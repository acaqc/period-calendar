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
];

export default function LegendBar({ cycleState }: LegendBarProps) {
  return (
    <div className="px-3 sm:px-4 pt-3 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-fade-in">
        {/* Color legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Cycle summary */}
        {cycleState.predictedNextPeriod && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-400 border-t border-gray-50 pt-3">
            <span>
              周期{' '}
              <strong className="text-gray-700 font-semibold">{cycleState.averageCycleLength}</strong>{' '}
              天
            </span>
            <span className="text-gray-200">|</span>
            <span>
              下次经期{' '}
              <strong className="text-gray-700 font-semibold">
                {formatDateCN(cycleState.predictedNextPeriod)}
              </strong>
            </span>
            {cycleState.predictedOvulation && (
              <>
                <span className="text-gray-200">|</span>
                <span>
                  排卵日{' '}
                  <strong className="text-gray-700 font-semibold">
                    {formatDateCN(cycleState.predictedOvulation)}
                  </strong>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
