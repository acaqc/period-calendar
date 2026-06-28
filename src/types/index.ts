export interface PeriodRecord {
  id: string;
  startDate: string; // ISO "YYYY-MM-DD"
  endDate: string;   // ISO "YYYY-MM-DD"
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface UserSettings {
  cycleLength: number;  // 21-45, default 28
  periodLength: number; // 2-10, default 5
}

export interface AppData {
  version: number;
  settings: UserSettings;
  periods: PeriodRecord[];
  lastModified: string;
}

export type ProbabilityLevel = 'period' | 'high' | 'medium' | 'low' | 'none';

export interface DayInfo {
  date: Date;
  dateStr: string;        // "YYYY-MM-DD"
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
  probability: ProbabilityLevel;
  periodDay: number | null;  // 经期第几天，null 表示非经期
  isPeriodStart: boolean;
}

export type PhaseLabel =
  | 'period'
  | 'follicular'
  | 'fertile_high'
  | 'fertile_medium'
  | 'luteal'
  | 'no_data';

export interface CycleState {
  averageCycleLength: number;
  lastPeriodStart: Date | null;
  predictedNextPeriod: Date | null;
  predictedOvulation: Date | null;
  fertileWindow: { start: Date; end: Date } | null;
  todayPhase: {
    phase: PhaseLabel;
    label: string;
    periodDay?: number;
    daysUntilOvulation?: number;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  cycleLength: 28,
  periodLength: 5,
};

export const STORAGE_KEY = 'period-calendar-data';
export const APP_VERSION = 1;
