import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  Users,
  PieChart as PieIcon,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { ERPDataStore } from '../../types';
import { formatINR, formatDate, downloadCSV } from '../../utils/formatters';
import { DEFAULT_COMPANY_PROFILE } from '../../config/companyProfile';

interface ReportsViewProps {
  data: ERPDataStore;
  initialTab?: 'pnl' | 'fruits' | 'aging';
}

export const ReportsView: React.FC<ReportsViewProps> = ({ data, initialTab = 'pnl' }) => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'fruits' | 'aging'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Overall Financials
  const totalSalesRevenue = data.sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPurchasesCost = data.purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalExpenses = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalWastageLoss = data.wastage.reduce((sum, w) => sum + w.costLoss, 0);
  const totalCurrentStockValue = data.stock.reduce(
    (sum, s) => sum + s.weightKg * s.averageCostPerKg,
    0
  );

  // Profit calculations
  const grossProfitEstimate = totalSalesRevenue - totalPurchasesCost + totalCurrentStockValue;
  const netProfitEstimate = grossProfitEstimate - totalExpenses - totalWastageLoss;
  const netMargin = totalSalesRevenue > 0 ? ((netProfitEstimate / totalSalesRevenue) * 100).toFixed(1) : '0';

  // Fast vs Slow moving fruits
  const fruitSalesKg: { [name: string]: { weight: number; revenue: number } } = {};
  data.sales.forEach((s) => {
    s.items.forEach((item) => {
      if (!fruitSalesKg[item.fruitName]) {
        fruitSalesKg[item.fruitName] = { weight: 0, revenue: 0 };
      }
      fruitSalesKg[item.fruitName].weight += item.weightKg;
      fruitSalesKg[item.fruitName].revenue += item.totalPrice;
    });
  });

  const sortedFruits = Object.entries(fruitSalesKg)
    .map(([fruitName, val]) => ({ fruitName, ...val }))
    .sort((a, b) => b.weight - a.weight);

  // Aging Receivables
  const overdue30Plus = data.customers
    .filter((c) => c.outstandingBalance > 50000)
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance);

  const handleExportFinancialsCSV = () => {
    const headers = ['Financial Metric', 'Amount (₹)'];
    const rows = [
      ['Total Sales Revenue', totalSalesRevenue],
      ['Total Fruit Inward Cost', totalPurchasesCost],
      ['Operational Overheads & Freight', totalExpenses],
      ['Spoilage & Wastage Damage', totalWastageLoss],
      ['Current Floor Stock Valuation', Math.round(totalCurrentStockValue)],
      ['Estimated Net Profit', Math.round(netProfitEstimate)],
    ];
    downloadCSV(`P_and_L_Financials_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* PRINT ONLY: OFFICIAL HFC BRANDING HEADER FOR REPORTS */}
      <div className="hidden print:flex flex-row justify-between items-start gap-4 pb-4 border-b-2 border-slate-900 mb-6">
        <div className="flex items-start gap-4">
          <img
            src="/assets/hfc-logo.svg"
            alt="Hari Kripa Fruit Company"
            className="h-16 w-auto object-contain shrink-0"
          />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 font-heading">
              {data.settings?.businessName || DEFAULT_COMPANY_PROFILE.name}
            </h1>
            <p className="text-emerald-700 font-bold text-xs uppercase tracking-wider mt-0.5">
              {data.settings?.tagline || DEFAULT_COMPANY_PROFILE.tagline}
            </p>
            <p className="text-slate-600 mt-1 max-w-md leading-relaxed text-xs">
              {data.settings?.address || DEFAULT_COMPANY_PROFILE.address}
            </p>
            <div className="text-slate-600 mt-1 text-xs space-y-0.5">
              <p>
                <span className="font-semibold text-slate-700">Phones:</span>{' '}
                <span>{data.settings?.phone1 || data.settings?.phone || DEFAULT_COMPANY_PROFILE.phone1}</span> •{' '}
                <span>{DEFAULT_COMPANY_PROFILE.phone2} ({DEFAULT_COMPANY_PROFILE.phone2Label})</span> •{' '}
                <span>{DEFAULT_COMPANY_PROFILE.phone3} ({DEFAULT_COMPANY_PROFILE.phone3Label})</span>
              </p>
              <p>
                <span className="font-semibold text-slate-700">Email:</span>{' '}
                <span>{data.settings?.email || DEFAULT_COMPANY_PROFILE.email}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-white font-bold text-xs uppercase tracking-wider mb-1">
            Executive Financial Intelligence
          </span>
          <p className="text-xs text-slate-500">Report Date: {formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
            Executive Intelligence & P&amp;L
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Profit &amp; Loss breakdown, product volume velocity, and overdue debtor aging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={handleExportFinancialsCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'pnl'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          P&amp;L Statement
        </button>

        <button
          onClick={() => setActiveTab('fruits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'fruits'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Fruit Velocity Ranking
        </button>

        <button
          onClick={() => setActiveTab('aging')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'aging'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Customer Khata Aging
        </button>
      </div>

      {/* TAB 1: P&L Statement */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gross Inward & Outward
              </span>
              <p className="text-xl font-extrabold text-slate-900 mt-2 font-mono">
                {formatINR(totalSalesRevenue)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total revenue collected & billed</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Net Operating Profit
              </span>
              <p
                className={`text-2xl font-black mt-2 font-mono ${
                  netProfitEstimate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatINR(Math.round(netProfitEstimate))}
              </p>
              <p className="text-xs text-slate-500 mt-1">After inventory, costs, and waste</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Net Profit Margin
              </span>
              <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{netMargin}%</p>
              <p className="text-xs text-slate-500 mt-1">On total wholesale volume</p>
            </div>
          </div>

          {/* Statement Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 font-heading border-b border-slate-100 pb-3">
              Comprehensive Wholesale Profit &amp; Loss Breakdown
            </h3>

            <div className="divide-y divide-slate-100 text-xs font-medium space-y-2">
              <div className="pt-2 flex justify-between items-center text-slate-800">
                <span className="font-bold">A. Total Sales Turnover (Invoiced)</span>
                <span className="font-extrabold font-mono text-slate-900 text-sm">
                  (+) {formatINR(totalSalesRevenue)}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center text-slate-600">
                <span>B. Less: Fruit Inward Purchase Cost</span>
                <span className="font-mono text-rose-600 font-bold">
                  (-) {formatINR(totalPurchasesCost)}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center text-slate-600">
                <span>C. Add: Closing Floor Stock Inventory Asset</span>
                <span className="font-mono text-emerald-700 font-bold">
                  (+) {formatINR(Math.round(totalCurrentStockValue))}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center text-slate-800 font-bold">
                <span>Gross Trading Margin</span>
                <span className="font-mono text-slate-900">
                  {formatINR(Math.round(grossProfitEstimate))}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center text-slate-600">
                <span>D. Less: Operating Mandi Expenses (Transport, Labour, Rent)</span>
                <span className="font-mono text-rose-600 font-bold">
                  (-) {formatINR(totalExpenses)}
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center text-slate-600">
                <span>E. Less: Spoilage &amp; Discarded Rot Loss</span>
                <span className="font-mono text-rose-600 font-bold">
                  (-) {formatINR(totalWastageLoss)}
                </span>
              </div>

              <div className="pt-4 flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Net Business Earnings</h4>
                  <p className="text-[11px] text-slate-500">True take-home commercial profit</p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-xl font-black font-mono ${
                      netProfitEstimate >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {formatINR(Math.round(netProfitEstimate))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Fruit Velocity */}
      {activeTab === 'fruits' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 font-heading">
              Fast-Moving Fruit Volume Velocity Ranking
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by cumulative physical volume sold (KG)
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {sortedFruits.map((item, index) => (
              <div key={item.fruitName} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-black text-slate-300 text-sm font-mono">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.fruitName}</h4>
                    <p className="text-[11px] text-slate-400">Total Billed: {formatINR(item.revenue)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black font-mono text-slate-900">
                    {item.weight.toLocaleString('en-IN')} KG
                  </span>
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase">
                    High Turn
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Aging Receivables */}
      {activeTab === 'aging' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900 font-heading">
              Customer Khata Aging &amp; Overdue Risk
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Wholesale buyers with heavy outstanding credit balances
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {overdue30Plus.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{c.name}</span>
                    <span className="text-slate-400 font-normal">({c.businessName})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Phone: {c.phone} &bull; Credit Period: {c.creditPeriodDays} Days
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black font-mono text-rose-600">
                    {formatINR(c.outstandingBalance)}
                  </span>
                  <span className="block text-[10px] text-amber-600 font-bold">Follow-Up Required</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
