import React from 'react';
import { PantryItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { Clock, Leaf, TrendingUp, ShoppingBag, ArrowRight } from 'lucide-react';
import { ESSENTIAL_GROCERIES } from '../constants';

interface DashboardViewProps {
  pantryItems: PantryItem[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ pantryItems }) => {
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
  
  // Estimate savings based on active items ($4.50 avg value per item)
  const savedAmount = activeCount * 4.50;

  // Chart Data 1: Waste Analysis (Active vs Expired)
  const wasteData = [
    { name: 'Consumed', value: activeCount || 1, color: '#10b981' }, // Fallback to 1 so chart isn't empty
    { name: 'Wasted', value: expiredCount, color: '#ef4444' }
  ];

  // Chart Data 2: Mock Spending Data (Visual placeholder as requested)
  const spendingData = [
    { name: 'Week 1', amount: 145 },
    { name: 'Week 2', amount: 120 },
    { name: 'Week 3', amount: 160 },
    { name: 'This Week', amount: 90 }
  ];

  // Recommendations for low stock (Get random 5 from essentials)
  const showRecommendations = pantryItems.length < 5;
  const essentialRecommendations = ESSENTIAL_GROCERIES.slice(0, 5);

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
        
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-orange-50 rounded-full shrink-0">
                    <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                    <div className="text-sm text-gray-500 font-medium">Expiring</div>
                    <div className="text-3xl font-bold text-gray-800 mt-1">{expiringCount}</div>
                    <div className="text-xs text-gray-400 mt-1">Items need attention</div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-emerald-50 rounded-full shrink-0">
                    <Leaf className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <div className="text-sm text-gray-500 font-medium">Saved</div>
                    <div className="text-3xl font-bold text-gray-800 mt-1">${savedAmount.toFixed(0)}</div>
                    <div className="text-xs text-gray-400 mt-1">By using pantry first</div>
                </div>
            </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Food Waste Analysis */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-[300px]">
                <h3 className="text-gray-700 font-semibold mb-6">Food Waste Analysis</h3>
                <div className="flex-1 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={wasteData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {wasteData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-sm text-gray-600">Consumed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm text-gray-600">Wasted</span>
                    </div>
                </div>
            </div>

            {/* Grocery Spending */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-[300px]">
                <h3 className="text-gray-700 font-semibold mb-6">Grocery Spending</h3>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={spendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 11, fill: '#9ca3af'}} 
                                dy={10}
                            />
                            <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Recommendations Section (If Pantry is Low) */}
        {showRecommendations && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <ShoppingBag className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Pantry Running Low?</h3>
                </div>
                <p className="mb-4 opacity-90">Here are some versatile essentials to restock your kitchen:</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {essentialRecommendations.map((item) => (
                        <div key={item.name} className="bg-white/20 backdrop-blur-sm p-3 rounded-lg flex flex-col items-center text-center">
                            <span className="text-xs uppercase tracking-wider opacity-75 mb-1">{item.category}</span>
                            <span className="font-semibold">{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Optimization Tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
                <h4 className="text-blue-900 font-semibold text-sm">Optimization Tip</h4>
                <p className="text-blue-700 text-sm mt-1">
                    {expiringCount > 0 
                        ? `You have items expiring soon. Prioritize using them in tonight's dinner to reduce waste!`
                        : "Your pantry usage is efficient! Try buying in bulk for non-perishables to save more next week."
                    }
                </p>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;