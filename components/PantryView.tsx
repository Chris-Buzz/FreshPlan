import React, { useState, useRef } from 'react';
import { PantryItem, Unit } from '../types';
import { CATEGORIES, SAFE_CONSUME_BUFFER } from '../constants';
import { Trash2, Plus, AlertTriangle, ScanLine, Loader2, Camera, Calendar, CheckCircle2, Info } from 'lucide-react';
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
        // Reset input
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

    // Calculate safety buffer
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

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">My Pantry</h2>
            <p className="text-sm text-gray-500">{items.length} items stored</p>
        </div>
        <div className="flex gap-2">
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
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 shadow-md"
          >
            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            <span className="hidden sm:inline">Scan Items</span>
          </button>
          <button className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 shadow-sm">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats/Alerts */}
      {itemsExpiringSoon > 0 && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-orange-900">Items Expiring</h3>
            <p className="text-sm text-orange-700 mt-1">
              {itemsExpiringSoon} items are expired or expiring soon. Check "Safe Until" dates before discarding.
            </p>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const { days, status, safeUntil, safeDaysLeft } = getExpiryStatus(item.expiryDate, item.category);
          
          return (
            <div key={item.id} className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3 transition hover:shadow-md ${status === 'expired' ? 'border-red-100 bg-red-50/30' : 'border-gray-200'}`}>
              
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                    <div className="font-semibold text-lg text-gray-800 line-clamp-1">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.quantity} {item.unit} • {item.category}</div>
                </div>
                 <div className="flex gap-1">
                     <button 
                        onClick={() => onRemoveItem(item.id)}
                        className="p-2 hover:bg-emerald-50 rounded-full transition text-gray-300 hover:text-emerald-600"
                        title="Mark as Consumed"
                     >
                        <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => onRemoveItem(item.id)}
                        className="p-2 hover:bg-red-50 rounded-full transition text-gray-200 hover:text-red-500"
                        title="Remove Item"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
                
              {/* Expiry Control */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> EXPIRATION
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
                        className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
              </div>

              {/* Safe Consumption Logic */}
              {status === 'expired' && safeDaysLeft !== null && (
                  <div className="flex items-start gap-2 text-xs text-gray-500 bg-white p-2 rounded border border-gray-200">
                      <Info className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                          <span className="font-bold text-gray-700">Safe Consumption Tip:</span>
                          <br />
                          Usually safe until <span className="font-bold text-gray-800">{safeUntil}</span> ({safeDaysLeft > 0 ? `${safeDaysLeft} days left` : 'past safe date'}).
                      </div>
                  </div>
              )}
            </div>
          );
        })}
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <ScanLine className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-semibold text-gray-600">Your pantry is empty</h3>
          <p className="mb-6 text-sm">Scan a photo of your groceries to get started!</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-emerald-600 font-medium hover:underline"
          >
              Open Camera
          </button>
        </div>
      )}
    </div>
  );
};

export default PantryView;