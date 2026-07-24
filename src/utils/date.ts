import { format } from 'date-fns';

/** 格式化日期为中文格式：yyyy年M月d日 */
export function formatDateCN(date: Date): string {
  return format(date, 'yyyy年M月d日');
}

/** 格式化月份为中文格式：yyyy年M月 */
export function formatMonthCN(date: Date): string {
  return format(date, 'yyyy年M月');
}

/** 星期标签（周一开始） */
export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
