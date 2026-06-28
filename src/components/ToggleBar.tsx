interface ToggleBarProps {
  periodMode: boolean;
  intimacyMode: boolean;
  onTogglePeriod: () => void;
  onToggleIntimacy: () => void;
  hasPeriods: boolean;
}

export default function ToggleBar({
  periodMode,
  intimacyMode,
  onTogglePeriod,
  onToggleIntimacy,
  hasPeriods,
}: ToggleBarProps) {
  return (
    <div className="px-3 sm:px-4 pt-3 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          {/* 经期记录开关 */}
          <button
            onClick={onTogglePeriod}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
              periodMode
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-200'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">{periodMode ? '🩸' : '🩸'}</span>
            <span>{periodMode ? '记录中' : '记录经期'}</span>
          </button>

          {/* 爱爱记录开关 */}
          <button
            onClick={onToggleIntimacy}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
              intimacyMode
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">💕</span>
            <span>{intimacyMode ? '记录中' : '记录爱爱'}</span>
          </button>
        </div>

        {/* Hint text */}
        {!periodMode && !intimacyMode && (
          <p className="text-xs text-gray-400 text-center mt-2">
            {hasPeriods
              ? '👆 打开开关后，点击日历日期即可记录'
              : '👆 打开「记录经期」开关，点击日历日期开始记录'}
          </p>
        )}
        {periodMode && (
          <p className="text-xs text-violet-500 text-center mt-2 font-medium">
            🩸 点击日历上的日期标记经期
          </p>
        )}
        {intimacyMode && (
          <p className="text-xs text-rose-500 text-center mt-2 font-medium">
            💕 点击日历上的日期记录爱爱
          </p>
        )}
      </div>
    </div>
  );
}
