
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, selectedDate, onSelectDate }) => {
  // Initialize viewDate based on selectedDate or today
  const [viewDate, setViewDate] = useState(() => {
     const d = selectedDate ? new Date(selectedDate) : new Date();
     // Reset time to avoid timezone shifts when getting month/year
     return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen && selectedDate) {
        const d = new Date(selectedDate);
        setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0 is Sunday

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const mStr = (month + 1).toString().padStart(2, '0');
    const dStr = day.toString().padStart(2, '0');
    onSelectDate(`${year}-${mStr}-${dStr}`);
    onClose();
  };

  const isToday = (d: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  };

  const isSelected = (d: number) => {
      // Need to handle timezone offsets simply by comparing strings if possible, 
      // or ensuring date construction matches.
      // selectedDate is "YYYY-MM-DD"
      const currentStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      return currentStr === selectedDate;
  }

  const days = [];
  // Empty slots for start of week
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }
  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const today = isToday(d);
    const selected = isSelected(d);
    
    days.push(
      <button
        key={d}
        onClick={() => handleDayClick(d)}
        className={`
          h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative
          ${selected ? 'bg-emerald-600 text-white shadow-md' : 
            today ? 'text-emerald-700 font-bold border-2 border-emerald-200' : 
            'hover:bg-gray-100 text-gray-700'}
        `}
      >
        {d}
        {today && !selected && <span className="absolute -bottom-1 w-1 h-1 bg-emerald-500 rounded-full"></span>}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-lg">
                {year}年 {month + 1}月
            </h2>
             <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                <X size={20} className="text-gray-500" />
            </button>
        </div>

        {/* Calendar Nav */}
        <div className="flex items-center justify-between px-4 py-3">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft size={20}/></button>
            <span className="text-sm font-medium text-gray-500 cursor-pointer hover:text-emerald-600" onClick={() => setViewDate(new Date())}>回到今天</span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ChevronRight size={20}/></button>
        </div>

        {/* Grid */}
        <div className="p-4 pt-0">
            <div className="grid grid-cols-7 mb-2 text-center">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                    <span key={d} className="text-xs font-bold text-gray-400 py-2">{d}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center">
                {days}
            </div>
        </div>
      </div>
    </div>
  );
};
