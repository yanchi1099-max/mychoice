
import React, { useState, useEffect, useMemo } from 'react';
import { Meal, Macros, FoodItem, RecommendationType, AiResponse, BodyMetrics } from './types';
import { MacroProgress } from './components/MacroProgress';
import { MealCard } from './components/MealCard';
import { DecisionModal } from './components/DecisionModal';
import { ManualRecordModal } from './components/ManualRecordModal';
import { EditFoodModal } from './components/EditFoodModal';
import { BodyMetricsCard } from './components/BodyMetricsCard';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { CalendarModal } from './components/CalendarModal';
import { getMealRecommendation, getDailySummary, generateWeeklyReport } from './services/geminiService';
import { loadDailyRecord, saveDailyRecord, getFormattedDate, getHistoryRange } from './services/storageService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FileText, AlertCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// Calculation: 70g P * 4 = 280kcal. 175g C * 4 = 700kcal. 41g F * 9 = 369kcal. Total = 1349kcal (~1350).
const TARGET_MACROS: Macros = {
  calories: 1350, 
  protein: 70,    // Target 70, max 80
  carbs: 175,     // >50% of energy (700/1350 = 51.8%)
  fat: 41         // Remainder
};

function App() {
  // Date State
  const [currentDate, setCurrentDate] = useState<string>(getFormattedDate(new Date()));
  
  // Data State
  const [meals, setMeals] = useState<Meal[]>([]);
  const [metrics, setMetrics] = useState<BodyMetrics>({});
  
  // UI State
  const [modalOpen, setModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResponse | null>(null);
  const [dailySummary, setDailySummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Load data when date changes
  useEffect(() => {
    const record = loadDailyRecord(currentDate);
    setMeals(record.meals);
    setMetrics(record.metrics || {});
    setDailySummary(null); // Reset summary for new day
  }, [currentDate]);

  // Save data when meals or metrics change
  useEffect(() => {
    if (meals.length > 0) {
        saveDailyRecord({
            date: currentDate,
            meals,
            metrics
        });
    }
  }, [meals, metrics, currentDate]);

  // Calculate totals
  const currentMacros = useMemo(() => {
    return meals.reduce((acc, meal) => {
      meal.foods.forEach(food => {
        acc.calories += food.macros.calories;
        acc.protein += food.macros.protein;
        acc.carbs += food.macros.carbs;
        acc.fat += food.macros.fat;
      });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 } as Macros);
  }, [meals]);

  const remainingMacros = useMemo(() => {
    return {
      calories: Math.max(0, TARGET_MACROS.calories - currentMacros.calories),
      protein: Math.max(0, TARGET_MACROS.protein - currentMacros.protein),
      carbs: Math.max(0, TARGET_MACROS.carbs - currentMacros.carbs),
      fat: Math.max(0, TARGET_MACROS.fat - currentMacros.fat),
    };
  }, [currentMacros]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(getFormattedDate(d));
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(getFormattedDate(d));
  };
  
  const handleDateSelect = (date: string) => {
      setCurrentDate(date);
  };
  
  const isToday = currentDate === getFormattedDate(new Date());

  // Action Handlers
  const handleAskAi = (mealId: string) => {
    setActiveMealId(mealId);
    setAiResult(null);
    setModalOpen(true);
  };

  const handleManualAdd = (mealId: string) => {
    setActiveMealId(mealId);
    setManualModalOpen(true);
  };

  const handleEditFood = (mealId: string, index: number) => {
    setActiveMealId(mealId);
    setEditingFoodIndex(index);
    setEditModalOpen(true);
  };

  const handleClearMeal = (mealId: string) => {
    setMeals(prev => prev.map(m => {
        if (m.id === mealId) {
             return { ...m, foods: [], isLocked: false };
        }
        return m;
    }));
  };

  const handleGetRecommendation = async (options: string[]) => {
    if (!activeMealId) return;
    setLoading(true);
    
    try {
      const activeMealName = meals.find(m => m.id === activeMealId)?.name || 'Meal';
      const type = options.length > 0 ? RecommendationType.DECISION : RecommendationType.OPEN;
      
      const response = await getMealRecommendation(
        {
          type,
          remainingMacros,
          userOptions: options,
          targetMealName: activeMealName
        },
        currentMacros
      );
      setAiResult(response);
    } catch (error) {
      alert("获取推荐失败，请重试。");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptResult = (result: AiResponse) => {
    if (!activeMealId) return;
    const newFoods: FoodItem[] = result.ingredients.map(ing => ({
        name: ing.name,
        weight: ing.grams,
        macros: ing.macros,
        cookingNote: ing.cookingNote
    }));

    setMeals(prev => prev.map(m => {
        if (m.id === activeMealId) {
            return {
                ...m,
                foods: newFoods, 
                isLocked: true
            };
        }
        return m;
    }));

    setModalOpen(false);
  };

  const handleAddManualFoods = (foods: FoodItem[]) => {
    if (!activeMealId) return;
    setMeals(prev => prev.map(m => {
      if (m.id === activeMealId) {
        return {
          ...m,
          foods: [...m.foods, ...foods],
          isLocked: true
        };
      }
      return m;
    }));
  };

  const handleSaveEditedFood = (updatedFood: FoodItem) => {
    if (!activeMealId || editingFoodIndex === null) return;
    
    setMeals(prev => prev.map(m => {
      if (m.id === activeMealId) {
        const newFoods = [...m.foods];
        newFoods[editingFoodIndex] = updatedFood;
        return { ...m, foods: newFoods };
      }
      return m;
    }));
    setEditModalOpen(false);
  };

  const handleDeleteFood = () => {
     if (!activeMealId || editingFoodIndex === null) return;
     setMeals(prev => prev.map(m => {
      if (m.id === activeMealId) {
        const newFoods = m.foods.filter((_, i) => i !== editingFoodIndex);
        return { ...m, foods: newFoods };
      }
      return m;
    }));
    setEditModalOpen(false);
  }

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
        const text = await getDailySummary(currentMacros);
        setDailySummary(text);
    } catch (e) {
        // ignore
    } finally {
        setSummaryLoading(false);
    }
  };

  const handleGenerateWeeklyReport = async () => {
      setReportModalOpen(true);
      setReportLoading(true);
      try {
          // Get last 7 days ending at currentDate
          const end = new Date(currentDate);
          const start = new Date(currentDate);
          start.setDate(start.getDate() - 6);
          
          const records = getHistoryRange(getFormattedDate(start), getFormattedDate(end));
          const text = await generateWeeklyReport(records);
          setWeeklyReport(text);
      } catch (e) {
          setWeeklyReport("生成报告失败，请稍后重试。");
      } finally {
          setReportLoading(false);
      }
  };

  const pieData = [
    { name: '蛋白质', value: currentMacros.protein * 4, color: '#3b82f6' }, 
    { name: '碳水', value: currentMacros.carbs * 4, color: '#fbbf24' },     
    { name: '脂肪', value: currentMacros.fat * 9, color: '#fb7185' },
  ];

  const activeMealForEdit = meals.find(m => m.id === activeMealId);
  const foodToEdit = activeMealForEdit && editingFoodIndex !== null ? activeMealForEdit.foods[editingFoodIndex] : null;

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto bg-gray-50 shadow-2xl min-w-[320px]">
      {/* Date Header */}
      <div className="bg-white px-6 pt-6 pb-2 sticky top-0 z-30 shadow-sm flex items-center justify-between">
          <button onClick={handlePrevDay} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronLeft size={24} />
          </button>
          
          <button 
            onClick={() => setCalendarOpen(true)}
            className="flex flex-col items-center hover:bg-gray-50 px-4 py-1 rounded-lg transition-colors cursor-pointer"
          >
              <span className="font-bold text-lg text-gray-800 flex items-center gap-2">
                 <Calendar size={18} className="text-emerald-600"/> {currentDate}
              </span>
              <span className="text-xs text-gray-400">{isToday ? '今天' : '历史记录'}</span>
          </button>

          <button onClick={handleNextDay} disabled={isToday} className={`p-2 rounded-full ${isToday ? 'text-gray-200' : 'hover:bg-gray-100 text-gray-600'}`}>
            <ChevronRight size={24} />
          </button>
      </div>

      <header className="bg-white p-6 pb-6 pt-2 rounded-b-3xl shadow-sm z-10 relative">
        <div className="mt-2">
            <MacroProgress current={currentMacros} target={TARGET_MACROS} />
        </div>
      </header>

      <main className="p-4 -mt-4 relative z-20 space-y-4">
        {/* Body Metrics Section */}
        <BodyMetricsCard 
            metrics={metrics} 
            onUpdate={setMetrics}
        />

        {meals.map(meal => (
          <MealCard 
            key={meal.id} 
            meal={meal} 
            onAskAi={handleAskAi}
            onManualAdd={handleManualAdd}
            onClear={handleClearMeal}
            onEditFood={handleEditFood}
          />
        ))}

        {/* Action Buttons Area */}
        <div className="grid grid-cols-2 gap-4">
            {/* Daily Summary Button */}
            {(currentMacros.calories > 500) && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="text-indigo-600" size={18} />
                        <h3 className="font-bold text-gray-800 text-sm">今日分析</h3>
                    </div>
                    
                    <div className="h-32 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={30}
                                    outerRadius={45}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {dailySummary ? (
                        <div className="mt-2 bg-indigo-50 p-3 rounded-lg text-indigo-900 text-xs leading-relaxed">
                            {dailySummary}
                        </div>
                    ) : (
                        <button 
                            onClick={handleGenerateSummary}
                            disabled={summaryLoading}
                            className="w-full mt-2 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 disabled:opacity-50 text-sm font-semibold"
                        >
                            {summaryLoading ? 'AI 分析中...' : '生成今日总结'}
                        </button>
                    )}
                </div>
            )}

            {/* Weekly Report Button */}
            <button
                onClick={handleGenerateWeeklyReport}
                className="col-span-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <CalendarDays size={20} className="text-blue-100" />
                生成本周身体报告 (AI)
            </button>
        </div>
      </main>

      {/* Protein Warning */}
      {currentMacros.protein > 80 && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-3 shadow-lg z-30 animate-pulse">
            <AlertCircle className="text-red-500" />
            <div className="text-sm text-red-700">
                <span className="font-bold">警告!</span> 蛋白质已达 {Math.round(currentMacros.protein)}g (上限 80g)。请减少肉蛋摄入。
            </div>
        </div>
      )}

      {/* Modals */}
      <DecisionModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mealName={meals.find(m => m.id === activeMealId)?.name || ''}
        onGetRecommendation={handleGetRecommendation}
        isLoading={loading}
        aiResult={aiResult}
        onAcceptResult={handleAcceptResult}
      />

      <ManualRecordModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onAddFoods={handleAddManualFoods}
        mealName={meals.find(m => m.id === activeMealId)?.name || ''}
      />

      <EditFoodModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        food={foodToEdit}
        onSave={handleSaveEditedFood}
        onDelete={handleDeleteFood}
      />

      <WeeklyReportModal 
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        report={weeklyReport}
        loading={reportLoading}
      />

      <CalendarModal 
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={currentDate}
        onSelectDate={handleDateSelect}
      />
    </div>
  );
}

// Helper icons needed for new buttons
function CalendarDays({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <path d="M8 14h.01" />
            <path d="M12 14h.01" />
            <path d="M16 14h.01" />
            <path d="M8 18h.01" />
            <path d="M12 18h.01" />
            <path d="M16 18h.01" />
        </svg>
    );
}

export default App;
