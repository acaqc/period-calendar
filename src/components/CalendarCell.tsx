import { useState } from 'react';
import type { DayInfo, ProbabilityLevel } from '../types';

interface CalendarCellProps {
  day: DayInfo;
  onDateClick: (date: Date) => void;
  onDateContextMenu: (date: Date, e: React.MouseEvent) => void;
  periodMode: boolean;
  intimacyMode: boolean;
}

function getCellClasses(
  probability: ProbabilityLevel,
  isPeriodStart: boolean,
  _isToday: boolean,
  isCurrentMonth: boolean,
  isWeekend: boolean
): string {
  if (!isCurrentMonth) return 'text-gray-300 cursor-default';

  const base = 'relative w-full aspect-square flex flex-col items-center justify-center rounded-2xl transition-all duration-200 select-none cursor-pointer active:scale-[0.92]';

  if (probability === 'period') {
    if (isPeriodStart) {
      return `${base} bg-violet-500 text-white font-semibold shadow-lg shadow-violet-200 animate-period-pulse`;
    }
    return `${base} bg-violet-50 text-gray-800 hover:bg-violet-100`;
  }

  if (probability === 'high') {
    return `${base} bg-rose-50 text-gray-800 hover:bg-rose-100`;
  }

  if (probability === 'medium') {
    return `${base} bg-amber-50 text-gray-800 hover:bg-amber-100`;
  }

  const weekendStyle = isWeekend ? 'text-gray-400' : 'text-gray-700';
  return `${base} hover:bg-gray-100 ${weekendStyle}`;
}

export default function CalendarCell({ day, onDateClick, onDateContextMenu, periodMode, intimacyMode }: CalendarCellProps) {
  const [pressing, setPressing] = useState(false);
  const isDisabled = !day.isCurrentMonth;
  // Already marked dates are always interactive (for cancellation)
  const hasMark = day.probability === 'period' || day.hasIntimacy;
  const isInteractive = isDisabled ? false : (periodMode || intimacyMode || hasMark);

  const cellClass = getCellClasses(
    day.probability,
    day.isPeriodStart,
    day.isToday,
    day.isCurrentMonth,
    day.isWeekend
  );

  const handleClick = () => {
    if (isInteractive) onDateClick(day.date);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isDisabled) {
      e.preventDefault();
      onDateContextMenu(day.date, e);
    }
  };

  return (
    <button
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      onMouseLeave={() => setPressing(false)}
      onTouchStart={() => setPressing(true)}
      onTouchEnd={() => setPressing(false)}
      disabled={isDisabled}
      className={cellClass}
      style={pressing && isInteractive ? { transform: 'scale(0.92)' } : undefined}
      aria-label={`${day.dateStr}${day.probability === 'period' ? ' 经期' : ''}${day.probability === 'high' ? ' 怀孕概率高' : ''}${day.probability === 'medium' ? ' 怀孕概率中' : ''}`}
    >
      {/* Today ring */}
      {day.isToday && (
        <div className="absolute inset-0.5 rounded-2xl ring-2 ring-indigo-400 ring-offset-1 ring-offset-white pointer-events-none z-0" />
      )}

      {/* Ovulation day indicator */}
      {day.isOvulationDay && day.isCurrentMonth && (
        <span className="absolute top-0.5 text-[10px] leading-none z-10">🌸</span>
      )}

      {/* Date number */}
      <span className={`text-sm relative z-10 ${day.isToday && !day.isPeriodStart ? 'text-indigo-600 font-semibold' : ''}`}>
        {day.dayOfMonth}
      </span>

      {/* Bottom indicators row */}
      <div className="absolute bottom-1 flex items-center gap-0.5">
        {day.probability === 'period' && !day.isPeriodStart && (
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
        )}
        {day.probability === 'high' && (
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        )}
        {day.probability === 'medium' && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        )}
        {day.hasIntimacy && day.isCurrentMonth && (
          <span className="text-[10px] leading-none">💕</span>
        )}
      </div>
    </button>
  );
}
