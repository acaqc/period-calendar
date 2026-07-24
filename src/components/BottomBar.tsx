import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { exportCSV, exportJSON, downloadFile } from '../utils';

export default function BottomBar() {
  const data = useAppStore((s) => s.data);
  const periods = data.periods;
  const [menuOpen, setMenuOpen] = useState(false);
  const showToast = useAppStore((s) => s.showToast);

  const handleExportCSV = () => {
    if (periods.length === 0) return;
    const csv = exportCSV(periods);
    downloadFile(csv, 'period-data.csv', 'text/csv');
    showToast('CSV 已导出');
    setMenuOpen(false);
  };

  const handleExportJSON = () => {
    if (periods.length === 0) return;
    const json = exportJSON(data);
    downloadFile(json, 'period-data.json', 'application/json');
    showToast('JSON 已导出');
    setMenuOpen(false);
  };

  const hasData = periods.length > 0;

  return (
    <div className="px-3 sm:px-4 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={!hasData}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
              hasData
                ? 'bg-white border border-[#EBEBE6] text-[#6B6B6B] hover:bg-[#F5F4F0] hover:border-[#D4D4CE] shadow-sm'
                : 'bg-[#F5F4F0] text-[#9A9A92] cursor-not-allowed'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出数据
          </button>

          {menuOpen && hasData && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full left-0 mb-3 z-50 bg-white rounded-xl shadow-lg border border-[#EBEBE6] py-1 min-w-[140px] animate-scale-in">
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#2D2D2D] hover:bg-[#F5F4F0] flex items-center gap-2 rounded-t-xl"
                >
                  <span className="text-xs font-mono bg-[#F5F4F0] text-[#757575] px-1.5 py-0.5 rounded">.csv</span>
                  导出 CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#2D2D2D] hover:bg-[#F5F4F0] flex items-center gap-2 rounded-b-xl"
                >
                  <span className="text-xs font-mono bg-[#F5F4F0] text-[#757575] px-1.5 py-0.5 rounded">.json</span>
                  导出 JSON
                </button>
              </div>
            </>
          )}
        </div>

        <span className="text-xs text-[#757575] flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          数据仅保存在本浏览器
        </span>
      </div>
    </div>
  );
}
