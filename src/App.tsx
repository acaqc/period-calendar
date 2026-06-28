import { useState, useCallback, useMemo } from 'react';
import type { UserSettings } from './types';
import { useAppData } from './hooks/useAppData';
import { getMonthDaysWithProbability, getDatePhase } from './utils';
import type { DatePhaseInfo } from './utils';
import HeaderBar from './components/HeaderBar';
import CalendarGrid from './components/CalendarGrid';
import ToggleBar from './components/ToggleBar';
import StatusBar from './components/StatusBar';
import LegendBar from './components/LegendBar';
import BottomBar from './components/BottomBar';
import OnboardingModal from './components/OnboardingModal';
import SettingsPanel from './components/SettingsPanel';
import ContextMenu from './components/ContextMenu';

export default function App() {
  const {
    data,
    cycleState,
    storageAvailable,
    isInitialized,
    periodMode,
    intimacyMode,
    togglePeriodMode,
    toggleIntimacyMode,
    updateSettings,
    completeOnboarding,
    addPeriodRecord,
    removePeriodRecord,
    toggleIntimacyRecord,
    resetAll,
  } = useAppData();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    date: Date;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const selectedPhase: DatePhaseInfo | null = useMemo(() => {
    if (!selectedDate || data.periods.length === 0) return null;
    return getDatePhase(selectedDate, data.periods, cycleState);
  }, [selectedDate, data.periods, cycleState]);

  const showOnboarding = isInitialized && !data.onboardingCompleted;

  const days = useMemo(
    () =>
      getMonthDaysWithProbability(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        cycleState,
        data.periods,
        data.intimacyDates || []
      ),
    [currentMonth, cycleState, data.periods, data.intimacyDates]
  );

  const showTodayBtn = useMemo(() => {
    const now = new Date();
    return (
      currentMonth.getFullYear() !== now.getFullYear() ||
      currentMonth.getMonth() !== now.getMonth()
    );
  }, [currentMonth]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(null); // reset to today's status
  }, []);

  const handleDateClick = useCallback(
    (date: Date) => {
      // Update selected date for status bar
      setSelectedDate(date);

      const dateStr = date.toISOString().slice(0, 10);

      // Intimacy mode: toggle intimacy for the date
      if (intimacyMode) {
        toggleIntimacyRecord(date);
        const hasIt = (data.intimacyDates || []).includes(dateStr);
        setToast(hasIt ? '已取消爱爱记录' : '💕 已记录爱爱');
        setTimeout(() => setToast(null), 2000);
        return;
      }

      // Check if clicking on an existing marked date (period or intimacy)
      const existingStart = data.periods.find((p) => p.startDate === dateStr);
      const existingPeriod = !existingStart
        ? data.periods.find((p) => dateStr >= p.startDate && dateStr <= p.endDate)
        : null;
      const existingIntimacy = (data.intimacyDates || []).includes(dateStr);

      // If clicking on a marked date without any mode active → cancel it
      if (!periodMode && !intimacyMode) {
        if (existingStart) {
          removePeriodRecord(date);
          setToast('经期记录已取消');
          setTimeout(() => setToast(null), 2000);
          return;
        }
        if (existingPeriod) {
          removePeriodRecord(new Date(existingPeriod.startDate));
          setToast('经期记录已取消');
          setTimeout(() => setToast(null), 2000);
          return;
        }
        if (existingIntimacy) {
          toggleIntimacyRecord(date);
          setToast('已取消爱爱记录');
          setTimeout(() => setToast(null), 2000);
          return;
        }
        return; // no mark, no mode → do nothing
      }

      // Period mode active
      if (periodMode) {
        if (existingStart) {
          removePeriodRecord(date);
          setToast('经期记录已取消');
          setTimeout(() => setToast(null), 2000);
        } else if (existingPeriod) {
          removePeriodRecord(new Date(existingPeriod.startDate));
          setToast('经期记录已取消');
          setTimeout(() => setToast(null), 2000);
        } else {
          const result = addPeriodRecord(date);
          if (result.error) {
            setToast(result.error);
            setTimeout(() => setToast(null), 3000);
          } else {
            setToast('✓ 经期已记录');
            setTimeout(() => setToast(null), 2000);
          }
        }
      }
    },
    [periodMode, intimacyMode, data.periods, data.intimacyDates, addPeriodRecord, removePeriodRecord, toggleIntimacyRecord]
  );

  const handleDateContextMenu = useCallback((date: Date, e: React.MouseEvent) => {
    e.preventDefault();
    const dateStr = date.toISOString().slice(0, 10);
    const hasPeriod = data.periods.some(
      (p) => dateStr >= p.startDate && dateStr <= p.endDate
    );
    if (!hasPeriod) return;
    setContextMenu({ x: e.clientX, y: e.clientY, date });
  }, [data.periods]);

  const handleEditPeriod = useCallback(() => {
    if (!contextMenu) return;
    removePeriodRecord(contextMenu.date);
    setToast('请重新点击日期标记经期');
    setTimeout(() => setToast(null), 2000);
  }, [contextMenu, removePeriodRecord]);

  const handleDeletePeriod = useCallback(() => {
    if (!contextMenu) return;
    removePeriodRecord(contextMenu.date);
    setToast('经期记录已删除');
    setTimeout(() => setToast(null), 2000);
  }, [contextMenu, removePeriodRecord]);

  const handleSaveOnboarding = useCallback(
    (settings: UserSettings) => completeOnboarding(settings),
    [completeOnboarding]
  );

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-slate-50 flex flex-col items-center">
      {/* Storage warning */}
      {!storageAvailable && (
        <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center animate-fade-in">
          <p className="text-xs text-amber-700 font-medium">
            ⚠️ 当前浏览器不支持数据持久化，关闭页面后数据将丢失。建议使用 Chrome 浏览器。
          </p>
        </div>
      )}

      {/* Main content wrapper — centered */}
      <div className="w-full max-w-lg flex flex-col flex-1">
        {/* Header */}
        <HeaderBar
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          showToday={showTodayBtn}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Toggle bar — period & intimacy switches */}
        <ToggleBar
          periodMode={periodMode}
          intimacyMode={intimacyMode}
          onTogglePeriod={togglePeriodMode}
          onToggleIntimacy={toggleIntimacyMode}
          hasPeriods={data.periods.length > 0}
        />

        {/* Calendar */}
        <div className="mt-3">
          <CalendarGrid
            days={days}
            onDateClick={handleDateClick}
            onDateContextMenu={handleDateContextMenu}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            periodMode={periodMode}
            intimacyMode={intimacyMode}
          />
        </div>

        {/* Status */}
        <StatusBar
          cycleState={cycleState}
          hasPeriods={data.periods.length > 0}
          selectedDate={selectedDate}
          selectedPhase={selectedPhase}
        />

        {/* Legend */}
        <LegendBar cycleState={cycleState} />

        {/* Bottom actions */}
        <div className="flex-1" />
        <BottomBar periods={data.periods} data={data} />
      </div>

      {/* Modals & Overlays */}
      {showOnboarding && <OnboardingModal onSave={handleSaveOnboarding} />}

      <SettingsPanel
        isOpen={showSettings}
        settings={data.settings}
        onClose={() => setShowSettings(false)}
        onSave={updateSettings}
        onReset={resetAll}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEditPeriod}
          onDelete={handleDeletePeriod}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Global Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 z-50 bg-gray-900/95 backdrop-blur text-white text-sm font-medium px-5 py-2.5 rounded-2xl shadow-xl animate-toast-in">
          {toast}
        </div>
      )}

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs text-gray-300">
        月经周期日历 · 数据仅保存在你的浏览器中
      </footer>
    </div>
  );
}
