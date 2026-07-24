import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

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

export default function SettingsPanel() {
  const showSettings = useAppStore((s) => s.showSettings);
  const settings = useAppStore((s) => s.data.settings);
  const setShowSettings = useAppStore((s) => s.setShowSettings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetAll = useAppStore((s) => s.resetAll);
  const showToast = useAppStore((s) => s.showToast);
  const setData = useAppStore((s) => s.setData);

  const [cycleLength, setCycleLength] = useState(settings.cycleLength);
  const [periodLength, setPeriodLength] = useState(settings.periodLength);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setCycleLength(settings.cycleLength);
    setPeriodLength(settings.periodLength);
  }, [settings, showSettings]);

  useEffect(() => {
    if (showSettings) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSettings]);

  if (!showSettings) return null;

  const handleSave = () => {
    updateSettings({ cycleLength, periodLength });
    setShowSettings(false);
  };

  const handleReset = () => {
    setShowResetConfirm(false);
    const prevData = resetAll();
    setShowSettings(false);
    showToast('数据已重置，5 秒内可撤销');
    // 5 秒倒计时
    let countdown = 5;
    const undoToast = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(undoToast);
      }
    }, 1000);
    // 存储撤销句柄
    const undoKey = setTimeout(() => {
      clearInterval(undoToast);
    }, 5000);
    // 将撤销能力暴露到 window（简单实现）
    (window as unknown as Record<string, unknown>).__undoReset = () => {
      clearTimeout(undoKey);
      clearInterval(undoToast);
      setData(prevData);
      showToast('已恢复数据');
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#2D2D2D]/25 backdrop-blur-sm animate-fade-in"
        onClick={() => setShowSettings(false)}
      />

      <div className="relative bg-white w-full max-w-md max-h-[90vh] rounded-[28px] shadow-xl animate-scale-in flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex-shrink-0 px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#2D2D2D] tracking-tight">设置</h2>
              <p className="text-sm text-[#757575] mt-0.5">调整你的周期参数</p>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F5F4F0] active:scale-90 transition-all text-[#757575]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 可滚动内容 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* 周期长度 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#FDF5F2] flex items-center justify-center flex-shrink-0">
                <span className="text-lg" role="img" aria-label="周期">🔄</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2D2D2D]">月经周期长度</p>
                <p className="text-xs text-[#757575]">两次月经第一天的间隔天数</p>
              </div>
            </div>

            <div className="bg-[#FDF5F2] rounded-2xl p-5 mb-3">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-[#E88D7D] tracking-tight">
                  {cycleLength}
                </span>
                <span className="text-lg text-[#8A8A8A] font-medium">天</span>
              </div>
              <div className="flex justify-center mt-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-5 rounded-full transition-all duration-300 ${
                        i < Math.round(((cycleLength - 21) / 24) * 10)
                          ? 'bg-[#E88D7D]'
                          : 'bg-[#F5D5CD]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#F5F4F0] rounded-xl px-4 py-3">
              <input
                type="range"
                min={21}
                max={45}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#8A8A8A] mt-1.5">
                <span>21天</span>
                <span>45天</span>
              </div>
            </div>

            <div className="flex gap-1.5 mt-2">
              {CYCLE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setCycleLength(p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    cycleLength === p.value
                      ? 'bg-[#FDF5F2] text-[#E88D7D]'
                      : 'bg-[#F5F4F0] text-[#757575] hover:bg-[#FDF5F2]/50'
                  }`}
                >
                  {p.desc}
                </button>
              ))}
            </div>
          </div>

          {/* 经期天数 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#FDF5F2] flex items-center justify-center flex-shrink-0">
                <span className="text-lg" role="img" aria-label="经期">🩸</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2D2D2D]">经期持续天数</p>
                <p className="text-xs text-[#757575]">每次月经通常持续几天</p>
              </div>
            </div>

            <div className="bg-[#FDF5F2] rounded-2xl p-5 mb-3">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-[#D4786A] tracking-tight">
                  {periodLength}
                </span>
                <span className="text-lg text-[#8A8A8A] font-medium">天</span>
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {Array.from({ length: periodLength }).map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 rounded-full bg-[#E88D7D]" />
                ))}
              </div>
            </div>

            <div className="bg-[#F5F4F0] rounded-xl px-4 py-3">
              <input
                type="range"
                min={2}
                max={10}
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#8A8A8A] mt-1.5">
                <span>2天</span>
                <span>10天</span>
              </div>
            </div>

            <div className="flex gap-1.5 mt-2">
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriodLength(p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    periodLength === p.value
                      ? 'bg-[#FDF5F2] text-[#D4786A]'
                      : 'bg-[#F5F4F0] text-[#757575] hover:bg-[#FDF5F2]/50'
                  }`}
                >
                  {p.desc}
                </button>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 py-3 border border-[#EBEBE6] text-[#757575] font-medium rounded-xl hover:bg-[#F5F4F0] hover:border-[#D4D4CE] active:scale-[0.98] transition-all text-sm"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-[#E88D7D] text-white font-semibold rounded-xl hover:bg-[#D4786A] active:scale-[0.97] transition-all text-sm shadow-sm"
            >
              保存
            </button>
          </div>

          {/* 重置 */}
          <div className="border-t border-[#F0F0EC] pt-5">
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
                    <p className="text-xs text-red-400 mt-0.5">
                      所有经期和爱爱记录将被清除，此操作不可恢复
                    </p>
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

          {/* 免责声明 */}
          <div className="mt-5 p-3.5 bg-amber-50/70 rounded-xl border border-amber-100/60">
            <div className="flex gap-2">
              <span className="text-amber-400/70 text-sm flex-shrink-0" role="img" aria-label="警告">⚠️</span>
              <p className="text-xs text-amber-700/80 leading-relaxed">
                基于日历法估算排卵日，不作为避孕或医疗建议。备孕或避孕请咨询专业医生。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
