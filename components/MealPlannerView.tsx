import React, { useState } from 'react';
import { PantryItem, Recipe, DayPlan } from '../types';
import { generateWeeklyPlan, suggestRecipes } from '../services/geminiService';
import { Loader2, Sparkles, ChefHat, Clock, Flame, ChevronRight, X, List, CheckSquare, CalendarDays } from 'lucide-react';

interface MealPlannerViewProps {
  pantryItems: PantryItem[];
  currentPlan: DayPlan[];
  onUpdatePlan: (plan: DayPlan[]) => void;
}

const MealPlannerView: React.FC<MealPlannerViewProps> = ({ pantryItems, currentPlan, onUpdatePlan }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'suggest'>('plan');
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

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

  // Simple Modal Component for Recipe Details
  const RecipeModal = ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="relative h-48 shrink-0 bg-gray-900">
                <img 
                    src={`https://picsum.photos/seed/${recipe.title.replace(/\s/g, '')}/800/400`} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-6">
                    <div className="text-white w-full">
                        <h3 className="text-2xl font-bold leading-tight">{recipe.title}</h3>
                        <div className="flex gap-4 mt-2 text-sm opacity-90">
                             {recipe.prepTimeMinutes && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {recipe.prepTimeMinutes} min</span>}
                             {recipe.calories && <span className="flex items-center gap-1"><Flame className="w-4 h-4" /> {recipe.calories} kcal</span>}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                <p className="text-gray-600 mb-6 italic">{recipe.description}</p>
                
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b">
                            <CheckSquare className="w-5 h-5 text-emerald-600" /> Ingredients
                        </h4>
                        <ul className="space-y-3 text-sm">
                            {recipe.ingredients && recipe.ingredients.length > 0 ? (
                                recipe.ingredients.map((ing, i) => (
                                    <li key={i} className="flex items-start gap-2 text-gray-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></div>
                                        <span className="leading-relaxed">
                                          <span className="font-semibold text-gray-900">{ing.amount}</span> {ing.name}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-400 italic">Ingredients not available for this quick plan item.</li>
                            )}
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b">
                            <List className="w-5 h-5 text-emerald-600" /> Instructions
                        </h4>
                        <ol className="space-y-4 text-sm">
                            {recipe.steps && recipe.steps.length > 0 ? (
                                recipe.steps.map((step, i) => (
                                    <li key={i} className="flex gap-3 text-gray-700">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs shrink-0">
                                          {i + 1}
                                        </span>
                                        <span className="leading-relaxed pt-0.5">{step}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-400 italic">Steps not detailed. Try the 'Quick Suggestions' tab for full recipes.</li>
                            )}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Meal Planner</h2>
            <p className="text-sm text-gray-500">Reduce waste with AI-driven plans</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto bg-gray-100 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('plan')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${activeTab === 'plan' ? 'bg-white text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Weekly Plan
            </button>
            <button 
                onClick={() => setActiveTab('suggest')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${activeTab === 'suggest' ? 'bg-white text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Quick Ideas
            </button>
        </div>
      </header>

      {activeTab === 'plan' && (
        <>
          {currentPlan.length === 0 ? (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-10 text-center border border-emerald-100 flex flex-col items-center">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <CalendarDays className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Plan Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md">
                Let AI analyze your pantry and create a waste-minimizing meal plan for the next 3 days.
              </p>
              <button
                onClick={handleGeneratePlan}
                disabled={isLoading}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-emerald-700 transition flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate Smart Plan
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">3-Day Plan based on your pantry</div>
                     <button
                        onClick={handleGeneratePlan}
                        disabled={isLoading}
                        className="text-sm bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-emerald-600 font-medium hover:bg-emerald-50 flex items-center gap-2 transition"
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Regenerate
                    </button>
                </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {currentPlan.map((day, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-bold text-gray-700 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-emerald-500" />
                      {day.day}
                    </div>
                    <div className="divide-y divide-gray-100 flex-1">
                      {['breakfast', 'lunch', 'dinner'].map((type) => {
                         const meal = day.meals[type as keyof typeof day.meals];
                         if (!meal) return null;
                         return (
                            <div 
                                key={type} 
                                onClick={() => setSelectedRecipe({ ...meal, id: `${idx}-${type}` } as Recipe)}
                                className="p-4 hover:bg-emerald-50/50 transition group cursor-pointer h-full"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">{type}</div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-transform group-hover:translate-x-1" />
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm group-hover:text-emerald-700 transition mb-1">{meal.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{meal.description}</p>
                                <div className="flex items-center gap-3 text-[10px] text-gray-400">
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
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {suggestions.length === 0 && !isLoading && (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                    <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Hungry right now?</h3>
                    <p className="text-gray-500 mb-6">Get instant recipe ideas based on what you have.</p>
                    <button 
                        onClick={handleGetSuggestions}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-emerald-700 transition hover:scale-105"
                    >
                        Find Recipes
                    </button>
                </div>
            )}

            {isLoading && (
                 <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Chef Gemini is cooking up ideas...</p>
                 </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {suggestions.map(recipe => (
                    <div 
                        key={recipe.id} 
                        onClick={() => setSelectedRecipe(recipe)}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className="h-48 bg-gray-200 relative overflow-hidden">
                             <img 
                                src={`https://picsum.photos/seed/${recipe.title.replace(/\s/g, '')}/800/400`} 
                                alt={recipe.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"></div>
                             <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-white font-bold text-lg shadow-sm leading-tight">{recipe.title}</h3>
                             </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">{recipe.description}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> {recipe.prepTimeMinutes}m</span>
                                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full"><Flame className="w-3.5 h-3.5" /> {recipe.calories}</span>
                                </div>
                                <span className="text-emerald-600 text-sm font-medium flex items-center group-hover:gap-2 gap-1 transition-all">
                                    Cook this <ChevronRight className="w-4 h-4" />
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </div>
  );
};

export default MealPlannerView;