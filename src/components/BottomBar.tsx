import { useState } from 'react';
import type { PeriodRecord } from '../types';
import { exportCSV, exportJSON } from '../utils';

interface BottomBarProps {
  periods: PeriodRecord[];
  data: { settings: { cycleLength: number; periodLength: number }; periods: PeriodRecord[] };
}

export default function BottomBar({ periods, data }: BottomBarProps) {
  const [showToast, setShowToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleExportCSV = () => {
    if (periods.length === 0) return;
    const csv = exportCSV(periods);
    downloadFile(csv, 'period-data.csv', 'text/csv');
    setShowToast('CSV 已导出');
    setMenuOpen(false);
    setTimeout(() => setShowToast(null), 2000);
  };

  const handleExportJSON = () => {
    if (periods.length === 0) return;
    const json = exportJSON({
      version: 1,
      settings: data.settings,
      periods: data.periods,
      onboardingCompleted: true,
      lastModified: new Date().toISOString(),
    });
    downloadFile(json, 'period-data.json', 'application/json');
    setShowToast('JSON 已导出');
    setMenuOpen(false);
    setTimeout(() => setShowToast(null), 2000);
  };

  const hasData = periods.length > 0;

  return (
    <>
      <div className="px-3 sm:px-4 pt-3 pb-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              disabled={!hasData}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                hasData
                  ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              导出数据
            </button>

            {/* Dropdown */}
            {menuOpen && hasData && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px] animate-scale-in">
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-xl"
                  >
                    <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">.csv</span>
                    导出 CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-b-xl"
                  >
                    <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">.json</span>
                    导出 JSON
                  </button>
                </div>
              </>
            )}
          </div>

          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            数据仅保存在本浏览器
          </span>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-2xl shadow-xl animate-toast-in">
          {showToast}
        </div>
      )}
    </>
  );
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
