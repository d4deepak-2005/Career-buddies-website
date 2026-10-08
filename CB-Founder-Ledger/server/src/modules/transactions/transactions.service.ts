import { trusted, type FilterQuery, type Types } from 'mongoose';
import { AppError } from '../../lib/errors';
import { resolveSplit, type SplitEntryResolved } from '../../domain/splits';
import { EDITABLE_STATUSES, canTransition, checkTypeRules, type TransactionStatus } from '../../domain/transactionRules';
import { Category } from '../../models/Category';
import { Founder } from '../../models/Founder';
import { nextSequence } from '../../models/Counter';
import { Receipt } from '../../models/Receipt';
import { Transaction, type TransactionDoc } from '../../models/Transaction';
import { REVISION_ACTIONS, TransactionRevision } from '../../models/TransactionRevision';
import { User } from '../../models/User';
import type { AuthUser } from '../../middleware/auth';
import { activeLinkedReimbursements, capacityError, checkReimbursementTarget, hasLinkedError, heldBy, releaseCapacity, reserveCapacity } from './reimbursements';
import type { ListQuery, TransactionContent } from './transactions.schemas';

type Issue = { path: string; message: string; code?: string };
type StoredTx = TransactionDoc & { _id: Types.ObjectId };

const validationError = (issues: Issue[]) => new AppError(400, 'VALIDATION_ERROR', 'Transaction validation failed', issues);
const idStr = (v: unknown) => (v ? String(v) : undefined);

// ---------------------------------------------------------------- validation

interface Existing { categoryId?: string; founderIds: Set<string> }

/** Validates cross-field rules, references and the split, and returns the resolved split entries. */
async function validateContent(content: TransactionContent, existing?: Existing): Promise<SplitEntryResolved[] | undefined> {
  const issues: Issue[] = checkTypeRules({
    type: content.type,
    categoryId: content.categoryId,
    paidByFounderId: content.paidByFounderId,
    counterpartyFounderId: content.counterpartyFounderId,
    notes: content.notes,
    method: content.method,
    reimbursesTransactionId: content.reimbursesTransactionId,
    hasSplit: !!content.split,
  });
  if (content.type === 'reimbursement') issues.push(...(await checkReimbursementTarget(content)));

  if (content.categoryId) {
    const cat = await Category.findById(content.categoryId).select('active').lean();
    if (!cat) issues.push({ path: 'categoryId', code: 'UNKNOWN_CATEGORY', message: 'Category does not exist' });
    else if (!cat.active && existing?.categoryId !== content.categoryId) issues.push({ path: 'categoryId', code: 'INACTIVE_CATEGORY', message: 'Category is inactive' });
  }

  const refs: Array<[string, string | undefined]> = [
    ['paidByFounderId', content.paidByFounderId],
    ['counterpartyFounderId', content.counterpartyFounderId],
    ...(content.split?.entries ?? []).map((e, i): [string, string] => [`split.entries.${i}.founderId`, e.founderId]),
  ];
  const ids = [...new Set(refs.map(([, id]) => id).filter((x): x is string => !!x))];
  if (ids.length > 0) {
    const found = await Founder.find({ _id: trusted({ $in: ids }) }).select('active').lean();
    const byId = new Map(found.map((f) => [String(f._id), f.active]));
    for (const [path, id] of refs) {
      if (!id) continue;
      const active = byId.get(id);
      if (active === undefined) issues.push({ path, code: 'UNKNOWN_FOUNDER', message: 'Founder does not exist' });
      else if (!active && !existing?.founderIds.has(id)) issues.push({ path, code: 'INACTIVE_FOUNDER', message: 'Founder is inactive' });
    }
  }

  let resolved: SplitEntryResolved[] | undefined;
  if (content.split) {
    const r = resolveSplit(content.split, content.amountMinor);
    if (r.ok) resolved = r.entries;
    else issues.push(...r.issues);
  }

  if (issues.length > 0) throw validationError(issues);
  return resolved;
}

/** Resolve a split definition without saving (powers the live preview in the form). */
export async function previewSplit(input: { amountMinor: number; split: NonNullable<TransactionContent['split']> }) {
  const ids = [...new Set(input.split.entries.map((e) => e.founderId))];
  const found = await Founder.find({ _id: trusted({ $in: ids }) }).select('name active').lean();
  const byId = new Map(found.map((f) => [String(f._id), f]));
  const issues: Issue[] = [];
  input.split.entries.forEach((e, i) => {
    const f = byId.get(e.founderId);
    if (!f) issues.push({ path: `split.entries.${i}.founderId`, code: 'UNKNOWN_FOUNDER', message: 'Founder does not exist' });
    else if (!f.active) issues.push({ path: `split.entries.${i}.founderId`, code: 'INACTIVE_FOUNDER', message: `${f.name} is inactive` });
  });
  const r = resolveSplit(input.split, input.amountMinor);
  if (!r.ok) issues.push(...r.issues);
  if (issues.length > 0 || !r.ok) throw validationError(issues);
  return { method: input.split.method, entries: r.entries.map((e) => ({ ...e, founderName: byId.get(e.founderId)?.name ?? '' })) };
}

