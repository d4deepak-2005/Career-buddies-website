import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Centred dialog over the current page: dimmed overlay, title + close button, focus moved in and trapped, Escape and
 * overlay click ask to close (the owner decides whether that needs a "discard changes?" check), body scroll locked,
 * focus restored on close. The panel never exceeds the viewport; children decide what scrolls.
 */
export function Modal({ title, titleId = 'modal-title', onRequestClose, escapeEnabled = true, children, wide }: {
  title: string; titleId?: string; onRequestClose: () => void; escapeEnabled?: boolean; children: ReactNode; wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onRequestClose);
  closeRef.current = onRequestClose;
  const escRef = useRef(escapeEnabled);
  escRef.current = escapeEnabled;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = panel.current?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, [role=radio]');
    (first ?? panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escRef.current) { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab' || !panel.current || !escRef.current) return;
      const f = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (f.length === 0) return;
      const a = f[0]!, z = f[f.length - 1]!;
      if (e.shiftKey && (document.activeElement === a || document.activeElement === panel.current)) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; opener?.focus?.(); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cb-navy-deep/50 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onRequestClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className={`flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop outline-none sm:max-h-[calc(100dvh-3rem)] sm:rounded-3xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-2xl'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-surface-line px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-lg font-extrabold text-cb-navy">{title}</h2>
          <button type="button" className="btn-ghost !min-h-10 !px-2" aria-label="Close" onClick={onRequestClose}><X className="h-5 w-5" aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
