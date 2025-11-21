
import React, { useState, useEffect } from 'react';
import { DayPlan, PantryItem, GroceryItem, UserProfile, Recipe, RestockSuggestion } from '../types';
import { generateGroceryList, suggestInspirationRecipes, suggestRestockItems } from '../services/geminiService';
import { ShoppingCart, Check, Loader2, Sparkles, Plus, Trash2, ChefHat, Clock, Flame, PlusCircle, X, DollarSign, Beef, Apple, Package, Search } from 'lucide-react';

interface GroceryListViewProps {
  pantryItems: PantryItem[];
  currentPlan: DayPlan[];
  userProfile: UserProfile | null;
}

const GroceryListView: React.FC<GroceryListViewProps> = ({ pantryItems, currentPlan, userProfile }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'discover'>('list');
  const [items, setItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem('freshplan_grocery');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [newItemInput, setNewItemInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inspirationRecipes, setInspirationRecipes] = useState<Recipe[]>([]);
  const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestion[]>([]);
  const [showRestockModal, setShowRestockModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('freshplan_grocery', JSON.stringify(items));
  }, [items]);

  const handleManualAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newItemInput.trim()) return;
      const newItem: GroceryItem = {
          id: `manual-${Date.now()}`,
          name: newItemInput.trim(),
          quantity: '1',
          category: 'Other',
          estimatedPrice: estimateIngredientPrice(newItemInput.trim()),
          checked: false
      };
      setItems(prev => [newItem, ...prev]);
      setNewItemInput('');
  };

  const handleGenerateList = async () => {
    if (currentPlan.length === 0) {
        alert("Generate a meal plan first, or use Smart Restock!");
        return;
    }
    setIsLoading(true);
    try {
      const list = await generateGroceryList(currentPlan, pantryItems);
      mergeItems(list);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartRestock = async () => {
      setIsLoading(true);
      try {
          const categories = await suggestRestockItems(userProfile, pantryItems);
          setRestockSuggestions(categories);
          setShowRestockModal(true);
      } finally {
          setIsLoading(false);
      }
  };

  const handleDiscoverRecipes = async () => {
      if (inspirationRecipes.length > 0) return; 
      setIsLoading(true);
      try {
          const recipes = await suggestInspirationRecipes(userProfile);
          setInspirationRecipes(recipes);
      } finally {
          setIsLoading(false);
      }
  };

  const estimateIngredientPrice = (name: string): number => {
      const n = name.toLowerCase();
      if (n.match(/chicken|beef|steak|salmon|pork|meat|fish|lamb/)) return 12.00;
      if (n.match(/milk|cheese|butter|cream|yogurt|eggs/)) return 5.50;
      if (n.match(/bread|rice|pasta|cereal|oats|grain/)) return 4.00;
      if (n.match(/onion|garlic|tomato|potato|carrot|lettuce|spinach|fruit|veg/)) return 2.50;
      if (n.match(/oil|sauce|spice|condiment/)) return 6.00;
      return 3.50;
  };

  const addRecipeIngredients = (recipe: Recipe) => {
      if (!recipe.ingredients) return;
      const newGroceries = recipe.ingredients.map((ing, idx) => ({
          id: `recipe-ing-${recipe.id}-${idx}`,
          name: ing.name,
          quantity: ing.amount || '1',
          category: 'Recipe Item',
          estimatedPrice: estimateIngredientPrice(ing.name),
          checked: false
      }));
      mergeItems(newGroceries);
      alert(`Added ingredients for ${recipe.title} to your list!`);
      setActiveTab('list');
  };

  const mergeItems = (newItems: GroceryItem[]) => {
    setItems(prev => {
        const existingNames = new Set(prev.map(i => i.name.toLowerCase()));
        const filteredNew = newItems.filter(i => !existingNames.has(i.name.toLowerCase()));
        return [...prev, ...filteredNew];
    });
  };

  const toggleItem = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(items.filter(i => i.id !== id));
  };

  const clearCompleted = () => {
      setItems(prev => prev.filter(i => !i.checked));
  }

  const totalCost = items.reduce((acc, item) => acc + (item.checked ? 0 : item.estimatedPrice), 0);

  // Improved Restock Modal
  const RestockModal = () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <div>
                      <h3 className="text-xl font-bold text-gray-800">Smart Restock</h3>
                      <p className="text-sm text-gray-500">Targeted suggestions to build complete meals.</p>
                  </div>
                  <button onClick={() => setShowRestockModal(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition">
                      <X className="w-5 h-5" />
                  </button>
              </div>
              
              <div className="p-8 overflow-y-auto bg-gray-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {restockSuggestions.map((group, i) => {
                        // Dynamic Icons based on category
                        let Icon = Package;
                        let colorClass = "text-gray-600";
                        let bgClass = "bg-gray-100";
                        
                        if (group.category === 'Proteins & Mains') { Icon = Beef; colorClass = "text-rose-600"; bgClass = "bg-rose-50"; }
                        if (group.category === 'Fresh Produce') { Icon = Apple; colorClass = "text-emerald-600"; bgClass = "bg-emerald-50"; }
                        if (group.category === 'Pantry Staples') { Icon = Package; colorClass = "text-amber-600"; bgClass = "bg-amber-50"; }
                        if (group.category === 'Snacks & Other') { Icon = Sparkles; colorClass = "text-purple-600"; bgClass = "bg-purple-50"; }

                        return (
                            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                <div className={`p-4 flex items-center gap-3 border-b border-gray-100 ${bgClass}`}>
                                    <Icon className={`w-5 h-5 ${colorClass}`} />
                                    <h4 className={`font-bold ${colorClass}`}>{group.category}</h4>
                                </div>
                                <div className="p-4 space-y-2">
                                    {group.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition group">
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-800">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.quantity} • ${item.estimatedPrice}</div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    mergeItems([{ ...item, id: `restock-${Date.now()}`, checked: false }]);
                                                }}
                                                className="text-emerald-600 hover:bg-emerald-100 p-2 rounded-full transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            >
                                                <PlusCircle className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                  </div>
              </div>
              <div className="p-5 border-t border-gray-100 bg-white text-right flex justify-end">
                  <button onClick={() => setShowRestockModal(false)} className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg transition">
                      Done Shopping
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Grocery List</h2>
           <p className="text-sm text-gray-500">
               {userProfile ? `Budget: $${userProfile.weeklyBudget}/wk` : 'Plan your shopping'}
           </p>
        </div>
        <div className="bg-gray-100 p-1 rounded-xl flex text-sm font-medium w-full sm:w-auto">
             <button 
                onClick={() => setActiveTab('list')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition ${activeTab === 'list' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 My List
             </button>
             <button 
                onClick={() => { setActiveTab('discover'); handleDiscoverRecipes(); }}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition ${activeTab === 'discover' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 Browse Recipes
             </button>
        </div>
      </div>

      {activeTab === 'list' && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
              {/* Command Bar */}
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2">
                  <form onSubmit={handleManualAdd} className="flex-1 flex items-center relative">
                      <Search className="absolute left-4 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        value={newItemInput}
                        onChange={(e) => setNewItemInput(e.target.value)}
                        placeholder="Add item (e.g. Milk, Bread)..."
                        className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium"
                      />
                      <button type="submit" className="mr-2 p-2 bg-gray-100 rounded-lg hover:bg-emerald-100 text-gray-600 hover:text-emerald-600 transition">
                          <Plus className="w-4 h-4" />
                      </button>
                  </form>
                  <div className="w-px bg-gray-200 hidden md:block"></div>
                  <button 
                      onClick={handleSmartRestock}
                      disabled={isLoading}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Smart Restock
                  </button>
              </div>

               {items.length > 0 && (
                   <div className="flex justify-between items-center px-4 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100">
                       <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                           <DollarSign className="w-4 h-4 text-emerald-600" />
                           Estimated Total: <span className="text-emerald-700 text-lg">${totalCost.toFixed(2)}</span>
                       </div>
                       {items.some(i => i.checked) && (
                           <button onClick={clearCompleted} className="text-xs text-red-500 hover:text-red-700 font-bold uppercase tracking-wider bg-white border border-red-100 px-3 py-1.5 rounded-lg shadow-sm">
                               Clear Done
                           </button>
                       )}
                   </div>
               )}

              {items.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingCart className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Your list is empty</h3>
                    <p className="text-gray-500 mb-8 max-w-xs mx-auto">Add items manually or use our AI to find what you're missing.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                         <button 
                            onClick={handleSmartRestock}
                            disabled={isLoading}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition hover:scale-105"
                        >
                            Populate Essentials
                        </button>
                    </div>
                 </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                    {items.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => toggleItem(item.id)}
                            className={`p-4 flex items-center gap-4 cursor-pointer transition-all duration-200 rounded-2xl border group relative overflow-hidden
                                ${item.checked 
                                    ? 'bg-gray-50 border-gray-100 opacity-70' 
                                    : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md'}`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${item.checked ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-gray-300 group-hover:border-emerald-400'}`}>
                                {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            
                            <div className="flex-1 min-w-0 z-10">
                                <div className={`font-bold text-lg transition-colors ${item.checked ? 'line-through text-gray-400' : 'text-gray-800 group-hover:text-emerald-900'}`}>
                                    {item.name}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{item.category}</span>
                                    {item.quantity !== '1' && <span>• Qty: {item.quantity}</span>}
                                </div>
                            </div>
                            
                            {item.estimatedPrice > 0 && (
                                <div className={`font-bold text-sm z-10 ${item.checked ? 'text-gray-300 line-through' : 'text-gray-900'}`}>
                                    ${item.estimatedPrice.toFixed(2)}
                                </div>
                            )}
                            
                            <button 
                                onClick={(e) => deleteItem(item.id, e)}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
              )}
          </div>
      )}

      {activeTab === 'discover' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                      <h3 className="text-2xl font-bold flex items-center gap-3 mb-2"><ChefHat className="w-8 h-8" /> Recipe Inspiration</h3>
                      <p className="text-emerald-100 max-w-lg">
                          Discover new meals tailored to your {userProfile ? userProfile.dietaryType : 'diet'}. 
                          These recipes ignore your current pantry limits, allowing you to explore new flavors.
                      </p>
                  </div>
                  <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              </div>

              {isLoading && inspirationRecipes.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                      <p className="text-gray-500 font-medium">Chef Gemini is finding delicious ideas...</p>
                   </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {inspirationRecipes.map(recipe => (
                      <div key={recipe.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition duration-300 group cursor-default">
                          <div className="relative h-48 bg-gray-200 overflow-hidden">
                               <img 
                                  src={`https://picsum.photos/seed/${recipe.title.replace(/\s/g, '')}/800/400`} 
                                  alt={recipe.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                               />
                               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                               <div className="absolute bottom-4 left-6 right-6">
                                   <h3 className="text-white font-bold text-xl leading-tight shadow-sm mb-1">{recipe.title}</h3>
                                   <div className="flex items-center gap-3 text-white/80 text-xs font-medium">
                                       <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.prepTimeMinutes}m</span>
                                       {recipe.macros && <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {recipe.macros.calories} kcal</span>}
                                   </div>
                               </div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                              <p className="text-gray-600 mb-6 line-clamp-3 flex-1">{recipe.description}</p>
                              
                              <button 
                                onClick={() => addRecipeIngredients(recipe)}
                                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition flex items-center justify-center gap-2"
                              >
                                  <Plus className="w-4 h-4" /> Add Ingredients to List
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {showRestockModal && <RestockModal />}
    </div>
  );
};

export default GroceryListView;
