import React, { useState } from 'react';
import {
  Apple,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Package,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import { ERPDataStore, Fruit, FruitGradePrice } from '../../types';
import { formatINR, downloadCSV } from '../../utils/formatters';
import { api } from '../../services/api';

interface FruitsViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
  initialFruitId?: string;
}

export const FruitsView: React.FC<FruitsViewProps> = ({
  data,
  onRefreshData,
  initialFruitId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFruit, setEditingFruit] = useState<Fruit | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [imageEmoji, setImageEmoji] = useState('🍎');
  const [variety, setVariety] = useState('');
  const [unit, setUnit] = useState<string>('KG');
  const [minStockAlertKg, setMinStockAlertKg] = useState<number | ''>(300);
  const [category, setCategory] = useState('Fresh Fruits');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    'all',
    'Apples & Pears',
    'Citrus & Oranges',
    'Bananas',
    'Mangoes & Tropical',
    'Grapes & Berries',
    'Melons & Watermelons',
    'Pomegranates',
    'Exotic & Stone Fruits',
  ];

  const handleOpenAdd = () => {
    setEditingFruit(null);
    setName('');
    setImageEmoji('🍎');
    setVariety('');
    setUnit('KG');
    setMinStockAlertKg(300);
    setCategory('Fresh Fruits');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Fruit) => {
    setEditingFruit(f);
    setName(f.name);
    setImageEmoji(f.image || '🍎');
    setVariety(f.variety || '');
    setUnit(f.unit || 'KG');
    setMinStockAlertKg(
      f.minStockAlertKg !== undefined
        ? f.minStockAlertKg
        : f.minStock !== undefined
          ? f.minStock
          : 300
    );
    setCategory(f.category || 'Fresh Fruits');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveFruit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    const defaultGrades: FruitGradePrice[] = editingFruit?.grades?.length
      ? editingFruit.grades
      : [
          { grade: 'A', purchaseRate: 0, wholesaleRate: 0, retailRate: 0, currentStockKg: 0 },
          { grade: 'B', purchaseRate: 0, wholesaleRate: 0, retailRate: 0, currentStockKg: 0 },
          { grade: 'C', purchaseRate: 0, wholesaleRate: 0, retailRate: 0, currentStockKg: 0 },
          { grade: 'Damaged', purchaseRate: 0, wholesaleRate: 0, retailRate: 0, currentStockKg: 0 },
        ];

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        name: name.trim(),
        image: imageEmoji.trim() || '🍎',
        variety: variety.trim() || 'Standard',
        unit: unit.trim() || 'KG',
        minStockAlertKg: Number(minStockAlertKg) || 0,
        minStock: Number(minStockAlertKg) || 0,
        category: category || (editingFruit ? editingFruit.category : 'Fresh Fruits'),
        grades: defaultGrades,
      };

      if (editingFruit) {
        await api.updateFruit(editingFruit.id, payload);
      } else {
        await api.createFruit(payload);
      }

      await onRefreshData();
      setIsModalOpen(false);
      setEditingFruit(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save fruit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFruit = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this fruit from Master?')) return;
    try {
      await api.deleteFruit(id);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete fruit');
    }
  };

  const filteredFruits = data.fruits.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.variety.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    const headers = [
      'Fruit Name',
      'Variety',
      'Category',
      'Base Unit',
      'Min Stock Alert (KG)',
      'Grade A Wholesale',
      'Grade A Retail',
      'Grade B Wholesale',
      'Grade B Retail',
      'Grade C Wholesale',
      'Grade C Retail',
      'Grade Damaged Wholesale',
      'Grade Damaged Retail',
    ];

    const rows = data.fruits.map((f) => {
      const gA = f.grades.find((g) => g.grade === 'A');
      const gB = f.grades.find((g) => g.grade === 'B');
      const gC = f.grades.find((g) => g.grade === 'C');
      const gD = f.grades.find((g) => g.grade === 'Damaged');
      return [
        f.name,
        f.variety,
        f.category,
        f.unit,
        f.minStockAlertKg,
        gA?.wholesaleRate ?? 0,
        gA?.retailRate ?? 0,
        gB?.wholesaleRate ?? 0,
        gB?.retailRate ?? 0,
        gC?.wholesaleRate ?? 0,
        gC?.retailRate ?? 0,
        gD?.wholesaleRate ?? 0,
        gD?.retailRate ?? 0,
      ];
    });

    downloadCSV(`Fruits_Catalog_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
            Fruit Master Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard varieties, multi-grade pricing tiers, units, and inventory thresholds
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Export Fruits Catalog to Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Catalog</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Fruit</span>
          </button>
        </div>
      </div>

      {/* Filter & Category Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative max-w-md">
          <label htmlFor="fruits-search-input" className="sr-only">Search fruits</label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="fruits-search-input"
            aria-label="Search fruits"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search fruit name or variety (e.g. Kinnow, Royal Gala)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Fruits' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Fruit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredFruits.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            No fruits match your search.
          </div>
        ) : (
          filteredFruits.map((fruit) => {
            // Find total stock of this fruit
            const fruitStock = data.stock.filter((s) => s.fruitId === fruit.id);
            const totalKg = fruitStock.reduce((sum, s) => sum + s.weightKg, 0);

            return (
              <div
                key={fruit.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl shadow-2xs">
                        {fruit.image || '🍎'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 font-heading">
                          {fruit.name}
                        </h3>
                        <p className="text-xs text-slate-500">{fruit.variety}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          {fruit.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(fruit)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Fruit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFruit(fruit.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Fruit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stock On Hand Pill */}
                  <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">Warehouse Stock:</span>
                    <span
                      className={`text-xs font-mono font-extrabold ${
                        totalKg <= fruit.minStockAlertKg ? 'text-amber-600' : 'text-slate-900'
                      }`}
                    >
                      {totalKg.toLocaleString('en-IN')} KG
                    </span>
                  </div>

                  {/* Grade Pricing Matrix */}
                  <div className="mt-3 space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Wholesale Mandi Rates:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {fruit.grades.map((g) => (
                        <div
                          key={g.grade}
                          className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex justify-between items-center"
                        >
                          <span className="text-slate-600 font-semibold">
                            {g.grade === 'Damaged' ? 'Damaged' : `Gr ${g.grade}`}:
                          </span>
                          <span className="font-extrabold text-slate-900 font-mono">
                            {formatINR(g.wholesaleRate)}/kg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Unit: {fruit.unit}</span>
                  <span>Alert &le; {fruit.minStockAlertKg !== undefined ? fruit.minStockAlertKg : (fruit.minStock || 0)} {fruit.unit}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT FRUIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base font-heading">
                {editingFruit ? 'Edit Fruit Details' : 'Add Fruit to Master Catalog'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFruit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* 1. Full Name */}
              <div>
                <label htmlFor="fruit-name" className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="fruit-name"
                  type="text"
                  required
                  placeholder="e.g. Apple, Banana, Mango"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* 2. Emoji / Icon */}
              <div>
                <label htmlFor="fruit-emoji" className="block text-xs font-bold text-slate-700 mb-1">
                  Emoji / Icon
                </label>
                <input
                  id="fruit-emoji"
                  type="text"
                  placeholder="e.g. 🍎, 🍌, 🥭"
                  value={imageEmoji}
                  onChange={(e) => setImageEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* 3. Variety / Origin */}
              <div>
                <label htmlFor="fruit-variety" className="block text-xs font-bold text-slate-700 mb-1">
                  Variety / Origin
                </label>
                <input
                  id="fruit-variety"
                  type="text"
                  placeholder="e.g. Kinnaur, Ratnagiri, Nagpur"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* 4. Primary Unit */}
              <div>
                <label htmlFor="fruit-unit" className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Unit
                </label>
                <input
                  id="fruit-unit"
                  type="text"
                  placeholder="e.g. KG, Box, Dozen, Piece"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* 5. Min Stock Threshold */}
              <div>
                <label htmlFor="fruit-min-stock" className="block text-xs font-bold text-slate-700 mb-1">
                  Min Stock Threshold
                </label>
                <input
                  id="fruit-min-stock"
                  type="number"
                  min="0"
                  placeholder="e.g. 300"
                  value={minStockAlertKg}
                  onChange={(e) => setMinStockAlertKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save / Add Fruit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
