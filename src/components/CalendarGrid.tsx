import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  const [direction, setDirection] = useState<number>(0); // -1 = 上个月, 1 = 下个月

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) { setDirection(-1); onPrevMonth(); }
      else { setDirection(1); onNextMonth(); }
    }
    setTouchStartX(null);
  };

  // 生成唯一 key 来驱动动画（基于首尾日期）
  const monthKey = days.length > 0 ? `${days[0].dateStr}-${days[days.length-1].dateStr}` : 'empty';

  return (
    <div className="px-3 sm:px-4 w-full max-w-lg mx-auto">
      <div className="bg-white rounded-[28px] shadow-sm border border-[#EBEBE6] overflow-hidden">
        {/* 星期头 */}
        <div className="grid grid-cols-7 border-b border-[#F0F0EC]">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`text-center text-[11px] font-medium py-3.5 tracking-wider ${
                i >= 5 ? 'text-[#B0A898]' : 'text-[#8A8A8A]'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={monthKey}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-7 p-2 gap-1"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
          {days.map((day, idx) => (
            <div
              key={day.dateStr}
              className="animate-cell-enter"
              style={{ animationDelay: `${Math.min(idx * 10, 200)}ms` }}
            >
              <CalendarCell
                day={day}
                onDateClick={onDateClick}
                onDateContextMenu={onDateContextMenu}
              />
            </div>
          ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
