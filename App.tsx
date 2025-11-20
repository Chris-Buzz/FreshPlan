import React, { useState, useEffect } from 'react';
import { LayoutGrid, Utensils, ShoppingCart, Package, Settings, Menu } from 'lucide-react';
import { PantryItem, DayPlan } from './types';
import { MOCK_PANTRY } from './constants';
import PantryView from './components/PantryView';
import MealPlannerView from './components/MealPlannerView';
import GroceryListView from './components/GroceryListView';
import DashboardView from './components/DashboardView';

type View = 'dashboard' | 'pantry' | 'planner' | 'grocery';

const App = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('freshplan_pantry', JSON.stringify(pantryItems));
  }, [pantryItems]);

  useEffect(() => {
    localStorage.setItem('freshplan_plan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  // Handlers
  const handleAddItem = (item: PantryItem) => setPantryItems(prev => [...prev, item]);
  const handleAddItems = (items: PantryItem[]) => setPantryItems(prev => [...prev, ...items]);
  const handleRemoveItem = (id: string) => setPantryItems(prev => prev.filter(i => i.id !== id));
  
  const handleUpdateItem = (id: string, updates: Partial<PantryItem>) => {
    setPantryItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleUpdatePlan = (plan: DayPlan[]) => setMealPlan(plan);

  const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
    <button
      onClick={() => {
        setActiveView(view);
        setIsSidebarOpen(false);
      }}
      className={`flex flex-col md:flex-row items-center md:justify-start gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl w-full transition-all
        ${activeView === view 
          ? 'text-emerald-600 bg-emerald-50 font-medium' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
        }`}
    >
      <Icon className={`w-6 h-6 md:w-5 md:h-5 ${activeView === view ? 'stroke-[2.5px]' : ''}`} />
      <span className="text-[10px] md:text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2 font-bold text-emerald-800 text-xl">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                <Utensils className="w-5 h-5" />
            </div>
            FreshPlan
        </div>
        {/* Settings/Profile placeholder */}
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 p-6">
         <div className="flex items-center gap-3 font-bold text-emerald-800 text-2xl mb-10">
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
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                 <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                 </div>
                 <div>
                     <div className="text-sm font-medium text-gray-800">John Doe</div>
                     <div className="text-xs text-gray-400">Free Plan</div>
                 </div>
                 <Settings className="w-4 h-4 text-gray-400 ml-auto" />
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeView === 'dashboard' && <DashboardView pantryItems={pantryItems} />}
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
            currentPlan={mealPlan} 
            onUpdatePlan={handleUpdatePlan} 
          />
        )}
        {activeView === 'grocery' && (
          <GroceryListView 
            pantryItems={pantryItems} 
            currentPlan={mealPlan} 
          />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 z-50 pb-safe">
         <NavItem view="dashboard" icon={LayoutGrid} label="Home" />
         <NavItem view="pantry" icon={Package} label="Pantry" />
         <NavItem view="planner" icon={Utensils} label="Plan" />
         <NavItem view="grocery" icon={ShoppingCart} label="Shop" />
      </nav>
    </div>
  );
};

export default App;