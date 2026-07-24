import { useAppStore } from '../store/useAppStore';
import { formatDateCN } from '../utils';

const legendItems = [
  { color: 'bg-[#E88D7D]', label: '经期日' },
  { color: 'bg-[#D4956A]', label: '高概率' },
  { color: 'bg-[#C9AD8B]', label: '中概率' },
  { color: 'ring-2 ring-[#B0B0B0] ring-inset', label: '今天' },
  { color: 'text-sm', label: '排卵日', emoji: '🌸' },
  { color: 'text-sm', label: '爱爱', emoji: '💕' },
];

export default function LegendBar() {
  const cycleState = useAppStore((s) => s.cycleState);

  return (
    <div className="px-3 sm:px-4 pt-4 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EBEBE6]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              {item.color.startsWith('bg-') || item.color.startsWith('ring-') ? (
                <span className={`w-3 h-3 rounded-full ${item.color}`} />
              ) : (
                <span className={item.color} role="img" aria-label={item.label}>{item.emoji}</span>
              )}
              <span className="text-[11px] text-[#757575]">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* 排卵日摘要 */}
        {cycleState.predictedOvulation && (
          <div className="border-t border-[#F0F0EC] pt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#A3B5A6]"><span role="img" aria-label="排卵">🌸</span> 下个排卵日</span>
              <strong className="text-[#8A9A7B] font-semibold">
                {formatDateCN(cycleState.predictedOvulation)}
              </strong>
              <span className="text-[#757575] ml-auto">
                周期{' '}
                <strong className="text-[#6B6B6B] font-semibold">
                  {cycleState.averageCycleLength}
                </strong>{' '}
                天
              </span>
            </div>

            {cycleState.predictedNextPeriod && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#757575]"><span role="img" aria-label="经期">🩸</span> 下次经期</span>
                <strong className="text-[#6B6B6B] font-semibold">
                  {formatDateCN(cycleState.predictedNextPeriod)}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
