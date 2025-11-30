
export interface Macros {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

export interface FoodItem {
  name: string;
  weight: number; // grams (cooked)
  macros: Macros;
  cookingNote?: string; // New field for oil/fat hints
}

export interface Meal {
  id: string;
  name: string; // "Breakfast", "Lunch", "Dinner", "Snack"
  foods: FoodItem[];
  isLocked: boolean; // If true, the user has eaten or decided on this
}

export interface BodyMetrics {
  weight?: number; // kg
  waist?: number; // cm
  thigh?: number; // cm
  calf?: number; // cm
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  meals: Meal[];
  metrics: BodyMetrics;
}

export enum RecommendationType {
  OPEN = 'OPEN', // "What should I eat?"
  DECISION = 'DECISION' // "Help me choose between A, B, C"
}

export interface RecommendationRequest {
  type: RecommendationType;
  remainingMacros: Macros;
  userOptions?: string[]; // For DECISION type
  targetMealName: string;
}

export interface IngredientRecommendation {
  name: string;
  grams: number;
  reason?: string;
  macros: Macros; // Added macros here for granular editing
  cookingNote?: string; // New field
}

export interface AiResponse {
  selectedOption: string;
  reason: string;
  ingredients: IngredientRecommendation[];
  estimatedMacros: Macros;
}
