import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Share2,
  Copy,
  Save,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Apple,
  Download,
} from 'lucide-react';
import { ERPDataStore, DailyRate } from '../../types';
import { formatINR, formatDate, buildWhatsAppLink, downloadCSV } from '../../utils/formatters';
import { api } from '../../services/api';

interface DailyRatesViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
}

export const DailyRatesView: React.FC<DailyRatesViewProps> = ({ data, onRefreshData }) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [rateEntries, setRateEntries] = useState<
    {
      fruitId: string;
      fruitName: string;
      variety: string;
      image: string;
      grade: 'A' | 'B' | 'C' | 'Damaged';
      purchaseRate: number;
      wholesaleRate: number;
      retailRate: number;
    }[]
  >([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize rates based on today's dailyRates or fruit master defaults
  useEffect(() => {
    const combined: typeof rateEntries = [];

    data.fruits.forEach((fruit) => {
      const gradesList: ('A' | 'B' | 'C' | 'Damaged')[] = ['A', 'B', 'C', 'Damaged'];

      gradesList.forEach((gr) => {
        // Find existing record for this date
        const existing = data.dailyRates.find(
          (dr) => dr.fruitId === fruit.id && dr.grade === gr && dr.date === selectedDate
        );

        if (existing) {
          combined.push({
            fruitId: fruit.id,
            fruitName: fruit.name,
            variety: fruit.variety,
            image: fruit.image || '🍎',
            grade: gr,
            purchaseRate: existing.purchaseRate,
            wholesaleRate: existing.wholesaleRate,
            retailRate: existing.retailRate,
          });
        } else {
          // Default from fruit master
          const defGrade = fruit.grades.find((g) => g.grade === gr);
          combined.push({
            fruitId: fruit.id,
            fruitName: fruit.name,
            variety: fruit.variety,
            image: fruit.image || '🍎',
            grade: gr,
            purchaseRate: defGrade ? defGrade.wholesaleRate * 0.8 : 80,
            wholesaleRate: defGrade ? defGrade.wholesaleRate : 100,
            retailRate: defGrade ? defGrade.retailRate : 120,
          });
        }
      });
    });

    setRateEntries(combined);
  }, [data, selectedDate]);

  const handleRateChange = (
    fruitId: string,
    grade: 'A' | 'B' | 'C' | 'Damaged',
    field: 'wholesaleRate' | 'retailRate',
    val: number
  ) => {
    setRateEntries((prev) =>
      prev.map((r) => {
        if (r.fruitId === fruitId && r.grade === grade) {
          return { ...r, [field]: val };
        }
        return r;
      })
    );
    setSaveSuccess(false);
  };

  const handleCopyYesterday = async () => {
    try {
      setIsSaving(true);
      await api.copyYesterdayRates();
      await onRefreshData();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to copy yesterday rates');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRates = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const payload = rateEntries.map((r) => ({
        fruitId: r.fruitId,
        fruitName: r.fruitName,
        grade: r.grade,
        date: selectedDate,
        purchaseRate: r.purchaseRate,
        wholesaleRate: r.wholesaleRate,
        retailRate: r.retailRate,
      }));

      await api.updateDailyRates(payload);
      await onRefreshData();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update daily rates');
    } finally {
      setIsSaving(false);
    }
  };

  // Broadcast rate board on WhatsApp
  const handleShareWhatsAppRateBoard = () => {
    const grouped: { [fruit: string]: string[] } = {};

    rateEntries.forEach((r) => {
      if (!grouped[r.fruitName]) grouped[r.fruitName] = [];
      grouped[r.fruitName].push(`Gr ${r.grade}: ₹${r.wholesaleRate}/kg`);
    });

    const ratesBody = Object.entries(grouped)
      .map(([fruit, grades]) => `🍏 *${fruit}*\n${grades.join(' | ')}`)
      .join('\n\n');

    const message = `*${data.settings.businessName}*
APMC Fruit Wholesale Daily Rate Board
Date: ${formatDate(selectedDate)}
--------------------------------
${ratesBody}
--------------------------------
*Note:* Rates subject to market arrival & stock availability.
Place your orders early for morning dispatch.
Contact: ${data.settings.phone}`;

    // Target a general broadcast number or open WhatsApp composer
    window.open(buildWhatsAppLink('', message), '_blank');
  };

  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Fruit Name',
      'Variety',
      'Grade',
      'Purchase Rate / KG',
      'Wholesale Rate / KG',
      'Retail Rate / KG',
    ];

    const rows = rateEntries.map((r) => [
      selectedDate,
      r.fruitName,
      r.variety,
      `Grade ${r.grade}`,
      r.purchaseRate,
      r.wholesaleRate,
      r.retailRate,
    ]);

    downloadCSV(`Daily_Mandi_Rates_${selectedDate}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
              Daily Fruit Rate Board
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
              Live Mandi Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Morning APMC rate publishing, grade pricing adjustment, and buyer WhatsApp broadcast
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Export Daily Rates to Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Rates</span>
          </button>

          <button
            onClick={handleCopyYesterday}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Yesterday</span>
          </button>

          <button
            onClick={handleShareWhatsAppRateBoard}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Broadcast WhatsApp</span>
          </button>

          <button
            onClick={handleSaveRates}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Publish Rates'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Daily Mandi Rates published successfully! Ready for invoicing.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Date Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <label htmlFor="daily-rates-date" className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Select Trading Date:</span>
        </label>
        <input
          id="daily-rates-date"
          aria-label="Select Trading Date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Rates Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="table-container">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Fruit Item</th>
                <th className="py-3.5 px-4">Variety</th>
                <th className="py-3.5 px-4">Grade</th>
                <th className="py-3.5 px-4 text-right">Wholesale Rate (₹/KG)</th>
                <th className="py-3.5 px-4 text-right">Retail / Small Order (₹/KG)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {rateEntries.map((r, idx) => (
                <tr key={`${r.fruitId}-${r.grade}`} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <span className="text-xl">{r.image}</span>
                    <span>{r.fruitName}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{r.variety}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        r.grade === 'A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.grade === 'B'
                          ? 'bg-blue-100 text-blue-800'
                          : r.grade === 'C'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      Grade {r.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-slate-400 font-mono">₹</span>
                      <input
                        aria-label={`${r.fruitName} Grade ${r.grade} Wholesale Rate in Rupees per Kilogram`}
                        type="number"
                        min="1"
                        value={r.wholesaleRate}
                        onChange={(e) =>
                          handleRateChange(
                            r.fruitId,
                            r.grade,
                            'wholesaleRate',
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-extrabold font-mono text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <span className="text-slate-400 font-mono">₹</span>
                      <input
                        aria-label={`${r.fruitName} Grade ${r.grade} Retail Rate in Rupees per Kilogram`}
                        type="number"
                        min="1"
                        value={r.retailRate}
                        onChange={(e) =>
                          handleRateChange(
                            r.fruitId,
                            r.grade,
                            'retailRate',
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
