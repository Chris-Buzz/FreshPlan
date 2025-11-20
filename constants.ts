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
