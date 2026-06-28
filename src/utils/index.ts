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
  CyclePrediction,
  DayInfo,
  PeriodRecord,
  ProbabilityLevel,
  UserSettings,
  PhaseLabel,
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
    intimacyDates: [],
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

// ========== Intimacy Operations ==========

export function toggleIntimacy(data: AppData, date: Date): AppData {
  const dateStr = format(date, 'yyyy-MM-dd');
  const exists = data.intimacyDates.includes(dateStr);
  return {
    ...data,
    intimacyDates: exists
      ? data.intimacyDates.filter((d) => d !== dateStr)
      : [...data.intimacyDates, dateStr].sort(),
  };
}

export function hasIntimacy(intimacyDates: string[], dateStr: string): boolean {
  return intimacyDates.includes(dateStr);
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

  // Even without period records, predict based on default cycle from today
  const predictedNextPeriod = lastPeriodStart
    ? addDays(lastPeriodStart, effectiveCycle)
    : addDays(today, effectiveCycle);
  const predictedOvulation = addDays(predictedNextPeriod, -14);

  // Previous ovulation: the one before the current cycle's predicted ovulation
  const previousOvulation = predictedOvulation
    ? addDays(predictedOvulation, -effectiveCycle)
    : null;

  const fertileWindow =
    predictedOvulation
      ? {
          start: addDays(predictedOvulation, -5),
          end: addDays(predictedOvulation, 1),
        }
      : null;

  // Pre-compute today's period check
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayPeriod = lastPeriod
    ? (todayStr >= lastPeriod.startDate && todayStr <= lastPeriod.endDate ? lastPeriod : null)
    : null;

  // ========== Build all cycle predictions (one per period record) ==========
  const allPredictions: CyclePrediction[] = sortedPeriods.map((period, idx) => {
    const pStart = parseISO(period.startDate);
    const pEnd = parseISO(period.endDate);
    // Determine cycle length for this period
    let cycleLen = effectiveCycle;
    if (idx < sortedPeriods.length - 1) {
      const nextStart = parseISO(sortedPeriods[idx + 1].startDate);
      const actualLen = differenceInCalendarDays(nextStart, pStart);
      if (actualLen >= 15 && actualLen <= 60) cycleLen = actualLen;
    }
    const nextPeriod = addDays(pStart, cycleLen);
    const ovDate = addDays(nextPeriod, -14);
    return {
      periodStart: pStart,
      periodEnd: pEnd,
      ovulationDate: ovDate,
      fertileStart: addDays(ovDate, -5),
      fertileEnd: addDays(ovDate, 1),
      nextPeriodStart: nextPeriod,
    };
  });

  // ========== Today's phase — use allPredictions to find correct ovulation ==========

  let phase: CycleState['todayPhase']['phase'] = 'no_data';
  let label = '请先标记经期开始日期，开始追踪周期';
  let periodDay: number | undefined;
  let daysUntilOvulation: number | undefined;
  let todayProbability: number | null = null;
  let todayProbabilityLabel = '';

  // Find which prediction today belongs to
  let todayOvDate: Date | null = null;
  for (let i = 0; i < allPredictions.length; i++) {
    const pred = allPredictions[i];
    const nextPred = allPredictions[i + 1];
    const periodStart = pred.periodStart.getTime();
    const nextPeriodStart = nextPred ? nextPred.periodStart.getTime() : pred.nextPeriodStart.getTime();
    if (today.getTime() >= periodStart && today.getTime() < nextPeriodStart) {
      todayOvDate = pred.ovulationDate;
      break;
    }
  }
  // Fallback to last prediction
  if (!todayOvDate && allPredictions.length > 0) {
    todayOvDate = allPredictions[allPredictions.length - 1].ovulationDate;
  }

  if (!lastPeriodStart) {
    phase = 'no_data';
  } else if (todayPeriod) {
    phase = 'period';
    periodDay = differenceInCalendarDays(today, parseISO(todayPeriod.startDate)) + 1;
    const remaining = differenceInCalendarDays(parseISO(todayPeriod.endDate), today);
    label = `🩸 经期第 ${periodDay} 天，预计还有 ${remaining} 天结束`;
    todayProbability = 0.5;
    todayProbabilityLabel = '经期怀孕概率极低（约 <1%）';
  } else if (todayOvDate) {
    const daysFromOv = differenceInCalendarDays(today, todayOvDate);

    if (daysFromOv === 0) {
      phase = 'fertile_high';
      label = '🌸 排卵日，怀孕概率较高';
      todayProbability = 25;
      todayProbabilityLabel = '排卵日当天，怀孕概率约 25%';
    } else if (daysFromOv === -1) {
      phase = 'fertile_high';
      label = '🌟 排卵前1天，怀孕概率最高';
      todayProbability = 30;
      todayProbabilityLabel = '排卵前1天，怀孕概率最高约 30%';
    } else if (daysFromOv === -2) {
      phase = 'fertile_high';
      label = '🌟 排卵前2天，怀孕概率较高';
      todayProbability = 25;
      todayProbabilityLabel = '排卵前2天，怀孕概率约 25%';
    } else if (daysFromOv === 1) {
      phase = 'fertile_high';
      label = '排卵后1天，仍有受孕可能';
      todayProbability = 10;
      todayProbabilityLabel = '排卵后1天，怀孕概率约 10%';
    } else if (daysFromOv >= -5 && daysFromOv <= -3) {
      phase = 'fertile_medium';
      label = `易孕期，距排卵日 ${Math.abs(daysFromOv)} 天`;
      todayProbability = 8;
      todayProbabilityLabel = `排卵前${Math.abs(daysFromOv)}天，怀孕概率约 8%`;
    } else if (daysFromOv > 1 && daysFromOv <= 7) {
      phase = 'luteal';
      label = `黄体期，排卵后 ${daysFromOv} 天`;
      todayProbability = 2;
      todayProbabilityLabel = '排卵后，怀孕概率约 2%';
    } else if (daysFromOv < -5) {
      phase = 'follicular';
      daysUntilOvulation = Math.abs(daysFromOv);
      label = `卵泡期，距排卵日约 ${daysUntilOvulation} 天`;
      todayProbability = 3;
      todayProbabilityLabel = '距排卵日较远，怀孕概率约 3%';
    } else {
      phase = 'luteal';
      label = '黄体期后期';
      todayProbability = 1;
      todayProbabilityLabel = '怀孕概率约 1%';
    }
  }

  return {
    averageCycleLength: effectiveCycle,
    lastPeriodStart,
    predictedNextPeriod,
    predictedOvulation,
    previousOvulation,
    fertileWindow,
    allPredictions,
    todayProbability,
    todayProbabilityLabel,
    todayPhase: { phase, label, periodDay, daysUntilOvulation },
  };
}