// ---------------------------------------------------------------- mapping

const toDate = (s: string) => new Date(`${s}T00:00:00Z`);

function fieldsFor(content: TransactionContent, resolved?: SplitEntryResolved[]) {
  return {
    type: content.type,
    amountMinor: content.amountMinor,
    transactionDate: toDate(content.transactionDate),
    description: content.description,
    notes: content.notes?.trim() || undefined,
    method: content.method?.trim() || undefined,
    reimbursesTransactionId: content.type === 'reimbursement' ? content.reimbursesTransactionId : undefined,
    categoryId: content.categoryId,
    paidByFounderId: content.paidByFounderId,
    counterpartyFounderId: content.counterpartyFounderId,
    split: content.split && resolved ? { method: content.split.method, entries: resolved } : undefined,
  };
}

/** Rebuild the editable content (no resolved allocations) from a stored transaction. */
function contentFromStored(tx: StoredTx): TransactionContent {
  const entries = (tx.split?.entries ?? []).map((e) => {
    const out: Record<string, unknown> = { founderId: String(e.founderId) };
    if (e.percent != null) out['percent'] = e.percent;
    if (e.shares != null) out['shares'] = e.shares;
    if (e.amountMinor != null) out['amountMinor'] = e.amountMinor;
    if (e.note) out['note'] = e.note;
    return out;
  });
  return {
    type: tx.type,
    amountMinor: tx.amountMinor,
    transactionDate: tx.transactionDate.toISOString().slice(0, 10),
    description: tx.description,
    ...(tx.notes ? { notes: tx.notes } : {}),
    ...(tx.method ? { method: tx.method } : {}),
    ...(tx.reimbursesTransactionId ? { reimbursesTransactionId: String(tx.reimbursesTransactionId) } : {}),
    ...(tx.categoryId ? { categoryId: String(tx.categoryId) } : {}),
    ...(tx.paidByFounderId ? { paidByFounderId: String(tx.paidByFounderId) } : {}),
    ...(tx.counterpartyFounderId ? { counterpartyFounderId: String(tx.counterpartyFounderId) } : {}),
    ...(tx.split ? { split: { method: tx.split.method, entries } as NonNullable<TransactionContent['split']> } : {}),
  };
}

function referencedFounderIds(tx: StoredTx): Set<string> {
  return new Set([idStr(tx.paidByFounderId), idStr(tx.counterpartyFounderId), ...(tx.split?.entries ?? []).map((e) => idStr(e.founderId))].filter((x): x is string => !!x));
}

async function recordRevision(tx: StoredTx, action: (typeof REVISION_ACTIONS)[number], actorId: string, extra: { reason?: string; snapshot?: unknown } = {}) {
  await TransactionRevision.create({
    transactionId: tx._id,
    version: tx.version,
    action,
    actorId,
    ...(extra.reason ? { reason: extra.reason } : {}),
    snapshot: extra.snapshot ?? { ...contentFromStored(tx), status: tx.status, split: tx.split ? { method: tx.split.method, entries: tx.split.entries } : undefined },
  });
}

// ---------------------------------------------------------------- serialisation

type Named = { id: string; name: string } | null;

