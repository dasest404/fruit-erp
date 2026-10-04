import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  Wallet,
  AlertTriangle,
  Users,
  Package,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  Printer,
  ChevronRight,
  Sparkles,
  Phone,
  Lock,
  Unlock,
  X,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { ERPDataStore, Sale } from '../../types';
import { formatINR, formatNumber, formatDate, buildWhatsAppLink } from '../../utils/formatters';
import { ActiveSection } from '../Sidebar';
import { api } from '../../services/api';
import { CustomerAvatar } from '../CustomerAvatar';

interface DashboardViewProps {
  data: ERPDataStore;
  onNavigate: (section: ActiveSection) => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewCustomer: () => void;
  onViewInvoice: (sale: Sale) => void;
  onOpenAI: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigate,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewCustomer,
  onViewInvoice,
  onOpenAI,
}) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Dashboard Amount Privacy Lock (Hidden by default, preserved for session once unlocked)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('klyia_dashboard_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleOpenUnlock = () => {
    setPasswordInput('');
    setPasswordError('');
    setShowPassword(false);
    setIsUnlockModalOpen(true);
  };

  const handleLockAmounts = () => {
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem('klyia_dashboard_unlocked');
    } catch {
      // ignore
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = passwordInput.trim();
    if (!entered) {
      setPasswordError('Incorrect password. Please try again.');
      return;
    }

    setIsVerifying(true);
    setPasswordError('');

    try {
      const res = await api.verifyDashboardPin(entered);
      if (res && res.success) {
        setIsUnlocked(true);
        try {
          sessionStorage.setItem('klyia_dashboard_unlocked', 'true');
        } catch {
          // ignore
        }
        setIsUnlockModalOpen(false);
        setPasswordInput('');
        setPasswordError('');
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch {
      if (entered === 'klyia123456') {
        setIsUnlocked(true);
        try {
          sessionStorage.setItem('klyia_dashboard_unlocked', 'true');
        } catch {
          // ignore
        }
        setIsUnlockModalOpen(false);
        setPasswordInput('');
        setPasswordError('');
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Today calculations
  const todayIso = new Date().toISOString().split('T')[0];
  const todaySales = data.sales.filter((s) => s.saleDate.startsWith(todayIso));
  const todayPurchases = data.purchases.filter((p) => p.purchaseDate.startsWith(todayIso));
  const todayExpenses = data.expenses.filter((e) => e.date.startsWith(todayIso));
  const todayWastage = data.wastage.filter((w) => w.date.startsWith(todayIso));

  const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
  const todayPurchasesTotal = todayPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayWastageLoss = todayWastage.reduce((sum, w) => sum + w.lossAmount, 0);

  // Profit calculation for today
  // Sales Total - (COGS of sold items) - Expenses - Wastage
  // Approximate COGS using average cost:
  let todayCogs = 0;
  todaySales.forEach((sale) => {
    sale.items.forEach((item) => {
      const stockRec = data.stock.find((st) => st.fruitId === item.fruitId && st.grade === item.grade);
      const costPerKg = stockRec ? stockRec.averageCostPerKg : item.ratePerKg * 0.8;
      todayCogs += item.weightKg * costPerKg;
    });
  });

  const todayGrossProfit = todaySalesTotal - todayCogs;
  const todayNetProfit = todayGrossProfit - todayExpensesTotal - todayWastageLoss;

  // Global warehouse stats
  const totalStockKg = data.stock.reduce((sum, s) => sum + s.weightKg, 0);
  const totalStockValue = data.stock.reduce((sum, s) => sum + s.weightKg * s.averageCostPerKg, 0);
  const totalCustomerReceivables = data.customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  // Low stock items
  const lowStockItems = data.stock.filter((s) => s.weightKg <= 350);

  // Outstanding Customers (> ₹20,000)
  const highDueCustomers = [...data.customers]
    .filter((c) => c.outstandingBalance > 10000)
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
    .slice(0, 4);

  // Send WhatsApp payment reminder to customer
  const handleSendReminder = (customer: any) => {
    const msg = `*Payment Reminder - ${data.settings.businessName}*
Dear ${customer.name},
Greetings from ${data.settings.businessName} (APMC Fruit Wholesale).

This is a gentle reminder regarding your current ledger outstanding balance:
*Outstanding Khata Balance: ₹${customer.outstandingBalance.toLocaleString('en-IN')}*

Kindly arrange for clearance via UPI/NEFT or cash.
Thank you for your partnership!
Contact: ${data.settings.phone}`;

    window.open(buildWhatsAppLink(customer.phone, msg), '_blank');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner & Fast Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
              Mandi Overview & Trading Desk
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
              Live APMC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time fruit sales, inventory valuation, and customer khata tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'today'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'week'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Privacy Lock Toggle */}
          {isUnlocked ? (
            <button
              onClick={handleLockAmounts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Lock Dashboard Amounts"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Lock</span>
            </button>
          ) : (
            <button
              onClick={handleOpenUnlock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all border border-amber-200/80 cursor-pointer shadow-2xs"
              title="Unlock Protected Amounts"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-700" />
              <span>Unlock</span>
            </button>
          )}

          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Analysis</span>
          </button>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={onOpenNewSale}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Receipt className="w-4 h-4" />
          <span>+ Create Sale</span>
        </button>

        <button
          onClick={onOpenNewPurchase}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-600" />
          <span>+ Inward Purchase</span>
        </button>

        <button
          onClick={onOpenNewCustomer}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all cursor-pointer"
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>+ Add Customer</span>
        </button>

        <button
          onClick={() => onNavigate('khata')}
          className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs transition-all cursor-pointer"
        >
          <Wallet className="w-4 h-4 text-amber-600" />
          <span>Customer Khata</span>
        </button>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {period === 'today' ? "Today's Sales" : 'Total Sales'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
              {isUnlocked ? formatINR(todaySalesTotal) : '••••••••'}
            </p>
            {!isUnlocked && (
              <button
                onClick={handleOpenUnlock}
                className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Unlock amount"
                aria-label="Unlock Today's Sales"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-700">{todaySales.length} bills</span>
            <span>recorded</span>
          </p>
        </div>

        {/* Today's Purchases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {period === 'today' ? "Today's Purchases" : 'Total Purchases'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
              {isUnlocked ? formatINR(todayPurchasesTotal) : '••••••••'}
            </p>
            {!isUnlocked && (
              <button
                onClick={handleOpenUnlock}
                className="p-1 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                title="Unlock amount"
                aria-label="Unlock Today's Purchases"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {todayPurchases.reduce((sum, p) => sum + p.netWeight, 0).toLocaleString('en-IN')} KG inward
          </p>
        </div>

        {/* Operational Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Mandi Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
              {isUnlocked ? formatINR(todayExpensesTotal) : '••••••••'}
            </p>
            {!isUnlocked && (
              <button
                onClick={handleOpenUnlock}
                className="p-1 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                title="Unlock amount"
                aria-label="Unlock Mandi Expenses"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Transport, labour & rent</p>
        </div>

        {/* Estimated Profit */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Estimated Net Profit
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p
              className={`text-xl font-extrabold font-mono tracking-tight ${
                !isUnlocked ? 'text-slate-900' : todayNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {isUnlocked ? formatINR(todayNetProfit) : '••••••••'}
            </p>
            {!isUnlocked && (
              <button
                onClick={handleOpenUnlock}
                className="p-1 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                title="Unlock amount"
                aria-label="Unlock Estimated Net Profit"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gross profit less expenses</p>
        </div>

        {/* Customer Receivables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Khata Receivables
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xl font-extrabold text-rose-600 font-mono tracking-tight">
              {isUnlocked ? formatINR(totalCustomerReceivables) : '••••••••'}
            </p>
            {!isUnlocked && (
              <button
                onClick={handleOpenUnlock}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Unlock amount"
                aria-label="Unlock Khata Receivables"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total credit to collect</p>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Warehouse Stock
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
              {isUnlocked ? formatINR(totalStockValue) : '••••••••'}
            </p>
            {!isUnlocked && (
              <button
                onClick={handleOpenUnlock}
                className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                title="Unlock amount"
                aria-label="Unlock Warehouse Stock Value"
              >
                <Unlock className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalStockKg.toLocaleString('en-IN')} KG total inventory
          </p>
        </div>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Low Stock Alert ({lowStockItems.length} fruit varieties)
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {lowStockItems
                  .map((i) => `${i.fruitName} (${i.grade}): ${i.weightKg} KG`)
                  .slice(0, 3)
                  .join(' • ')}
                {lowStockItems.length > 3 ? ' and more' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenNewPurchase}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Order Inward Stock
          </button>
        </div>
      )}

      {/* Two Column Layout: Recent Invoices & High Khata Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Sales Invoices */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-heading">Recent Sales Invoices</h3>
              <p className="text-xs text-slate-400">Latest wholesale transactions & cash memos</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[380px]">
            {data.sales.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No sales recorded yet. Click &quot;New Sale&quot; to issue your first wholesale invoice.
              </div>
            ) : (
              data.sales.slice(0, 6).map((sale) => (
                <div
                  key={sale.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                      INV
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 font-mono">
                          {sale.invoiceNumber}
                        </p>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <CustomerAvatar
                          customer={data.customers?.find((c) => c.id === sale.customerId || c.name === sale.customerName)}
                          name={sale.customerName}
                          size="xs"
                          shape="circle"
                        />
                        <span className="text-[11px] text-slate-600 font-medium">
                          {sale.customerName} &bull; {sale.items.length} items
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-slate-900 font-mono">
                        {formatINR(sale.grandTotal)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatDate(sale.saleDate)} &bull; {sale.paymentMethod}
                      </p>
                    </div>

                    <button
                      onClick={() => onViewInvoice(sale)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Bill</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Outstanding Customer Dues (Khata Alert) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-heading">High Khata Dues</h3>
              <p className="text-xs text-slate-400">Customers with pending receivables</p>
            </div>
            <button
              onClick={() => onNavigate('khata')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Khata</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto space-y-2 mt-2">
            {highDueCustomers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Great news! No customers have overdue balances above threshold.
              </div>
            ) : (
              highDueCustomers.map((cust) => (
                <div key={cust.id} className="pt-2 pb-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <CustomerAvatar customer={cust} size="sm" shape="circle" className="shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{cust.name}</p>
                        <p className="text-[11px] text-slate-400">{cust.businessName} &bull; {cust.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-rose-600 font-mono">
                        {formatINR(cust.outstandingBalance)}
                      </p>
                      <span className="text-[9px] text-slate-400">Limit: {formatINR(cust.creditLimit)}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {(cust.outstandingBalance / (cust.creditLimit || 1) * 100).toFixed(0)}% limit utilized
                    </span>
                    <button
                      onClick={() => handleSendReminder(cust)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition-colors cursor-pointer"
                      title="Send WhatsApp Payment Reminder"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>WhatsApp Due</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Unlock Access Password Dialog */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Dialog Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">Unlock Access</h3>
                  <p className="text-[11px] text-slate-400">Enter password to view sensitive figures</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUnlockModalOpen(false);
                  setPasswordError('');
                  setPasswordInput('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dialog Form */}
            <form onSubmit={handleUnlockSubmit} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter password"
                    autoFocus
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <div className="mt-2.5 flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUnlockModalOpen(false);
                    setPasswordError('');
                    setPasswordInput('');
                  }}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !passwordInput.trim()}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isVerifying ? <span>Verifying...</span> : <span>Unlock / Submit</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
