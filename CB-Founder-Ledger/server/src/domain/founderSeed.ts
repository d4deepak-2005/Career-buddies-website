/** The three founders, in the mandatory display order. Matching is by first name so an existing record is UPDATED, never duplicated. */
export const FOUNDER_TARGETS = [
  { name: 'Nishant Sharma', role: 'Founder', order: 0, match: 'nishant', slug: 'nishant-sharma' },
  { name: 'Deepak Sah', role: 'Co-founder', order: 1, match: 'deepak', slug: 'deepak-sah' },
  { name: 'Divyanshu Gautam', role: 'Co-founder', order: 2, match: 'divyanshu', slug: 'divyanshu-gautam' },
] as const;

export interface ExistingFounder { id: string; name: string; role?: string | null; displayOrder?: number | null }
export type SeedAction =
  | { kind: 'create'; name: string; role: string; order: number }
  | { kind: 'update'; id: string; name: string; role: string; order: number; changes: string[] }
  | { kind: 'keep'; id: string; name: string }
  | { kind: 'ambiguous'; target: string; ids: string[] }
  | { kind: 'push-back'; id: string; name: string; order: number };

const tokens = (s: string) => s.toLowerCase().normalize('NFKD').split(/[^a-z]+/).filter(Boolean);

/** Pure planning step (unit-tested): decides what to create/update without touching the database. Safe to run repeatedly. */
export function planFounderSeed(existing: ExistingFounder[]): SeedAction[] {
  const actions: SeedAction[] = [];
  const claimed = new Set<string>();
  for (const t of FOUNDER_TARGETS) {
    const hits = existing.filter((f) => !claimed.has(f.id) && tokens(f.name).includes(t.match));
    if (hits.length > 1) { actions.push({ kind: 'ambiguous', target: t.name, ids: hits.map((h) => h.id) }); continue; }
    const hit = hits[0];
    if (!hit) { actions.push({ kind: 'create', name: t.name, role: t.role, order: t.order }); continue; }
    claimed.add(hit.id);
    const changes: string[] = [];
    if (hit.name !== t.name) changes.push(`name "${hit.name}" -> "${t.name}"`);
    if ((hit.role ?? '') !== t.role) changes.push(`role -> ${t.role}`);
    if ((hit.displayOrder ?? 1000) !== t.order) changes.push(`order -> ${t.order}`);
    actions.push(changes.length ? { kind: 'update', id: hit.id, name: t.name, role: t.role, order: t.order, changes } : { kind: 'keep', id: hit.id, name: hit.name });
  }
  // Anyone else must not sit among the first three positions.
  let next = FOUNDER_TARGETS.length;
  for (const f of existing.filter((x) => !claimed.has(x.id))) {
    if ((f.displayOrder ?? 1000) < FOUNDER_TARGETS.length) actions.push({ kind: 'push-back', id: f.id, name: f.name, order: next++ });
  }
  return actions;
}
