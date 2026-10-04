import React, { useState } from 'react';
import {
  Package,
  Search,
  Download,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { ERPDataStore, StockItem } from '../../types';
import { formatINR, formatWeight, downloadCSV } from '../../utils/formatters';
import { api } from '../../services/api';

interface StockViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
  onOpenWastage: () => void;
  onOpenNewPurchase: () => void;
}

export const StockView: React.FC<StockViewProps> = ({
  data,
  onRefreshData,
  onOpenWastage,
  onOpenNewPurchase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [adjustingStockItem, setAdjustingStockItem] = useState<StockItem | null>(null);
  const [newWeightKg, setNewWeightKg] = useState<number | ''>('');
  const [newCrates, setNewCrates] = useState<number | ''>('');
  const [adjustmentReason, setAdjustmentReason] = useState('Physical Stock Audit Count');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Warehouse summaries
  const totalStockKg = data.stock.reduce((sum, s) => sum + s.weightKg, 0);
  const totalStockValue = data.stock.reduce((sum, s) => sum + s.weightKg * s.averageCostPerKg, 0);
  const lowStockCount = data.stock.filter((s) => s.weightKg <= 300).length;

  const filteredStock = data.stock.filter((item) => {
    const matchesSearch = item.fruitName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === 'all' || item.grade === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const handleOpenAdjust = (item: StockItem) => {
    setAdjustingStockItem(item);
    setNewWeightKg(item.weightKg);
    setNewCrates(item.cratesCount);
    setAdjustmentReason('Physical Stock Audit Count');
    setErrorMessage('');
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingStockItem) return;

    if (newWeightKg === '' || Number(newWeightKg) < 0) {
      setErrorMessage('Please enter a valid non-negative weight in KG.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await api.adjustStock({
        stockId: adjustingStockItem.id,
        newWeightKg: Number(newWeightKg),
        newCratesCount: Number(newCrates) || 0,
        reason: adjustmentReason,
      });

      await onRefreshData();
      setAdjustingStockItem(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to adjust stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Fruit', 'Grade', 'Weight (KG)', 'Crates', 'Avg Cost/KG', 'Valuation', 'Status'];
    const rows = filteredStock.map((s) => [
      s.fruitName,
      s.grade,
      s.weightKg,
      s.cratesCount,
      s.averageCostPerKg,
      Math.round(s.weightKg * s.averageCostPerKg),
      s.weightKg <= 300 ? 'LOW STOCK' : 'IN STOCK',
    ]);
    downloadCSV(`Stock_Valuation_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
            Stock Master & Valuation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time physical inventory, grade-wise weighment, and storage valuation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenWastage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Log Spoilage</span>
          </button>

          <button
            onClick={onOpenNewPurchase}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inward Stock</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Warehouse Inventory
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {totalStockKg.toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-500">KG</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Active crates & sacks on floor</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Stock Asset Valuation
          </span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono">
            {formatINR(totalStockValue)}
          </p>
          <p className="text-xs text-slate-500 mt-1">At weighted average landing cost</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Critical Low Stock Items
          </span>
          <p
            className={`text-2xl font-extrabold mt-2 font-mono ${
              lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {lowStockCount} <span className="text-sm font-normal text-slate-500">lots</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Below minimum threshold</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <label htmlFor="stock-search-input" className="sr-only">Search fruit name in stock</label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="stock-search-input"
            aria-label="Search fruit name in stock"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fruit name in stock..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['all', 'A', 'B', 'C', 'Damaged'].map((g) => (
            <button
              key={g}
              onClick={() => setFilterGrade(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterGrade === g
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {g === 'all' ? 'All Grades' : `Grade ${g}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="table-container">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Fruit</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4 text-right">Physical Stock (KG)</th>
                <th className="py-3 px-4 text-right">Crates</th>
                <th className="py-3 px-4 text-right">Avg Cost / KG</th>
                <th className="py-3 px-4 text-right">Total Valuation</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No stock records match your query.
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const isLow = item.weightKg <= 300;
                  const itemValuation = Math.round(item.weightKg * item.averageCostPerKg);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>{item.fruitName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          Grade {item.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 font-mono text-sm">
                        {item.weightKg.toLocaleString('en-IN')} KG
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                        {item.cratesCount}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                        {formatINR(item.averageCostPerKg)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-800 font-mono">
                        {formatINR(itemValuation)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST STOCK MODAL */}
      {adjustingStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm font-heading">
                  Physical Stock Count Reconciliation
                </h3>
              </div>
              <button
                onClick={() => setAdjustingStockItem(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">Fruit Item & Grade:</p>
                <p className="text-sm font-bold text-slate-900">
                  {adjustingStockItem.fruitName} (Grade {adjustingStockItem.grade})
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Current System Stock: <strong className="text-slate-900">{adjustingStockItem.weightKg} KG</strong>
                </p>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label htmlFor="stock-actual-weight" className="block text-xs font-bold text-slate-700 mb-1">
                  Actual Physical Weight (KG) *
                </label>
                <input
                  id="stock-actual-weight"
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={newWeightKg}
                  onChange={(e) => setNewWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="stock-crates-count" className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Crates Count
                </label>
                <input
                  id="stock-crates-count"
                  type="number"
                  min="0"
                  value={newCrates}
                  onChange={(e) => setNewCrates(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="stock-adjustment-reason" className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  id="stock-adjustment-reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Physical Stock Audit Count">Physical Stock Audit Count</option>
                  <option value="Natural Moisture Shrinkage / Drying Loss">
                    Natural Moisture Shrinkage / Drying Loss
                  </option>
                  <option value="Sorting & Grade Reclassification">
                    Sorting & Grade Reclassification
                  </option>
                  <option value="Data Entry Correction">Data Entry Correction</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingStockItem(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adjusting...' : 'Save Stock Count'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
