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
  intimacyDates: string[];     // ISO "YYYY-MM-DD" — 爱爱记录日期
  onboardingCompleted: boolean;
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
  periodDay: number | null;
  isPeriodStart: boolean;
  isOvulationDay: boolean;    // 是否为预测排卵日
  hasIntimacy: boolean;       // 是否有爱爱记录
}

export type PhaseLabel =
  | 'period'
  | 'follicular'
  | 'fertile_high'
  | 'fertile_medium'
  | 'luteal'
  | 'no_data';

export interface CyclePrediction {
  periodStart: Date;        // 经期开始日
  periodEnd: Date;          // 经期结束日
  ovulationDate: Date;      // 预测排卵日
  fertileStart: Date;       // 易孕期开始
  fertileEnd: Date;         // 易孕期结束
  nextPeriodStart: Date;    // 预测下次经期
}

export interface CycleState {
  averageCycleLength: number;
  lastPeriodStart: Date | null;
  predictedNextPeriod: Date | null;
  predictedOvulation: Date | null;
  previousOvulation: Date | null;
  fertileWindow: { start: Date; end: Date } | null;
  allPredictions: CyclePrediction[];  // 每条经期的独立预测
  todayProbability: number | null;
  todayProbabilityLabel: string;
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
export const APP_VERSION = 2;
