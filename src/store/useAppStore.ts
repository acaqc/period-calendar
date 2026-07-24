import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppData, UserSettings, CycleState, DatePhaseInfo } from '../types';
import {
  loadData,
  initializeData,
  isStorageAvailable,
  addPeriod,
  removePeriod,
  toggleIntimacy,
  calculateCycle,
  getDatePhase,
} from '../utils';

interface AppStore {
  // ===== 数据状态 =====
  data: AppData;
  storageAvailable: boolean;
  isInitialized: boolean;

  // ===== UI 状态 =====
  periodMode: boolean;
  intimacyMode: boolean;
  showSettings: boolean;
  selectedDate: Date | null;
  contextMenu: { x: number; y: number; date: Date } | null;
  toast: string | null;

  // ===== 派生状态 =====
  cycleState: CycleState;
  selectedPhase: DatePhaseInfo | null;

  // ===== 操作 =====
  setData: (data: AppData) => void;
  init: () => void;
  togglePeriodMode: () => void;
  toggleIntimacyMode: () => void;
  updateSettings: (settings: UserSettings) => void;
  completeOnboarding: (settings: UserSettings) => void;
  addPeriodRecord: (date: Date) => { error?: string };
  removePeriodRecord: (date: Date) => boolean;
  toggleIntimacyRecord: (date: Date) => void;
  resetAll: () => AppData;
  setShowSettings: (show: boolean) => void;
  setSelectedDate: (date: Date | null) => void;
  setContextMenu: (menu: { x: number; y: number; date: Date } | null) => void;
  showToast: (msg: string, duration?: number) => void;

  // ===== 内部方法 =====
  _recalculate: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => {
      const _recalculate = () => {
        const { data, selectedDate } = get();
        const cycleState = calculateCycle(data.periods, data.settings);
        const selectedPhase = selectedDate
          ? getDatePhase(selectedDate, data.periods, cycleState)
          : null;
        set({ cycleState, selectedPhase });
      };

      return {
        // ===== 初始状态 =====
        data: loadData() || initializeData(),
        storageAvailable: true,
        isInitialized: false,
        periodMode: false,
        intimacyMode: false,
        showSettings: false,
        selectedDate: null,
        contextMenu: null,
        toast: null,
        cycleState: calculateCycle(
          (loadData() || initializeData()).periods,
          (loadData() || initializeData()).settings
        ),
        selectedPhase: null,

        // ===== 初始化 =====
        init: () => {
          set({
            storageAvailable: isStorageAvailable(),
            isInitialized: true,
          });
        },

        // ===== 数据操作（Bug #1 修复：使用 get() 获取最新状态，消除闭包陈旧） =====
        setData: (data: AppData) => {
          set({ data });
          get()._recalculate();
        },

        addPeriodRecord: (date: Date) => {
          const { data } = get();
          const result = addPeriod(data, date);
          if (result.error) return result;
          set({ data: result.data });
          get()._recalculate();
          return {};
        },

        removePeriodRecord: (date: Date) => {
          const { data } = get();
          const result = removePeriod(data, date);
          set({ data: result.data });
          get()._recalculate();
          return result.removed;
        },

        toggleIntimacyRecord: (date: Date) => {
          const { data } = get();
          set({ data: toggleIntimacy(data, date) });
          get()._recalculate();
        },

        // ===== 开关操作 =====
        togglePeriodMode: () => {
          const { periodMode } = get();
          if (periodMode) {
            set({ periodMode: false });
          } else {
            set({ periodMode: true, intimacyMode: false });
          }
        },

        toggleIntimacyMode: () => {
          const { intimacyMode } = get();
          if (intimacyMode) {
            set({ intimacyMode: false });
          } else {
            set({ intimacyMode: true, periodMode: false });
          }
        },

        // ===== 设置操作 =====
        updateSettings: (settings: UserSettings) => {
          const { data } = get();
          set({ data: { ...data, settings } });
          get()._recalculate();
        },

        completeOnboarding: (settings: UserSettings) => {
          const { data } = get();
          set({ data: { ...data, settings, onboardingCompleted: true } });
          get()._recalculate();
        },

        resetAll: () => {
          const prevData = get().data;
          const fresh = initializeData();
          set({
            data: fresh,
            periodMode: false,
            intimacyMode: false,
            selectedDate: null,
          });
          get()._recalculate();
          // 返回撤销函数
          return prevData;
        },

        // ===== UI 状态操作 =====
        setShowSettings: (show: boolean) => set({ showSettings: show }),

        setSelectedDate: (date: Date | null) => {
          set({ selectedDate: date });
          // Bug #2 修复：每次 selectedDate 变化时立即重新计算
          const { data } = get();
          const cycleState = get().cycleState;
          const selectedPhase = date
            ? getDatePhase(date, data.periods, cycleState)
            : null;
          set({ selectedPhase });
        },

        setContextMenu: (menu: { x: number; y: number; date: Date } | null) =>
          set({ contextMenu: menu }),

        showToast: (msg: string, duration = 2000) => {
          set({ toast: msg });
          setTimeout(() => set({ toast: null }), duration);
        },

        // ===== 重新计算 =====
        _recalculate,
      };
    },
    {
      name: 'period-tracker-data',
      partialize: (state) => ({ data: state.data }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.cycleState = calculateCycle(state.data.periods, state.data.settings);
          state.isInitialized = true;
          state.storageAvailable = isStorageAvailable();
        }
      },
    }
  )
);
