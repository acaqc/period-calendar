import { useState, useEffect } from 'react';
import type { UserSettings } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  settings: UserSettings;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
  onReset: () => void;
}

export default function SettingsPanel({
  isOpen,
  settings,
  onClose,
  onSave,
  onReset,
}: SettingsPanelProps) {
  const [cycleLength, setCycleLength] = useState(settings.cycleLength);
  const [periodLength, setPeriodLength] = useState(settings.periodLength);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setCycleLength(settings.cycleLength);
    setPeriodLength(settings.periodLength);
  }, [settings, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ cycleLength, periodLength });
    onClose();
  };

  const handleReset = () => {
    setShowResetConfirm(false);
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-sm h-full shadow-2xl animate-slide-in-right p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900">设置</h2>
            <p className="text-xs text-gray-400 mt-0.5">调整周期参数</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-90 transition-all text-gray-400"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Cycle Length */}
        <div className="mb-8 bg-gray-50 rounded-2xl p-5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">月经周期长度</p>
              <p className="text-xs text-gray-400 mt-0.5">两次月经第一天的间隔天数</p>
            </div>
            <span className="text-3xl font-bold text-indigo-600">{cycleLength}<span className="text-sm font-normal text-gray-400 ml-0.5">天</span></span>
          </div>
          <input
            type="range"
            min={21}
            max={45}
            value={cycleLength}
            onChange={(e) => setCycleLength(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>21</span>
            <span>45</span>
          </div>
        </div>

        {/* Period Length */}
        <div className="mb-8 bg-gray-50 rounded-2xl p-5">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">经期持续天数</p>
              <p className="text-xs text-gray-400 mt-0.5">每次月经通常持续几天</p>
            </div>
            <span className="text-3xl font-bold text-violet-600">{periodLength}<span className="text-sm font-normal text-gray-400 ml-0.5">天</span></span>
          </div>
          <input
            type="range"
            min={2}
            max={10}
            value={periodLength}
            onChange={(e) => setPeriodLength(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>2</span>
            <span>10</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
          >
            保存更改
          </button>
        </div>

        {/* Reset */}
        <div className="border-t border-gray-100 pt-6">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 text-red-500 font-medium rounded-xl border border-red-200 hover:bg-red-50 transition-all text-sm"
            >
              重置所有数据
            </button>
          ) : (
            <div className="bg-red-50 rounded-2xl p-4 animate-fade-in">
              <p className="text-sm text-red-700 mb-3 font-medium">确定要重置吗？</p>
              <p className="text-xs text-red-500 mb-4">所有经期记录将被清除，此操作不可恢复。</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all text-sm"
                >
                  确认重置
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-xs text-amber-700 leading-relaxed">
            ⚠️ 本工具基于日历法估算，仅供参考，不可作为避孕手段。实际排卵日受多种因素影响，如需精确判断请结合基础体温和排卵试纸。
          </p>
        </div>
      </div>
    </div>
  );
}
