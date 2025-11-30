
import React, { useState, useEffect } from 'react';
import { X, Save, Droplets } from 'lucide-react';
import { FoodItem } from '../types';

interface EditFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: FoodItem | null;
  onSave: (updatedFood: FoodItem) => void;
  onDelete: () => void;
}

export const EditFoodModal: React.FC<EditFoodModalProps> = ({ isOpen, onClose, food, onSave, onDelete }) => {
  const [editedFood, setEditedFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    if (food) setEditedFood({ ...food });
  }, [food]);

  if (!isOpen || !editedFood) return null;

  const handleMacroChange = (field: keyof typeof editedFood.macros, value: string) => {
    const num = parseFloat(value);
    setEditedFood({
      ...editedFood,
      macros: {
        ...editedFood.macros,
        [field]: isNaN(num) ? 0 : num
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800">编辑食材</h2>
          <button onClick={onClose}><X size={20} className="text-gray-500" /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">名称</label>
            <input 
              type="text" 
              value={editedFood.name}
              onChange={(e) => setEditedFood({...editedFood, name: e.target.value})}
              className="w-full border-b-2 border-gray-200 focus:border-emerald-500 outline-none py-1 text-lg font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">熟重 (g)</label>
                <div className="flex items-center gap-2">
                    <input 
                    type="number" 
                    value={Math.round(editedFood.weight)}
                    onChange={(e) => {
                        const w = parseFloat(e.target.value);
                        if (!isNaN(w) && food) {
                             const ratio = w / (food.weight || 1);
                             setEditedFood({
                                ...editedFood,
                                weight: w,
                                macros: {
                                    calories: Number((food.macros.calories * ratio).toFixed(1)),
                                    protein: Number((food.macros.protein * ratio).toFixed(1)),
                                    carbs: Number((food.macros.carbs * ratio).toFixed(1)),
                                    fat: Number((food.macros.fat * ratio).toFixed(1)),
                                }
                             });
                        }
                    }}
                    className="w-full border rounded p-2 text-emerald-700 font-bold bg-emerald-50"
                    />
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">热量 (kcal)</label>
                <input 
                  type="number" 
                  value={Math.round(editedFood.macros.calories)}
                  onChange={(e) => handleMacroChange('calories', e.target.value)}
                  className="w-full border rounded p-2 bg-gray-50"
                />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
                <label className="text-xs text-gray-500">蛋白质</label>
                <input 
                    type="number" 
                    value={editedFood.macros.protein}
                    onChange={(e) => handleMacroChange('protein', e.target.value)}
                    className="w-full border rounded p-1 text-sm"
                />
            </div>
            <div>
                <label className="text-xs text-gray-500">碳水</label>
                <input 
                    type="number" 
                    value={editedFood.macros.carbs}
                    onChange={(e) => handleMacroChange('carbs', e.target.value)}
                    className="w-full border rounded p-1 text-sm"
                />
            </div>
            <div>
                <label className="text-xs text-gray-500">脂肪</label>
                <input 
                    type="number" 
                    value={editedFood.macros.fat}
                    onChange={(e) => handleMacroChange('fat', e.target.value)}
                    className="w-full border rounded p-1 text-sm"
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                <Droplets size={12} className="text-amber-500"/> 油脂/烹饪备注
            </label>
            <input 
                type="text" 
                value={editedFood.cookingNote || ''}
                onChange={(e) => setEditedFood({...editedFood, cookingNote: e.target.value})}
                className="w-full border rounded p-2 text-sm text-gray-700 bg-amber-50 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="例如: 炒菜约用油10g"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex gap-3">
           <button 
            onClick={onDelete}
            className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium text-sm"
          >
            删除
          </button>
          <button 
            onClick={() => onSave(editedFood)}
            className="flex-1 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
          >
            <Save size={18} /> 保存修改
          </button>
        </div>
      </div>
    </div>
  );
};
