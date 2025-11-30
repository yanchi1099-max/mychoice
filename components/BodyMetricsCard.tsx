
import React, { useState, useEffect } from 'react';
import { BodyMetrics } from '../types';
import { Ruler, Scale, ChevronDown, ChevronUp } from 'lucide-react';

interface BodyMetricsCardProps {
  metrics: BodyMetrics;
  onUpdate: (metrics: BodyMetrics) => void;
  readOnly?: boolean;
}

export const BodyMetricsCard: React.FC<BodyMetricsCardProps> = ({ metrics, onUpdate, readOnly = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localMetrics, setLocalMetrics] = useState<BodyMetrics>(metrics);

  useEffect(() => {
    setLocalMetrics(metrics);
  }, [metrics]);

  const handleChange = (field: keyof BodyMetrics, value: string) => {
    const num = parseFloat(value);
    const newMetrics = {
      ...localMetrics,
      [field]: isNaN(num) ? undefined : num
    };
    setLocalMetrics(newMetrics);
    onUpdate(newMetrics);
  };

  const hasData = Object.values(metrics).some(v => typeof v === 'number' && v > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer bg-blue-50/50 hover:bg-blue-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 text-blue-900 font-semibold">
          <Scale size={18} />
          <span>身体维度记录</span>
          {hasData && <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">已记录</span>}
        </div>
        {isOpen ? <ChevronUp size={18} className="text-blue-400"/> : <ChevronDown size={18} className="text-blue-400"/>}
      </div>

      {(isOpen || !hasData) && (
        <div className="p-4 grid grid-cols-2 gap-4 border-t border-gray-100">
          <div>
             <label className="text-xs font-medium text-gray-500 mb-1 block">体重 (kg)</label>
             <input 
               type="number" 
               placeholder="0.0"
               value={localMetrics.weight || ''}
               onChange={(e) => handleChange('weight', e.target.value)}
               disabled={readOnly}
               className="w-full p-2 rounded border border-gray-200 focus:border-blue-400 outline-none text-sm font-mono"
             />
          </div>
          <div>
             <label className="text-xs font-medium text-gray-500 mb-1 block">腰围 (cm)</label>
             <input 
               type="number" 
               placeholder="0.0"
               value={localMetrics.waist || ''}
               onChange={(e) => handleChange('waist', e.target.value)}
               disabled={readOnly}
               className="w-full p-2 rounded border border-gray-200 focus:border-blue-400 outline-none text-sm font-mono"
             />
          </div>
          <div>
             <label className="text-xs font-medium text-gray-500 mb-1 block">大腿围 (cm)</label>
             <input 
               type="number" 
               placeholder="0.0"
               value={localMetrics.thigh || ''}
               onChange={(e) => handleChange('thigh', e.target.value)}
               disabled={readOnly}
               className="w-full p-2 rounded border border-gray-200 focus:border-blue-400 outline-none text-sm font-mono"
             />
          </div>
          <div>
             <label className="text-xs font-medium text-gray-500 mb-1 block">小腿围 (cm)</label>
             <input 
               type="number" 
               placeholder="0.0"
               value={localMetrics.calf || ''}
               onChange={(e) => handleChange('calf', e.target.value)}
               disabled={readOnly}
               className="w-full p-2 rounded border border-gray-200 focus:border-blue-400 outline-none text-sm font-mono"
             />
          </div>
        </div>
      )}
    </div>
  );
};
