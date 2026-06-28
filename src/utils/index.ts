import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isToday,
  isWeekend,
} from 'date-fns';
import type {
  AppData,
  CycleState,
  DayInfo,
  PeriodRecord,
  ProbabilityLevel,
  UserSettings,
} from '../types';
import { DEFAULT_SETTINGS, STORAGE_KEY, APP_VERSION } from '../types';

// ========== Storage ==========

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

export function saveData(data: AppData): void {
  try {
    data.lastModified = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
    }
    // silently fail for other storage errors
  }
}

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

export function initializeData(settings?: UserSettings): AppData {
  return {
    version: APP_VERSION,
    settings: settings || { ...DEFAULT_SETTINGS },
    periods: [],
    onboardingCompleted: false,
    lastModified: new Date().toISOString(),
  };
}

// ========== Period Operations ==========

export function addPeriod(
  data: AppData,
  startDate: Date
): { data: AppData; error?: string } {
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endDate = addDays(startDate, data.settings.periodLength - 1);
  const endStr = format(endDate, 'yyyy-MM-dd');

  // Check overlap
  const overlap = data.periods.some((p) => {
    return (
      (startStr >= p.startDate && startStr <= p.endDate) ||
      (endStr >= p.startDate && endStr <= p.endDate) ||
      (startStr <= p.startDate && endStr >= p.endDate)
    );
  });

  if (overlap) {
    return { data, error: '该日期与已有经期记录重叠，请先取消上一条记录' };
  }

  const newPeriod: PeriodRecord = {
    id: crypto.randomUUID(),
    startDate: startStr,
    endDate: endStr,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const periods = [...data.periods, newPeriod].sort(
    (a, b) => a.startDate.localeCompare(b.startDate)
  );

  return { data: { ...data, periods } };
}

export function removePeriod(
  data: AppData,
  date: Date
): { data: AppData; removed: boolean } {
  const dateStr = format(date, 'yyyy-MM-dd');
  const period = data.periods.find((p) => p.startDate === dateStr);

  if (!period) {
    // Also try removing if date is inside a period (for UX flexibility)
    const containing = data.periods.find(
      (p) => dateStr >= p.startDate && dateStr <= p.endDate
    );
    if (!containing) return { data, removed: false };
    return {
      data: { ...data, periods: data.periods.filter((p) => p.id !== containing.id) },
      removed: true,
    };
  }

  return {
    data: { ...data, periods: data.periods.filter((p) => p.id !== period.id) },
    removed: true,
  };
}

export function getPeriodForDate(
  periods: PeriodRecord[],
  dateStr: string
): PeriodRecord | null {
  return (
    periods.find((p) => dateStr >= p.startDate && dateStr <= p.endDate) || null
  );
}

export function getPeriodStartForDate(
  periods: PeriodRecord[],
  dateStr: string
): PeriodRecord | null {
  return periods.find((p) => p.startDate === dateStr) || null;
}

// ========== Cycle Prediction ==========

function getAverageCycleLength(periods: PeriodRecord[]): number {
  if (periods.length < 2) return -1;

  const lengths: number[] = [];
  for (let i = 1; i < periods.length; i++) {
    const prev = parseISO(periods[i - 1].startDate);
    const curr = parseISO(periods[i].startDate);
    const len = differenceInCalendarDays(curr, prev);
    // Exclude outliers: 15-60 days
    if (len >= 15 && len <= 60) {
      lengths.push(len);
    }
  }

  if (lengths.length === 0) return -1;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

export function calculateCycle(
  periods: PeriodRecord[],
  settings: UserSettings
): CycleState {
  const today = new Date();
  const avgCycle =
    periods.length >= 2 ? getAverageCycleLength(periods) : -1;
  const effectiveCycle = avgCycle > 0 ? avgCycle : settings.cycleLength;

  const sortedPeriods = [...periods].sort(
    (a, b) => a.startDate.localeCompare(b.startDate)
  );
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1] || null;
  const lastPeriodStart = lastPeriod ? parseISO(lastPeriod.startDate) : null;

  const predictedNextPeriod = lastPeriodStart
    ? addDays(lastPeriodStart, effectiveCycle)
    : null;
  const predictedOvulation = predictedNextPeriod
    ? addDays(predictedNextPeriod, -14)
    : null;

  const fertileWindow =
    predictedOvulation
      ? {
          start: addDays(predictedOvulation, -5),
          end: addDays(predictedOvulation, 1),
        }
      : null;

  // Today's phase
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayPeriod = lastPeriod
    ? (todayStr >= lastPeriod.startDate && todayStr <= lastPeriod.endDate ? lastPeriod : null)
    : null;

  let phase: CycleState['todayPhase']['phase'] = 'no_data';
  let label = '请先标记经期开始日期，开始追踪周期';
  let periodDay: number | undefined;
  let daysUntilOvulation: number | undefined;

  if (!lastPeriodStart) {
    phase = 'no_data';
  } else if (todayPeriod) {
    phase = 'period';
    periodDay = differenceInCalendarDays(today, parseISO(todayPeriod.startDate)) + 1;
    const remaining = differenceInCalendarDays(parseISO(todayPeriod.endDate), today);
    label = `🩸 经期第 ${periodDay} 天，预计还有 ${remaining} 天结束`;
  } else if (fertileWindow && predictedOvulation) {
    const todayTime = today.getTime();
    if (todayTime >= fertileWindow.start.getTime() && todayTime <= predictedOvulation.getTime()) {
      if (todayTime >= addDays(predictedOvulation, -2).getTime()) {
        phase = 'fertile_high';
        const dayIn = differenceInCalendarDays(today, fertileWindow.start) + 1;
        label = `🌟 怀孕概率较高，今天是易孕期第 ${dayIn} 天`;
      } else {
        phase = 'fertile_medium';
        label = '怀孕概率中等，易孕期即将到来';
      }
    } else if (todayTime > predictedOvulation.getTime() && todayTime <= fertileWindow.end.getTime()) {
      phase = 'fertile_high';
      label = '🌟 怀孕概率较高，排卵后第一天';
    } else if (lastPeriodStart && today < lastPeriodStart) {
      phase = 'follicular';
      daysUntilOvulation = predictedOvulation
        ? differenceInCalendarDays(predictedOvulation, today)
        : undefined;
      label = daysUntilOvulation && daysUntilOvulation > 0
        ? `当前怀孕概率较低，距排卵日约还有 ${daysUntilOvulation} 天`
        : '当前处于卵泡期';
    } else {
      phase = 'luteal';
      daysUntilOvulation = predictedNextPeriod
        ? differenceInCalendarDays(predictedNextPeriod, today)
        : undefined;
      label = daysUntilOvulation && daysUntilOvulation > 0
        ? `当前怀孕概率较低，距下次经期约 ${daysUntilOvulation} 天`
        : '当前处于黄体期';
    }
  }

  return {
    averageCycleLength: effectiveCycle,
    lastPeriodStart,
    predictedNextPeriod,
    predictedOvulation,
    fertileWindow,
    todayPhase: { phase, label, periodDay, daysUntilOvulation },
  };
}

export function getProbabilityLevel(
  dateStr: string,
  cycleState: CycleState,
  periods: PeriodRecord[]
): { level: ProbabilityLevel; periodDay: number | null; isPeriodStart: boolean } {
  const date = parseISO(dateStr);

  // Check period
  const period = getPeriodForDate(periods, dateStr);
  if (period) {
    const periodDay = differenceInCalendarDays(date, parseISO(period.startDate)) + 1;
    return {
      level: 'period',
      periodDay,
      isPeriodStart: period.startDate === dateStr,
    };
  }

  // Check fertile window
  if (cycleState.fertileWindow) {
    const d = date.getTime();
    const fwStart = cycleState.fertileWindow.start.getTime();
    const fwEnd = cycleState.fertileWindow.end.getTime();

    if (d >= fwStart && d <= fwEnd) {
      if (cycleState.predictedOvulation) {
        if (d >= addDays(cycleState.predictedOvulation, -2).getTime() && d <= addDays(cycleState.predictedOvulation, 1).getTime()) {
          return { level: 'high', periodDay: null, isPeriodStart: false };
        }
      }
      return { level: 'medium', periodDay: null, isPeriodStart: false };
    }
  }

  return { level: 'low', periodDay: null, isPeriodStart: false };
}

// ========== Calendar Grid ==========

export function getMonthDays(year: number, month: number): DayInfo[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: DayInfo[] = [];
  let current = calStart;

  while (current <= calEnd) {
    days.push({
      date: new Date(current),
      dateStr: format(current, 'yyyy-MM-dd'),
      dayOfMonth: current.getDate(),
      isCurrentMonth: current.getMonth() === month,
      isWeekend: isWeekend(current),
      isToday: isToday(current),
      probability: 'none', // will be filled by caller
      periodDay: null,
      isPeriodStart: false,
    });
    current = addDays(current, 1);
  }

  return days;
}

export function getMonthDaysWithProbability(
  year: number,
  month: number,
  cycleState: CycleState,
  periods: PeriodRecord[]
): DayInfo[] {
  const days = getMonthDays(year, month);
  return days.map((day) => {
    if (!day.isCurrentMonth) return day;
    const { level, periodDay, isPeriodStart } = getProbabilityLevel(
      day.dateStr,
      cycleState,
      periods
    );
    return { ...day, probability: level, periodDay, isPeriodStart };
  });
}

// ========== Export ==========

export function exportCSV(periods: PeriodRecord[]): string {
  const header = '经期开始日期,经期结束日期,周期长度(天),经期持续天数';
  const rows = periods.map((p, i) => {
    const cycleLen =
      i > 0
        ? differenceInCalendarDays(
            parseISO(p.startDate),
            parseISO(periods[i - 1].startDate)
          )
        : '';
    const dur = differenceInCalendarDays(parseISO(p.endDate), parseISO(p.startDate)) + 1;
    return `${p.startDate},${p.endDate},${cycleLen},${dur}`;
  });
  return [header, ...rows].join('\n');
}

export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

// ========== Helpers ==========

export function formatDateCN(date: Date): string {
  return format(date, 'yyyy年M月d日');
}

export function formatMonthCN(date: Date): string {
  return format(date, 'yyyy年M月');
}

export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
