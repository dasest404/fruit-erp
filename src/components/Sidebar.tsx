import React from 'react';
import {
  LayoutDashboard,
  Apple,
  Truck,
  Users,
  ShoppingBag,
  Package,
  Receipt,
  BookOpen,
  CreditCard,
  Wallet,
  TrendingUp,
  Trash2,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ERPDataStore } from '../types';

export type ActiveSection =
  | 'dashboard'
  | 'fruits'
  | 'suppliers'
  | 'customers'
  | 'purchases'
  | 'stock'
  | 'sales'
  | 'khata'
  | 'supplier-payments'
  | 'expenses'
  | 'rates'
  | 'wastage'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  data: ERPDataStore | null;
  onLogout: () => void;
  onOpenAI: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  data,
  onLogout,
  onOpenAI,
}) => {
  const lowStockCount = data?.stock.filter((s) => s.weightKg <= 300).length || 0;
  const overdueCustomersCount = data?.customers.filter((c) => c.outstandingBalance > 50000).length || 0;

  const navigationItems: { id: ActiveSection; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'sales', label: 'Sales (POS)', icon: <Receipt className="w-4 h-4" /> },
    { id: 'purchases', label: 'Purchases (In)', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'stock', label: 'Stock Master', icon: <Package className="w-4 h-4" />, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" />, badge: overdueCustomersCount > 0 ? overdueCustomersCount : undefined, badgeColor: 'bg-rose-100 text-rose-800' },
    { id: 'khata', label: 'Customer Khata', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck className="w-4 h-4" /> },
    { id: 'supplier-payments', label: 'Supplier Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'fruits', label: 'Fruit Master Catalog', icon: <Apple className="w-4 h-4" /> },
    { id: 'rates', label: 'Daily Fruit Rates', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'expenses', label: 'Expenses', icon: <Wallet className="w-4 h-4" /> },
    { id: 'wastage', label: 'Wastage Tracker', icon: <Trash2 className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & P&L', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Backup', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-slate-200/80 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-4 xl:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full shadow-2xs overflow-hidden shrink-0 border border-amber-200/80 bg-white">
            <img src="/assets/hfc-emblem.svg" alt="HFC" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-sm xl:text-base tracking-tight text-slate-900 font-heading truncate">
              {data?.settings.businessName || 'Hari Kripa Fruit Company'}
            </h2>
            <p className="text-[10px] text-emerald-700 font-bold truncate">
              {data?.settings.tagline || 'FRESHNESS • QUALITY • TRUST'}
            </p>
          </div>
        </div>
      </div>

      {/* APMC Live Status Banner */}
      <div className="mx-4 xl:mx-5 my-3 px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-800">APMC Mandi Online</span>
        </div>
        <button
          onClick={onOpenAI}
          title="FreshERP AI Assistant — Ask anything about your business"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>FreshERP AI</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 xl:px-4 py-2 space-y-1">
        {navigationItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 xl:p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {data?.user.username || 'klyiatech'}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Sole ERP Admin</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Sign Out of ERP"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400 font-medium">
          Powered by Klyia Technology
        </p>
      </div>
    </aside>
  );
};
