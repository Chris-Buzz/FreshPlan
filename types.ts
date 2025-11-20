export enum Unit {
  GRAMS = 'g',
  KILOGRAMS = 'kg',
  PIECES = 'pcs',
  LITERS = 'l',
  PACKS = 'packs',
  CANS = 'cans'
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string; // ISO date string YYYY-MM-DD
  category: string;
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
  calories: number;
  imageUrl?: string; // Placeholder or generated
  missingIngredientsCount: number;
}

export interface DayPlan {
  day: string; // e.g., "Monday"
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
  };
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  estimatedPrice: number;
  category: string;
  checked: boolean;
}

export interface UserStats {
  itemsExpiringSoon: number;
  weeklyBudgetSpent: number;
  wasteAvoidedKg: number;
}
