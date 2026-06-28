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

export default function StatusBar({ cycleState, hasPeriods }: StatusBarProps) {
  const { todayPhase } = cycleState;
  const emoji = getPhaseEmoji(todayPhase.phase);

  return (
    <div className="px-3 sm:px-4 pt-4 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
            {emoji}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 mb-0.5">
              {hasPeriods ? '今日状态' : '欢迎使用'}
            </p>
            <p className="text-sm font-semibold text-gray-800 leading-relaxed">
              {todayPhase.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
