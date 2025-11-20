import React, { useState, useEffect } from 'react';
import { DayPlan, PantryItem, GroceryItem } from '../types';
import { generateGroceryList } from '../services/geminiService';
import { ESSENTIAL_GROCERIES } from '../constants';
import { ShoppingCart, Check, Loader2, RefreshCw, Plus, Trash2, Sparkles } from 'lucide-react';

interface GroceryListViewProps {
  pantryItems: PantryItem[];
  currentPlan: DayPlan[];
}

const GroceryListView: React.FC<GroceryListViewProps> = ({ pantryItems, currentPlan }) => {
  // Initialize from local storage or empty
  const [items, setItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem('freshplan_grocery');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Save to local storage whenever items change
  useEffect(() => {
    localStorage.setItem('freshplan_grocery', JSON.stringify(items));
  }, [items]);

  const handleGenerateList = async () => {
    if (currentPlan.length === 0) {
        alert("Please generate a meal plan first!");
        return;
    }
    setIsLoading(true);
    try {
      const list = await generateGroceryList(currentPlan, pantryItems);
      // Merge with existing items to avoid overwriting manually added ones
      setItems(prev => {
        const existingNames = new Set(prev.map(i => i.name.toLowerCase()));
        const newItems = list.filter(i => !existingNames.has(i.name.toLowerCase()));
        return [...prev, ...newItems];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(items.filter(i => i.id !== id));
  };

  const addSuggestion = (suggestion: typeof ESSENTIAL_GROCERIES[0]) => {
    const newItem: GroceryItem = {
        id: `auto-${Date.now()}-${Math.random()}`,
        name: suggestion.name,
        quantity: '1 unit',
        category: suggestion.category,
        estimatedPrice: suggestion.estimatedPrice,
        checked: false
    };
    setItems(prev => [...prev, newItem]);
  };

  // Filter suggestions: Show items NOT in pantry AND NOT in current list
  const suggestions = ESSENTIAL_GROCERIES.filter(s => {
    const inPantry = pantryItems.some(p => p.name.toLowerCase().includes(s.name.toLowerCase()));
    const inList = items.some(i => i.name.toLowerCase().includes(s.name.toLowerCase()));
    return !inPantry && !inList;
  });

  const totalCost = items.reduce((acc, item) => acc + (item.checked ? 0 : item.estimatedPrice), 0);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Grocery List</h2>
           <p className="text-sm text-gray-500">Items needed for your plan</p>
        </div>
        <div className="flex items-center gap-4">
             {items.length > 0 && (
                <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Est. Cost</div>
                    <div className="text-xl font-bold text-emerald-600">${totalCost.toFixed(2)}</div>
                </div>
             )}
            <button 
                onClick={handleGenerateList}
                disabled={isLoading}
                className="text-emerald-600 p-2 hover:bg-emerald-50 rounded-full transition bg-white border border-emerald-100 shadow-sm"
                title="Generate from Meal Plan"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            </button>
        </div>
      </div>

      {/* Main List */}
      {items.length === 0 ? (
         <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Your list is empty.</p>
            <button 
                onClick={handleGenerateList}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                disabled={isLoading || currentPlan.length === 0}
            >
                {isLoading ? 'Generating...' : 'Create from Meal Plan'}
            </button>
            {currentPlan.length === 0 && (
                <p className="text-xs text-orange-500 mt-2">Create a meal plan first!</p>
            )}
         </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {items.map((item) => (
                <div 
                    key={item.id} 
                    onClick={() => toggleItem(item.id)}
                    className={`p-4 flex items-center gap-4 cursor-pointer transition hover:bg-gray-50 group ${item.checked ? 'bg-gray-50' : ''}`}
                >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${item.checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                        {item.checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                        <div className={`font-medium text-gray-800 ${item.checked ? 'line-through text-gray-400' : ''}`}>{item.name}</div>
                        <div className="text-xs text-gray-500">{item.quantity} • {item.category}</div>
                    </div>
                    <div className={`font-medium text-sm ${item.checked ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
                        ${item.estimatedPrice.toFixed(2)}
                    </div>
                    <button 
                        onClick={(e) => deleteItem(item.id, e)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove item"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
      )}

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
          <div className="pt-4">
             <h3 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Quick Add Essentials
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {suggestions.slice(0, 8).map((item) => (
                    <button
                        key={item.name}
                        onClick={() => addSuggestion(item)}
                        className="bg-white border border-gray-200 p-3 rounded-xl text-left hover:border-emerald-400 hover:shadow-sm transition group flex items-center justify-between"
                    >
                        <div>
                            <div className="font-medium text-gray-700 text-sm">{item.name}</div>
                            <div className="text-xs text-gray-400">{item.category}</div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 transition">
                            <Plus className="w-3.5 h-3.5" />
                        </div>
                    </button>
                ))}
             </div>
          </div>
      )}
    </div>
  );
};

export default GroceryListView;