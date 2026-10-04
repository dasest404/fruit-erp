import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Download,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Edit2,
} from 'lucide-react';
import { ERPDataStore, Expense } from '../../types';
import { formatINR, formatDate, downloadCSV } from '../../utils/formatters';
import { api } from '../../services/api';

interface ExpensesViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ data, onRefreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [category, setCategory] = useState('Transport');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const expenseCategories = [
    'Transport',
    'Labour',
    'Packaging',
    'Rent',
    'Electricity',
    'Loading/Unloading',
    'Commission',
    'Fuel',
    'Maintenance',
    'Other',
  ];

  const filteredExpenses = data.expenses.filter((e) => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setCategory('Transport');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Cash');
    setPaidTo('');
    setDescription('');
    setNotes('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setCategory(exp.category);
    setAmount(exp.amount);
    setDate(exp.date ? exp.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setPaymentMethod((exp.paymentMethod as any) || 'Cash');
    setPaidTo(exp.paidTo || '');
    setDescription(exp.description || '');
    setNotes(exp.notes || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid expense amount.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please describe the expense.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        category,
        amount: numAmount,
        date,
        paymentMethod,
        paidTo,
        description,
        notes,
      };

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, payload);
      } else {
        await api.createExpense(payload);
      }

      await onRefreshData();
      setIsModalOpen(false);
      setEditingExpense(null);
      setAmount('');
      setDescription('');
      setPaidTo('');
      setNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Paid To', 'Amount', 'Payment Method', 'Notes'];
    const rows = filteredExpenses.map((e) => [
      formatDate(e.date),
      e.category,
      e.description,
      e.paidTo,
      e.amount,
      e.paymentMethod,
      e.notes,
    ]);
    downloadCSV(`Expenses_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
            Operational Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record freight, hamali labour, mandi stall rent, crates packaging, and overheads
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
            onClick={handleOpenCreateExpense}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards & Category Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Filtered Expenses
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {formatINR(totalExpenseAmount)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{filteredExpenses.length} entries</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Largest Category
          </span>
          <p className="text-2xl font-extrabold text-purple-700 mt-2 font-heading">
            Transport & Freight
          </p>
          <p className="text-xs text-slate-500 mt-1">Interstate tempos & mandi drayage</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Average Per Day
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
            {formatINR(Math.round(totalExpenseAmount / 7))}
          </p>
          <p className="text-xs text-slate-500 mt-1">Estimated daily burn</p>
        </div>
      </div>

      {/* Search & Category Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative max-w-md">
          <label htmlFor="expenses-search-input" className="sr-only">Search expenses</label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="expenses-search-input"
            aria-label="Search expenses"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search description, payee, or notes..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', ...expenseCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Expenses' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="table-container">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Del</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found. Click &quot;+ Record Expense&quot; to log daily mandi costs.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{formatDate(exp.date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{exp.description}</td>
                    <td className="py-3 px-4 text-slate-600">{exp.paidTo || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditExpense(exp)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-700 transition-colors mr-1 cursor-pointer"
                        title="Edit / Modify Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base font-heading">
                {editingExpense ? 'Edit Mandi Expense' : 'Record Mandi Expense'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingExpense(null);
                }}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label htmlFor="expense-category" className="block text-xs font-bold text-slate-700 mb-1">Expense Category *</label>
                <select
                  id="expense-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="expense-amount" className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  id="expense-amount"
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 2500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="expense-description" className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <input
                  id="expense-description"
                  type="text"
                  required
                  placeholder="e.g. Unloading hamali charges for Apple truck"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="expense-paid-to" className="block text-xs font-bold text-slate-700 mb-1">Paid To</label>
                  <input
                    id="expense-paid-to"
                    type="text"
                    placeholder="e.g. Mathadi Union"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="expense-payment-method" className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    id="expense-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="expense-date" className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input
                  id="expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                  }}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !amount}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
