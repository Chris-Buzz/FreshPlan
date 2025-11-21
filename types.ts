
export enum Unit {
  GRAMS = 'g',
  KILOGRAMS = 'kg',
  PIECES = 'pcs',
  LITERS = 'l',
  PACKS = 'packs',
  CANS = 'cans'
}

export interface Macros {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  sugar: number; // grams (required now)
}

export type UserGoal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  height: number; // stored in cm
  weight: number; // stored in kg
  age: number;
  gender: 'male' | 'female';
  activityLevel: ActivityLevel;
  goal: UserGoal;
  targets: Macros; // Calculated daily targets
  consumedMacros: Macros; // Tracked daily consumption
  
  // New Fields
  dietaryType: string; // e.g., "None", "Vegan", "Keto"
  allergies: string; // e.g., "Peanuts, Gluten"
  weeklyBudget: number; // USD
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string; // ISO date string YYYY-MM-DD
  category: string;
  macros?: Macros; // Estimated per unit
}

export interface Ingredient {
  name: string;
  amount: string;
  isPantryItem?: boolean; // True if we have it
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  prepTimeMinutes: number;
  macros?: Macros; // Total for the recipe
  imageUrl?: string; // Placeholder or generated
  missingIngredientsCount: number;
  missingIngredients?: string[];
  isSaved?: boolean; // New field for saved recipes
}

export interface DayPlan {
  day: string; // e.g., "Monday"
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
  };
  dailyMacros?: Macros;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  estimatedPrice: number;
  category: string;
  checked: boolean;
}

export interface RestockSuggestion {
  category: 'Proteins & Mains' | 'Fresh Produce' | 'Pantry Staples' | 'Snacks & Other';
  items: GroceryItem[];
}

export interface UserStats {
  itemsExpiringSoon: number;
  weeklyBudgetSpent: number;
  wasteAvoidedKg: number;
}
