import type { CycleState, PeriodRecord } from '../types';
import type { DatePhaseInfo } from '../utils';
import { getDatePhase } from '../utils';

interface StatusBarProps {
  cycleState: CycleState;
  hasPeriods: boolean;
  selectedDate: Date | null;
  periods: PeriodRecord[];
}

function getPhaseEmoji(phase: string): string {
  switch (phase) {
    case 'period': return '🩸';
    case 'fertile_high': return '🌟';
    case 'fertile_medium': return '🌤️';
    case 'follicular': return '🌱';
    case 'luteal': return '🌙';
    default: return '📅';
  }
}

function getProbabilityColor(value: number): string {
  if (value >= 20) return 'text-rose-500';
  if (value >= 8) return 'text-amber-500';
  if (value >= 3) return 'text-yellow-500';
  return 'text-gray-400';
}

function formatDateShort(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function StatusBar({ cycleState, hasPeriods, selectedDate, periods }: StatusBarProps) {
  let activePhase: DatePhaseInfo | null = null;
  let isSelected = false;

  if (selectedDate) {
    activePhase = getDatePhase(selectedDate, periods, cycleState);
    isSelected = true;
  } else {
    // Today's phase
    activePhase = {
      phase: cycleState.todayPhase.phase,
      label: cycleState.todayPhase.label,
      probability: cycleState.todayProbability,
      probabilityLabel: cycleState.todayProbabilityLabel,
    };
  }

  const probability = activePhase?.probability ?? null;
  const probabilityLabel = activePhase?.probabilityLabel ?? '';
  const emoji = getPhaseEmoji(activePhase?.phase ?? 'no_data');

  return (
    <div className="px-3 sm:px-4 pt-4 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
            {emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-400 mb-0.5">
              {isSelected
                ? `📅 ${formatDateShort(selectedDate!)}`
                : hasPeriods
                  ? '今日状态'
                  : '欢迎使用'}
            </p>
            <p className="text-sm font-semibold text-gray-800 leading-relaxed">
              {activePhase?.label ?? ''}
            </p>
            {isSelected && (
              <p className="text-xs text-indigo-400 mt-0.5">
                点击「今天」按钮可回到今日状态
              </p>
            )}
          </div>
        </div>

        {/* Probability section */}
        {probability !== null && hasPeriods && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {probabilityLabel}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      probability >= 20
                        ? 'bg-rose-400'
                        : probability >= 8
                          ? 'bg-amber-400'
                          : probability >= 3
                            ? 'bg-yellow-400'
                            : 'bg-gray-300'
                    }`}
                    style={{ width: `${Math.min(probability * 3.3, 100)}%` }}
                  />
                </div>
                <span className={`text-lg font-bold ${getProbabilityColor(probability)}`}>
                  {probability}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
