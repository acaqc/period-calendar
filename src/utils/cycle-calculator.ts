import {
  format,
  parseISO,
  addDays,
  differenceInCalendarDays,
} from 'date-fns';
import type {
  PeriodRecord,
  CycleState,
  CyclePrediction,
  PhaseLabel,
  DatePhaseInfo,
  AppData,
  UserSettings,
} from '../types';

// ========== 经期数据操作 ==========

/** 添加经期记录（含重叠检查 — 修复 Bug #5） */
export function addPeriod(
  data: AppData,
  startDate: Date
): { data: AppData; error?: string } {
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endDate = addDays(startDate, data.settings.periodLength - 1);
  const endStr = format(endDate, 'yyyy-MM-dd');

  // Bug #5 修复：使用标准区间重叠公式
  const overlap = data.periods.some((p) => {
    return startStr <= p.endDate && endStr >= p.startDate;
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

/** 删除经期记录 */
export function removePeriod(
  data: AppData,
  date: Date
): { data: AppData; removed: boolean } {
  const dateStr = format(date, 'yyyy-MM-dd');

  // 精确匹配 startDate
  const period = data.periods.find((p) => p.startDate === dateStr);
  if (period) {
    return {
      data: { ...data, periods: data.periods.filter((p) => p.id !== period.id) },
      removed: true,
    };
  }

  // 也支持删除日期范围内的经期（点中间某天也能删整个经期）
  const containing = data.periods.find(
    (p) => dateStr >= p.startDate && dateStr <= p.endDate
  );
  if (containing) {
    return {
      data: { ...data, periods: data.periods.filter((p) => p.id !== containing.id) },
      removed: true,
    };
  }

  return { data, removed: false };
}

/** 查找某日期所在的经期 */
export function getPeriodForDate(
  periods: PeriodRecord[],
  dateStr: string
): PeriodRecord | null {
  return (
    periods.find((p) => dateStr >= p.startDate && dateStr <= p.endDate) || null
  );
}

/** 切换爱爱记录 */
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

// ========== 周期计算核心 ==========

/** 计算平均周期长度 */
function getAverageCycleLength(periods: PeriodRecord[]): number {
  if (periods.length < 2) return -1;

  const lengths: number[] = [];
  for (let i = 1; i < periods.length; i++) {
    const prev = parseISO(periods[i - 1].startDate);
    const curr = parseISO(periods[i].startDate);
    const len = differenceInCalendarDays(curr, prev);
    if (len >= 15 && len <= 60) {
      lengths.push(len);
    }
  }

  if (lengths.length === 0) return -1;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

/** 计算完整的周期状态 */
export function calculateCycle(
  periods: PeriodRecord[],
  settings: UserSettings
): CycleState {
  const today = new Date();
  const avgCycle = periods.length >= 2 ? getAverageCycleLength(periods) : -1;
  const effectiveCycle = avgCycle > 0 ? avgCycle : settings.cycleLength;

  const sortedPeriods = [...periods].sort(
    (a, b) => a.startDate.localeCompare(b.startDate)
  );
  const lastPeriod = sortedPeriods[sortedPeriods.length - 1] || null;
  const lastPeriodStart = lastPeriod ? parseISO(lastPeriod.startDate) : null;

  const predictedNextPeriod = lastPeriodStart
    ? addDays(lastPeriodStart, effectiveCycle)
    : addDays(today, effectiveCycle);
  const predictedOvulation = addDays(predictedNextPeriod, -14);

  const previousOvulation = predictedOvulation
    ? addDays(predictedOvulation, -effectiveCycle)
    : null;

  const fertileWindow = predictedOvulation
    ? {
        start: addDays(predictedOvulation, -5),
        end: addDays(predictedOvulation, 1),
      }
    : null;

  const todayStr = format(today, 'yyyy-MM-dd');
  const todayPeriod = lastPeriod
    ? todayStr >= lastPeriod.startDate && todayStr <= lastPeriod.endDate
      ? lastPeriod
      : null
    : null;

  // ========== 构建所有周期预测（Bug #3 修复：每条经期独立预测） ==========
  const allPredictions: CyclePrediction[] = sortedPeriods.map((period, idx) => {
    const pStart = parseISO(period.startDate);
    const pEnd = parseISO(period.endDate);
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

  // ========== 今日阶段计算 ==========
  let phase: PhaseLabel = 'no_data';
  let label = '请先标记经期开始日期，开始追踪周期';
  let periodDay: number | undefined;
  let daysUntilOvulation: number | undefined;
  let todayProbability: number | null = null;
  let todayProbabilityLabel = '';

  // Bug #3 修复：找 periodStart <= today 的最新预测
  let todayOvDate: Date | null = null;
  const todayTime = today.getTime();
  for (const pred of allPredictions) {
    if (pred.periodStart.getTime() <= todayTime) {
      todayOvDate = pred.ovulationDate;
    } else {
      break;
    }
  }
  if (!todayOvDate && allPredictions.length > 0) {
    todayOvDate = allPredictions[0].ovulationDate;
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

/** 获取指定日期的阶段信息 */
export function getDatePhase(
  targetDate: Date,
  periods: PeriodRecord[],
  cycleState: CycleState
): DatePhaseInfo {
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  // 检查是否在经期中
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

  // Bug #3 修复：找 periodStart <= targetDate 的最新预测
  const { allPredictions } = cycleState;
  let matchedPrediction: CyclePrediction | null = null;

  if (allPredictions.length > 0) {
    const targetTime = targetDate.getTime();
    for (const pred of allPredictions) {
      if (pred.periodStart.getTime() <= targetTime) {
        matchedPrediction = pred;
      } else {
        break;
      }
    }
    if (!matchedPrediction) {
      matchedPrediction = allPredictions[0];
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