export async function hydrate(txs: StoredTx[]) {
  const userIds = new Set<string>(), founderIds = new Set<string>(), categoryIds = new Set<string>();
  for (const t of txs) {
    userIds.add(String(t.createdBy)); userIds.add(String(t.updatedBy));
    if (t.void?.voidedBy) userIds.add(String(t.void.voidedBy));
    for (const f of referencedFounderIds(t)) founderIds.add(f);
    if (t.categoryId) categoryIds.add(String(t.categoryId));
  }
  const targetIds = [...new Set(txs.map((t) => idStr(t.reimbursesTransactionId)).filter((x): x is string => !!x))];
  const [users, founders, categories, targets] = await Promise.all([
    User.find({ _id: trusted({ $in: [...userIds] }) }).select('name').lean(),
    Founder.find({ _id: trusted({ $in: [...founderIds] }) }).select('name').lean(),
    Category.find({ _id: trusted({ $in: [...categoryIds] }) }).select('name').lean(),
    targetIds.length ? Transaction.find({ _id: trusted({ $in: targetIds }) }).select('txnNumber description amountMinor').lean() : Promise.resolve([]),
  ]);
  const targetById = new Map(targets.map((x) => [String(x._id), { id: String(x._id), txnNumber: x.txnNumber, description: x.description, amountMinor: x.amountMinor }]));
  const u = new Map(users.map((x) => [String(x._id), x.name]));
  const f = new Map(founders.map((x) => [String(x._id), x.name]));
  const c = new Map(categories.map((x) => [String(x._id), x.name]));
  const named = (m: Map<string, string>, id: unknown): Named => (id ? { id: String(id), name: m.get(String(id)) ?? 'Unknown' } : null);

  return txs.map((t) => ({
    id: String(t._id),
    txnNumber: t.txnNumber,
    type: t.type,
    amountMinor: t.amountMinor,
    description: t.description,
    notes: t.notes ?? null,
    method: t.method ?? null,
    // Option C. Reimbursement: the expense it reimburses. Expense: how much is already reserved by active reimbursements (display only).
    reimbursesTransactionId: idStr(t.reimbursesTransactionId) ?? null,
    reimbursesTransaction: t.reimbursesTransactionId ? (targetById.get(String(t.reimbursesTransactionId)) ?? null) : null,
    reimbursedMinor: t.type === 'business_expense' ? (t.reimbursedMinor ?? 0) : null,
    remainingReimbursableMinor: t.type === 'business_expense' ? Math.max(t.amountMinor - (t.reimbursedMinor ?? 0), 0) : null,
    category: named(c, t.categoryId),
    paidBy: named(f, t.paidByFounderId),
    counterparty: named(f, t.counterpartyFounderId),
    transactionDate: t.transactionDate.toISOString().slice(0, 10),
    status: t.status,
    split: t.split
      ? {
          method: t.split.method,
          entries: t.split.entries.map((e) => ({
            founderId: String(e.founderId),
            founderName: f.get(String(e.founderId)) ?? 'Unknown',
            ...(e.percent != null ? { percent: e.percent } : {}),
            ...(e.shares != null ? { shares: e.shares } : {}),
            ...(e.amountMinor != null ? { amountMinor: e.amountMinor } : {}),
            ...(e.note ? { note: e.note } : {}),
            allocatedMinor: e.allocatedMinor,
          })),
        }
      : null,
    receiptCount: t.receiptCount,
    void: t.void ? { reason: t.void.reason, voidedAt: t.void.voidedAt, voidedBy: named(u, t.void.voidedBy) } : null,
    version: t.version,
    createdBy: named(u, t.createdBy),
    updatedBy: named(u, t.updatedBy),
    createdAt: (t as unknown as { createdAt: Date }).createdAt,
    updatedAt: (t as unknown as { updatedAt: Date }).updatedAt,
  }));
}

// ---------------------------------------------------------------- operations

export async function loadOr404(id: string): Promise<StoredTx> {
  const tx = await Transaction.findById(id).lean<StoredTx>();
  if (!tx) throw AppError.notFound('Transaction not found');
  return tx;
}

function assertOwnerOrAdmin(tx: StoredTx, actor: AuthUser) {
  if (actor.role !== 'admin' && String(tx.createdBy) !== actor.id) {
    throw AppError.forbidden('Only the creator or an admin can change this transaction');
  }
}

const conflict = (current: number) => new AppError(409, 'VERSION_CONFLICT', 'This transaction was changed by someone else. Reload to see the latest version.', { currentVersion: current });

export async function createTransaction(content: TransactionContent, status: 'draft' | 'pending_approval', actor: AuthUser) {
  const resolved = await validateContent(content);
  // Option C: reserve the expense's capacity atomically BEFORE writing, so concurrent reimbursements cannot exceed it.
  const reserved = content.type === 'reimbursement' && content.reimbursesTransactionId ? { expenseId: content.reimbursesTransactionId, amount: content.amountMinor } : null;
  if (reserved && !(await reserveCapacity(reserved.expenseId, reserved.amount))) throw await capacityError(reserved.expenseId);
  let created;
  try {
    const seq = await nextSequence('transaction');
    created = await Transaction.create({
      ...fieldsFor(content, resolved),
      txnNumber: `TXN-${String(seq).padStart(6, '0')}`,
      status,
      createdBy: actor.id,
      updatedBy: actor.id,
    });
  } catch (err) {
    if (reserved) await releaseCapacity(reserved.expenseId, reserved.amount); // roll back the reservation
    throw err;
  }
  const tx = created.toObject() as unknown as StoredTx;
  await recordRevision(tx, 'created', actor.id);
  return tx;
}

