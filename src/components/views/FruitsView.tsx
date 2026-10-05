import React, { useState, useMemo, useRef } from 'react';
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
  Upload,
  Image as ImageIcon,
  Check,
  Eye,
  Power,
  ShieldCheck,
  Tag,
  Hash,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ERPDataStore, Fruit, FruitGradePrice } from '../../types';
import { formatINR, downloadCSV } from '../../utils/formatters';
import { api } from '../../services/api';
import { FruitAvatar } from '../FruitAvatar';
import { FruitIconPickerModal } from '../FruitIconPickerModal';
import { SYSTEM_DEFAULT_FRUIT_ICON } from '../../config/fruitIcons';
import { compressImageFile, validateImageFile } from '../../utils/imageUtils';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFruit, setEditingFruit] = useState<Fruit | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Apple');
  const [variety, setVariety] = useState('Standard');
  const [unit, setUnit] = useState<string>('KG');
  const [defaultRate, setDefaultRate] = useState<number | ''>(100);
  const [gstRate, setGstRate] = useState<number | ''>(0);
  const [hsn, setHsn] = useState('0808');
  const [description, setDescription] = useState('');
  const [minStockAlertKg, setMinStockAlertKg] = useState<number | ''>(300);
  const [isActive, setIsActive] = useState(true);

  // Visual Identifiers
  const [avatarIcon, setAvatarIcon] = useState('🍎');
  const [photoUrl, setPhotoUrl] = useState('');
  const [customIconUrl, setCustomIconUrl] = useState('');

  // Icon Picker Modal State
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [directIconFruit, setDirectIconFruit] = useState<Fruit | null>(null);

  // View Details Modal
  const [viewingFruit, setViewingFruit] = useState<Fruit | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const directPhotoInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'all',
    'Apple',
    'Mango',
    'Banana',
    'Citrus',
    'Berries & Grapes',
    'Melons',
    'Exotic Fruit',
    'Seasonal Fruit',
    'Dry Fruit',
    'Packaging',
    'Other',
  ];

  const units = ['KG', 'BOX', 'DOZEN', 'PIECE', 'CRATE', 'TON', 'BAG'];

  const handleOpenAdd = () => {
    setEditingFruit(null);
    setName('');
    setShortName('');
    setCode(`FRT-${String(data.fruits.length + 1).padStart(3, '0')}`);
    setCategory('Apple');
    setVariety('Standard');
    setUnit('KG');
    setDefaultRate(100);
    setGstRate(0);
    setHsn('0808');
    setDescription('');
    setMinStockAlertKg(300);
    setIsActive(true);
    setAvatarIcon('🍎');
    setPhotoUrl('');
    setCustomIconUrl('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Fruit) => {
    setEditingFruit(f);
    setName(f.name);
    setShortName(f.shortName || f.name.split(' ')[0] || '');
    setCode(f.code || f.productCode || `FRT-${f.id.replace(/\D/g, '').slice(-3)}`);
    setCategory(f.category || 'Apple');
    setVariety(f.variety || 'Standard');
    setUnit(f.unit || 'KG');
    setDefaultRate(f.defaultRate !== undefined ? f.defaultRate : (f.grades?.[0]?.wholesaleRate || 100));
    setGstRate(f.gstRate !== undefined ? f.gstRate : 0);
    setHsn(f.hsn || f.hsnSac || '0808');
    setDescription(f.description || '');
    setMinStockAlertKg(
      f.minStockAlertKg !== undefined
        ? f.minStockAlertKg
        : f.minStock !== undefined
        ? f.minStock
        : 300
    );
    setIsActive(f.status !== 'inactive');

    // Visuals
    const isImgUrl = f.image && (f.image.startsWith('data:') || f.image.startsWith('http') || f.image.startsWith('/'));
    setPhotoUrl(f.photoUrl || (isImgUrl ? f.image! : ''));
    setCustomIconUrl(f.customIconUrl || '');
    setAvatarIcon(f.avatarIcon || f.defaultIcon || (!isImgUrl && f.image ? f.image : '🍎'));

    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveFruit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Fruit/Product Name is required.');
      return;
    }

    const rateNum = Number(defaultRate) || 0;
    const defaultGrades: FruitGradePrice[] = editingFruit?.grades?.length
      ? editingFruit.grades
      : [
          { grade: 'A', purchaseRate: Math.round(rateNum * 0.8), wholesaleRate: rateNum, retailRate: Math.round(rateNum * 1.2), currentStockKg: 0 },
          { grade: 'B', purchaseRate: Math.round(rateNum * 0.65), wholesaleRate: Math.round(rateNum * 0.85), retailRate: rateNum, currentStockKg: 0 },
          { grade: 'C', purchaseRate: Math.round(rateNum * 0.5), wholesaleRate: Math.round(rateNum * 0.7), retailRate: Math.round(rateNum * 0.85), currentStockKg: 0 },
          { grade: 'Damaged', purchaseRate: Math.round(rateNum * 0.25), wholesaleRate: Math.round(rateNum * 0.35), retailRate: Math.round(rateNum * 0.4), currentStockKg: 0 },
        ];

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        name: name.trim(),
        shortName: shortName.trim() || name.trim().split(' ')[0],
        code: code.trim() || `FRT-${String(data.fruits.length + 1).padStart(3, '0')}`,
        productCode: code.trim() || `FRT-${String(data.fruits.length + 1).padStart(3, '0')}`,
        category: category.trim() || 'Apple',
        variety: variety.trim() || 'Standard',
        unit: unit.trim() || 'KG',
        defaultRate: rateNum,
        gstRate: Number(gstRate) || 0,
        hsn: hsn.trim() || '0808',
        hsnSac: hsn.trim() || '0808',
        description: description.trim(),
        minStockAlertKg: Number(minStockAlertKg) || 0,
        minStock: Number(minStockAlertKg) || 0,
        photoUrl: photoUrl.trim() || undefined,
        customIconUrl: customIconUrl.trim() || undefined,
        avatarIcon: avatarIcon.trim() || '🍎',
        defaultIcon: avatarIcon.trim() || '🍎',
        image: photoUrl.trim() || customIconUrl.trim() || avatarIcon.trim() || '🍎',
        status: isActive ? 'active' : 'inactive',
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

  const handleToggleStatus = async (fruit: Fruit) => {
    const newStatus = fruit.status === 'inactive' ? 'active' : 'inactive';
    try {
      await api.updateFruit(fruit.id, { status: newStatus });
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update fruit status.');
    }
  };

  const handleDeleteFruit = async (fruit: Fruit) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete "${fruit.name}"? If it has historical billing records, it will be safely deactivated.`)) {
      return;
    }
    try {
      await api.deleteFruit(fruit.id);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete fruit.');
    }
  };

  // Direct Icon change from table/grid
  const handleOpenDirectIcon = (f: Fruit) => {
    setDirectIconFruit(f);
    const isImgUrl = f.image && (f.image.startsWith('data:') || f.image.startsWith('http') || f.image.startsWith('/'));
    setPhotoUrl(f.photoUrl || (isImgUrl ? f.image! : ''));
    setCustomIconUrl(f.customIconUrl || '');
    setAvatarIcon(f.avatarIcon || f.defaultIcon || (!isImgUrl && f.image ? f.image : '🍎'));
    setIsIconPickerOpen(true);
  };

  const handleDirectIconApply = async (selected: { icon?: string; photo?: string; customIcon?: string }) => {
    if (!directIconFruit) return;
    try {
      const payload: any = {};
      if (selected.photo) {
        payload.photoUrl = selected.photo;
        payload.image = selected.photo;
      } else if (selected.customIcon) {
        payload.customIconUrl = selected.customIcon;
        payload.photoUrl = null;
        payload.image = selected.customIcon;
      } else if (selected.icon) {
        payload.avatarIcon = selected.icon;
        payload.defaultIcon = selected.icon;
        payload.photoUrl = null;
        payload.customIconUrl = null;
        payload.image = selected.icon;
      }
      await api.updateFruit(directIconFruit.id, payload);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update fruit visual.');
    } finally {
      setDirectIconFruit(null);
    }
  };

  const filteredFruits = useMemo(() => {
    return data.fruits.filter((f) => {
      const term = searchTerm.toLowerCase().trim();
      const codeStr = (f.code || f.productCode || '').toLowerCase();
      const shortStr = (f.shortName || '').toLowerCase();
      const nameStr = f.name.toLowerCase();
      const catStr = f.category.toLowerCase();

      const matchesSearch =
        !term ||
        nameStr.includes(term) ||
        codeStr.includes(term) ||
        shortStr.includes(term) ||
        catStr.includes(term);

      const matchesCategory = selectedCategory === 'all' || f.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && f.status !== 'inactive') ||
        (statusFilter === 'inactive' && f.status === 'inactive');

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data.fruits, searchTerm, selectedCategory, statusFilter]);

  const handleExportCSV = () => {
    const headers = [
      'Product Code',
      'Fruit Name',
      'Short Name',
      'Category',
      'Unit',
      'Default Rate (₹)',
      'GST %',
      'HSN/SAC',
      'Min Stock (KG)',
      'Status',
    ];

    const rows = data.fruits.map((f) => [
      f.code || f.productCode || '',
      f.name,
      f.shortName || '',
      f.category,
      f.unit,
      f.defaultRate !== undefined ? f.defaultRate : (f.grades?.[0]?.wholesaleRate ?? 0),
      f.gstRate ?? 0,
      f.hsn ?? '0808',
      f.minStockAlertKg ?? f.minStock ?? 0,
      f.status || 'active',
    ]);

    downloadCSV(`FreshERP_Fruit_Master_Catalog_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs border border-emerald-100">
            <Apple className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
                Fruit Master Catalog
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                Masters
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Central fruit catalog, multi-tier icons, default rates, GST & inventory thresholds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Catalog Cards
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Export Fruits Catalog to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Fruit</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by fruit name, short name, code, or category..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Status ({data.fruits.length})</option>
              <option value="active">Active Only ({data.fruits.filter((f) => f.status !== 'inactive').length})</option>
              <option value="inactive">Inactive Only ({data.fruits.filter((f) => f.status === 'inactive').length})</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* FRUIT MASTER LIST: TABLE VIEW (PART 7 & PART 8) */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-14 text-center">ICON</th>
                  <th className="py-3 px-4">Fruit / Product</th>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3 text-right">Default Rate</th>
                  <th className="py-3 px-3 text-center">GST</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredFruits.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No fruit records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredFruits.map((fruit) => {
                    const effectiveRate = fruit.defaultRate !== undefined
                      ? fruit.defaultRate
                      : (fruit.grades?.[0]?.wholesaleRate || 0);

                    const isInactive = fruit.status === 'inactive';

                    return (
                      <tr
                        key={fruit.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isInactive ? 'opacity-65 bg-slate-50/40' : ''
                        }`}
                      >
                        {/* ICON column */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenDirectIcon(fruit)}
                            className="cursor-pointer group relative inline-block"
                            title="Click to change fruit icon/photo"
                          >
                            <FruitAvatar fruit={fruit} size="sm" shape="square" />
                            <div className="absolute inset-0 bg-slate-900/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                              Edit
                            </div>
                          </button>
                        </td>

                        {/* Fruit Name & Short Name */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 font-heading">
                            {fruit.name}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            {fruit.shortName && (
                              <span>Short: <span className="font-semibold text-slate-600">{fruit.shortName}</span></span>
                            )}
                            {fruit.variety && fruit.variety !== 'Standard' && (
                              <span>• {fruit.variety}</span>
                            )}
                          </div>
                        </td>

                        {/* Product Code */}
                        <td className="py-3 px-3 font-mono text-[11px] font-bold text-slate-600">
                          {fruit.code || fruit.productCode || '—'}
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {fruit.category}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {fruit.unit}
                        </td>

                        {/* Default Rate */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatINR(effectiveRate)}
                        </td>

                        {/* GST */}
                        <td className="py-3 px-3 text-center font-mono text-slate-600">
                          {fruit.gstRate !== undefined ? `${fruit.gstRate}%` : '0%'}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(fruit)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              isInactive
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                            title="Click to toggle Active / Inactive"
                          >
                            {isInactive ? 'Inactive' : 'Active'}
                          </button>
                        </td>

                        {/* Actions: View | Edit | Change Icon | Deactivate */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingFruit(fruit)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="View Fruit Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenDirectIcon(fruit)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Change Icon / Photo"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(fruit)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              title="Edit Fruit Master"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteFruit(fruit)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Deactivate / Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* FRUIT MASTER LIST: CATALOG CARDS GRID (PART 7 & PART 8) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFruits.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              No fruit catalog items match your search.
            </div>
          ) : (
            filteredFruits.map((fruit) => {
              const effectiveRate = fruit.defaultRate !== undefined
                ? fruit.defaultRate
                : (fruit.grades?.[0]?.wholesaleRate || 0);

              const isInactive = fruit.status === 'inactive';

              return (
                <div
                  key={fruit.id}
                  className={`bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                    isInactive ? 'opacity-65 bg-slate-50/50' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FruitAvatar fruit={fruit} size="lg" shape="square" />
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 font-heading">
                            {fruit.name}
                          </h3>
                          <div className="text-[11px] text-slate-500 font-mono font-bold">
                            {fruit.code || fruit.productCode || '—'}
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            {fruit.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenDirectIcon(fruit)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Change Icon"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(fruit)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit Fruit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Pricing Pill */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Default Rate:</span>
                      <span className="text-sm font-mono font-extrabold text-slate-900">
                        {formatINR(effectiveRate)} / {fruit.unit}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>GST: {fruit.gstRate || 0}%</span>
                      <span>HSN: {fruit.hsn || '0808'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px]">
                    <button
                      onClick={() => handleToggleStatus(fruit)}
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                        isInactive
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isInactive ? 'Inactive' : 'Active'}
                    </button>

                    <button
                      onClick={() => setViewingFruit(fruit)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ADD / EDIT FRUIT MODAL (PART 3 & PART 4) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Apple className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base font-heading">
                    {editingFruit ? 'Edit Fruit in Master Catalog' : '+ Add Fruit to Master Catalog'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Central catalog entry for billing, stock, and pricing across ERP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFruit} className="p-5 flex-1 overflow-y-auto space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. VISUAL IDENTITY & ICON SECTION (PART 4 & PART 5) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Fruit Photo / Icon Visual
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Priority: Uploaded Image &rarr; Custom Icon &rarr; Default Icon &rarr; System Default
                  </span>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <FruitAvatar
                      photoUrl={photoUrl}
                      customIconUrl={customIconUrl}
                      avatarIcon={avatarIcon}
                      size="lg"
                      shape="square"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {photoUrl
                          ? '1. Uploaded Fruit Photo Active'
                          : customIconUrl
                          ? '2. Custom Icon Active'
                          : `3. Default Icon Active (${avatarIcon})`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Used consistently across Invoices, Sales, Inventory & Catalog
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsIconPickerOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Choose / Upload Visual</span>
                    </button>

                    {(photoUrl || customIconUrl || avatarIcon !== SYSTEM_DEFAULT_FRUIT_ICON) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('');
                          setCustomIconUrl('');
                          setAvatarIcon(SYSTEM_DEFAULT_FRUIT_ICON);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Icon
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. BASIC INFORMATION (PART 3) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Basic Product Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fruit / Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apple, Mango, Banana, Orange"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!shortName) setShortName(e.target.value.split(' ')[0]);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Short Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Apple, Mango, Kinnow"
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fruit / Product Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FRT-001"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                    >
                      <option value="Apple">Apple</option>
                      <option value="Mango">Mango</option>
                      <option value="Banana">Banana</option>
                      <option value="Citrus">Citrus</option>
                      <option value="Berries & Grapes">Berries & Grapes</option>
                      <option value="Melons">Melons</option>
                      <option value="Dry Fruit">Dry Fruit</option>
                      <option value="Seasonal Fruit">Seasonal Fruit</option>
                      <option value="Exotic Fruit">Exotic Fruit</option>
                      <option value="Packaging">Packaging</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                    >
                      {units.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Default Rate (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="e.g. 120"
                      value={defaultRate}
                      onChange={(e) => setDefaultRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      GST Rate (%)
                    </label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                    >
                      <option value={0}>0% (Fresh / Exempt)</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      HSN / SAC Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0808"
                      value={hsn}
                      onChange={(e) => setHsn(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Variety / Mandi Grade
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kinnaur, Alphonso, G9"
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Min Stock Alert (KG)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 300"
                      value={minStockAlertKg}
                      onChange={(e) => setMinStockAlertKg(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Mandi origin, quality notes, packaging type..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Status Toggle */}
                <div className="pt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Active (Available for billing and search)
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingFruit ? 'Update Fruit Record' : 'Save Fruit to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ICON PICKER MODAL (STANDALONE & DIRECT) */}
      <FruitIconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => {
          setIsIconPickerOpen(false);
          setDirectIconFruit(null);
        }}
        selectedIcon={avatarIcon}
        photoUrl={photoUrl}
        customIconUrl={customIconUrl}
        onSelectIcon={(icon) => {
          setAvatarIcon(icon);
          setPhotoUrl('');
          setCustomIconUrl('');
          if (directIconFruit) {
            handleDirectIconApply({ icon });
          }
        }}
        onSelectPhoto={(photo) => {
          setPhotoUrl(photo);
          setCustomIconUrl('');
          if (directIconFruit) {
            handleDirectIconApply({ photo });
          }
        }}
        onSelectCustomIcon={(custom) => {
          setCustomIconUrl(custom);
          setPhotoUrl('');
          if (directIconFruit) {
            handleDirectIconApply({ customIcon: custom });
          }
        }}
        onClearVisuals={() => {
          setPhotoUrl('');
          setCustomIconUrl('');
          setAvatarIcon(SYSTEM_DEFAULT_FRUIT_ICON);
          if (directIconFruit) {
            handleDirectIconApply({ icon: SYSTEM_DEFAULT_FRUIT_ICON });
          }
        }}
      />

      {/* VIEW DETAILS MODAL */}
      {viewingFruit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FruitAvatar fruit={viewingFruit} size="md" shape="square" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base font-heading">
                    {viewingFruit.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Code: {viewingFruit.code || viewingFruit.productCode || '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingFruit(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-400">CATEGORY</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{viewingFruit.category}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-400">PRIMARY UNIT</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{viewingFruit.unit}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-400">DEFAULT RATE</div>
                  <div className="font-extrabold text-slate-900 font-mono mt-0.5">
                    {formatINR(viewingFruit.defaultRate || viewingFruit.grades?.[0]?.wholesaleRate || 0)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-400">GST RATE / HSN</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    {viewingFruit.gstRate || 0}% • {viewingFruit.hsn || '0808'}
                  </div>
                </div>
              </div>

              {viewingFruit.description && (
                <div className="p-3 bg-slate-50 rounded-2xl text-xs">
                  <div className="text-[10px] font-bold text-slate-400">DESCRIPTION</div>
                  <div className="text-slate-700 mt-1">{viewingFruit.description}</div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = viewingFruit;
                    setViewingFruit(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Edit Fruit
                </button>
                <button
                  type="button"
                  onClick={() => setViewingFruit(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
