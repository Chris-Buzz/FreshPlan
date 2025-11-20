import React from 'react';
import { PantryItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Leaf, TrendingDown, AlertCircle } from 'lucide-react';

interface DashboardViewProps {
  pantryItems: PantryItem[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ pantryItems }) => {
  const expiringSoonCount = pantryItems.filter(i => {
      if(!i.expiryDate) return false;
      const diff = new Date(i.expiryDate).getTime() - new Date().getTime();
      return diff < 3 * 24 * 60 * 60 * 1000;
  }).length;

  // Mock Data for charts
  const wasteData = [
    { name: 'Consumed', value: 85, color: '#10b981' },
    { name: 'Wasted', value: 15, color: '#ef4444' },
  ];

  const spendingData = [
    { name: 'Week 1', amount: 120 },
    { name: 'Week 2', amount: 95 },
    { name: 'Week 3', amount: 110 },
    { name: 'This Week', amount: 45 }, // Low because using pantry
  ];

  return (
    <div className="space-y-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Expiring
                </div>
                <div className="text-3xl font-bold text-gray-800">{expiringSoonCount}</div>
                <div className="text-xs text-gray-400 mt-1">Items need attention</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    Saved
                </div>
                <div className="text-3xl font-bold text-gray-800">$42</div>
                <div className="text-xs text-gray-400 mt-1">By using pantry first</div>
            </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4">Food Waste Analysis</h3>
                <div className="h-64 w-full">
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
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 text-sm">
                    {wasteData.map(d => (
                        <div key={d.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div>
                            <span className="text-gray-600">{d.name}</span>
                        </div>
                    ))}
                </div>
            </div>

             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-4">Grocery Spending</h3>
                <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={spendingData}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                            <YAxis hide />
                            <Tooltip cursor={{fill: '#f3f4f6'}} />
                            <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
            <TrendingDown className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
                <h4 className="font-semibold text-blue-900">Optimization Tip</h4>
                <p className="text-sm text-blue-700 mt-1">
                    You have a lot of pasta. Consider "Pasta Primavera" for dinner to use up the expiring spinach!
                </p>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
