import type { CycleState } from '../types';

interface StatusBarProps {
  cycleState: CycleState;
  hasPeriods: boolean;
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

export default function StatusBar({ cycleState, hasPeriods }: StatusBarProps) {
  const { todayPhase, todayProbability, todayProbabilityLabel } = cycleState;
  const emoji = getPhaseEmoji(todayPhase.phase);

  return (
    <div className="px-3 sm:px-4 pt-4 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
            {emoji}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-400 mb-0.5">
              {hasPeriods ? '今日状态' : '欢迎使用'}
            </p>
            <p className="text-sm font-semibold text-gray-800 leading-relaxed">
              {todayPhase.label}
            </p>
          </div>
        </div>

        {/* Probability section */}
        {todayProbability !== null && hasPeriods && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {todayProbabilityLabel}
              </span>
              <div className="flex items-center gap-2">
                {/* Probability bar */}
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      todayProbability >= 20
                        ? 'bg-rose-400'
                        : todayProbability >= 8
                          ? 'bg-amber-400'
                          : todayProbability >= 3
                            ? 'bg-yellow-400'
                            : 'bg-gray-300'
                    }`}
                    style={{ width: `${Math.min(todayProbability * 3.3, 100)}%` }}
                  />
                </div>
                <span className={`text-lg font-bold ${getProbabilityColor(todayProbability)}`}>
                  {todayProbability}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
