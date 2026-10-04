import React from 'react';
import { LayoutDashboard, Receipt, ShoppingBag, Package, MoreHorizontal } from 'lucide-react';
import { ActiveSection } from './Sidebar';

interface BottomNavProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  onOpenMore: () => void;
  lowStockCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeSection,
  onSelectSection,
  onOpenMore,
  lowStockCount,
}) => {
  const isMoreActive = ![
    'dashboard',
    'sales',
    'purchases',
    'stock',
  ].includes(activeSection);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <button
          onClick={() => onSelectSection('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 max-w-[80px] min-h-[48px] py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            activeSection === 'dashboard'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[10px] tracking-tight truncate">Home</span>
        </button>

        <button
          onClick={() => onSelectSection('sales')}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 max-w-[80px] min-h-[48px] py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            activeSection === 'sales'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[10px] tracking-tight truncate">Sales</span>
        </button>

        <button
          onClick={() => onSelectSection('purchases')}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 max-w-[80px] min-h-[48px] py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            activeSection === 'purchases'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[10px] tracking-tight truncate">Purchase</span>
        </button>

        <button
          onClick={() => onSelectSection('stock')}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 max-w-[80px] min-h-[48px] py-1 px-1 rounded-xl relative transition-colors cursor-pointer ${
            activeSection === 'stock'
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[10px] tracking-tight truncate">Stock</span>
          {lowStockCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 max-w-[80px] min-h-[48px] py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            isMoreActive
              ? 'text-emerald-600 font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[10px] tracking-tight truncate">More</span>
        </button>
      </div>
    </div>
  );
};
