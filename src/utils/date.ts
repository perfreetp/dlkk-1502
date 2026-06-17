export const formatDate = (dateStr: string, format: string = 'YYYY-MM-DD'): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

export const formatDateTime = (dateStr: string): string => {
  return formatDate(dateStr, 'YYYY-MM-DD HH:mm');
};

export const getDaysDiff = (startStr: string, endStr: string): number => {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const isDatePassed = (dateStr: string): boolean => {
  return new Date(dateStr) < new Date();
};

export const isToday = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export const isExpiringSoon = (dateStr: string, hours: number = 24): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff > 0 && diff <= hours * 60 * 60 * 1000;
};

export const generateDateRange = (startDate: string, days: number): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

export const getTimeSlotLabel = (slot: string): string => {
  const labels: Record<string, string> = {
    morning: '上午 (9:00-12:00)',
    afternoon: '下午 (14:00-17:00)',
    evening: '晚上 (18:00-21:00)',
    fullday: '全天',
  };
  return labels[slot] || slot;
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消',
    borrowed: '借用中',
    returned: '已归还',
    overdue: '已逾期',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
    borrowed: 'bg-emerald-100 text-emerald-700',
    returned: 'bg-gray-100 text-gray-700',
    overdue: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};
