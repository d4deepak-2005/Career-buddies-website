import { Hourglass } from 'lucide-react';
import type { AppModule } from '../lib/modules';

/** Placeholder for modules whose logic is delivered in a later phase. Shows no financial figures. */
export function ModulePlaceholder({ module: m }: { module: AppModule }) {
  const Icon = m.icon;
  return (
    <section className="card mx-auto flex max-w-2xl flex-col items-center px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-card">
        <Icon className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="mt-5 text-2xl font-extrabold text-cb-navy">{m.label}</h2>
      <p className="mt-2 max-w-md text-ink-muted">{m.summary}</p>
      <p className="badge mt-6 gap-1.5 bg-cb-green/10 !px-3 !py-1.5 text-cb-green-dark">
        <Hourglass className="h-3.5 w-3.5" aria-hidden /> Planned for {m.phase}
      </p>
    </section>
  );
}
