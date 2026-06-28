import { useState, useEffect } from 'react';
import type { UserSettings } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  settings: UserSettings;
  onClose: () => void;
  onSave: (settings: UserSettings) => void;
  onReset: () => void;
}

const CYCLE_PRESETS = [
  { label: '较短', value: 24, desc: '24天' },
  { label: '常见', value: 28, desc: '28天' },
  { label: '较长', value: 32, desc: '32天' },
  { label: '偏长', value: 38, desc: '38天' },
];

const PERIOD_PRESETS = [
  { label: '较短', value: 3, desc: '3天' },
  { label: '常见', value: 5, desc: '5天' },
  { label: '较长', value: 7, desc: '7天' },
];

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
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-sm h-full shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">设置</h2>
              <p className="text-sm text-gray-400 mt-0.5">调整你的周期参数</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all text-gray-400"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Cycle Length */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🔄</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">月经周期长度</p>
                <p className="text-xs text-gray-400">两次月经第一天的间隔天数</p>
              </div>
            </div>

            {/* Value display */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 mb-3">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-indigo-600 tracking-tight">{cycleLength}</span>
                <span className="text-lg text-gray-400 font-medium">天</span>
              </div>
              <div className="flex justify-center mt-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-5 rounded-full transition-all duration-300 ${
                        i < Math.round((cycleLength - 21) / 24 * 10)
                          ? 'bg-indigo-400'
                          : 'bg-indigo-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <input
                type="range"
                min={21}
                max={45}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>21天</span>
                <span>45天</span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-1.5 mt-2">
              {CYCLE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setCycleLength(p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    cycleLength === p.value
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {p.desc}
                </button>
              ))}
            </div>
          </div>

          {/* Period Length */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🩸</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">经期持续天数</p>
                <p className="text-xs text-gray-400">每次月经通常持续几天</p>
              </div>
            </div>

            {/* Value display */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-5 mb-3">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-violet-600 tracking-tight">{periodLength}</span>
                <span className="text-lg text-gray-400 font-medium">天</span>
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: periodLength }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-violet-400"
                  />
                ))}
              </div>
            </div>

            {/* Slider */}
            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <input
                type="range"
                min={2}
                max={10}
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>2天</span>
                <span>10天</span>
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-1.5 mt-2">
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriodLength(p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    periodLength === p.value
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {p.desc}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 active:scale-[0.98] transition-all text-sm shadow-lg shadow-indigo-200"
            >
              保存
            </button>
          </div>

          {/* Reset */}
          <div className="border-t border-gray-100 pt-5">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-400 font-medium rounded-xl border border-red-100 hover:bg-red-50 hover:text-red-500 transition-all text-sm"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1,4 1,10 7,10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                重置所有数据
              </button>
            ) : (
              <div className="bg-red-50 rounded-2xl p-4 animate-fade-in border border-red-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700">确定要重置吗？</p>
                    <p className="text-xs text-red-400 mt-0.5">所有经期和爱爱记录将被清除，此操作不可恢复</p>
                  </div>
                </div>
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
          <div className="mt-5 p-3.5 bg-amber-50 rounded-xl border border-amber-100/80">
            <div className="flex gap-2">
              <span className="text-amber-400 text-sm flex-shrink-0">⚠️</span>
              <p className="text-xs text-amber-600 leading-relaxed">
                本工具基于日历法估算，仅供参考，不可作为避孕手段。实际排卵日受多种因素影响。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
