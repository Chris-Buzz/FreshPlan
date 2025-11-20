import React, { useState } from 'react';
import { DayPlan, PantryItem, GroceryItem } from '../types';
import { generateGroceryList } from '../services/geminiService';
import { ShoppingCart, Check, Loader2, RefreshCw } from 'lucide-react';

interface GroceryListViewProps {
  pantryItems: PantryItem[];
  currentPlan: DayPlan[];
}

const GroceryListView: React.FC<GroceryListViewProps> = ({ pantryItems, currentPlan }) => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateList = async () => {
    if (currentPlan.length === 0) {
        alert("Please generate a meal plan first!");
        return;
    }
    setIsLoading(true);
    try {
      const list = await generateGroceryList(currentPlan, pantryItems);
      setItems(list);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const totalCost = items.reduce((acc, item) => acc + (item.checked ? 0 : item.estimatedPrice), 0);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Grocery List</h2>
           <p className="text-sm text-gray-500">Items needed for your plan</p>
        </div>
        <div className="flex items-center gap-4">
             {items.length > 0 && (
                <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Est. Cost</div>
                    <div className="text-xl font-bold text-emerald-600">${totalCost.toFixed(2)}</div>
                </div>
             )}
            <button 
                onClick={handleGenerateList}
                disabled={isLoading}
                className="text-emerald-600 p-2 hover:bg-emerald-50 rounded-full transition bg-white border border-emerald-100 shadow-sm"
                title="Regenerate List"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            </button>
        </div>
      </div>

      {items.length === 0 ? (
         <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
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
                    className={`p-4 flex items-center gap-4 cursor-pointer transition hover:bg-gray-50 ${item.checked ? 'bg-gray-50' : ''}`}
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
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default GroceryListView;