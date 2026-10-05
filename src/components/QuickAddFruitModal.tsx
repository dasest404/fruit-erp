import React, { useState, useRef } from 'react';
import {
  X,
  Apple,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Tag,
  Hash,
  FileText,
} from 'lucide-react';
import { Fruit } from '../types';
import { api } from '../services/api';
import { FruitAvatar } from './FruitAvatar';
import { FruitIconPickerModal } from './FruitIconPickerModal';
import { SYSTEM_DEFAULT_FRUIT_ICON } from '../config/fruitIcons';
import { compressImageFile, validateImageFile } from '../utils/imageUtils';

interface QuickAddFruitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFruitCreated: (newFruit: Fruit) => void;
  onRefreshData?: () => Promise<void>;
  prefilledName?: string;
}

export const QuickAddFruitModal: React.FC<QuickAddFruitModalProps> = ({
  isOpen,
  onClose,
  onFruitCreated,
  onRefreshData,
  prefilledName = '',
}) => {
  const [name, setName] = useState(prefilledName);
  const [shortName, setShortName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Apple');
  const [variety, setVariety] = useState('Standard');
  const [unit, setUnit] = useState('KG');
  const [defaultRate, setDefaultRate] = useState<number | ''>(100);
  const [gstRate, setGstRate] = useState<number | ''>(0);
  const [hsn, setHsn] = useState('0808');
  const [description, setDescription] = useState('');

  // 3-Option Visual State
  const [avatarIcon, setAvatarIcon] = useState('🍎');
  const [photoUrl, setPhotoUrl] = useState('');
  const [customIconUrl, setCustomIconUrl] = useState('');

  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories = [
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const val = validateImageFile(file);
    if (!val.valid) {
      setErrorMessage(val.error || 'Invalid file format.');
      return;
    }

    try {
      const dataUri = await compressImageFile(file, { maxWidth: 360, maxHeight: 360, cropToSquare: true });
      setPhotoUrl(dataUri);
      setErrorMessage('');
    } catch {
      setErrorMessage('Failed to compress image file.');
    }
  };

  const handleIconPickerApply = (selected: { icon?: string; photo?: string; customIcon?: string }) => {
    if (selected.photo) {
      setPhotoUrl(selected.photo);
    } else if (selected.customIcon) {
      setCustomIconUrl(selected.customIcon);
      setPhotoUrl('');
    } else if (selected.icon) {
      setAvatarIcon(selected.icon);
      setPhotoUrl('');
      setCustomIconUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Fruit / Product Name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const rateNum = Number(defaultRate) || 80;
      const defaultGrades = [
        {
          grade: 'Standard' as any,
          purchaseRate: Math.round(rateNum * 0.8),
          wholesaleRate: rateNum,
          retailRate: Math.round(rateNum * 1.2),
        },
      ];

      const payload = {
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        code: code.trim().toUpperCase() || undefined,
        productCode: code.trim().toUpperCase() || undefined,
        category,
        variety: variety.trim() || 'Standard',
        unit,
        defaultRate: rateNum,
        gstRate: Number(gstRate) || 0,
        hsn: hsn.trim() || '0808',
        hsnSac: hsn.trim() || '0808',
        description: description.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
        customIconUrl: customIconUrl.trim() || undefined,
        avatarIcon: avatarIcon.trim() || '🍎',
        defaultIcon: avatarIcon.trim() || '🍎',
        image: photoUrl.trim() || customIconUrl.trim() || avatarIcon.trim() || '🍎',
        status: 'active',
        grades: defaultGrades,
        minStock: 100,
        minStockAlertKg: 100,
      };

      const res = await api.createFruit(payload);
      const createdFruit = res.fruit;

      if (onRefreshData) {
        await onRefreshData();
      }

      onFruitCreated(createdFruit);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save fruit to catalog.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview fruit object
  const previewFruit: Partial<Fruit> = {
    name: name || 'New Fruit',
    photoUrl: photoUrl || undefined,
    customIconUrl: customIconUrl || undefined,
    avatarIcon: avatarIcon || '🍎',
    image: photoUrl || customIconUrl || avatarIcon || '🍎',
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center text-white">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base font-heading">
                  + Add New Fruit to Catalog
                </h3>
                <p className="text-[11px] text-emerald-200">
                  Adds to Fruit Master Catalog &amp; auto-selects for this current bill
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Visual Identification Picker Bar */}
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FruitAvatar fruit={previewFruit as Fruit} size="lg" shape="square" />
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Fruit Visual Identity
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {photoUrl ? 'Custom Image Uploaded' : customIconUrl ? 'Custom Icon' : `Icon: ${avatarIcon}`}
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Priority: Uploaded Image &gt; Custom &gt; Selected Icon &gt; System Default
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Choose Icon</span>
                </button>

                <input
                  type="file"
                  ref={photoInputRef}
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fruit / Product Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Mango Dasheri / Apple Kinnaur"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. DSHR / KNR"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Code, Category & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Code
                </label>
                <input
                  type="text"
                  placeholder="FRT-MAN-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Unit *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Default Rate, GST & HSN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Rate (₹ / Unit) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="120"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GST Rate (%)
                </label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value={0}>0% (Fresh Fruits Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12% (Processed / Dry)</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  placeholder="0808"
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Premium Uttar Pradesh Dussehri Mango wholesale lot"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium">
                ⚡ Auto-adds to this bill upon save
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Fruit...' : 'Save & Add to Bill'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Embedded Fruit Icon Picker Modal */}
      <FruitIconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        selectedIcon={avatarIcon}
        photoUrl={photoUrl}
        customIconUrl={customIconUrl}
        onSelectIcon={(icon) => {
          setAvatarIcon(icon);
          setPhotoUrl('');
          setCustomIconUrl('');
          setIsIconPickerOpen(false);
        }}
        onSelectPhoto={(photo) => {
          setPhotoUrl(photo);
          setIsIconPickerOpen(false);
        }}
        onSelectCustomIcon={(customIcon) => {
          setCustomIconUrl(customIcon);
          setPhotoUrl('');
          setIsIconPickerOpen(false);
        }}
        onClearVisuals={() => {
          setPhotoUrl('');
          setCustomIconUrl('');
          setAvatarIcon('🍎');
        }}
      />
    </>
  );
};
