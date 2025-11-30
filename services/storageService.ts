
import { DailyRecord, Meal, BodyMetrics, FoodItem } from '../types';

const STORAGE_PREFIX = 'diet_app_';

// Initial constants
const INITIAL_BREAKFAST: FoodItem[] = [
  { name: '水煮蛋', weight: 50, macros: { calories: 72, protein: 6.3, carbs: 0.6, fat: 4.8 } },
  { name: '牛奶 (250ml)', weight: 250, macros: { calories: 130, protein: 8, carbs: 12, fat: 5 } }
];

const DEFAULT_MEALS: Meal[] = [
  { id: 'breakfast', name: '早餐', foods: INITIAL_BREAKFAST, isLocked: true },
  { id: 'lunch', name: '午餐', foods: [], isLocked: false },
  { id: 'dinner', name: '晚餐', foods: [], isLocked: false },
  { id: 'snack', name: '加餐', foods: [], isLocked: false },
];

export const getFormattedDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const loadDailyRecord = (dateStr: string): DailyRecord => {
  const stored = localStorage.getItem(`${STORAGE_PREFIX}${dateStr}`);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Return default structure if no record exists
  return {
    date: dateStr,
    meals: JSON.parse(JSON.stringify(DEFAULT_MEALS)), // Deep copy to avoid reference issues
    metrics: {}
  };
};

export const saveDailyRecord = (record: DailyRecord): void => {
  localStorage.setItem(`${STORAGE_PREFIX}${record.date}`, JSON.stringify(record));
};

export const getHistoryRange = (startDate: string, endDate: string): DailyRecord[] => {
  const records: DailyRecord[] = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = getFormattedDate(current);
    records.push(loadDailyRecord(dateStr));
    current.setDate(current.getDate() + 1);
  }
  return records;
};
