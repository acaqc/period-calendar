import type { AppData, UserSettings } from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEY, APP_VERSION } from '../types';

/** 从 localStorage 加载数据 */
export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: AppData = JSON.parse(raw);
    if (data.version !== APP_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

/** 保存数据到 localStorage */
export function saveData(data: AppData): void {
  try {
    data.lastModified = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
    }
  }
}

/** 检查 localStorage 是否可用 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** 初始化默认数据 */
export function initializeData(settings?: UserSettings): AppData {
  return {
    version: APP_VERSION,
    settings: settings || { ...DEFAULT_SETTINGS },
    periods: [],
    intimacyDates: [],
    onboardingCompleted: false,
    lastModified: new Date().toISOString(),
  };
}
