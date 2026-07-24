import { useState, useEffect } from 'react';
import type { UserSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface OnboardingModalProps {
  onSave: (settings: UserSettings) => void;
}

export default function OnboardingModal({ onSave }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [cycleLength, setCycleLength] = useState(DEFAULT_SETTINGS.cycleLength);
  const [periodLength, setPeriodLength] = useState(DEFAULT_SETTINGS.periodLength);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const totalSteps = 2;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onSave({ cycleLength, periodLength });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2D2D2D]/30 backdrop-blur-sm" />

      <div className="relative bg-white rounded-[28px] shadow-xl max-w-sm w-full p-6 pb-8 animate-slide-in-up sm:animate-scale-in">
        {/* 进度点 */}
        <div className="flex justify-center gap-1.5 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-[#E88D7D]'
                  : i < step
                    ? 'w-3 bg-[#E88D7D]/40'
                    : 'w-3 bg-[#EBEBE6]'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#FDF5F2] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl" role="img" aria-label="日历">📅</span>
              </div>
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-1">设置月经周期</h2>
              <p className="text-sm text-[#757575]">
                两次月经第一天的间隔（21-45 天）
              </p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-[#757575]">周期长度</span>
                <span className="text-4xl font-bold text-[#E88D7D]">
                  {cycleLength}
                  <span className="text-base font-normal text-[#8A8A8A]"> 天</span>
                </span>
              </div>
              <input
                type="range"
                min={21}
                max={45}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#8A8A8A] mt-2">
                <span>21天</span>
                <span className={cycleLength === 28 ? 'text-[#E88D7D] font-semibold' : ''}>
                  28天
                </span>
                <span>45天</span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#FDF5F2] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl" role="img" aria-label="经期">🩸</span>
              </div>
              <h2 className="text-xl font-bold text-[#2D2D2D] mb-1">设置经期天数</h2>
              <p className="text-sm text-[#757575]">月经从开始到结束通常持续几天</p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-[#757575]">经期持续</span>
                <span className="text-4xl font-bold text-[#E88D7D]">
                  {periodLength}
                  <span className="text-base font-normal text-[#8A8A8A]"> 天</span>
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[#8A8A8A] mt-2">
                <span>2天</span>
                <span className={periodLength === 5 ? 'text-[#E88D7D] font-semibold' : ''}>
                  5天
                </span>
                <span>10天</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          className="w-full py-3.5 bg-[#E88D7D] text-white font-semibold rounded-2xl hover:bg-[#D4786A] active:scale-[0.98] transition-all duration-200 shadow-md shadow-[#E88D7D]/20"
        >
          {step < totalSteps - 1 ? '下一步' : '开始使用'}
        </button>

        {/* 跳过引导 */}
        <button
          onClick={() => onSave({ cycleLength: DEFAULT_SETTINGS.cycleLength, periodLength: DEFAULT_SETTINGS.periodLength })}
          className="w-full py-2 text-xs text-[#8A8A8A] hover:text-[#6B6B6B] transition-colors mt-1.5"
        >
          稍后设置，先体验
        </button>

        <p className="text-xs text-[#8A8A8A] text-center mt-3">
          <span role="img" aria-label="锁">🔒</span> 数据仅保存在你的浏览器中
        </p>
      </div>
    </div>
  );
}
