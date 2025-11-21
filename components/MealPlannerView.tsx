
import React, { useState, useEffect } from 'react';
import { PantryItem, Recipe, DayPlan, UserProfile } from '../types';
import { generateWeeklyPlan, suggestRecipes, getRecipeDetails } from '../services/geminiService';
import { Loader2, Sparkles, ChefHat, Clock, Flame, ChevronRight, X, List, CheckSquare, CalendarDays, AlertCircle, Activity, Heart, Bookmark } from 'lucide-react';

interface MealPlannerViewProps {
  pantryItems: PantryItem[];
  userProfile: UserProfile | null;
  currentPlan: DayPlan[];
  onUpdatePlan: (plan: DayPlan[]) => void;
  savedRecipes: Recipe[];
  onToggleSave: (recipe: Recipe) => void;
}

const MealPlannerView: React.FC<MealPlannerViewProps> = ({ pantryItems, userProfile, currentPlan, onUpdatePlan, savedRecipes, onToggleSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'suggest' | 'saved'>('plan');
  const [suggestions, setSuggestions] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleGeneratePlan = async () => {
    if (pantryItems.length === 0) {
        alert("Add items to your pantry first!");
        return;
    }
    setIsLoading(true);
    try {
      const plan = await generateWeeklyPlan(pantryItems, userProfile);
      if (plan && plan.length > 0) {
          onUpdatePlan(plan);
      } else {
          alert("Failed to generate plan. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
     if (pantryItems.length === 0) {
        alert("Add items to your pantry first!");
        return;
    }
    // Don't regenerate if we already have suggestions, unless user forces it
    if (suggestions.length > 0) return; 

    setIsLoading(true);
    try {
      const recipes = await suggestRecipes(pantryItems);
      setSuggestions(recipes);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger suggestion fetch when tab changes if empty
  useEffect(() => {
      if (activeTab === 'suggest' && suggestions.length === 0) {
          handleGetSuggestions();
      }
  }, [activeTab]);

  const openRecipeModal = async (recipe: Recipe) => {
      setSelectedRecipe(recipe);
      if((!recipe.steps || recipe.steps.length === 0)) {
          setLoadingDetails(true);
          const pantryNames = pantryItems.map(p => p.name);
          const details = await getRecipeDetails(recipe.title, recipe.description, pantryNames);
          setSelectedRecipe(prev => prev ? ({ ...prev, ...details }) : null);
          setLoadingDetails(false);
      }
  };

  const isRecipeSaved = (recipe: Recipe) => {
      return savedRecipes.some(r => r.id === recipe.id || r.title === recipe.title);
  };

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
                    <div className="text-white w-full pr-12">
                        <h3 className="text-2xl font-bold leading-tight">{recipe.title}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm opacity-90">
                             {recipe.prepTimeMinutes && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {recipe.prepTimeMinutes} min</span>}
                             {recipe.macros && <span className="flex items-center gap-1"><Flame className="w-4 h-4" /> {recipe.macros.calories} kcal</span>}
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => onToggleSave(recipe)}
                    className="absolute bottom-4 right-4 p-3 rounded-full bg-white shadow-lg transition hover:scale-110 active:scale-95"
                >
                    <Heart className={`w-6 h-6 ${isRecipeSaved(recipe) ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                </button>
            </div>
            
            <div className="p-6 overflow-y-auto relative">
                {loadingDetails && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-2" />
                        <p className="text-gray-500">Chef Gemini is writing the recipe...</p>
                    </div>
                )}

                <p className="text-gray-600 mb-6 italic">{recipe.description}</p>
                
                {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
                        <h4 className="text-orange-800 font-bold flex items-center gap-2 text-sm uppercase tracking-wide mb-2">
                            <AlertCircle className="w-4 h-4" /> Missing Ingredients
                        </h4>
                        <ul className="list-disc list-inside text-orange-700 text-sm">
                            {recipe.missingIngredients.map((missing, i) => (
                                <li key={i}>{missing}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {recipe.macros && (
                    <div className="grid grid-cols-4 gap-2 mb-6">
                        <div className="bg-gray-50 p-2 rounded text-center">
                            <div className="text-xs text-gray-400 uppercase">Calories</div>
                            <div className="font-bold text-gray-800">{recipe.macros.calories}</div>
                        </div>
                        <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="text-xs text-blue-400 uppercase">Protein</div>
                            <div className="font-bold text-blue-800">{recipe.macros.protein}g</div>
                        </div>
                        <div className="bg-amber-50 p-2 rounded text-center">
                            <div className="text-xs text-amber-400 uppercase">Carbs</div>
                            <div className="font-bold text-amber-800">{recipe.macros.carbs}g</div>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded text-center">
                            <div className="text-xs text-yellow-400 uppercase">Fat</div>
                            <div className="font-bold text-yellow-800">{recipe.macros.fats}g</div>
                        </div>
                    </div>
                )}

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
                                <li className="text-gray-400 italic">Ingredients loading...</li>
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
                                <li className="text-gray-400 italic">Steps loading...</li>
                            )}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );

  const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
     <div 
        onClick={() => openRecipeModal(recipe)}
        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative"
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
             <button 
                onClick={(e) => { e.stopPropagation(); onToggleSave(recipe); }}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white backdrop-blur-md transition"
            >
                <Heart className={`w-5 h-5 ${isRecipeSaved(recipe) ? 'fill-rose-500 text-rose-500' : 'text-white hover:text-rose-500'}`} />
            </button>
        </div>
        <div className="p-5 flex-1 flex flex-col">
            <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">{recipe.description}</p>
            
            {recipe.macros && (
                <div className="grid grid-cols-3 gap-2 mb-4 border-t border-b border-gray-100 py-2">
                    <div className="text-center">
                        <div className="text-[10px] text-gray-400 uppercase">Protein</div>
                        <div className="text-xs font-bold text-gray-700">{recipe.macros.protein}g</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-gray-400 uppercase">Carbs</div>
                        <div className="text-xs font-bold text-gray-700">{recipe.macros.carbs}g</div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-gray-400 uppercase">Fat</div>
                        <div className="text-xs font-bold text-gray-700">{recipe.macros.fats}g</div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mt-auto">
                <div className="flex gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> {recipe.prepTimeMinutes}m</span>
                </div>
                <span className="text-emerald-600 text-sm font-medium flex items-center group-hover:gap-2 gap-1 transition-all">
                    Cook this <ChevronRight className="w-4 h-4" />
                </span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Meal Planner</h2>
            <p className="text-sm text-gray-500">
                {userProfile ? `Tailored to your ${userProfile.goal} goal` : 'Reduce waste with AI-driven plans'}
            </p>
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
            <button 
                onClick={() => setActiveTab('saved')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${activeTab === 'saved' ? 'bg-white text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Saved ({savedRecipes.length})
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
                Let AI analyze your pantry and create a complete 3-day meal plan (Breakfast, Lunch, Dinner) that fits your 
                {userProfile ? ` ${userProfile.targets.calories} kcal daily target.` : ' pantry inventory.'}
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
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full min-h-[500px]">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-bold text-gray-700 flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-emerald-500" />
                        {day.day}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100 flex-1 flex flex-col">
                      {['breakfast', 'lunch', 'dinner'].map((type) => {
                         // Safe key access (handles potential capitalization issues from AI)
                         const mealKey = Object.keys(day.meals).find(k => k.toLowerCase() === type) as keyof typeof day.meals | undefined;
                         const meal = mealKey ? day.meals[mealKey] : undefined;

                         if (!meal) {
                             return (
                                 <div key={type} className="p-4 text-center text-xs text-gray-400 italic bg-gray-50/50 flex-1 flex items-center justify-center">
                                     No {type} planned
                                 </div>
                             );
                         }
                         const missingCount = meal.missingIngredientsCount || 0;
                         const isMissingIng = missingCount > 0;
                         return (
                            <div 
                                key={type} 
                                onClick={() => openRecipeModal({ ...meal, id: `${idx}-${type}` } as Recipe)}
                                className="p-4 hover:bg-emerald-50/50 transition group cursor-pointer relative flex-1"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">{type}</div>
                                    <div className="flex items-center gap-2">
                                        {isMissingIng && (
                                            <div title={`${missingCount} Missing Ingredients`}>
                                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                            </div>
                                        )}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onToggleSave({ ...meal, id: `${idx}-${type}` }); }}
                                            className="p-1 rounded-full hover:bg-gray-100 transition"
                                        >
                                            <Heart className={`w-3.5 h-3.5 ${isRecipeSaved({ ...meal, id: `${idx}-${type}` } as Recipe) ? 'fill-rose-500 text-rose-500' : 'text-gray-300'}`} />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm group-hover:text-emerald-700 transition mb-1">{meal.title}</h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{meal.description}</p>
                                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meal.prepTimeMinutes}m</span>
                                    {meal.macros && <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {meal.macros.calories} kcal</span>}
                                </div>
                                {isMissingIng && (
                                    <div className="mt-2 text-[10px] text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                                        {missingCount} missing items
                                    </div>
                                )}
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
                   <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
            </div>
        </div>
      )}

      {activeTab === 'saved' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {savedRecipes.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                     <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                     <h3 className="text-lg font-medium text-gray-900 mb-2">No saved recipes</h3>
                     <p className="text-gray-500">Tap the heart icon on recipes to save them here.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedRecipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                 </div>
              )}
          </div>
      )}

      {selectedRecipe && <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />}
    </div>
  );
};

export default MealPlannerView;
