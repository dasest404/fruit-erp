import React from 'react';
import {
  X,
  Users,
  Truck,
  BookOpen,
  CreditCard,
  Apple,
  TrendingUp,
  Wallet,
  Trash2,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { ActiveSection } from './Sidebar';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  onLogout: () => void;
  onOpenAI: () => void;
  businessName?: string;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  onLogout,
  onOpenAI,
  businessName,
}) => {
  if (!isOpen) return null;

  const items: { id: ActiveSection; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'customers', label: 'Customers', icon: <Users className="w-5 h-5 text-emerald-600" />, desc: 'Buyer profiles & credit limits' },
    { id: 'khata', label: 'Customer Khata', icon: <BookOpen className="w-5 h-5 text-blue-600" />, desc: 'Digital ledger & balances' },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck className="w-5 h-5 text-amber-600" />, desc: 'Farmer & mandi vendors' },
    { id: 'supplier-payments', label: 'Supplier Payments', icon: <CreditCard className="w-5 h-5 text-indigo-600" />, desc: 'Payables settlement' },
    { id: 'fruits', label: 'Fruit Master', icon: <Apple className="w-5 h-5 text-rose-600" />, desc: 'Grades, units & varieties' },
    { id: 'rates', label: 'Daily Fruit Rates', icon: <TrendingUp className="w-5 h-5 text-teal-600" />, desc: 'Today’s market rate board' },
    { id: 'expenses', label: 'Expenses', icon: <Wallet className="w-5 h-5 text-purple-600" />, desc: 'Freight, labour & hamali' },
    { id: 'wastage', label: 'Wastage Tracker', icon: <Trash2 className="w-5 h-5 text-red-500" />, desc: 'Spoilage & transit losses' },
    { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 className="w-5 h-5 text-cyan-600" />, desc: 'P&L, sales & stocks' },
    { id: 'settings', label: 'Settings & Backup', icon: <Settings className="w-5 h-5 text-slate-600" />, desc: 'GST, company & data restore' },
  ];

  const handleSelect = (id: ActiveSection) => {
    onSelectSection(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs lg:hidden">
      <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🥭</span>
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-heading">Klyia FreshERP Menu</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{businessName || 'Business ERP'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Assistant Quick Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-100 mx-4 my-2 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-xs font-bold text-emerald-900 block">FreshERP AI Assistant</span>
              <span className="text-[10px] text-emerald-700">Ask anything about your business</span>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenAI();
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            Launch
          </button>
        </div>

        {/* Grid of options */}
        <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2.5">
          {items.map((it) => {
            const isSelected = activeSection === it.id;
            return (
              <button
                key={it.id}
                onClick={() => handleSelect(it.id)}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center">
                    {it.icon}
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                </div>
                <span className="font-bold text-xs text-slate-800 mt-1">{it.label}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{it.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Footer with Sign Out */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Logged in as admin</span>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
