import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppData, UserSettings, CycleState } from '../types';
import {
  loadData,
  saveData,
  initializeData,
  isStorageAvailable,
  addPeriod,
  removePeriod,
  calculateCycle,
} from '../utils';

interface UseAppDataReturn {
  data: AppData;
  cycleState: CycleState;
  storageAvailable: boolean;
  isInitialized: boolean;
  updateSettings: (settings: UserSettings) => void;
  addPeriodRecord: (date: Date) => { error?: string };
  removePeriodRecord: (date: Date) => boolean;
  resetAll: () => void;
  setData: (data: AppData) => void;
}

export function useAppData(): UseAppDataReturn {
  const [data, setData] = useState<AppData>(() => {
    const saved = loadData();
    if (saved) return saved;
    return initializeData();
  });
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializedRef = useRef(false);

  // Check storage availability once
  useEffect(() => {
    setStorageAvailable(isStorageAvailable());
    setIsInitialized(true);
  }, []);

  // Recalculate cycle state whenever data changes
  const cycleState = calculateCycle(data.periods, data.settings);

  // Persist on data change (skip initial render)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    if (storageAvailable) {
      saveData(data);
    }
  }, [data, storageAvailable]);

  const updateSettings = useCallback((settings: UserSettings) => {
    setData((prev) => ({ ...prev, settings }));
  }, []);

  const addPeriodRecord = useCallback(
    (date: Date): { error?: string } => {
      const result = addPeriod(data, date);
      if (result.error) return { error: result.error };
      setData(result.data);
      return {};
    },
    [data]
  );

  const removePeriodRecord = useCallback(
    (date: Date): boolean => {
      const result = removePeriod(data, date);
      if (result.removed) {
        setData(result.data);
      }
      return result.removed;
    },
    [data]
  );

  const resetAll = useCallback(() => {
    const fresh = initializeData();
    setData(fresh);
  }, []);

  return {
    data,
    cycleState,
    storageAvailable,
    isInitialized,
    updateSettings,
    addPeriodRecord,
    removePeriodRecord,
    resetAll,
    setData,
  };
}
