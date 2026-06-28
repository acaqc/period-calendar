import { useState, useRef } from 'react';
import type { DayInfo } from '../types';
import CalendarCell from './CalendarCell';
import { WEEKDAY_LABELS } from '../utils';

interface CalendarGridProps {
  days: DayInfo[];
  onDateClick: (date: Date) => void;
  onDateContextMenu: (date: Date, e: React.MouseEvent) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function CalendarGrid({
  days,
  onDateClick,
  onDateContextMenu,
  onPrevMonth,
  onNextMonth,
}: CalendarGridProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) onPrevMonth();
      else onNextMonth();
    }
    setTouchStartX(null);
  };

  return (
    <div className="px-3 sm:px-4 max-w-lg mx-auto">
      {/* Card wrapper */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-50">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`text-center text-xs font-semibold py-3 tracking-wide ${
                i >= 5 ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-7 p-1.5 gap-0.5"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {days.map((day, idx) => (
            <div
              key={day.dateStr}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(idx * 15, 300)}ms` }}
            >
              <CalendarCell
                day={day}
                onDateClick={onDateClick}
                onDateContextMenu={onDateContextMenu}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