type Patch = Partial<{ [K in keyof TransactionContent]: TransactionContent[K] | null }> & { expectedVersion: number };

export async function updateTransaction(id: string, patch: Patch, actor: AuthUser, contentParser: (v: unknown) => TransactionContent) {
  const existing = await loadOr404(id);
  assertOwnerOrAdmin(existing, actor);
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    throw new AppError(409, 'NOT_EDITABLE', `A ${existing.status.replace('_', ' ')} transaction can no longer be edited`);
  }
  if (existing.version !== patch.expectedVersion) throw conflict(existing.version);

  // Merge the patch over the stored content; `null` clears an optional field.
  const merged: Record<string, unknown> = { ...contentFromStored(existing) };
  const cleared: string[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'expectedVersion') continue;
    if (v === null) { delete merged[k]; cleared.push(k); } else merged[k] = v;
  }
  const content = contentParser(merged); // strict re-validation of the full document
  const resolved = await validateContent(content, { categoryId: idStr(existing.categoryId), founderIds: referencedFounderIds(existing) });

  // Option C: adjust the capacity this reimbursement holds (before the write; compensated if the write fails).
  const oldHeld = heldBy(existing);
  const newHeld = content.type === 'reimbursement' && content.reimbursesTransactionId ? { expenseId: content.reimbursesTransactionId, amount: content.amountMinor } : null;
  let newlyReserved: { expenseId: string; amount: number } | null = null;
  if (newHeld) {
    const sameExpense = oldHeld?.expenseId === newHeld.expenseId;
    const needed = sameExpense ? newHeld.amount - oldHeld.amount : newHeld.amount;
    if (needed > 0) {
      if (!(await reserveCapacity(newHeld.expenseId, needed))) throw await capacityError(newHeld.expenseId);
      newlyReserved = { expenseId: newHeld.expenseId, amount: needed };
    }
  }

  const fields = fieldsFor(content, resolved);
  const set: Record<string, unknown> = { updatedBy: actor.id };
  const unset: Record<string, 1> = {};
  for (const [k, v] of Object.entries(fields)) { if (v === undefined) unset[k] = 1; else set[k] = v; }

  const updated = await Transaction.findOneAndUpdate(
    { _id: id, version: patch.expectedVersion, status: trusted({ $in: EDITABLE_STATUSES }) },
    { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}), $inc: { version: 1 } },
    { new: true },
  ).lean<StoredTx>();
  if (!updated) {
    if (newlyReserved) await releaseCapacity(newlyReserved.expenseId, newlyReserved.amount); // roll back
    const now = await loadOr404(id);
    if (!EDITABLE_STATUSES.includes(now.status)) throw new AppError(409, 'NOT_EDITABLE', 'This transaction can no longer be edited');
    throw conflict(now.version);
  }
  // Write succeeded: give back whatever the OLD link no longer needs.
  if (oldHeld) {
    const keep = newHeld && newHeld.expenseId === oldHeld.expenseId ? Math.min(newHeld.amount, oldHeld.amount) : 0;
    await releaseCapacity(oldHeld.expenseId, oldHeld.amount - keep);
  }
  await recordRevision(updated, 'edited', actor.id);
  return updated;
}

export async function submitTransaction(id: string, expectedVersion: number, actor: AuthUser) {
  const existing = await loadOr404(id);
  assertOwnerOrAdmin(existing, actor);
  if (!canTransition(existing.status, 'pending_approval')) throw new AppError(409, 'INVALID_TRANSITION', `Cannot submit a ${existing.status.replace('_', ' ')} transaction`);
  if (existing.version !== expectedVersion) throw conflict(existing.version);
  const updated = await Transaction.findOneAndUpdate(
    { _id: id, version: expectedVersion, status: 'draft' },
    { $set: { status: 'pending_approval', updatedBy: actor.id }, $inc: { version: 1 } },
    { new: true },
  ).lean<StoredTx>();
  if (!updated) throw conflict((await loadOr404(id)).version);
  await recordRevision(updated, 'submitted', actor.id);
  return updated;
}

