import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarProps {
  selectedStartDate?: string;
  selectedEndDate?: string;
  onDateSelect?: (startDate: string, endDate: string) => void;
  disabledDates?: string[];
  minDate?: string;
}

export default function Calendar({
  selectedStartDate,
  selectedEndDate,
  onDateSelect,
  disabledDates = [],
  minDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<string | null>(selectedStartDate || null);
  const [endDate, setEndDate] = useState<string | null>(selectedEndDate || null);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const minDateStr = minDate || today;

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (string | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push(date.toISOString().split('T')[0]);
    }

    return days;
  };

  const isDateDisabled = (date: string) => {
    return date < minDateStr || disabledDates.includes(date);
  };

  const isDateInRange = (date: string) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date: string) => {
    return date === startDate || date === endDate;
  };

  const handleDateClick = (date: string) => {
    if (isDateDisabled(date)) return;

    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
      onDateSelect?.(date, '');
    } else if (startDate && !endDate) {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(null);
        onDateSelect?.(date, '');
      } else {
        setEndDate(date);
        onDateSelect?.(startDate, date);
      }
    }
  };

  const days = generateCalendarDays();
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-base font-semibold text-gray-900">
          {currentMonth.getFullYear()}年{monthNames[currentMonth.getMonth()]}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => (
          <div key={index} className="aspect-square">
            {date && (
              <button
                onClick={() => handleDateClick(date)}
                disabled={isDateDisabled(date)}
                className={cn(
                  'w-full h-full flex items-center justify-center text-sm rounded-lg transition-all',
                  isDateDisabled(date) && 'text-gray-300 cursor-not-allowed',
                  !isDateDisabled(date) && !isDateSelected(date) && !isDateInRange(date) && 'hover:bg-gray-100 text-gray-700',
                  isDateInRange(date) && !isDateSelected(date) && 'bg-blue-100 text-blue-700',
                  isDateSelected(date) && 'bg-blue-600 text-white font-semibold',
                  date === today && !isDateSelected(date) && !isDateDisabled(date) && 'ring-2 ring-blue-600 ring-offset-1'
                )}
              >
                {date.split('-')[2]}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-600" />
          <span className="text-xs text-gray-500">已选日期</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100" />
          <span className="text-xs text-gray-500">日期范围</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded ring-2 ring-blue-600 ring-offset-1" />
          <span className="text-xs text-gray-500">今天</span>
        </div>
      </div>
    </div>
  );
}
