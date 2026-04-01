import { useState, useCallback, useEffect, useRef } from 'react';
import { loadPersistentState } from '../utils/persistence';
import type { PersistentState } from '../types/index';

export function usePersistence(): {
  persistent: PersistentState;
  reload: () => void;
} {
  const [persistent, setPersistent] = useState<PersistentState>(
    () => loadPersistentState(),
  );

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(() => {
    const next = loadPersistentState();
    if (mountedRef.current) {
      setPersistent(next);
    }
  }, []);

  return { persistent, reload };
}
