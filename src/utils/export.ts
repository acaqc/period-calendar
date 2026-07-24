import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { PeriodRecord, AppData } from '../types';

/** 导出为 CSV */
export function exportCSV(periods: PeriodRecord[]): string {
  const header = '经期开始日期,经期结束日期,周期长度(天),经期持续天数';
  const rows = periods.map((p, i) => {
    const cycleLen =
      i > 0
        ? differenceInCalendarDays(
            parseISO(p.startDate),
            parseISO(periods[i - 1].startDate)
          )
        : '';
    const dur =
      differenceInCalendarDays(parseISO(p.endDate), parseISO(p.startDate)) + 1;
    return `${p.startDate},${p.endDate},${cycleLen},${dur}`;
  });
  return [header, ...rows].join('\n');
}

/** 导出为 JSON */
export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

/** 触发文件下载 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
