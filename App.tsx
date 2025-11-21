
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Utensils, ShoppingCart, Package, Settings, Menu, Target, Ruler, Weight, Check, DollarSign } from 'lucide-react';
import { PantryItem, DayPlan, UserProfile, ActivityLevel, UserGoal, Macros, Recipe } from './types';
import { MOCK_PANTRY, DIET_TYPES } from './constants';
import PantryView from './components/PantryView';
import MealPlannerView from './components/MealPlannerView';
import GroceryListView from './components/GroceryListView';
import DashboardView from './components/DashboardView';

type View = 'dashboard' | 'pantry' | 'planner' | 'grocery';

const App = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initialize from LocalStorage or fallback to MOCK_PANTRY
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => {
    const saved = localStorage.getItem('freshplan_pantry');
    return saved ? JSON.parse(saved) : MOCK_PANTRY;
  });

  // Initialize Meal Plan from LocalStorage
  const [mealPlan, setMealPlan] = useState<DayPlan[]>(() => {
    const saved = localStorage.getItem('freshplan_plan');
    return saved ? JSON.parse(saved) : [];
  });

  // Initialize User Profile from LocalStorage
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
      const saved = localStorage.getItem('freshplan_profile');
      return saved ? JSON.parse(saved) : null;
  });

  // Saved Recipes State
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
      const saved = localStorage.getItem('freshplan_saved_recipes');
      return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('freshplan_pantry', JSON.stringify(pantryItems));
  }, [pantryItems]);

  useEffect(() => {
    localStorage.setItem('freshplan_plan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('freshplan_saved_recipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
      if (userProfile) {
        localStorage.setItem('freshplan_profile', JSON.stringify(userProfile));
      } else {
          setShowOnboarding(true);
      }
  }, [userProfile]);

  // Handlers
  const handleAddItem = (item: PantryItem) => setPantryItems(prev => [...prev, item]);
  const handleAddItems = (items: PantryItem[]) => setPantryItems(prev => [...prev, ...items]);
  const handleRemoveItem = (id: string) => setPantryItems(prev => prev.filter(i => i.id !== id));
  
  const handleUpdateItem = (id: string, updates: Partial<PantryItem>) => {
    setPantryItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleUpdatePlan = (plan: DayPlan[]) => setMealPlan(plan);

  const handleToggleSaveRecipe = (recipe: Recipe) => {
      setSavedRecipes(prev => {
          const isSaved = prev.some(r => r.id === recipe.id || r.title === recipe.title);
          if (isSaved) {
              return prev.filter(r => r.id !== recipe.id && r.title !== recipe.title);
          } else {
              return [...prev, { ...recipe, isSaved: true }];
          }
      });
  };

  const handleUpdateConsumed = (macros: Macros) => {
      if (!userProfile) return;
      const updated: UserProfile = {
          ...userProfile,
          consumedMacros: {
              calories: userProfile.consumedMacros.calories + macros.calories,
              protein: userProfile.consumedMacros.protein + macros.protein,
              carbs: userProfile.consumedMacros.carbs + macros.carbs,
              fats: userProfile.consumedMacros.fats + macros.fats,
              sugar: (userProfile.consumedMacros.sugar || 0) + (macros.sugar || 0),
          }
      };
      setUserProfile(updated);
  };

  const calculateTargets = (weightLbs: number, heightInches: number, age: number, gender: 'male'|'female', activity: ActivityLevel, goal: UserGoal) => {
      // Convert to Metric for Calculation
      const weightKg = weightLbs * 0.453592;
      const heightCm = heightInches * 2.54;

      // Mifflin-St Jeor Equation
      let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
      bmr += gender === 'male' ? 5 : -161;

      const activityMultipliers = {
          'sedentary': 1.2,
          'light': 1.375,
          'moderate': 1.55,
          'active': 1.725,
          'very_active': 1.9
      };

      let tdee = bmr * activityMultipliers[activity];

      // Adjust for Goal
      if (goal === 'lose') tdee -= 500;
      if (goal === 'gain') tdee += 500;

      const calories = Math.round(tdee);
      const protein = Math.round((calories * 0.30) / 4);
      const carbs = Math.round((calories * 0.35) / 4);
      const fats = Math.round((calories * 0.35) / 9);

      return { calories, protein, carbs, fats, sugar: 0 };
  };

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const weight = Number(formData.get('weight'));
      const height = Number(formData.get('height'));
      const age = Number(formData.get('age'));
      const gender = formData.get('gender') as 'male' | 'female';
      const activity = formData.get('activity') as ActivityLevel;
      const goal = formData.get('goal') as UserGoal;
      const dietType = formData.get('dietType') as string;
      const allergies = formData.get('allergies') as string;
      const weeklyBudget = Number(formData.get('weeklyBudget'));

      const targets = calculateTargets(weight, height, age, gender, activity, goal);

      setUserProfile({
          weight, height, age, gender, activityLevel: activity, goal, targets,
          dietaryType: dietType,
          allergies: allergies,
          weeklyBudget: weeklyBudget,
          consumedMacros: { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 }
      });
      setShowOnboarding(false);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => {
        setActiveView(view);
        setIsSidebarOpen(false);
      }}
      className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl w-full transition-all
        ${activeView === view 
          ? 'text-emerald-600 bg-emerald-50 font-medium shadow-sm border border-emerald-100' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 border border-transparent'
        }`}
    >
      <Icon className={`w-6 h-6 md:w-5 md:h-5 ${activeView === view ? 'stroke-[2.5px]' : ''}`} />
      <span className="text-[10px] md:text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Onboarding Modal */}
      {showOnboarding && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 bg-emerald-50 border-b border-emerald-100 flex items-start gap-4">
                       <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                          <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Personalize Your Plan</h2>
                        <p className="text-sm text-gray-500 mt-1">We'll tailor your meals and grocery list to your specific needs.</p>
                      </div>
                  </div>

                  <div className="p-8 overflow-y-auto no-scrollbar bg-white">
                    <form onSubmit={handleSaveProfile} className="space-y-8">
                        {/* Section 1: Body Stats */}
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Body Stats</h3>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Weight (lbs)</label>
                                    <div className="relative group">
                                        <Weight className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input type="number" name="weight" required placeholder="150" className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Height (Inches)</label>
                                    <div className="relative group">
                                        <Ruler className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                        <input type="number" name="height" required placeholder="70" className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Age</label>
                                    <input type="number" name="age" required placeholder="25" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Gender</label>
                                    <select name="gender" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-none">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Lifestyle & Diet */}
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Lifestyle & Diet</h3>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Activity Level</label>
                                    <select name="activity" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-none">
                                        <option value="sedentary">Sedentary (Office job)</option>
                                        <option value="light">Lightly Active</option>
                                        <option value="moderate">Moderately Active</option>
                                        <option value="active">Active</option>
                                        <option value="very_active">Very Active</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Diet Type</label>
                                    <select name="dietType" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-none">
                                        {DIET_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Allergies / Restrictions</label>
                                <input type="text" name="allergies" placeholder="e.g. Peanuts, Shellfish, None" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Weekly Grocery Budget ($)</label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input type="number" name="weeklyBudget" required placeholder="150" className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Goal */}
                        <div>
                            <label className="block text-sm font-black text-gray-900 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">Primary Goal</label>
                            <div className="grid grid-cols-3 gap-3">
                                <label className="cursor-pointer group relative">
                                    <input type="radio" name="goal" value="lose" className="peer sr-only" required />
                                    <div className="p-4 rounded-xl border-2 border-gray-100 text-center hover:border-emerald-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50/50 transition-all bg-white h-full flex flex-col justify-center">
                                        <div className="text-sm font-bold mb-1 text-gray-900 peer-checked:text-emerald-700">Lose Weight</div>
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-emerald-500/70 peer-checked:text-emerald-600">Deficit</div>
                                    </div>
                                </label>
                                <label className="cursor-pointer group relative">
                                    <input type="radio" name="goal" value="maintain" className="peer sr-only" defaultChecked />
                                    <div className="p-4 rounded-xl border-2 border-gray-100 text-center hover:border-emerald-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50/50 transition-all bg-white h-full flex flex-col justify-center">
                                        <div className="text-sm font-bold mb-1 text-gray-900 peer-checked:text-emerald-700">Maintain</div>
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-emerald-500/70 peer-checked:text-emerald-600">Balance</div>
                                    </div>
                                </label>
                                <label className="cursor-pointer group relative">
                                    <input type="radio" name="goal" value="gain" className="peer sr-only" />
                                    <div className="p-4 rounded-xl border-2 border-gray-100 text-center hover:border-emerald-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50/50 transition-all bg-white h-full flex flex-col justify-center">
                                        <div className="text-sm font-bold mb-1 text-gray-900 peer-checked:text-emerald-700">Gain Muscle</div>
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-emerald-500/70 peer-checked:text-emerald-600">Surplus</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition transform active:scale-[0.99] flex items-center justify-center gap-2">
                            Complete Profile <Check className="w-5 h-5" />
                        </button>
                    </form>
                  </div>
              </div>
          </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-gray-800 text-xl">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <Utensils className="w-5 h-5" />
            </div>
            FreshPlan
        </div>
        <button onClick={() => setShowOnboarding(true)} className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-md hover:scale-105 transition">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile ? userProfile.gender : 'Felix'}`} alt="User" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 h-screen sticky top-0 p-6 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] z-10">
         <div className="flex items-center gap-3 font-bold text-gray-800 text-2xl mb-10 px-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-emerald-200 shadow-lg">
                <Utensils className="w-6 h-6" />
            </div>
            FreshPlan
        </div>
        
        <nav className="space-y-2 flex-1">
            <NavItem view="dashboard" icon={LayoutGrid} label="Dashboard" />
            <NavItem view="pantry" icon={Package} label="My Pantry" />
            <NavItem view="planner" icon={Utensils} label="Meal Plans" />
            <NavItem view="grocery" icon={ShoppingCart} label="Grocery List" />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
            <div onClick={() => setShowOnboarding(true)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer group transition border border-transparent hover:border-gray-200">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition">
                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile ? userProfile.gender : 'Felix'}`} alt="User" />
                 </div>
                 <div className="flex-1 min-w-0">
                     <div className="text-sm font-bold text-gray-800 truncate">My Profile</div>
                     <div className="text-xs text-gray-400 group-hover:text-emerald-600 font-medium truncate">{userProfile ? `${userProfile.targets.calories} kcal • ${userProfile.goal}` : 'Setup needed'}</div>
                 </div>
                 <Settings className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition" />
            </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeView === 'dashboard' && (
            <DashboardView 
                pantryItems={pantryItems} 
                userProfile={userProfile} 
                currentPlan={mealPlan} 
                onUpdateConsumed={handleUpdateConsumed} 
            />
        )}
        {activeView === 'pantry' && (
          <PantryView 
            items={pantryItems} 
            onAddItem={handleAddItem}
            onAddItems={handleAddItems} 
            onRemoveItem={handleRemoveItem}
            onUpdateItem={handleUpdateItem}
          />
        )}
        {activeView === 'planner' && (
          <MealPlannerView 
            pantryItems={pantryItems} 
            userProfile={userProfile}
            currentPlan={mealPlan} 
            onUpdatePlan={handleUpdatePlan} 
            savedRecipes={savedRecipes}
            onToggleSave={handleToggleSaveRecipe}
          />
        )}
        {activeView === 'grocery' && (
          <GroceryListView 
            pantryItems={pantryItems} 
            currentPlan={mealPlan} 
            userProfile={userProfile}
          />
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
         <NavItem view="dashboard" icon={LayoutGrid} label="Home" />
         <NavItem view="pantry" icon={Package} label="Pantry" />
         <NavItem view="planner" icon={Utensils} label="Plan" />
         <NavItem view="grocery" icon={ShoppingCart} label="Shop" />
      </nav>
    </div>
  );
};

export default App;