// ========== Get phase for any date (not just today) ==========

export interface DatePhaseInfo {
  phase: PhaseLabel;
  label: string;
  periodDay?: number;
  probability: number | null;
  probabilityLabel: string;
}

export function getDatePhase(
  targetDate: Date,
  periods: PeriodRecord[],
  cycleState: CycleState
): DatePhaseInfo {
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  // Check if in period
  const period = getPeriodForDate(periods, dateStr);
  if (period) {
    const periodDay = differenceInCalendarDays(targetDate, parseISO(period.startDate)) + 1;
    const remaining = differenceInCalendarDays(parseISO(period.endDate), targetDate);
    return {
      phase: 'period',
      label: `🩸 经期第 ${periodDay} 天，预计还有 ${remaining} 天结束`,
      periodDay,
      probability: 0.5,
      probabilityLabel: '经期怀孕概率极低（约 <1%）',
    };
  }

  // Find the prediction that this date belongs to
  // Strategy: find the period that starts before targetDate and whose next period starts after targetDate
  const { allPredictions } = cycleState;
  let matchedPrediction = allPredictions.length > 0 ? allPredictions[allPredictions.length - 1] : null;

  for (let i = 0; i < allPredictions.length; i++) {
    const pred = allPredictions[i];
    const nextPred = allPredictions[i + 1];
    const periodStart = pred.periodStart.getTime();
    const nextPeriodStart = nextPred ? nextPred.periodStart.getTime() : pred.nextPeriodStart.getTime();
    const targetTime = targetDate.getTime();

    if (targetTime >= periodStart && targetTime < nextPeriodStart) {
      matchedPrediction = pred;
      break;
    }
    // If target is before the first period, use the first prediction
    if (i === 0 && targetTime < periodStart) {
      matchedPrediction = pred;
      break;
    }
  }

  if (!matchedPrediction) {
    return { phase: 'no_data', label: '暂无预测数据', probability: null, probabilityLabel: '' };
  }

  const ovDate = matchedPrediction.ovulationDate;
  const daysFromOvulation = differenceInCalendarDays(targetDate, ovDate);
  let phase: PhaseLabel;
  let label: string;
  let probability: number;
  let probabilityLabel: string;

  if (daysFromOvulation === 0) {
    phase = 'fertile_high';
    label = '🌸 排卵日，怀孕概率较高';
    probability = 25;
    probabilityLabel = '排卵日当天，怀孕概率约 25%';
  } else if (daysFromOvulation === -1) {
    phase = 'fertile_high';
    label = '🌟 排卵前1天，怀孕概率最高';
    probability = 30;
    probabilityLabel = '排卵前1天，怀孕概率最高约 30%';
  } else if (daysFromOvulation === -2) {
    phase = 'fertile_high';
    label = '🌟 排卵前2天，怀孕概率较高';
    probability = 25;
    probabilityLabel = '排卵前2天，怀孕概率约 25%';
  } else if (daysFromOvulation === 1) {
    phase = 'fertile_high';
    label = '排卵后1天，仍有受孕可能';
    probability = 10;
    probabilityLabel = '排卵后1天，怀孕概率约 10%';
  } else if (daysFromOvulation >= -5 && daysFromOvulation <= -3) {
    phase = 'fertile_medium';
    label = `易孕期，距排卵日 ${Math.abs(daysFromOvulation)} 天`;
    probability = 8;
    probabilityLabel = `排卵前${Math.abs(daysFromOvulation)}天，怀孕概率约 8%`;
  } else if (daysFromOvulation > 1 && daysFromOvulation <= 7) {
    phase = 'luteal';
    label = `黄体期，排卵后 ${daysFromOvulation} 天`;
    probability = 2;
    probabilityLabel = '排卵后，怀孕概率约 2%';
  } else if (daysFromOvulation < -5) {
    phase = 'follicular';
    label = `卵泡期，距排卵日约 ${Math.abs(daysFromOvulation)} 天`;
    probability = 3;
    probabilityLabel = '距排卵日较远，怀孕概率约 3%';
  } else {
    phase = 'luteal';
    label = '黄体期后期';
    probability = 1;
    probabilityLabel = '怀孕概率约 1%';
  }

  return { phase, label, probability, probabilityLabel };
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
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
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
      probability: 'none',
      periodDay: null,
      isPeriodStart: false,
      isOvulationDay: false,
      hasIntimacy: false,
    });
    current = addDays(current, 1);
  }

  return days;
}

