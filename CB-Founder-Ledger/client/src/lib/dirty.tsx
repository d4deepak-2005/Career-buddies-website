import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';

interface Ctx { set: (dirty: boolean) => void; isDirty: () => boolean }
const C = createContext<Ctx | null>(null);

/** Tracks "there are unsaved changes" so navigation inside the app and closing the tab can warn first. */
export function DirtyProvider({ children }: { children: ReactNode }) {
  const dirty = useRef(false);
  const set = useCallback((d: boolean) => { dirty.current = d; }, []);
  const isDirty = useCallback(() => dirty.current, []);
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);
  return <C.Provider value={{ set, isDirty }}>{children}</C.Provider>;
}

/** Register the current form's dirty state; cleared automatically when the form unmounts. */
export function useDirtyGuard(dirty: boolean): void {
  const c = useContext(C);
  useEffect(() => { c?.set(dirty); return () => c?.set(false); }, [c, dirty]);
}

/** For navigation links: returns true if it is fine to leave (nothing unsaved, or the user confirmed). */
export function useConfirmLeave(): () => boolean {
  const c = useContext(C);
  return useCallback(() => !c?.isDirty() || window.confirm('You have unsaved changes. Leave without saving?'), [c]);
}
