import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Users, Apple, Truck, Receipt, ShoppingBag, ArrowRight } from 'lucide-react';
import { ERPDataStore } from '../types';
import { ActiveSection } from './Sidebar';
import { formatINR } from '../utils/formatters';
import { CustomerAvatar } from './CustomerAvatar';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ERPDataStore | null;
  onNavigate?: (section: ActiveSection, filterOrId?: string) => void;
  onSelectCustomer?: (customer: any) => void;
  onSelectSupplier?: (supplier: any) => void;
  onSelectFruit?: (fruit: any) => void;
  onSelectSale?: (sale: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  data,
  onNavigate,
  onSelectCustomer,
  onSelectSupplier,
  onSelectFruit,
  onSelectSale,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim() || !data) return { fruits: [], customers: [], suppliers: [], sales: [], purchases: [] };
    const q = query.toLowerCase();

    return {
      fruits: data.fruits.filter(
        (f) => f.name.toLowerCase().includes(q) || f.variety.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
      ).slice(0, 4),
      customers: data.customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.businessName.toLowerCase().includes(q) || c.phone.includes(q)
      ).slice(0, 4),
      suppliers: data.suppliers.filter(
        (s) => s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.contactPerson.toLowerCase().includes(q)
      ).slice(0, 4),
      sales: data.sales.filter(
        (s) => s.invoiceNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q)
      ).slice(0, 4),
      purchases: data.purchases.filter(
        (p) => p.purchaseNumber.toLowerCase().includes(q) || p.fruitName.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q)
      ).slice(0, 4),
    };
  }, [query, data]);

  if (!isOpen) return null;

  const totalResults =
    results.fruits.length +
    results.customers.length +
    results.suppliers.length +
    results.sales.length +
    results.purchases.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <label htmlFor="global-search-input" className="sr-only">Search</label>
          <Search className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            id="global-search-input"
            aria-label="Search fruits, customers, suppliers, invoices, purchases"
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fruits, customers, suppliers, invoices, purchases..."
            className="w-full text-sm font-medium text-slate-900 focus:outline-none placeholder:text-slate-400 bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Type anything to search across live ERP databases. Try &quot;Apple&quot;, &quot;Sharma&quot;, or &quot;KFP/2026&quot;.
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching ERP records found for &quot;<span className="font-semibold text-slate-700">{query}</span>&quot;.
            </div>
          ) : (
            <>
              {/* Customers */}
              {results.customers.length > 0 && (
                 <div>
                   <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                     <Users className="w-3.5 h-3.5" />
                     <span>Customers</span>
                   </h4>
                   <div className="space-y-1">
                     {results.customers.map((c) => (
                       <div
                         key={c.id}
                         onClick={() => {
                           if (onSelectCustomer) {
                             onSelectCustomer(c);
                           } else if (onNavigate) {
                             onNavigate('customers', c.id);
                           }
                           onClose();
                         }}
                         className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group border border-transparent hover:border-slate-200/60"
                       >
                         <div className="flex items-center gap-2.5">
                           <CustomerAvatar customer={c} size="sm" shape="circle" className="shrink-0" />
                           <div>
                             <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                               {c.name} <span className="text-slate-500 font-normal">({c.businessName})</span>
                             </p>
                             <p className="text-[11px] text-slate-400">{c.phone} &bull; {c.city}</p>
                           </div>
                         </div>
                         <div className="text-right flex items-center gap-3">
                           <div>
                             <p className="text-xs font-bold text-slate-700">Due: {formatINR(c.outstandingBalance)}</p>
                           </div>
                           <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

              {/* Fruits */}
              {results.fruits.length > 0 && (
                 <div>
                   <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                     <Apple className="w-3.5 h-3.5" />
                     <span>Fruit Inventory</span>
                   </h4>
                   <div className="space-y-1">
                     {results.fruits.map((f) => (
                       <div
                         key={f.id}
                         onClick={() => {
                           if (onSelectFruit) {
                             onSelectFruit(f);
                           } else if (onNavigate) {
                             onNavigate('fruits', f.id);
                           }
                           onClose();
                         }}
                         className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group border border-transparent hover:border-slate-200/60"
                       >
                         <div className="flex items-center gap-2.5">
                           <span className="text-lg">{f.image || '🍎'}</span>
                           <div>
                             <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                               {f.name} <span className="text-slate-400 font-medium">({f.variety})</span>
                             </p>
                             <p className="text-[11px] text-slate-400">{f.category} &bull; Unit: {f.unit}</p>
                           </div>
                         </div>
                         <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                       </div>
                     ))}
                   </div>
                 </div>
               )}

              {/* Sales Invoices */}
              {results.sales.length > 0 && (
                 <div>
                   <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                     <Receipt className="w-3.5 h-3.5" />
                     <span>Sales & Invoices</span>
                   </h4>
                   <div className="space-y-1">
                     {results.sales.map((s) => (
                       <div
                         key={s.id}
                         onClick={() => {
                           if (onSelectSale) {
                             onSelectSale(s);
                           } else if (onNavigate) {
                             onNavigate('sales', s.id);
                           }
                           onClose();
                         }}
                         className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group border border-transparent hover:border-slate-200/60"
                       >
                         <div>
                           <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                             {s.invoiceNumber} &bull; {s.customerName}
                           </p>
                           <p className="text-[11px] text-slate-400">{s.saleDate} &bull; {s.items.length} items</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs font-bold text-emerald-700">{formatINR(s.grandTotal)}</p>
                           <span className="text-[10px] text-slate-400">{s.paymentMethod}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

              {/* Suppliers */}
              {results.suppliers.length > 0 && (
                 <div>
                   <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                     <Truck className="w-3.5 h-3.5" />
                     <span>Suppliers</span>
                   </h4>
                   <div className="space-y-1">
                     {results.suppliers.map((sup) => (
                       <div
                         key={sup.id}
                         onClick={() => {
                           if (onSelectSupplier) {
                             onSelectSupplier(sup);
                           } else if (onNavigate) {
                             onNavigate('suppliers', sup.id);
                           }
                           onClose();
                         }}
                         className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group border border-transparent hover:border-slate-200/60"
                       >
                         <div>
                           <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">{sup.name}</p>
                           <p className="text-[11px] text-slate-400">{sup.contactPerson} &bull; {sup.phone}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs font-bold text-rose-700">Payable: {formatINR(sup.outstandingPayable)}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

              {/* Purchases */}
              {results.purchases.length > 0 && (
                 <div>
                   <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                     <ShoppingBag className="w-3.5 h-3.5" />
                     <span>Purchases (Stock In)</span>
                   </h4>
                   <div className="space-y-1">
                     {results.purchases.map((p) => (
                       <div
                         key={p.id}
                         onClick={() => {
                           if (onNavigate) {
                             onNavigate('purchases', p.id);
                           }
                           onClose();
                         }}
                         className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group border border-transparent hover:border-slate-200/60"
                       >
                         <div>
                           <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                             {p.purchaseNumber} &bull; {p.fruitName} ({p.grade})
                           </p>
                           <p className="text-[11px] text-slate-400">{p.supplierName} &bull; Net: {p.netWeight} KG</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs font-bold text-slate-900">{formatINR(p.totalCost)}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
