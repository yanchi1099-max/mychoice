
import React from 'react';
import { Meal, FoodItem } from '../types';
import { CheckCircle2, PlusCircle, Sparkles, Edit2, Droplets } from 'lucide-react';

interface MealCardProps {
  meal: Meal;
  onAskAi: (mealId: string) => void;
  onManualAdd: (mealId: string) => void;
  onClear: (mealId: string) => void;
  onEditFood: (mealId: string, foodIndex: number) => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onAskAi, onManualAdd, onClear, onEditFood }) => {
  const totalCals = meal.foods.reduce((acc, f) => acc + f.macros.calories, 0);

  return (
    <div className={`rounded-xl p-4 border transition-all ${meal.isLocked ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          {meal.name}
          {meal.isLocked && <CheckCircle2 size={16} className="text-green-500" />}
        </h3>
        <div className="text-xs text-gray-500 font-mono">
          {totalCals > 0 ? `${Math.round(totalCals)} kcal` : ''}
        </div>
      </div>

      {meal.foods.length > 0 ? (
        <ul className="space-y-2 mb-4">
          {meal.foods.map((food, idx) => (
            <li 
              key={idx} 
              onClick={() => onEditFood(meal.id, idx)}
              className="flex flex-col text-sm text-gray-700 bg-white border border-gray-100 p-2 rounded hover:border-emerald-300 hover:shadow-sm cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                     <span>{food.name} <span className="text-emerald-600 font-bold text-xs">({food.weight}g)</span></span>
                     <Edit2 size={12} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                  </div>
                  <span className="text-xs text-gray-400 self-center font-mono">
                     P{Math.round(food.macros.protein)} C{Math.round(food.macros.carbs)} F{Math.round(food.macros.fat)}
                  </span>
              </div>
              
              {food.cookingNote && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 bg-amber-50 w-fit px-1.5 py-0.5 rounded">
                      <Droplets size={10} />
                      <span>{food.cookingNote}</span>
                  </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-400 italic mb-4 text-center py-2">
          尚未记录
        </div>
      )}

      <div className="flex gap-2">
         {/* Always allow manual add, even if locked, to append items */}
          <button 
              onClick={() => onAskAi(meal.id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm py-2 px-3 rounded-lg hover:shadow-md transition-shadow"
          >
            <Sparkles size={16} />
            {meal.isLocked ? '重新推荐' : '帮我决定'}
          </button>
          <button 
              onClick={() => onManualAdd(meal.id)}
              className="px-3 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center"
              title="手动记录"
          >
              <PlusCircle size={20} />
          </button>
          
          {meal.isLocked && (
             <button 
                onClick={() => onClear(meal.id)}
                className="px-3 text-red-400 bg-red-50 hover:bg-red-100 rounded-lg text-xs"
            >
                重置
            </button>
          )}
      </div>
    </div>
  );
};
