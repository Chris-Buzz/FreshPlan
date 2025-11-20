import React, { useState, useRef } from 'react';
import { PantryItem, Unit } from '../types';
import { CATEGORIES } from '../constants';
import { Trash2, Plus, AlertTriangle, ScanLine, Loader2, Camera, Calendar, Edit2 } from 'lucide-react';
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

  const getDaysUntilExpiry = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Simplified status logic for text color only
  const getStatusColor = (days: number | null) => {
    if (days === null) return 'text-emerald-600';
    if (days < 0) return 'text-red-600';
    if (days <= 3) return 'text-orange-600';
    return 'text-gray-500';
  };

  const itemsExpiringSoon = items.filter(i => {
      const days = getDaysUntilExpiry(i.expiryDate);
      return days !== null && days <= 3 && days >= 0;
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
            <h3 className="font-medium text-orange-900">Expiring Soon</h3>
            <p className="text-sm text-orange-700 mt-1">
              {itemsExpiringSoon} items need to be used within 3 days.
            </p>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const daysLeft = getDaysUntilExpiry(item.expiryDate);
          return (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-start gap-3 transition hover:shadow-md">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div className="font-semibold text-lg text-gray-800 line-clamp-1">{item.name}</div>
                </div>
                <div className="text-sm text-gray-500 mb-3">{item.quantity} {item.unit} • {item.category}</div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                    <Calendar className={`w-3.5 h-3.5 ${!item.expiryDate ? 'text-emerald-500' : 'text-gray-400'}`} />
                    <input 
                        type="date" 
                        value={item.expiryDate || ''}
                        onChange={(e) => onUpdateItem(item.id, { expiryDate: e.target.value })}
                        className={`text-xs bg-transparent border-none focus:ring-0 p-0 w-24 cursor-pointer font-medium ${!item.expiryDate ? 'text-emerald-600' : 'text-gray-600'}`}
                    />
                  </div>
                  
                  <div className={`text-xs font-medium ${getStatusColor(daysLeft)}`}>
                    {daysLeft === null ? 'Set Expiry' : 
                     daysLeft < 0 ? `Expired` :
                     daysLeft === 0 ? 'Today' :
                     `${daysLeft} days`}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onRemoveItem(item.id)}
                className="p-2 hover:bg-red-50 rounded-full transition shrink-0 group"
                title="Remove Item"
              >
                <Trash2 className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition" />
              </button>
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