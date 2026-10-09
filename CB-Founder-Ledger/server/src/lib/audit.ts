import { AuditEvent } from '../models/AuditEvent';
import type { AuthUser } from '../middleware/auth';

/** Keys that must never be written to the audit log (credentials, tokens, hashes). */
const SENSITIVE = /pass(word)?|secret|token|hash|session|authorization|cookie|api[-_]?key|mongo_uri/i;

export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 6) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 100).map((v) => redact(v, depth + 1));
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = SENSITIVE.test(k) ? '[redacted]' : redact(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string') return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  return value;
}

export interface AuditInput {
  action: string;
  entityType: string;
  entityId?: string | undefined;
  summary: string;
  before?: unknown;
  after?: unknown;
  reason?: string | undefined;
}

/**
 * Best-effort append. A failing audit write is reported on stderr but never rolls back a committed financial change
 * (that would let an audit outage block or half-apply money movements). Rows can never be altered afterwards.
 */
export async function audit(actor: Pick<AuthUser, 'id' | 'name' | 'email'> | null, input: AuditInput): Promise<void> {
  try {
    await AuditEvent.create({
      actorId: actor?.id,
      actorLabel: actor ? `${actor.name} <${actor.email}>`.slice(0, 200) : undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary.slice(0, 300),
      ...(input.before !== undefined ? { before: redact(input.before) } : {}),
      ...(input.after !== undefined ? { after: redact(input.after) } : {}),
      ...(input.reason ? { reason: input.reason.slice(0, 500) } : {}),
    });
  } catch (err) {
    console.error('[audit] failed to record event', input.action, err instanceof Error ? err.message : err);
  }
}

/** Events with no signed-in actor (failed login). Only the attempted e-mail is recorded, never the password. */
export async function auditAnonymous(input: AuditInput & { actorLabel: string }): Promise<void> {
  try {
    await AuditEvent.create({ actorLabel: input.actorLabel.slice(0, 200), action: input.action, entityType: input.entityType, summary: input.summary.slice(0, 300) });
  } catch (err) {
    console.error('[audit] failed to record event', input.action, err instanceof Error ? err.message : err);
  }
}
