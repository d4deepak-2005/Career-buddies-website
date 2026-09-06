import fs from 'fs';
import path from 'path';

// Lightweight JSON-file-backed persistence so candidate accounts and payment
// records survive a server restart (unlike the original in-memory leadsStore).
// This is a stopgap for launch day, not a database: on hosts with an ephemeral
// filesystem (e.g. a fresh container per deploy) this directory is wiped on
// every redeploy. Move to a real database (Postgres, etc.) before relying on
// this for anything beyond the initial launch.

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonStore<T>(fileName: string, fallback: T): T {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return raw.trim() ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.error(`[Store] Failed to read ${fileName}, starting fresh:`, err);
    return fallback;
  }
}

function writeJsonStore<T>(fileName: string, data: T): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

export interface CandidateActivity {
  id: string;
  type: 'signup' | 'login' | 'payment_initiated' | 'payment_succeeded' | 'payment_failed';
  message: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  email: string;
  fullName: string;
  mobile?: string;
  createdAt: string;
  lastLoginAt?: string;
  activity: CandidateActivity[];
}

export interface PaymentRecord {
  id: string;
  planId: 'explore' | 'elevate' | 'excel';
  planName: string;
  candidateEmail: string;
  candidateName: string;
  amountINR: number;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  leadId?: string;
  dodoCheckoutSessionId?: string;
  dodoPaymentId?: string;
  createdBy?: string;
}

let candidates: Candidate[] = readJsonStore<Candidate[]>('candidates.json', []);
let payments: PaymentRecord[] = readJsonStore<PaymentRecord[]>('payments.json', []);

function persistCandidates() {
  writeJsonStore('candidates.json', candidates);
}

function persistPayments() {
  writeJsonStore('payments.json', payments);
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export function findCandidateByEmail(email: string): Candidate | undefined {
  const normalized = email.trim().toLowerCase();
  return candidates.find((c) => c.email === normalized);
}

export function upsertCandidate(input: { email: string; fullName?: string; mobile?: string }): Candidate {
  const email = input.email.trim().toLowerCase();
  let candidate = findCandidateByEmail(email);
  if (!candidate) {
    candidate = {
      id: newId('cand'),
      email,
      fullName: input.fullName?.trim() || 'Career Candidate',
      mobile: input.mobile?.trim(),
      createdAt: new Date().toISOString(),
      activity: []
    };
    candidates.unshift(candidate);
  } else {
    if (input.fullName?.trim()) candidate.fullName = input.fullName.trim();
    if (input.mobile?.trim()) candidate.mobile = input.mobile.trim();
  }
  persistCandidates();
  return candidate;
}

export function logCandidateActivity(
  email: string,
  type: CandidateActivity['type'],
  message: string
): Candidate {
  const candidate = upsertCandidate({ email });
  candidate.activity.unshift({
    id: newId('act'),
    type,
    message,
    createdAt: new Date().toISOString()
  });
  if (type === 'login') {
    candidate.lastLoginAt = new Date().toISOString();
  }
  persistCandidates();
  return candidate;
}

export function listCandidates(): Candidate[] {
  return candidates;
}

export function createPaymentRecord(input: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: PaymentRecord['status'] }): PaymentRecord {
  const record: PaymentRecord = {
    id: newId('pay'),
    status: input.status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input
  };
  payments.unshift(record);
  persistPayments();
  return record;
}

export function findPaymentById(id: string): PaymentRecord | undefined {
  return payments.find((p) => p.id === id);
}

export function updatePaymentById(id: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined {
  const record = findPaymentById(id);
  if (!record) return undefined;
  Object.assign(record, updates, { updatedAt: new Date().toISOString() });
  persistPayments();
  return record;
}

export function listPayments(): PaymentRecord[] {
  return payments;
}
