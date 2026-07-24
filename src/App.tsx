import { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { getMonthDaysWithProbability } from './utils';
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
  // ===== Store =====
  const data = useAppStore((s) => s.data);
  const cycleState = useAppStore((s) => s.cycleState);
  const storageAvailable = useAppStore((s) => s.storageAvailable);
  const isInitialized = useAppStore((s) => s.isInitialized);
  const periodMode = useAppStore((s) => s.periodMode);
  const intimacyMode = useAppStore((s) => s.intimacyMode);
  const contextMenu = useAppStore((s) => s.contextMenu);
  const toast = useAppStore((s) => s.toast);

  const init = useAppStore((s) => s.init);
  const addPeriodRecord = useAppStore((s) => s.addPeriodRecord);
  const removePeriodRecord = useAppStore((s) => s.removePeriodRecord);
  const toggleIntimacyRecord = useAppStore((s) => s.toggleIntimacyRecord);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const setContextMenu = useAppStore((s) => s.setContextMenu);
  const showToast = useAppStore((s) => s.showToast);

  // ===== 本地状态 =====
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 初始化
  useEffect(() => {
    init();
  }, [init]);

  const showOnboarding = isInitialized && !data.onboardingCompleted;

  // 生成日历数据
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

  // 是否显示"今天"按钮
  const showTodayBtn = useMemo(() => {
    const now = new Date();
    return (
      currentMonth.getFullYear() !== now.getFullYear() ||
      currentMonth.getMonth() !== now.getMonth()
    );
  }, [currentMonth]);

  // ===== 事件处理 =====
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(null);
  }, [setSelectedDate]);

  // Bug #4 修复：所有点击都更新 selectedDate，开关仅控制行为
  const handleDateClick = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      const dateStr = date.toISOString().slice(0, 10);

      const currentPeriods = data.periods;
      const currentIntimacy = data.intimacyDates || [];
      const existingStart = currentPeriods.find((p) => p.startDate === dateStr);
      const existingPeriod = !existingStart
        ? currentPeriods.find((p) => dateStr >= p.startDate && dateStr <= p.endDate)
        : null;
      const existingIntimacy = currentIntimacy.includes(dateStr);

      // 爱爱模式
      if (intimacyMode) {
        toggleIntimacyRecord(date);
        showToast(existingIntimacy ? '已取消爱爱记录' : '💕 已记录爱爱');
        return;
      }

      // 经期模式 + 点击已有经期 → 取消
      if (periodMode && (existingStart || existingPeriod)) {
        const targetDateStr = existingStart ? dateStr : existingPeriod!.startDate;
        removePeriodRecord(new Date(targetDateStr + 'T00:00:00'));
        showToast('经期记录已取消');
        return;
      }

      // 经期模式 + 空白日期 → 添加
      if (periodMode && !existingStart && !existingPeriod) {
        const result = addPeriodRecord(date);
        if (result.error) {
          showToast(result.error);
        } else {
          showToast('✓ 经期已记录');
        }
        return;
      }

      // 无模式 + 无标记 → 仅查看信息（selectedDate 已在上方设置）
    },
    [
      data.periods,
      data.intimacyDates,
      periodMode,
      intimacyMode,
      setSelectedDate,
      addPeriodRecord,
      removePeriodRecord,
      toggleIntimacyRecord,
      showToast,
    ]
  );

  // 右键菜单
  const handleDateContextMenu = useCallback(
    (date: Date, e: React.MouseEvent) => {
      e.preventDefault();
      const dateStr = date.toISOString().slice(0, 10);
      const hasPeriod = data.periods.some(
        (p) => dateStr >= p.startDate && dateStr <= p.endDate
      );
      if (!hasPeriod) return;
      setContextMenu({ x: e.clientX, y: e.clientY, date });
    },
    [data.periods, setContextMenu]
  );

  const handleEditPeriod = useCallback(() => {
    if (!contextMenu) return;
    removePeriodRecord(contextMenu.date);
    showToast('请重新点击日期标记经期');
  }, [contextMenu, removePeriodRecord, showToast]);

  const handleDeletePeriod = useCallback(() => {
    if (!contextMenu) return;
    removePeriodRecord(contextMenu.date);
    showToast('经期记录已删除');
  }, [contextMenu, removePeriodRecord, showToast]);

  // ===== 加载状态 =====
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 border-2 border-[#E88D7D]/40 border-t-[#E88D7D] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-[#757575] text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-[#FAFAF8] flex flex-col items-center">
      {/* 存储警告 */}
      {!storageAvailable && (
        <div className="w-full bg-amber-50/80 border-b border-amber-100 px-4 py-2.5 text-center animate-fade-in">
          <p className="text-xs text-amber-700/80 font-medium">
            ⚠️ 当前浏览器不支持数据持久化，关闭页面后数据将丢失。建议使用 Chrome 浏览器。
          </p>
        </div>
      )}

      {/* 主内容区 */}
      <div className="w-full max-w-lg flex flex-col flex-1">
        {/* 顶部导航 */}
        <HeaderBar
          currentMonth={currentMonth}
          showToday={showTodayBtn}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
        />

        {/* 开关栏 */}
        <ToggleBar />

        {/* 日历 */}
        <div className="mt-2">
          <CalendarGrid
            days={days}
            onDateClick={handleDateClick}
            onDateContextMenu={handleDateContextMenu}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        </div>

        {/* 状态栏 */}
        <StatusBar />

        {/* 图例 */}
        <LegendBar />

        {/* 底部操作 */}
        <div className="flex-1" />
        <BottomBar />
      </div>

      {/* 引导弹窗 */}
      {showOnboarding && <OnboardingModal onSave={completeOnboarding} />}

      {/* 设置面板 */}
      <SettingsPanel />

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEditPeriod}
          onDelete={handleDeletePeriod}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            className="fixed top-20 left-1/2 z-50 bg-[#2D2D2D]/95 backdrop-blur text-[#FAFAF8] text-sm font-medium px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-3"
          >
            <span>{toast}</span>
            {toast.includes('撤销') && (
              <button
                onClick={() => {
                  const undo = (window as unknown as Record<string, unknown>).__undoReset as (() => void) | undefined;
                  if (undo) undo();
                }}
                className="text-[#E88D7D] font-semibold hover:text-[#D4786A] transition-colors whitespace-nowrap"
              >
                撤销
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 页脚 */}
      <footer className="w-full text-center py-4 text-xs text-[#9A9A92]">
        月经周期日历 · 数据仅保存在你的浏览器中
      </footer>
    </div>
  );
}