export async function voidTransaction(id: string, expectedVersion: number, reason: string, actor: AuthUser) {
  const existing = await loadOr404(id);
  if (!canTransition(existing.status, 'voided')) throw new AppError(409, 'INVALID_TRANSITION', 'This transaction is already voided');
  if (existing.version !== expectedVersion) throw conflict(existing.version);
  const isExpense = existing.type === 'business_expense';
  // Option C guard: an expense cannot be voided while active reimbursements are linked to it (void them first).
  if (isExpense) {
    const linked = await activeLinkedReimbursements(id);
    if (linked.length > 0) throw hasLinkedError(linked);
  }
  const updated = await Transaction.findOneAndUpdate(
    // For an expense the write is also conditional on "nothing reserved", closing the race with a reimbursement being created right now.
    { _id: id, version: expectedVersion, status: trusted({ $ne: 'voided' as TransactionStatus }), ...(isExpense ? { reimbursedMinor: trusted({ $in: [0, null] }) } : {}) },
    { $set: { status: 'voided', updatedBy: actor.id, void: { reason, voidedBy: actor.id, voidedAt: new Date() } }, $inc: { version: 1 } },
    { new: true },
  ).lean<StoredTx>();
  if (!updated) {
    const now = await loadOr404(id);
    if (isExpense && (now.reimbursedMinor ?? 0) > 0) throw hasLinkedError(await activeLinkedReimbursements(id));
    throw conflict(now.version);
  }
  // Voiding a reimbursement restores the expense's founder-funded amount: give its reserved capacity back.
  const held = heldBy(existing);
  if (held) await releaseCapacity(held.expenseId, held.amount);
  await recordRevision(updated, 'voided', actor.id, { reason });
  return updated;
}

export async function addReceiptRevision(tx: StoredTx, actorId: string, receipt: { id: string; fileName: string }) {
  await recordRevision(tx, 'receipt_added', actorId, { snapshot: { receiptId: receipt.id, fileName: receipt.fileName } });
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listTransactions(q: ListQuery) {
  const filter: FilterQuery<TransactionDoc> = {};
  if (q.type) filter.type = q.type;
  if (q.status) filter.status = q.status;
  if (q.categoryId) filter.categoryId = q.categoryId;
  if (q.paidByFounderId) filter.paidByFounderId = q.paidByFounderId;
  if (q.hasReceipt === 'true') filter.receiptCount = trusted({ $gt: 0 });
  if (q.hasReceipt === 'false') filter.receiptCount = 0;
  if (q.dateFrom || q.dateTo) {
    filter.transactionDate = trusted({ ...(q.dateFrom ? { $gte: toDate(q.dateFrom) } : {}), ...(q.dateTo ? { $lte: toDate(q.dateTo) } : {}) });
  }
  if (q.search) {
    const rx = trusted({ $regex: escapeRegex(q.search), $options: 'i' });
    filter.$or = [{ txnNumber: rx }, { description: rx }, { notes: rx }];
  }
  const dir = q.order === 'asc' ? 1 : -1;
  const [total, docs] = await Promise.all([
    Transaction.countDocuments(filter),
    Transaction.find(filter).sort({ [q.sort]: dir, _id: dir }).skip((q.page - 1) * q.pageSize).limit(q.pageSize).lean<StoredTx[]>(),
  ]);
  return { items: await hydrate(docs), page: q.page, pageSize: q.pageSize, total };
}

export async function listHistory(id: string) {
  await loadOr404(id);
  const rows = await TransactionRevision.find({ transactionId: id }).sort({ at: 1, version: 1 }).lean();
  const users = await User.find({ _id: trusted({ $in: [...new Set(rows.map((r) => String(r.actorId)))] }) }).select('name').lean();
  const names = new Map(users.map((u) => [String(u._id), u.name]));
  return rows.map((r) => ({ id: String(r._id), version: r.version, action: r.action, at: r.at, reason: r.reason ?? null, actor: { id: String(r.actorId), name: names.get(String(r.actorId)) ?? 'Unknown' } }));
}

export async function receiptsFor(id: string) {
  const rows = await Receipt.find({ transactionId: id }).sort({ uploadedAt: 1 }).lean();
  const users = await User.find({ _id: trusted({ $in: [...new Set(rows.map((r) => String(r.uploadedBy)))] }) }).select('name').lean();
  const names = new Map(users.map((u) => [String(u._id), u.name]));
  return rows.map((r) => publicReceipt(r, names.get(String(r.uploadedBy))));
}

export function publicReceipt(r: { _id: unknown; transactionId: unknown; originalName: string; mimeType: string; sizeBytes: number; sha256: string; uploadedBy: unknown; uploadedAt: Date }, uploaderName?: string) {
  return { id: String(r._id), transactionId: String(r.transactionId), fileName: r.originalName, mimeType: r.mimeType, sizeBytes: r.sizeBytes, sha256: r.sha256, uploadedAt: r.uploadedAt, uploadedBy: { id: String(r.uploadedBy), name: uploaderName ?? 'Unknown' } };
}