export function getMonthDaysWithProbability(
  year: number,
  month: number,
  cycleState: CycleState,
  periods: PeriodRecord[],
  intimacyDates: string[]
): DayInfo[] {
  const days = getMonthDays(year, month);

  return days.map((day) => {
    if (!day.isCurrentMonth) return day;

    // Check period from actual records
    const period = getPeriodForDate(periods, day.dateStr);
    if (period) {
      const periodDay = differenceInCalendarDays(parseISO(day.dateStr), parseISO(period.startDate)) + 1;
      return {
        ...day,
        probability: 'period' as ProbabilityLevel,
        periodDay,
        isPeriodStart: period.startDate === day.dateStr,
        isOvulationDay: false,
        hasIntimacy: intimacyDates.includes(day.dateStr),
      };
    }

    // Check against ALL cycle predictions for fertile windows and ovulation
    let bestLevel: ProbabilityLevel = 'low';
    let isOvDay = false;

    for (const pred of cycleState.allPredictions) {
      const d = parseISO(day.dateStr).getTime();

      // Is this the ovulation day?
      if (format(pred.ovulationDate, 'yyyy-MM-dd') === day.dateStr) {
        isOvDay = true;
      }

      // Is this in the fertile window?
      if (d >= pred.fertileStart.getTime() && d <= pred.fertileEnd.getTime()) {
        // High probability: ovulation day ±2
        if (d >= addDays(pred.ovulationDate, -2).getTime() && d <= addDays(pred.ovulationDate, 1).getTime()) {
          bestLevel = 'high';
        } else if (bestLevel !== 'high') {
          bestLevel = 'medium';
        }
      }
    }

    return {
      ...day,
      probability: bestLevel,
      periodDay: null,
      isPeriodStart: false,
      isOvulationDay: isOvDay,
      hasIntimacy: intimacyDates.includes(day.dateStr),
    };
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
