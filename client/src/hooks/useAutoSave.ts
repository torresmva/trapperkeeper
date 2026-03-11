import { useRef, useEffect, useCallback } from 'react';

export function useAutoSave(
  saveFn: () => Promise<void>,
  deps: any[],
  delay: number = 800
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const saveFnRef = useRef(saveFn);
  const isMountedRef = useRef(false);

  saveFnRef.current = saveFn;

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      saveFnRef.current().catch(console.error);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, deps);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    await saveFnRef.current();
  }, []);

  return { saveNow };
}
