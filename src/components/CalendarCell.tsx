import type { DayInfo, ProbabilityLevel } from '../types';

interface CalendarCellProps {
  day: DayInfo;
  onDateClick: (date: Date) => void;
  onDateContextMenu: (date: Date, e: React.MouseEvent) => void;
}

function getCellClasses(
  probability: ProbabilityLevel,
  isPeriodStart: boolean,
  isCurrentMonth: boolean,
  isWeekend: boolean
): string {
  if (!isCurrentMonth) return 'text-[#D4D4CE] cursor-default';

  const base =
    'relative w-full aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-200 select-none cursor-pointer active:scale-[0.92]';

  if (probability === 'period') {
    if (isPeriodStart) {
      return `${base} bg-[#E88D7D] text-white font-semibold shadow-md shadow-[#E88D7D]/25 animate-period-pulse`;
    }
    return `${base} bg-[#FDF5F2] text-[#2D2D2D] hover:bg-[#F5D5CD]/50`;
  }

  if (probability === 'high') {
    return `${base} bg-[#FDF6F0] text-[#2D2D2D] hover:bg-[#EED5C0]/50`;
  }

  if (probability === 'medium') {
    return `${base} bg-[#FDFAF5] text-[#2D2D2D] hover:bg-[#E8D5B7]/40`;
  }

  const weekendStyle = isWeekend ? 'text-[#8A8A8A]' : 'text-[#6B6B6B]';
  return `${base} hover:bg-[#F5F4F0] ${weekendStyle}`;
}

export default function CalendarCell({
  day,
  onDateClick,
  onDateContextMenu,
}: CalendarCellProps) {
  const isDisabled = !day.isCurrentMonth;
  const isInteractive = !isDisabled;

  const cellClass = getCellClasses(
    day.probability,
    day.isPeriodStart,
    day.isCurrentMonth,
    day.isWeekend
  );

  return (
    <button
      onClick={() => isInteractive && onDateClick(day.date)}
      onContextMenu={(e) => {
        if (!isDisabled) {
          e.preventDefault();
          onDateContextMenu(day.date, e);
        }
      }}
      disabled={isDisabled}
      className={cellClass}
      aria-label={`${day.dateStr}${day.probability === 'period' ? ' 经期' : ''}${day.probability === 'high' ? ' 怀孕概率高' : ''}${day.probability === 'medium' ? ' 怀孕概率中' : ''}`}
    >
      {/* 今日环 */}
      {day.isToday && (
        <div className="absolute inset-0.5 rounded-2xl ring-2 ring-[#B0B0B0] ring-offset-1 ring-offset-white pointer-events-none z-0" />
      )}

      {/* 排卵日标记 */}
      {day.isOvulationDay && day.isCurrentMonth && (
        <span className="absolute -top-1 text-[11px] leading-none z-10 animate-ovulation-bloom" role="img" aria-label="排卵日">
          🌸
        </span>
      )}

      {/* 日期数字 */}
      <span
        className={`text-[13px] font-medium relative z-10 ${
          day.isToday && !day.isPeriodStart ? 'text-[#4A4A4A] font-semibold' : ''
        }`}
      >
        {day.dayOfMonth}
      </span>

      {/* 底部指示器 */}
      <div className="absolute bottom-1.5 flex items-center gap-[3px]">
        {day.probability === 'period' && !day.isPeriodStart && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#E88D7D]" />
        )}
        {day.probability === 'high' && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4956A]" />
        )}
        {day.probability === 'medium' && (
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9AD8B]" />
        )}
        {day.hasIntimacy && day.isCurrentMonth && (
          <span className="text-[9px] leading-none" role="img" aria-label="爱爱">💕</span>
        )}
      </div>
    </button>
  );
}
