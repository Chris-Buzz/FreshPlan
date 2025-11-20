import { PantryItem } from './types';

export const MOCK_PANTRY: PantryItem[] = [
  { id: '1', name: 'Pasta', quantity: 2, unit: 'packs', expiryDate: '2025-12-01', category: 'Grains' },
  { id: '2', name: 'Tomato Sauce', quantity: 3, unit: 'cans', expiryDate: '2024-08-15', category: 'Canned' },
  { id: '3', name: 'Eggs', quantity: 6, unit: 'pcs', expiryDate: '2024-05-20', category: 'Dairy' }, // Intentionally near-expiry for demo
  { id: '4', name: 'Spinach', quantity: 1, unit: 'bag', expiryDate: '2024-05-18', category: 'Produce' },
  { id: '5', name: 'Chicken Breast', quantity: 500, unit: 'g', expiryDate: '2024-05-19', category: 'Meat' },
  { id: '6', name: 'Rice', quantity: 1, unit: 'kg', expiryDate: '2026-01-01', category: 'Grains' },
];

export const CATEGORIES = ['Produce', 'Meat', 'Dairy', 'Grains', 'Canned', 'Spices', 'Other'];

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