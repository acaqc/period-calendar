import { useAppStore } from '../store/useAppStore';

export default function ToggleBar() {
  const periodMode = useAppStore((s) => s.periodMode);
  const intimacyMode = useAppStore((s) => s.intimacyMode);
  const togglePeriodMode = useAppStore((s) => s.togglePeriodMode);
  const toggleIntimacyMode = useAppStore((s) => s.toggleIntimacyMode);
  const hasPeriods = useAppStore((s) => s.data.periods.length > 0);

  return (
    <div className="px-3 sm:px-4 pt-4 pb-1 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-[#EBEBE6]">
        <div className="flex items-center gap-3">
          {/* 经期记录开关 */}
          <button
            onClick={togglePeriodMode}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
              periodMode
                ? 'bg-[#E88D7D] text-white shadow-md shadow-[#E88D7D]/20 scale-[1.02]'
                : 'bg-[#F5F4F0] text-[#757575] hover:bg-[#FDF5F2] hover:text-[#E88D7D]'
            }`}
          >
            <span className="text-lg" role="img" aria-label="经期">🩸</span>
            <span>{periodMode ? '记录中' : '记录经期'}</span>
          </button>

          {/* 爱爱记录开关 */}
          <button
            onClick={toggleIntimacyMode}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
              intimacyMode
                ? 'bg-[#D4956A] text-white shadow-md shadow-[#D4956A]/20 scale-[1.02]'
                : 'bg-[#F5F4F0] text-[#757575] hover:bg-[#FDF6F0] hover:text-[#D4956A]'
            }`}
          >
            <span className="text-lg" role="img" aria-label="爱爱">💕</span>
            <span>{intimacyMode ? '记录中' : '记录爱爱'}</span>
          </button>
        </div>

        {/* 提示文字 */}
        {!periodMode && !intimacyMode && (
          <p className="text-xs text-[#757575] text-center mt-2.5">
            {hasPeriods
              ? '👆 打开开关后，点击日历日期即可记录'
              : '👆 打开「记录经期」开关，点击日历日期开始记录'}
          </p>
        )}
        {periodMode && (
          <p className="text-xs text-[#E88D7D]/80 text-center mt-2.5 font-medium animate-fade-in">
            🩸 点击日历上的日期标记经期
          </p>
        )}
        {intimacyMode && (
          <p className="text-xs text-[#D4956A]/80 text-center mt-2.5 font-medium animate-fade-in">
            💕 点击日历上的日期记录爱爱
          </p>
        )}
      </div>
    </div>
  );
}
