import React, { useState, useRef } from 'react';
import { PantryItem, Unit } from '../types';
import { CATEGORIES } from '../constants';
import { Trash2, Plus, AlertTriangle, ScanLine, Loader2, Camera } from 'lucide-react';
import { fileToGenerativePart, identifyPantryItems } from '../services/geminiService';

interface PantryViewProps {
  items: PantryItem[];
  onAddItem: (item: PantryItem) => void;
  onAddItems: (items: PantryItem[]) => void;
  onRemoveItem: (id: string) => void;
}

const PantryView: React.FC<PantryViewProps> = ({ items, onAddItem, onAddItems, onRemoveItem }) => {
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
    if (!dateStr) return 999;
    const today = new Date();
    const expiry = new Date(dateStr);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'bg-red-100 text-red-800 border-red-200';
    if (days <= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (days <= 7) return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    return 'bg-white text-gray-700 border-gray-100';
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Pantry</h2>
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
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            <span className="hidden sm:inline">Scan Items</span>
          </button>
          <button className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats/Alerts */}
      <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-orange-900">Expiring Soon</h3>
          <p className="text-sm text-orange-700 mt-1">
            {items.filter(i => getDaysUntilExpiry(i.expiryDate) <= 3).length} items need to be used within 3 days.
          </p>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const daysLeft = getDaysUntilExpiry(item.expiryDate);
          return (
            <div key={item.id} className={`p-4 rounded-xl border shadow-sm flex justify-between items-center ${getExpiryColor(daysLeft)}`}>
              <div>
                <div className="font-semibold text-lg">{item.name}</div>
                <div className="text-sm opacity-80">{item.quantity} {item.unit} • {item.category}</div>
                {item.expiryDate && (
                  <div className="text-xs mt-1 font-medium flex items-center gap-1">
                    {daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} days`}
                  </div>
                )}
              </div>
              <button 
                onClick={() => onRemoveItem(item.id)}
                className="p-2 hover:bg-black/5 rounded-full transition"
              >
                <Trash2 className="w-4 h-4 opacity-50 hover:opacity-100" />
              </button>
            </div>
          );
        })}
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <ScanLine className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Your pantry is empty. <br/>Scan a photo of your groceries to get started!</p>
        </div>
      )}
    </div>
  );
};

export default PantryView;
