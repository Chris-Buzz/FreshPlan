
import { PantryItem } from './types';

export const MOCK_PANTRY: PantryItem[] = [
  { 
    id: '1', 
    name: 'Pasta', 
    quantity: 2, 
    unit: 'packs', 
    expiryDate: '2025-12-01', 
    category: 'Grains',
    macros: { calories: 350, protein: 12, carbs: 70, fats: 2, sugar: 2 }
  },
  { 
    id: '2', 
    name: 'Tomato Sauce', 
    quantity: 3, 
    unit: 'cans', 
    expiryDate: '2024-08-15', 
    category: 'Canned',
    macros: { calories: 80, protein: 2, carbs: 15, fats: 0, sugar: 8 } 
  },
  { 
    id: '3', 
    name: 'Eggs', 
    quantity: 6, 
    unit: 'pcs', 
    expiryDate: '2024-05-20', 
    category: 'Dairy',
    macros: { calories: 70, protein: 6, carbs: 0, fats: 5, sugar: 0 }
  }, 
  { 
    id: '4', 
    name: 'Spinach', 
    quantity: 1, 
    unit: 'bag', 
    expiryDate: '2024-05-18', 
    category: 'Produce',
    macros: { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, sugar: 0.4 }
  },
  { 
    id: '5', 
    name: 'Chicken Breast', 
    quantity: 500, 
    unit: 'g', 
    expiryDate: '2024-05-19', 
    category: 'Meat',
    macros: { calories: 165, protein: 31, carbs: 0, fats: 3.6, sugar: 0 }
  },
  { 
    id: '6', 
    name: 'Rice', 
    quantity: 1, 
    unit: 'kg', 
    expiryDate: '2026-01-01', 
    category: 'Grains',
    macros: { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, sugar: 0.1 }
  },
];

export const CATEGORIES = ['Produce', 'Meat', 'Dairy', 'Grains', 'Canned', 'Spices', 'Snacks', 'Beverages', 'Other'];

export const DIET_TYPES = [
    'Standard / None',
    'Vegetarian',
    'Vegan',
    'Pescatarian',
    'Keto',
    'Paleo',
    'Gluten-Free',
    'Dairy-Free',
    'Low-Carb'
];

export const PLACEHOLDER_FOOD_IMG = "https://picsum.photos/400/300";

// Days past expiry that items are generally safe to consume (Estimates)
export const SAFE_CONSUME_BUFFER: Record<string, number> = {
  'Produce': 2,
  'Meat': 1,
  'Dairy': 5,
  'Grains': 90,
  'Canned': 365,
  'Spices': 180,
  'Other': 7
};

export const ESSENTIAL_GROCERIES = [
  { name: 'Olive Oil', category: 'Pantry', estimatedPrice: 8.00 },
  { name: 'Salt & Pepper', category: 'Spices', estimatedPrice: 4.00 },
  { name: 'Rice', category: 'Grains', estimatedPrice: 3.50 },
  { name: 'Pasta', category: 'Grains', estimatedPrice: 2.00 },
  { name: 'Onions', category: 'Produce', estimatedPrice: 1.50 },
  { name: 'Garlic', category: 'Produce', estimatedPrice: 1.00 },
  { name: 'Eggs', category: 'Dairy', estimatedPrice: 4.50 },
  { name: 'Milk', category: 'Dairy', estimatedPrice: 3.00 },
  { name: 'Bread', category: 'Grains', estimatedPrice: 3.00 },
  { name: 'Butter', category: 'Dairy', estimatedPrice: 5.00 },
  { name: 'Canned Beans', category: 'Canned', estimatedPrice: 1.20 },
  { name: 'Tomatoes', category: 'Produce', estimatedPrice: 2.50 },
];
