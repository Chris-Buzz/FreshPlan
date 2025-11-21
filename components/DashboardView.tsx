
import React, { useState, useRef } from 'react';
import { PantryItem, Macros, UserProfile, DayPlan } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, YAxis, Legend } from 'recharts';
import { Clock, Leaf, Target, MapPin, Loader2, ExternalLink, Activity, Camera } from 'lucide-react';
import { findNearbyRestaurants, fileToGenerativePart, analyzeMeal } from '../services/geminiService';

interface DashboardViewProps {
  pantryItems: PantryItem[];
  userProfile: UserProfile | null;
  currentPlan: DayPlan[];
  onUpdateConsumed: (macros: Macros) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ pantryItems, userProfile, currentPlan, onUpdateConsumed }) => {
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const logInputRef = useRef<HTMLInputElement>(null);

  // Real Data Calculations
  const expiringCount = pantryItems.filter(i => {
      if(!i.expiryDate) return false;
      const diff = new Date(i.expiryDate).getTime() - new Date().getTime();
      return diff < 3 * 24 * 60 * 60 * 1000 && diff > 0;
  }).length;

  const expiredCount = pantryItems.filter(i => {
      if(!i.expiryDate) return false;
      return new Date(i.expiryDate).getTime() < new Date().getTime();
  }).length;

  const activeCount = Math.max(0, pantryItems.length - expiredCount);
  const savedAmount = activeCount * 4.50;

  // Chart Data 1: Waste Analysis
  const wasteData = [
    { name: 'Consumed', value: activeCount || 1, color: '#10b981' },
    { name: 'Wasted', value: expiredCount, color: '#ef4444' }
  ];

  // Chart Data 2: Macro Distribution
  let planMacros = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  if (currentPlan.length > 0) {
      const totalPlanMacros = currentPlan.reduce((acc, day) => {
          const meals = [day.meals.breakfast, day.meals.lunch, day.meals.dinner];
          meals.forEach(meal => {
              if (meal && meal.macros) {
                  acc.calories += meal.macros.calories;
                  acc.protein += meal.macros.protein;
                  acc.carbs += meal.macros.carbs;
                  acc.fats += meal.macros.fats;
              }
          });
          return acc;
      }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
      
      planMacros = {
          calories: Math.round(totalPlanMacros.calories / currentPlan.length),
          protein: Math.round(totalPlanMacros.protein / currentPlan.length),
          carbs: Math.round(totalPlanMacros.carbs / currentPlan.length),
          fats: Math.round(totalPlanMacros.fats / currentPlan.length),
      };
  }

  const macroData = userProfile ? [
      { name: 'Protein', consumed: userProfile.consumedMacros.protein, goal: userProfile.targets.protein, plan: planMacros.protein },
      { name: 'Carbs', consumed: userProfile.consumedMacros.carbs, goal: userProfile.targets.carbs, plan: planMacros.carbs },
      { name: 'Fats', consumed: userProfile.consumedMacros.fats, goal: userProfile.targets.fats, plan: planMacros.fats },
  ] : [];

  const handleFindNearby = async () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    setLoadingNearby(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const chunks = await findNearbyRestaurants(latitude, longitude);
        setNearbyPlaces(chunks);
        setLoadingNearby(false);
    }, (err) => {
        console.error(err);
        alert("Unable to retrieve location.");
        setLoadingNearby(false);
    });
  };

  const handleLogMeal = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsLogging(true);
          try {
              const file = e.target.files[0];
              const base64 = await fileToGenerativePart(file);
              const macros = await analyzeMeal(base64, file.type);
              if (macros) {
                  onUpdateConsumed(macros);
                  alert(`Logged: ${macros.calories} kcal meal!`);
              } else {
                  alert("Could not analyze food. Try again.");
              }
          } catch(err) {
              console.error(err);
          } finally {
              setIsLogging(false);
              if(logInputRef.current) logInputRef.current.value = '';
          }
      }
  }

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h2>
                <p className="text-gray-500 mt-1">Welcome back! Here is your daily nutrition and pantry health.</p>
            </div>
            
            <div className="flex gap-3">
                 <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    ref={logInputRef}
                    onChange={handleLogMeal}
                />
                <button 
                    onClick={() => logInputRef.current?.click()}
                    disabled={isLogging}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition shadow-lg active:scale-95"
                >
                    {isLogging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    Log Meal
                </button>
            </div>
        </div>
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Expiring Soon */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition duration-300 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-orange-50 rounded-xl">
                        <Clock className="w-6 h-6 text-orange-500" />
                    </div>
                    {expiringCount > 0 && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">Action Needed</span>}
                </div>
                <div className="mt-auto">
                    <div className="text-3xl font-black text-gray-900">{expiringCount}</div>
                    <div className="text-sm text-gray-500 font-medium mt-1">Items Expiring Soon</div>
                </div>
            </div>

            {/* Saved Amount */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition duration-300 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                        <Leaf className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>
                <div className="mt-auto">
                    <div className="text-3xl font-black text-gray-900">${savedAmount.toFixed(0)}</div>
                    <div className="text-sm text-gray-500 font-medium mt-1">Estimated Pantry Value</div>
                </div>
            </div>

            {/* Calories Progress */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition duration-300 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    {userProfile && (
                        <div className="text-right bg-gray-50 px-2 py-1 rounded-lg">
                             <span className="text-[10px] text-gray-400 uppercase font-bold block">Goal</span>
                             <div className="text-sm font-bold text-gray-800">{userProfile.targets.calories}</div>
                        </div>
                    )}
                </div>
                <div className="mt-auto">
                    <div className="text-3xl font-black text-gray-900">
                        {userProfile ? userProfile.consumedMacros.calories : 0} 
                        <span className="text-lg text-gray-400 font-normal ml-1">kcal</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-4 overflow-hidden">
                        <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${userProfile ? Math.min(100, (userProfile.consumedMacros.calories / userProfile.targets.calories) * 100) : 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Macro Tracker (Larger) */}
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Daily Macro Goals</h3>
                        <p className="text-sm text-gray-500">Track your protein, carbs, and fats</p>
                    </div>
                    <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                            <span className="text-gray-600 font-medium">Consumed</span>
                        </div>
                         <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                            <span className="text-gray-600 font-medium">Goal</span>
                        </div>
                         <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-gray-600 font-medium">Planned</span>
                        </div>
                    </div>
                </div>
                
                <div className="h-[300px] w-full">
                    {userProfile ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                layout="vertical" 
                                data={macroData} 
                                margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                                barGap={8}
                            >
                                 <XAxis type="number" hide />
                                 <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={60} 
                                    tick={{fontSize: 13, fill: '#374151', fontWeight: 600}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                 <Tooltip 
                                    cursor={{fill: '#f9fafb'}} 
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}} 
                                 />
                                 <Bar dataKey="consumed" fill="#2563eb" barSize={12} radius={[0, 6, 6, 0]} animationDuration={1000} />
                                 <Bar dataKey="goal" fill="#e5e7eb" barSize={12} radius={[0, 6, 6, 0]} />
                                 <Bar dataKey="plan" fill="#10b981" barSize={12} radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                            <Activity className="w-12 h-12 mb-3 text-gray-300" />
                            <p className="text-sm font-medium text-gray-500">Set up your profile to track macros</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Food Waste Chart (Smaller) */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Pantry Health</h3>
                <p className="text-xs text-gray-400 mb-4">Utilization based on expiration dates</p>
                <div className="flex-1 relative min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={wasteData}
                                innerRadius={65}
                                outerRadius={85}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {wasteData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-black text-gray-800">{Math.round((activeCount / (pantryItems.length || 1)) * 100)}%</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">Fresh</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Nearby Food Finder (Map Integration) */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Background Decorative Pattern */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="max-w-xl">
                    <h3 className="text-3xl font-bold flex items-center gap-3 mb-3">
                        <MapPin className="w-8 h-8 text-emerald-400" /> 
                        Need groceries or a quick meal?
                    </h3>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        Locate highly-rated healthy restaurants or grocery stores near you using Google Maps integration.
                    </p>
                </div>
                <button 
                    onClick={handleFindNearby}
                    disabled={loadingNearby}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                    {loadingNearby ? <Loader2 className="animate-spin w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                    Find Near Me
                </button>
            </div>
            
            {/* Map Results */}
            {nearbyPlaces.length > 0 && (
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4">
                    {nearbyPlaces.map((chunk, i) => {
                        const mapData = chunk.maps;
                        if (!mapData) return null;
                        return (
                            <div key={i} className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-white/20 transition group cursor-pointer">
                                <h4 className="font-bold text-xl text-white group-hover:text-emerald-300 transition-colors">{mapData.title}</h4>
                                {mapData.placeAnswerSources?.reviewSnippets?.[0] && (
                                     <p className="text-sm text-gray-300 mt-3 line-clamp-2 italic leading-relaxed">"{mapData.placeAnswerSources.reviewSnippets[0].snippet}"</p>
                                )}
                                <a href={mapData.uri} target="_blank" rel="noreferrer" className="text-emerald-400 text-sm font-bold flex items-center gap-1 mt-5 hover:text-emerald-300 uppercase tracking-wider">
                                    View on Maps <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

export default DashboardView;
