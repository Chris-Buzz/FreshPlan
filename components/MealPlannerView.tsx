import React, { useState } from 'react';
import { PantryItem, Recipe, DayPlan } from '../types';
import { generateWeeklyPlan, suggestRecipes } from '../services/geminiService';
import { Loader2, Sparkles, ChefHat, Clock, Flame, ChevronRight } from 'lucide-react';

interface MealPlannerViewProps {
  pantryItems: PantryItem[];
  currentPlan: DayPlan[];
  onUpdatePlan: (plan: DayPlan[]) => void;
}

const MealPlannerView: React.FC<MealPlannerViewProps> = ({ pantryItems, currentPlan, onUpdatePlan }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'suggest'>('plan');
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);

  const handleGeneratePlan = async () => {
    if (pantryItems.length === 0) {
        alert("Add items to your pantry first!");
        return;
    }
    setIsLoading(true);
    try {
      const plan = await generateWeeklyPlan(pantryItems);
      onUpdatePlan(plan);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
     if (pantryItems.length === 0) {
        alert("Add items to your pantry first!");
        return;
    }
    setIsLoading(true);
    setActiveTab('suggest');
    try {
      const recipes = await suggestRecipes(pantryItems);
      setSuggestions(recipes);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Meal Planner</h2>
        <div className="flex gap-2 w-full sm:w-auto">
            <button 
                onClick={() => setActiveTab('plan')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'plan' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border'}`}
            >
                Weekly Plan
            </button>
            <button 
                onClick={() => setActiveTab('suggest')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'suggest' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border'}`}
            >
                Quick Suggestions
            </button>
        </div>
      </header>

      {activeTab === 'plan' && (
        <>
          {currentPlan.length === 0 ? (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 text-center border border-emerald-100">
              <ChefHat className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-emerald-900 mb-2">No Plan Yet</h3>
              <p className="text-emerald-700 mb-6 max-w-md mx-auto">
                Let AI analyze your pantry and create a waste-minimizing meal plan for the next 3 days.
              </p>
              <button
                onClick={handleGeneratePlan}
                disabled={isLoading}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-emerald-700 transition flex items-center gap-2 mx-auto"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate Smart Plan
              </button>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="flex justify-end">
                     <button
                        onClick={handleGeneratePlan}
                        disabled={isLoading}
                        className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1"
                    >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Regenerate Plan
                    </button>
                </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {currentPlan.map((day, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-semibold text-gray-700">
                      {day.day}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {['breakfast', 'lunch', 'dinner'].map((type) => {
                         const meal = day.meals[type as keyof typeof day.meals];
                         if (!meal) return null;
                         return (
                            <div key={type} className="p-4 hover:bg-gray-50 transition group cursor-pointer">
                                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1 font-medium">{type}</div>
                                <h4 className="font-medium text-gray-800 group-hover:text-emerald-600 transition">{meal.title}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{meal.description}</p>
                                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meal.prepTimeMinutes}m</span>
                                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {meal.calories} kcal</span>
                                </div>
                            </div>
                         )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'suggest' && (
        <div className="space-y-6">
            {suggestions.length === 0 && !isLoading && (
                <div className="text-center py-10">
                    <p className="text-gray-500 mb-4">Need something to cook right now?</p>
                    <button 
                        onClick={handleGetSuggestions}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-emerald-700 transition"
                    >
                        Find Recipes
                    </button>
                </div>
            )}

            {isLoading && (
                 <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                    <p className="text-gray-500">Chef Gemini is thinking...</p>
                 </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {suggestions.map(recipe => (
                    <div key={recipe.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="h-40 bg-gray-200 relative">
                             <img src={`https://picsum.photos/seed/${recipe.id}/800/400`} alt={recipe.title} className="w-full h-full object-cover" />
                             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                <h3 className="text-white font-bold text-lg shadow-sm">{recipe.title}</h3>
                             </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <p className="text-sm text-gray-600 mb-4 flex-1">{recipe.description}</p>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                <div className="flex gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {recipe.prepTimeMinutes}m</span>
                                    <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {recipe.calories}</span>
                                </div>
                                <button className="text-emerald-600 text-sm font-medium flex items-center hover:underline">
                                    View Recipe <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default MealPlannerView;
