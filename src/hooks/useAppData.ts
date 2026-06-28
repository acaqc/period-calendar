import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppData, UserSettings, CycleState } from '../types';
import {
  loadData,
  saveData,
  initializeData,
  isStorageAvailable,
  addPeriod,
  removePeriod,
  toggleIntimacy,
  calculateCycle,
} from '../utils';

interface UseAppDataReturn {
  data: AppData;
  cycleState: CycleState;
  storageAvailable: boolean;
  isInitialized: boolean;
  periodMode: boolean;
  intimacyMode: boolean;
  togglePeriodMode: () => void;
  toggleIntimacyMode: () => void;
  updateSettings: (settings: UserSettings) => void;
  completeOnboarding: (settings: UserSettings) => void;
  addPeriodRecord: (date: Date) => { error?: string };
  removePeriodRecord: (date: Date) => boolean;
  toggleIntimacyRecord: (date: Date) => void;
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
  const [periodMode, setPeriodMode] = useState(false);
  const [intimacyMode, setIntimacyMode] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    setStorageAvailable(isStorageAvailable());
    setIsInitialized(true);
  }, []);

  const cycleState = calculateCycle(data.periods, data.settings);

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

  const completeOnboarding = useCallback((settings: UserSettings) => {
    setData((prev) => ({ ...prev, settings, onboardingCompleted: true }));
  }, []);

  const togglePeriodMode = useCallback(() => {
    setPeriodMode((prev) => {
      if (prev) return false; // turning off
      setIntimacyMode(false); // turn off intimacy when turning on period
      return true;
    });
  }, []);

  const toggleIntimacyMode = useCallback(() => {
    setIntimacyMode((prev) => {
      if (prev) return false;
      setPeriodMode(false); // turn off period when turning on intimacy
      return true;
    });
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

  const toggleIntimacyRecord = useCallback(
    (date: Date) => {
      setData((prev) => toggleIntimacy(prev, date));
    },
    []
  );

  const resetAll = useCallback(() => {
    const fresh = initializeData();
    setData(fresh);
    setPeriodMode(false);
    setIntimacyMode(false);
  }, []);

  return {
    data,
    cycleState,
    storageAvailable,
    isInitialized,
    periodMode,
    intimacyMode,
    togglePeriodMode,
    toggleIntimacyMode,
    updateSettings,
    completeOnboarding,
    addPeriodRecord,
    removePeriodRecord,
    toggleIntimacyRecord,
    resetAll,
    setData,
  };
}
