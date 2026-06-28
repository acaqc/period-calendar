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
    return () => { document.body.style.overflow = ''; };
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 pb-8 animate-slide-in-up sm:animate-scale-in">
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-indigo-500' : i < step ? 'w-2 bg-indigo-300' : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">设置月经周期</h2>
              <p className="text-sm text-gray-500">从这次月经第一天到下次月经第一天的天数</p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-gray-500">周期长度</span>
                <span className="text-3xl font-bold text-indigo-600">{cycleLength}<span className="text-base font-normal text-gray-400"> 天</span></span>
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
                <span>21天</span>
                <span className={cycleLength === 28 ? 'text-indigo-500 font-semibold' : ''}>28天</span>
                <span>45天</span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🩸</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">设置经期天数</h2>
              <p className="text-sm text-gray-500">每次月经通常持续多少天</p>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm text-gray-500">经期持续</span>
                <span className="text-3xl font-bold text-violet-600">{periodLength}<span className="text-base font-normal text-gray-400"> 天</span></span>
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
                <span>2天</span>
                <span className={periodLength === 5 ? 'text-violet-500 font-semibold' : ''}>5天</span>
                <span>10天</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          className="w-full py-3.5 bg-indigo-500 text-white font-semibold rounded-2xl hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
        >
          {step < totalSteps - 1 ? '下一步' : '开始使用'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          🔒 数据仅保存在你的浏览器中
        </p>
      </div>
    </div>
  );
}
