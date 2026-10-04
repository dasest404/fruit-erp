import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  ShoppingBag,
  X,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  Calculator,
  Edit2,
} from 'lucide-react';
import { ERPDataStore, Purchase } from '../../types';
import { formatINR, formatCurrencyAmount, formatDate, downloadCSV } from '../../utils/formatters';
import { api } from '../../services/api';

interface PurchasesViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
  initialCreateModalOpen?: boolean;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  data,
  onRefreshData,
  initialCreateModalOpen = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(initialCreateModalOpen);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (initialCreateModalOpen) {
      setEditingPurchase(null);
      setIsModalOpen(true);
    }
  }, [initialCreateModalOpen]);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [fruitId, setFruitId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | 'Damaged'>('A');
  const [crateCount, setCrateCount] = useState<number | ''>('');
  const [grossWeight, setGrossWeight] = useState<number | ''>('');
  const [tareWeight, setTareWeight] = useState<number | ''>(0);
  const [purchaseRate, setPurchaseRate] = useState<number | ''>('');
  const [transportCost, setTransportCost] = useState<number | ''>(0);
  const [commissionCost, setCommissionCost] = useState<number | ''>(0);
  const [otherCost, setOtherCost] = useState<number | ''>(0);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'credit'>('credit');
  const [paidAmount, setPaidAmount] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Automatic Real-time Mandi Calculations
  const numGross = Number(grossWeight) || 0;
  const numTare = Number(tareWeight) || 0;
  const netWeight = Math.max(0, numGross - numTare);

  const numRate = Number(purchaseRate) || 0;
  const purchaseValue = Math.round(netWeight * numRate);

  const numTransport = Number(transportCost) || 0;
  const numComm = Number(commissionCost) || 0;
  const numOther = Number(otherCost) || 0;

  const totalCost = purchaseValue + numTransport + numComm + numOther;
  const effectiveCostPerKg = netWeight > 0 ? Number((totalCost / netWeight).toFixed(2)) : 0;

  const handleOpenCreate = () => {
    setEditingPurchase(null);
    setSupplierId('');
    setFruitId('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setGrade('A');
    setCrateCount('');
    setGrossWeight('');
    setTareWeight(0);
    setPurchaseRate('');
    setTransportCost(0);
    setCommissionCost(0);
    setOtherCost(0);
    setPaymentStatus('credit');
    setPaidAmount(0);
    setNotes('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditPurchase = (p: Purchase) => {
    setEditingPurchase(p);
    setSupplierId(p.supplierId);
    setFruitId(p.fruitId);
    setPurchaseDate(p.purchaseDate ? p.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setGrade((p.grade as any) || 'A');
    setCrateCount((p as any).crateCount ?? p.crateQuantity ?? '');
    setGrossWeight(p.grossWeight || '');
    setTareWeight(p.tareWeight || 0);
    setPurchaseRate(p.purchaseRate || '');
    setTransportCost(p.transportCost || 0);
    setCommissionCost(p.commissionCost || 0);
    setOtherCost(p.otherCost || 0);
    setPaymentStatus((p.paymentStatus as any) || 'credit');
    setPaidAmount(p.paidAmount || 0);
    setNotes(p.notes || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setErrorMessage('Please choose a supplier.');
      return;
    }
    if (!fruitId) {
      setErrorMessage('Please select a fruit.');
      return;
    }
    if (netWeight <= 0) {
      setErrorMessage('Net weight must be greater than zero.');
      return;
    }
    if (numRate <= 0) {
      setErrorMessage('Purchase rate must be greater than zero.');
      return;
    }

    const supplier = data.suppliers.find((s) => s.id === supplierId);
    const fruit = data.fruits.find((f) => f.id === fruitId);
    if (!supplier || !fruit) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        supplierId: supplier.id,
        supplierName: supplier.name,
        fruitId: fruit.id,
        fruitName: fruit.name,
        grade,
        crateCount: Number(crateCount) || 0,
        grossWeight: numGross,
        tareWeight: numTare,
        purchaseRate: numRate,
        transportCost: numTransport,
        commissionCost: numComm,
        otherCost: numOther,
        paymentStatus,
        paidAmount: Number(paidAmount) || 0,
        notes,
        purchaseDate,
      };

      if (editingPurchase) {
        await api.updatePurchase(editingPurchase.id, payload);
      } else {
        await api.createPurchase(payload);
      }

      await onRefreshData();
      setIsModalOpen(false);
      setEditingPurchase(null);
      // Reset form
      setSupplierId('');
      setFruitId('');
      setCrateCount('');
      setGrossWeight('');
      setTareWeight(0);
      setPurchaseRate('');
      setTransportCost(0);
      setCommissionCost(0);
      setOtherCost(0);
      setPaidAmount(0);
      setNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPurchases = data.purchases.filter(
    (p) =>
      p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fruitName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = [
      'Purchase No',
      'Date',
      'Supplier',
      'Fruit',
      'Grade',
      'Net Weight (KG)',
      'Rate/KG',
      'Purchase Value',
      'Freight/Costs',
      'Total Cost',
      'Effective Cost/KG',
      'Status',
    ];
    const rows = filteredPurchases.map((p) => [
      p.purchaseNumber,
      formatDate(p.purchaseDate),
      p.supplierName,
      p.fruitName,
      p.grade,
      p.netWeight,
      p.purchaseRate,
      p.purchaseValue,
      p.transportCost + p.commissionCost + p.otherCost,
      p.totalCost,
      p.effectiveCostPerKg,
      p.paymentStatus,
    ]);
    downloadCSV(`Purchases_Inward_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
            Purchases & Inward Stock
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Log mandi lot receipts with automated tare weight and landing cost calculation
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
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Inward New Stock</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-md">
          <label htmlFor="purchases-search-input" className="sr-only">Search purchases</label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="purchases-search-input"
            aria-label="Search purchases"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by supplier, fruit, purchase lot no..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="table-container">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Lot No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Fruit Item</th>
                <th className="py-3 px-4 text-right">Net Weight</th>
                <th className="py-3 px-4 text-right">Purchase Rate</th>
                <th className="py-3 px-4 text-right">Landing Cost/KG</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No inward purchases found. Click &quot;+ Inward New Stock&quot; to log a fruit delivery.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {purchase.purchaseNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(purchase.purchaseDate)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{purchase.supplierName}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{purchase.fruitName}</span>{' '}
                      <span className="text-[11px] text-slate-500">({purchase.grade})</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      {purchase.netWeight.toLocaleString('en-IN')} KG
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{formatINR(purchase.purchaseRate)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatINR(purchase.effectiveCostPerKg)}/kg
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono">
                      {formatINR(purchase.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          purchase.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : purchase.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {purchase.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEditPurchase(purchase)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Edit / Modify Purchase"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-xs font-semibold">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW INWARD PURCHASE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-base font-heading">
                    {editingPurchase ? `Edit Inward Purchase #${editingPurchase.purchaseNumber}` : 'Record Inward Fruit Purchase'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingPurchase ? 'Modify purchase details & recalculate stock, ledger, and balances' : 'Stock increase & supplier ledger update'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPurchase(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Supplier, Fruit, Grade & Date Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="purchase-supplier-id" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Supplier / Mandi Vendor *
                  </label>
                  <select
                    id="purchase-supplier-id"
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {data.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contactPerson}) - Due: {formatINR(s.outstandingPayable)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="purchase-fruit-id" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Fruit *
                  </label>
                  <select
                    id="purchase-fruit-id"
                    required
                    value={fruitId}
                    onChange={(e) => setFruitId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Fruit --</option>
                    {data.fruits.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.image} {f.name} ({f.variety})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="purchase-grade" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Fruit Grade
                  </label>
                  <select
                    id="purchase-grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="A">Grade A (Super)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Economy)</option>
                    <option value="Damaged">Damaged / Salvage</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="purchase-date" className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Purchase Date *
                  </label>
                  <input
                    id="purchase-date"
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Weighment Section with Automated Net Weight */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mandi Weighment & Tare Deduction</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Net Weight: {netWeight.toLocaleString('en-IN')} KG
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                  <div>
                    <label htmlFor="purchase-crate-count" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Crates / Bags
                    </label>
                    <input
                      id="purchase-crate-count"
                      type="number"
                      placeholder="e.g. 80"
                      value={crateCount}
                      onChange={(e) => setCrateCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="purchase-gross-weight" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Gross Wt (KG) *
                    </label>
                    <input
                      id="purchase-gross-weight"
                      type="number"
                      required
                      placeholder="Gross KG"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="purchase-tare-weight" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tare Wt (KG)
                    </label>
                    <input
                      id="purchase-tare-weight"
                      type="number"
                      placeholder="Tare KG"
                      value={tareWeight}
                      onChange={(e) => setTareWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="purchase-rate" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Rate (₹/KG) *
                    </label>
                    <input
                      id="purchase-rate"
                      type="number"
                      required
                      placeholder="Rate / KG"
                      value={purchaseRate}
                      onChange={(e) => setPurchaseRate(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-right shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Amount
                    </label>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={formatCurrencyAmount(purchaseValue)}
                      className="w-full h-10 px-3 py-2 bg-emerald-50/80 border border-emerald-300 rounded-xl text-xs font-black text-emerald-800 font-mono text-right focus:outline-none cursor-default select-none shadow-2xs"
                      aria-label="Calculated Base Purchase Value"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Inward Landing Costs */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                  Freight & Mandi Commission Costs
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="purchase-transport-cost" className="block text-[10px] font-bold text-slate-600 mb-1">Transport / Freight (₹)</label>
                    <input
                      id="purchase-transport-cost"
                      type="number"
                      value={transportCost}
                      onChange={(e) => setTransportCost(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="purchase-commission-cost" className="block text-[10px] font-bold text-slate-600 mb-1">Mandi Commission / Cess (₹)</label>
                    <input
                      id="purchase-commission-cost"
                      type="number"
                      value={commissionCost}
                      onChange={(e) => setCommissionCost(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="purchase-other-cost" className="block text-[10px] font-bold text-slate-600 mb-1">Hamali / Unloading (₹)</label>
                    <input
                      id="purchase-other-cost"
                      type="number"
                      value={otherCost}
                      onChange={(e) => setOtherCost(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Calculations Bar & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="purchase-payment-status" className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                    <select
                      id="purchase-payment-status"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="credit">Credit (Add to Supplier Payable)</option>
                      <option value="paid">Fully Paid</option>
                      <option value="partial">Partially Paid</option>
                    </select>
                  </div>

                  {paymentStatus !== 'credit' && (
                    <div>
                      <label htmlFor="purchase-paid-amount" className="block text-xs font-bold text-slate-700 mb-1">Amount Paid Now (₹)</label>
                      <input
                        id="purchase-paid-amount"
                        type="number"
                        placeholder="Amount"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="purchase-notes" className="block text-xs font-bold text-slate-700 mb-1">Lot Notes / Vehicle No</label>
                    <input
                      id="purchase-notes"
                      type="text"
                      placeholder="e.g. Truck HP-12-B-9988 from Shimla"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Final Computation Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-2">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Base Purchase Value:</span>
                      <span className="font-semibold text-slate-900 font-mono">{formatINR(purchaseValue)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Freight & Handling:</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        {formatINR(numTransport + numComm + numOther)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Inward Cost:</span>
                      <span className="text-emerald-700 font-mono">{formatINR(totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-blue-700 pt-1">
                      <span>Effective Landing Cost/KG:</span>
                      <span className="font-mono">{formatINR(effectiveCostPerKg)} / KG</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || netWeight <= 0 || numRate <= 0 || !supplierId || !fruitId}
                    className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Updating Inventory & Ledger...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{editingPurchase ? 'Save Changes' : 'Confirm Inward Purchase'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
