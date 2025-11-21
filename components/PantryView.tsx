
import React, { useState, useRef } from 'react';
import { PantryItem, Unit } from '../types';
import { CATEGORIES, SAFE_CONSUME_BUFFER } from '../constants';
import { Trash2, Plus, AlertTriangle, ScanLine, Loader2, Camera, Calendar, CheckCircle2, Info, FileText, Activity, X, ChevronRight, Scale, Tag, Box } from 'lucide-react';
import { fileToGenerativePart, identifyPantryItems } from '../services/geminiService';

interface PantryViewProps {
  items: PantryItem[];
  onAddItem: (item: PantryItem) => void;
  onAddItems: (items: PantryItem[]) => void;
  onRemoveItem: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<PantryItem>) => void;
}

const PantryView: React.FC<PantryViewProps> = ({ items, onAddItem, onAddItems, onRemoveItem, onUpdateItem }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsScanning(true);
      try {
        const file = e.target.files[0];
        const base64 = await fileToGenerativePart(file);
        const newItems = await identifyPantryItems(base64, file.type);
        onAddItems(newItems);
      } catch (error) {
        console.error("Failed to scan", error);
        alert("Could not analyze image. Please try again.");
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const getExpiryStatus = (dateStr?: string, category: string = 'Other') => {
    if (!dateStr) return { days: null, status: 'unknown', safeUntil: null };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const bufferDays = SAFE_CONSUME_BUFFER[category] || 7;
    const safeDate = new Date(expiry);
    safeDate.setDate(safeDate.getDate() + bufferDays);
    const safeDiffTime = safeDate.getTime() - today.getTime();
    const safeDaysLeft = Math.ceil(safeDiffTime / (1000 * 60 * 60 * 24));

    let status = 'good';
    if (days < 0) status = 'expired';
    else if (days <= 3) status = 'expiring';

    return { days, status, safeUntil: safeDate.toLocaleDateString(), safeDaysLeft };
  };

  const itemsExpiringSoon = items.filter(i => {
      const { status } = getExpiryStatus(i.expiryDate, i.category);
      return status === 'expiring' || status === 'expired';
  }).length;

  // Redesigned Add Item Modal
  const AddItemModal = () => {
      const [newItem, setNewItem] = useState<Partial<PantryItem>>({
          name: '', quantity: 1, unit: 'pcs', category: 'Other',
          macros: { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 }
      });

      const updateMacro = (field: keyof typeof newItem.macros, value: string) => {
          setNewItem({
              ...newItem,
              macros: {
                  ...(newItem.macros || { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 }),
                  [field]: Number(value) || 0
              }
          });
      };

      const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if(!newItem.name) return;
          onAddItem({
              ...newItem as PantryItem,
              id: `manual-${Date.now()}`,
              expiryDate: '',
          });
          setShowAddModal(false);
      };

      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-800">Add Pantry Item</h3>
                      <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Left Column: Details */}
                          <div className="space-y-6">
                              <div className="flex items-center gap-2 text-emerald-700 font-bold uppercase text-xs tracking-wider mb-2">
                                  <Tag className="w-4 h-4" /> Item Details
                              </div>
                              
                              <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                                  <input 
                                    type="text" 
                                    required 
                                    placeholder="e.g., Greek Yogurt"
                                    value={newItem.name} 
                                    onChange={e => setNewItem({...newItem, name: e.target.value})} 
                                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 focus:bg-white transition" 
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                                      <div className="flex items-center">
                                          <input 
                                            type="number" 
                                            required 
                                            min="0"
                                            value={newItem.quantity} 
                                            onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} 
                                            className="w-20 border-l border-t border-b border-gray-200 rounded-l-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-center font-medium" 
                                          />
                                          <input 
                                            type="text" 
                                            placeholder="Unit" 
                                            value={newItem.unit} 
                                            onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                                            className="flex-1 border border-gray-200 rounded-r-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50" 
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                      <div className="relative">
                                          <select 
                                            value={newItem.category} 
                                            onChange={e => setNewItem({...newItem, category: e.target.value})} 
                                            className="w-full border border-gray-200 rounded-xl p-3 appearance-none bg-gray-50 focus:bg-white transition"
                                          >
                                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                          </select>
                                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                                              <Box className="w-4 h-4" />
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Right Column: Nutrition */}
                          <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                              <div className="flex items-center gap-2 text-blue-700 font-bold uppercase text-xs tracking-wider mb-4">
                                  <Activity className="w-4 h-4" /> Nutrition Facts (Per Unit)
                              </div>
                              
                              <div className="space-y-4">
                                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                      <label className="text-sm font-bold text-gray-800">Calories</label>
                                      <div className="flex items-center gap-1">
                                          <input 
                                            type="number" 
                                            min="0"
                                            value={newItem.macros?.calories} 
                                            onChange={e => updateMacro('calories', e.target.value)} 
                                            className="w-20 text-right p-1 border-b border-gray-300 focus:border-blue-500 outline-none font-mono text-lg font-bold text-gray-900"
                                          />
                                          <span className="text-xs text-gray-400 font-bold">kcal</span>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Protein</label>
                                          <div className="flex items-baseline gap-1">
                                              <input type="number" min="0" value={newItem.macros?.protein} onChange={e => updateMacro('protein', e.target.value)} className="w-full text-lg font-bold outline-none border-none p-0" />
                                              <span className="text-xs text-gray-400">g</span>
                                          </div>
                                      </div>
                                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Carbs</label>
                                          <div className="flex items-baseline gap-1">
                                              <input type="number" min="0" value={newItem.macros?.carbs} onChange={e => updateMacro('carbs', e.target.value)} className="w-full text-lg font-bold outline-none border-none p-0" />
                                              <span className="text-xs text-gray-400">g</span>
                                          </div>
                                      </div>
                                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fat</label>
                                          <div className="flex items-baseline gap-1">
                                              <input type="number" min="0" value={newItem.macros?.fats} onChange={e => updateMacro('fats', e.target.value)} className="w-full text-lg font-bold outline-none border-none p-0" />
                                              <span className="text-xs text-gray-400">g</span>
                                          </div>
                                      </div>
                                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sugar</label>
                                          <div className="flex items-baseline gap-1">
                                              <input type="number" min="0" value={newItem.macros?.sugar} onChange={e => updateMacro('sugar', e.target.value)} className="w-full text-lg font-bold outline-none border-none p-0" />
                                              <span className="text-xs text-gray-400">g</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3 justify-end">
                          <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition">
                              Cancel
                          </button>
                          <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-200 transition transform active:scale-95">
                              Save Item
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      );
  };

  // Improved Nutrition Modal
  const NutritionModal = ({ item, onClose }: { item: PantryItem, onClose: () => void }) => {
      const macros = item.macros || { calories: 0, protein: 0, carbs: 0, fats: 0, sugar: 0 };
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
                    <div>
                       <h3 className="font-bold text-lg text-gray-800">Nutrition Facts</h3>
                       <p className="text-xs text-gray-500">Estimated per {item.unit}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition">
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-2xl font-black text-gray-900 leading-none">{item.name}</h4>
                            <span className="text-sm text-gray-500 font-medium mt-1 inline-block bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span>
                        </div>
                        <div className="text-right">
                             <span className="block text-2xl font-black text-emerald-600">{item.quantity}</span>
                             <span className="text-xs text-gray-400 uppercase font-bold">{item.unit}</span>
                        </div>
                    </div>

                    <div className="border-t-4 border-gray-900 pt-4 mb-4">
                        <div className="flex justify-between items-baseline mb-2 pb-2 border-b border-gray-100">
                            <span className="font-black text-2xl">Calories</span>
                            <span className="font-black text-2xl text-gray-900">{macros.calories}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-4">
                             <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                 <span className="font-bold text-gray-700 text-sm">Protein</span>
                                 <span className="font-mono text-gray-900 font-bold">{macros.protein}g</span>
                             </div>
                             <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                 <span className="font-bold text-gray-700 text-sm">Carbs</span>
                                 <span className="font-mono text-gray-900 font-bold">{macros.carbs}g</span>
                             </div>
                             <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                 <span className="font-bold text-gray-700 text-sm">Fat</span>
                                 <span className="font-mono text-gray-900 font-bold">{macros.fats}g</span>
                             </div>
                             <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                 <span className="font-bold text-gray-700 text-sm">Sugar</span>
                                 <span className="font-mono text-gray-900 font-bold">{macros.sugar}g</span>
                             </div>
                        </div>
                    </div>
                    
                    <p className="text-[10px] text-gray-400 leading-tight mt-6 text-center">
                        * AI estimates based on generic nutritional data. Verify with package labels for accuracy.
                    </p>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">My Pantry</h2>
            <p className="text-sm text-gray-500">{items.length} items stored</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-200"
          >
            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            <span className="inline">Scan</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-gray-50 shadow-sm hover:border-emerald-200 hover:text-emerald-600 transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {itemsExpiringSoon > 0 && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-orange-900 text-sm">Attention Needed</h3>
            <p className="text-sm text-orange-800/80 mt-1">
              {itemsExpiringSoon} items are expired or expiring soon. Check "Safe Until" dates.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const { days, status, safeUntil, safeDaysLeft } = getExpiryStatus(item.expiryDate, item.category);
          
          return (
            <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col gap-3 transition-all hover:shadow-md cursor-pointer group relative overflow-hidden ${status === 'expired' ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:border-emerald-200'}`}
            >
               <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight className="w-4 h-4 text-gray-400" />
               </div>
              
              <div className="flex justify-between items-start pr-6">
                <div>
                    <div className="font-bold text-lg text-gray-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">{item.name}</div>
                    <div className="text-sm text-gray-500 font-medium">{item.quantity} {item.unit} • {item.category}</div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                 <button 
                    onClick={() => onRemoveItem(item.id)}
                    className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex items-center justify-center gap-1"
                 >
                    <CheckCircle2 className="w-3 h-3" /> Consumed
                 </button>
                 <button 
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
              </div>

              {/* Macros Badge */}
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50/80 p-2 rounded-lg border border-gray-100">
                  <Activity className="w-3 h-3 text-emerald-500" />
                  <span className="font-bold text-gray-700">{item.macros?.calories || 0} kcal</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-[10px] text-gray-400">Tap for Details</span>
              </div>
                
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mt-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Expiration
                      </label>
                      {days !== null && (
                          <span className={`text-xs font-bold ${
                              status === 'expired' ? 'text-red-600' : 
                              status === 'expiring' ? 'text-orange-500' : 'text-emerald-600'
                          }`}>
                              {status === 'expired' ? `${Math.abs(days)} days ago` : `${days} days left`}
                          </span>
                      )}
                  </div>
                  <input 
                        type="date" 
                        value={item.expiryDate || ''}
                        onChange={(e) => onUpdateItem(item.id, { expiryDate: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none font-medium shadow-sm"
                    />
              </div>

              {status === 'expired' && safeDaysLeft !== null && (
                  <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                          <span className="font-bold text-blue-900">Still good?</span>
                          <div className="leading-tight mt-0.5">
                              Safe until <span className="font-bold">{safeUntil}</span> ({safeDaysLeft > 0 ? `${safeDaysLeft} days left` : 'discard now'}).
                          </div>
                      </div>
                  </div>
              )}
            </div>
          );
        })}
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
          <ScanLine className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <h3 className="text-lg font-bold text-gray-600">Your pantry is empty</h3>
          <p className="mb-6 text-sm max-w-xs mx-auto">Scan a photo of your groceries OR a receipt to get started instantly!</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-emerald-600 font-bold hover:underline"
          >
              Open Camera
          </button>
        </div>
      )}

      {selectedItem && <NutritionModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      {showAddModal && <AddItemModal />}
    </div>
  );
};

export default PantryView;
