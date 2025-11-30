
import React from 'react';
import { X, CalendarDays, Loader2 } from 'lucide-react';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: string | null;
  loading: boolean;
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose, report, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
          <h2 className="font-bold text-indigo-900 flex items-center gap-2">
            <CalendarDays size={20} />
            本周身体报告
          </h2>
          <button onClick={onClose}><X size={20} className="text-indigo-400 hover:text-indigo-600" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center py-8 text-indigo-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>正在分析过去一周的数据...</p>
            </div>
          ) : (
            <div className="prose prose-sm prose-indigo text-gray-700 leading-relaxed whitespace-pre-wrap">
               {report}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-400">
            基于过去7天的记录生成的AI分析
        </div>
      </div>
    </div>
  );
};
