import {
  format,
  parseISO,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isWeekend,
  isToday,
} from 'date-fns';
import type { DayInfo, PeriodRecord, CycleState, ProbabilityLevel } from '../types';
import { getPeriodForDate } from './cycle-calculator';

/** 生成一个月的日历网格 */
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

/** 生成带概率标记的月历网格 */
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

    // 检查经期
    const period = getPeriodForDate(periods, day.dateStr);
    if (period) {
      const periodDay =
        Math.floor(
          (parseISO(day.dateStr).getTime() - parseISO(period.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;
      return {
        ...day,
        probability: 'period' as ProbabilityLevel,
        periodDay,
        isPeriodStart: period.startDate === day.dateStr,
        isOvulationDay: false,
        hasIntimacy: intimacyDates.includes(day.dateStr),
      };
    }

    // 遍历所有预测，检查易孕期和排卵日
    let bestLevel: ProbabilityLevel = 'low';
    let isOvDay = false;

    for (const pred of cycleState.allPredictions) {
      const d = parseISO(day.dateStr).getTime();

      // 排卵日
      if (format(pred.ovulationDate, 'yyyy-MM-dd') === day.dateStr) {
        isOvDay = true;
      }

      // 易孕期
      if (d >= pred.fertileStart.getTime() && d <= pred.fertileEnd.getTime()) {
        if (
          d >= addDays(pred.ovulationDate, -2).getTime() &&
          d <= addDays(pred.ovulationDate, 1).getTime()
        ) {
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
