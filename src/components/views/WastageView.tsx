import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Search,
  Download,
  AlertTriangle,
  X,
  CheckCircle2,
  TrendingDown,
  Edit2,
} from 'lucide-react';
import { ERPDataStore, Wastage } from '../../types';
import { formatINR, formatWeight, formatDate, downloadCSV } from '../../utils/formatters';
import { api } from '../../services/api';

interface WastageViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
  isOpenAddDirectly?: boolean;
}

export const WastageView: React.FC<WastageViewProps> = ({
  data,
  onRefreshData,
  isOpenAddDirectly = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(isOpenAddDirectly);
  const [editingWastage, setEditingWastage] = useState<Wastage | null>(null);

  // Form State
  const [fruitId, setFruitId] = useState(data.fruits[0]?.id || '');
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | 'Damaged'>('Damaged');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [cratesCount, setCratesCount] = useState<number | ''>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<'Rotten' | 'Overripe' | 'Transit Damage' | 'Moisture Shrinkage' | 'Pest'>(
    'Rotten'
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedFruit = data.fruits.find((f) => f.id === fruitId);
  const currentStock = data.stock.find((s) => s.fruitId === fruitId && s.grade === grade);

  // KPIs
  const totalWastageKg = data.wastage.reduce((sum, w) => sum + w.weightKg, 0);
  const totalWastageLoss = data.wastage.reduce((sum, w) => sum + w.costLoss, 0);
  const totalPurchasedKg = data.purchases.reduce((sum, p) => sum + p.netWeightKg, 0);
  const wastageRatio =
    totalPurchasedKg > 0 ? ((totalWastageKg / totalPurchasedKg) * 100).toFixed(1) : '0.0';

  const filteredWastage = data.wastage.filter(
    (w) =>
      w.fruitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreateWastage = () => {
    setEditingWastage(null);
    setFruitId(data.fruits[0]?.id || '');
    setGrade('Damaged');
    setWeightKg('');
    setCratesCount(0);
    setDate(new Date().toISOString().split('T')[0]);
    setReason('Rotten');
    setNotes('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditWastage = (w: Wastage) => {
    setEditingWastage(w);
    setFruitId(w.fruitId);
    setGrade(w.grade);
    setWeightKg(w.weightKg);
    setCratesCount(w.cratesCount || 0);
    setDate(w.date ? w.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setReason((w.reason as any) || 'Rotten');
    setNotes(w.notes || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveWastage = async (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = Number(weightKg);
    if (isNaN(numWeight) || numWeight <= 0) {
      setErrorMessage('Please enter a valid wastage weight in KG.');
      return;
    }

    if (!editingWastage && currentStock && numWeight > currentStock.weightKg) {
      if (
        !window.confirm(
          `Warning: Entered weight (${numWeight} KG) exceeds recorded stock (${currentStock.weightKg} KG). Proceed anyway?`
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        fruitId,
        grade,
        weightKg: numWeight,
        cratesCount: Number(cratesCount) || 0,
        reason,
        date,
        notes,
      };

      if (editingWastage) {
        await api.updateWastage(editingWastage.id, payload);
      } else {
        await api.createWastage(payload);
      }

      await onRefreshData();
      setIsModalOpen(false);
      setEditingWastage(null);
      setWeightKg('');
      setCratesCount(0);
      setNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to log spoilage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Fruit', 'Grade', 'Weight (KG)', 'Crates', 'Reason', 'Cost Loss (₹)', 'Notes'];
    const rows = filteredWastage.map((w) => [
      formatDate(w.date),
      w.fruitName,
      w.grade,
      w.weightKg,
      w.cratesCount,
      w.reason,
      w.costLoss,
      w.notes,
    ]);
    downloadCSV(`Spoilage_Report_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
            Spoilage & Wastage Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track rot loss, transit bruising, moisture shrinkage, and financial damage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreateWastage}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm shadow-rose-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Wastage</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Spoilage Weight
          </span>
          <p className="text-2xl font-extrabold text-rose-600 mt-2 font-mono">
            {totalWastageKg.toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-500">KG</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Discarded fruit inventory</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Financial Loss
          </span>
          <p className="text-2xl font-extrabold text-rose-700 mt-2 font-mono">
            {formatINR(totalWastageLoss)}
          </p>
          <p className="text-xs text-slate-500 mt-1">At wholesale cost valuation</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Spoilage Rate %
          </span>
          <p
            className={`text-2xl font-extrabold mt-2 font-mono ${
              Number(wastageRatio) > 3 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {wastageRatio}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Of total inward supply</p>
        </div>
      </div>

      {/* Wastage Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <label htmlFor="wastage-search-input" className="sr-only">Search fruit or reason</label>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="wastage-search-input"
              aria-label="Search fruit or reason"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search fruit or reason (e.g. Overripe)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="table-container">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Fruit</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4 text-right">Weight (KG)</th>
                <th className="py-3 px-4 text-right">Crates</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Cost Loss</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredWastage.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No wastage entries recorded. Spoilage logs will appear here.
                  </td>
                </tr>
              ) : (
                filteredWastage.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{formatDate(item.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.fruitName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        Grade {item.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600 font-mono">
                      {item.weightKg.toLocaleString('en-IN')} KG
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono">
                      {item.cratesCount}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                        {item.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono">
                      {formatINR(item.costLoss)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEditWastage(item)}
                        className="p-1 rounded text-slate-400 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Edit / Modify Wastage"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG WASTAGE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base font-heading">
                  {editingWastage ? 'Edit Fruit Spoilage & Wastage' : 'Log Fruit Spoilage & Wastage'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingWastage(null);
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWastage} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label htmlFor="wastage-fruit-id" className="block text-xs font-bold text-slate-700 mb-1">Fruit Variety *</label>
                <select
                  id="wastage-fruit-id"
                  value={fruitId}
                  onChange={(e) => setFruitId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {data.fruits.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.image || '🍎'} {f.name} ({f.variety})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wastage-grade" className="block text-xs font-bold text-slate-700 mb-1">Grade</label>
                  <select
                    id="wastage-grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="Damaged">Damaged / Rot</option>
                    <option value="C">Grade C</option>
                    <option value="B">Grade B</option>
                    <option value="A">Grade A</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="wastage-reason" className="block text-xs font-bold text-slate-700 mb-1">Reason *</label>
                  <select
                    id="wastage-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="Rotten">Rotten / Mold</option>
                    <option value="Overripe">Overripe / Soft</option>
                    <option value="Transit Damage">Transit Damage / Bruised</option>
                    <option value="Moisture Shrinkage">Moisture Shrinkage</option>
                    <option value="Pest">Pest Infested</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wastage-weight" className="block text-xs font-bold text-slate-700 mb-1">Weight (KG) *</label>
                  <input
                    id="wastage-weight"
                    type="number"
                    required
                    min="1"
                    placeholder="KG"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-rose-600 font-mono focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label htmlFor="wastage-crates-count" className="block text-xs font-bold text-slate-700 mb-1">Crates Dumped</label>
                  <input
                    id="wastage-crates-count"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={cratesCount}
                    onChange={(e) => setCratesCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="wastage-date" className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input
                  id="wastage-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              {currentStock && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  Current Warehouse Stock:{' '}
                  <strong className="text-slate-900 font-mono">{currentStock.weightKg} KG</strong>{' '}
                  (Avg Cost: {formatINR(currentStock.averageCostPerKg)}/KG)
                </p>
              )}

              <div>
                <label htmlFor="wastage-notes" className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <input
                  id="wastage-notes"
                  type="text"
                  placeholder="e.g. Unloaded lot contained bottom crate rots"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingWastage(null);
                  }}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !weightKg}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingWastage ? 'Save Changes' : 'Confirm Spoilage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
