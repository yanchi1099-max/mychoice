
import React from 'react';
import { Macros } from '../types';

interface MacroProgressProps {
  current: Macros;
  target: Macros;
}

const ProgressBar = ({ label, current, max, color, unit = 'g' }: { label: string, current: number, max: number, color: string, unit?: string }) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
        <span>{label}</span>
        <span>{Math.round(current)} / {max}{unit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export const MacroProgress: React.FC<MacroProgressProps> = ({ current, target }) => {
  // Determine if Carb % is met
  const totalCals = current.calories > 0 ? current.calories : 1;
  const carbCals = current.carbs * 4;
  const carbPercent = Math.round((carbCals / totalCals) * 100);
  const isCarbTargetMet = carbPercent >= 50;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
        <span>今日进度</span>
        {current.calories > 0 && (
            <span className={`text-xs px-2 py-1 rounded-full ${isCarbTargetMet ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                碳水占比: {carbPercent}% {isCarbTargetMet ? '✅' : '⚠️'}
            </span>
        )}
      </h2>
      
      <ProgressBar 
        label="热量" 
        current={current.calories} 
        max={target.calories} 
        color="bg-emerald-500" 
        unit="kcal"
      />
      <ProgressBar 
        label="蛋白质 (上限 80g)" 
        current={current.protein} 
        max={target.protein} 
        color={current.protein > 80 ? "bg-red-500" : "bg-blue-500"}
      />
      <ProgressBar 
        label="碳水" 
        current={current.carbs} 
        max={target.carbs} 
        color="bg-amber-400"
      />
      <ProgressBar 
        label="脂肪" 
        current={current.fat} 
        max={target.fat} 
        color="bg-rose-400"
      />
    </div>
  );
};
