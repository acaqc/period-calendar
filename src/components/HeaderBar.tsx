import { useState } from 'react';
import { formatMonthCN } from '../utils';

interface HeaderBarProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  showToday: boolean;
  onOpenSettings: () => void;
}

export default function HeaderBar({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
  showToday,
  onOpenSettings,
}: HeaderBarProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

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
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/60">
      <div className="max-w-lg mx-auto flex items-center justify-between px-3 py-2.5">
        {/* Prev month */}
        <button
          onClick={onPrevMonth}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-90 transition-all text-gray-500"
          aria-label="上个月"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>

        {/* Month title */}
        <h1
          className="text-lg font-bold text-gray-900 select-none tracking-tight"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {formatMonthCN(currentMonth)}
        </h1>

        {/* Right actions */}
        <div className="flex items-center gap-0.5">
          {showToday && (
            <button
              onClick={onToday}
              className="px-3.5 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 active:scale-95 transition-all"
            >
              今天
            </button>
          )}
          <button
            onClick={onOpenSettings}
            className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-90 transition-all text-gray-500"
            aria-label="设置"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={onNextMonth}
            className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-90 transition-all text-gray-500"
            aria-label="下个月"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
