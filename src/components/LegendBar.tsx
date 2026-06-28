import type { CycleState } from '../types';
import { formatDateCN } from '../utils';

interface LegendBarProps {
  cycleState: CycleState;
}

const legendItems = [
  { color: 'bg-violet-500', label: '经期日' },
  { color: 'bg-rose-400', label: '高概率' },
  { color: 'bg-amber-400', label: '中概率' },
  { color: 'ring-2 ring-indigo-400 ring-inset', label: '今天' },
  { color: 'text-sm', label: '🌸 排卵日' },
  { color: 'text-sm', label: '💕 爱爱' },
];

export default function LegendBar({ cycleState }: LegendBarProps) {
  return (
    <div className="px-3 sm:px-4 pt-3 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-in">
        {/* Color legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              {item.color.startsWith('bg-') || item.color.startsWith('ring-') ? (
                <span className={`w-3 h-3 rounded-full ${item.color}`} />
              ) : (
                <span className={item.color}>{item.label.slice(0, 2)}</span>
              )}
              <span className="text-xs text-gray-500">
                {item.color.startsWith('text-') ? item.label.slice(2) : item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Ovulation summary */}
        {cycleState.predictedOvulation && (
          <div className="border-t border-gray-50 pt-3 space-y-1.5">
            {/* Next ovulation */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-rose-400">🌸 下个排卵日</span>
              <strong className="text-rose-600 font-semibold">
                {formatDateCN(cycleState.predictedOvulation)}
              </strong>
              <span className="text-gray-400 ml-auto">
                周期{' '}
                <strong className="text-gray-600 font-semibold">{cycleState.averageCycleLength}</strong>{' '}
                天
              </span>
            </div>

            {/* Next period */}
            {cycleState.predictedNextPeriod && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">🩸 下次经期</span>
                <strong className="text-gray-600 font-semibold">
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
