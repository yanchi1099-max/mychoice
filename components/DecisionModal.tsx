import React, { useState } from 'react';
import { Loader2, X, ChefHat, ArrowRight } from 'lucide-react';
import { AiResponse } from '../types';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealName: string;
  onGetRecommendation: (options: string[]) => Promise<void>;
  isLoading: boolean;
  aiResult: AiResponse | null;
  onAcceptResult: (result: AiResponse) => void;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({ 
  isOpen, onClose, mealName, onGetRecommendation, isLoading, aiResult, onAcceptResult 
}) => {
  const [inputs, setInputs] = useState<string[]>(['', '', '']);
  const [mode, setMode] = useState<'DECIDE' | 'SUGGEST'>('DECIDE');

  if (!isOpen) return null;

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleStart = () => {
    const validOptions = inputs.filter(i => i.trim() !== '');
    if (mode === 'DECIDE' && validOptions.length === 0) return;
    onGetRecommendation(mode === 'DECIDE' ? validOptions : []);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <ChefHat className="text-emerald-600" />
            {mealName} 助手
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="animate-spin text-emerald-500" size={48} />
              <p className="text-gray-500 text-sm animate-pulse">正在咨询营养引擎...</p>
            </div>
          ) : aiResult ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                <div className="text-xs text-emerald-600 uppercase font-bold tracking-wide mb-1">推荐选择</div>
                <h3 className="text-xl font-bold text-gray-900">{aiResult.selectedOption}</h3>
                <p className="text-gray-600 text-sm mt-2">{aiResult.reason}</p>
              </div>

              <div className="bg-white border rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm">精确份量 (熟重)</h4>
                <ul className="space-y-3">
                  {aiResult.ingredients.map((ing, i) => (
                    <li key={i} className="flex justify-between items-center text-sm border-b border-dashed border-gray-200 last:border-0 pb-2 last:pb-0">
                      <span className="text-gray-700">{ing.name}</span>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {ing.grams}g
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
               <div className="grid grid-cols-4 gap-2 text-center text-xs text-gray-500">
                    <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold">{Math.round(aiResult.estimatedMacros.calories)}</div>
                        <div>kcal</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold">{Math.round(aiResult.estimatedMacros.protein)}g</div>
                        <div>Prot</div>
                    </div>
                     <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold">{Math.round(aiResult.estimatedMacros.carbs)}g</div>
                        <div>Carb</div>
                    </div>
                     <div className="bg-gray-50 p-2 rounded">
                        <div className="font-bold">{Math.round(aiResult.estimatedMacros.fat)}g</div>
                        <div>Fat</div>
                    </div>
                </div>

              <button 
                onClick={() => onAcceptResult(aiResult)}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                接受并记录
              </button>
            </div>
          ) : (
            <>
              {/* Mode Selection */}
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button 
                  onClick={() => setMode('DECIDE')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'DECIDE' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  我有几个选项
                </button>
                <button 
                  onClick={() => setMode('SUGGEST')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'SUGGEST' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  直接推荐
                </button>
              </div>

              {mode === 'DECIDE' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-2">你在纠结吃什么？我会帮你选出最符合营养配额的一项。</p>
                  {inputs.map((val, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`选项 ${idx + 1} (例如: 牛肉饭、冷面)`}
                      value={val}
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  ))}
                </div>
              ) : (
                 <div className="text-center py-8">
                    <p className="text-gray-600">我会根据你剩余的热量、蛋白质空缺和碳水需求，计算出完美的一餐。</p>
                 </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions (Only show if not loading and no result) */}
        {!isLoading && !aiResult && (
          <div className="p-4 border-t bg-gray-50">
            <button 
              onClick={handleStart}
              className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              分析并决定 <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};