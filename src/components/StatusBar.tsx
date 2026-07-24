import { useAppStore } from '../store/useAppStore';

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

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'period': return '经期';
    case 'fertile_high': return '易孕期';
    case 'fertile_medium': return '可孕期';
    case 'follicular': return '卵泡期';
    case 'luteal': return '黄体期';
    default: return '日历';
  }
}

function getProbabilityColor(value: number): string {
  if (value >= 20) return 'text-[#D4956A]';
  if (value >= 8) return 'text-[#C9AD8B]';
  if (value >= 3) return 'text-[#D4C5A0]';
  return 'text-[#8A8A8A]';
}

function getProbabilityBarColor(value: number): string {
  if (value >= 20) return 'bg-[#D4956A]';
  if (value >= 8) return 'bg-[#C9AD8B]';
  if (value >= 3) return 'bg-[#D4C5A0]';
  return 'bg-[#D4D4CE]';
}

function formatDateShort(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export default function StatusBar() {
  const cycleState = useAppStore((s) => s.cycleState);
  const data = useAppStore((s) => s.data);
  const selectedDate = useAppStore((s) => s.selectedDate);
  const selectedPhase = useAppStore((s) => s.selectedPhase);

  const hasPeriods = data.periods.length > 0;
  const isSelected = selectedDate !== null;

  const activePhase = selectedPhase ?? {
    phase: cycleState.todayPhase.phase,
    label: cycleState.todayPhase.label,
    probability: cycleState.todayProbability,
    probabilityLabel: cycleState.todayProbabilityLabel,
  };

  const probability = activePhase?.probability ?? null;
  const probabilityLabel = activePhase?.probabilityLabel ?? '';
  const emoji = getPhaseEmoji(activePhase?.phase ?? 'no_data');
  const phaseLabel = getPhaseLabel(activePhase?.phase ?? 'no_data');

  // 判断选中日期是否是今天
  const isTodaySelected = selectedDate !== null &&
    selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="px-3 sm:px-4 pt-4 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EBEBE6]">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#F5F4F0] flex items-center justify-center text-xl flex-shrink-0">
            <span role="img" aria-label={phaseLabel}>{emoji}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[#757575] mb-0.5 tracking-wider">
              {isSelected
                ? `${formatDateShort(selectedDate!)}${isTodaySelected ? ' · 今日' : ''}`
                : hasPeriods
                  ? '今日状态'
                  : '开始记录吧'}
            </p>
            <p className="text-sm font-semibold text-[#2D2D2D] leading-relaxed">
              {activePhase?.label ?? ''}
            </p>
            {isSelected && (
              <p className="text-xs text-[#A3B5A6] mt-0.5">
                点击底部「今天」可回到今日状态
              </p>
            )}
          </div>
        </div>

        {/* 概率条 */}
        {probability !== null && hasPeriods && (
          <div className="mt-3 pt-3 border-t border-[#F0F0EC]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#757575]">{probabilityLabel}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1 bg-[#EBEBE6] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProbabilityBarColor(probability)}`}
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
