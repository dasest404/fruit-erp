import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Download,
  CreditCard,
  Phone,
  MapPin,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Eye,
  FileText,
  ArrowLeft,
  Printer,
  Calendar,
  DollarSign,
  Receipt,
  Mail,
} from 'lucide-react';
import { ERPDataStore, Supplier, SupplierLedgerEntry, PurchaseItem, SupplierPayment } from '../../types';
import { formatINR, formatDate, downloadCSV } from '../../utils/formatters';
import { generateSupplierStatementPDF } from '../../utils/pdfGenerator';
import { api } from '../../services/api';
import { DEFAULT_COMPANY_PROFILE } from '../../config/companyProfile';

interface SuppliersViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
  initialSupplierId?: string;
  onSupplierSelect?: (supplierId: string | undefined) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  data,
  onRefreshData,
  initialSupplierId,
  onSupplierSelect,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(initialSupplierId || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'khata' | 'purchases' | 'payments' | 'info'>('khata');
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [openingPayable, setOpeningPayable] = useState<number | ''>(0);
  const [notes, setNotes] = useState('');

  // Payment form states
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Bank' | 'Cash' | 'UPI' | 'Cheque'>('Bank');
  const [reference, setReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Supplier Ledger Edit / Direct Adjustment State
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [editingLedgerEntry, setEditingLedgerEntry] = useState<SupplierLedgerEntry | null>(null);
  const [ledgerDate, setLedgerDate] = useState(new Date().toISOString().split('T')[0]);
  const [ledgerType, setLedgerType] = useState<'Purchase' | 'Payment' | 'Adjustment' | 'Opening'>('Adjustment');
  const [ledgerReferenceNo, setLedgerReferenceNo] = useState('');
  const [ledgerDescription, setLedgerDescription] = useState('');
  const [ledgerNotes, setLedgerNotes] = useState('');
  const [ledgerDebit, setLedgerDebit] = useState<number | ''>('');
  const [ledgerCredit, setLedgerCredit] = useState<number | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state if initialSupplierId prop changes
  useEffect(() => {
    if (initialSupplierId) {
      setSelectedSupplierId(initialSupplierId);
    }
  }, [initialSupplierId]);

  // Derive current supplier safely
  const currentSupplier = selectedSupplierId
    ? data?.suppliers?.find((s) => s.id === selectedSupplierId) || null
    : null;

  // Safe supplier ledger retrieval
  const allSupplierLedgers: SupplierLedgerEntry[] =
    data?.supplierLedger || (data as any)?.supplierLedgers || [];

  const supplierLedger: SupplierLedgerEntry[] = currentSupplier
    ? allSupplierLedgers.filter((l) => l && l.supplierId === currentSupplier.id)
    : [];

  // Safe supplier purchases
  const supplierPurchases: PurchaseItem[] = currentSupplier
    ? (data?.purchases || []).filter((p) => p && p.supplierId === currentSupplier.id)
    : [];

  // Safe supplier payments
  const supplierPayments: SupplierPayment[] = currentSupplier
    ? (data?.supplierPayments || []).filter((p) => p && p.supplierId === currentSupplier.id)
    : [];

  // Handle supplier selection
  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setActiveTab('khata');
    setUpdateSuccessMessage(null);
    setErrorMessage('');
    if (onSupplierSelect) {
      onSupplierSelect(supplierId);
    }
  };

  // Back to suppliers list
  const handleBackToSuppliers = () => {
    setSelectedSupplierId(null);
    setUpdateSuccessMessage(null);
    setErrorMessage('');
    if (onSupplierSelect) {
      onSupplierSelect(undefined);
    }
  };

  // Filtered suppliers for directory
  const filteredSuppliers = (data?.suppliers || []).filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(term) ||
      (s.contactPerson || '').toLowerCase().includes(term) ||
      (s.phone || '').includes(term) ||
      (s.city || '').toLowerCase().includes(term) ||
      (s.state || '').toLowerCase().includes(term)
    );
  });

  // Open Edit Supplier Modal
  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name || '');
    setContactPerson(sup.contactPerson || '');
    setPhone(sup.phone || '');
    setEmail(sup.email || '');
    setAddress(sup.address || '');
    setCity(sup.city || '');
    setState(sup.state || '');
    setGstNumber(sup.gstNumber || '');
    setBankDetails(sup.bankDetails || '');
    setOpeningPayable(sup.openingBalance || 0);
    setNotes(sup.notes || '');
    setErrorMessage('');
    setIsAddOpen(true);
  };

  // Open Add Supplier Modal
  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setState('');
    setGstNumber('');
    setBankDetails('');
    setOpeningPayable(0);
    setNotes('');
    setErrorMessage('');
    setIsAddOpen(true);
  };

  // Save Supplier (Add or Edit)
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Supplier name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.id, {
          name: name.trim(),
          contactPerson: contactPerson.trim() || name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          gstNumber: gstNumber.trim(),
          bankDetails: bankDetails.trim(),
          notes: notes.trim(),
        });

        await onRefreshData();
        setIsAddOpen(false);
        setEditingSupplier(null);
        setUpdateSuccessMessage('Supplier updated successfully.');
        setTimeout(() => setUpdateSuccessMessage(null), 5000);
      } else {
        const res = await api.createSupplier({
          name: name.trim(),
          contactPerson: contactPerson.trim() || name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          gstNumber: gstNumber.trim(),
          bankDetails: bankDetails.trim(),
          openingPayable: Number(openingPayable) || 0,
          notes: notes.trim(),
        });

        await onRefreshData();
        setIsAddOpen(false);
        if (res?.supplier?.id) {
          handleSelectSupplier(res.supplier.id);
          setUpdateSuccessMessage('Supplier created successfully.');
          setTimeout(() => setUpdateSuccessMessage(null), 5000);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save supplier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (id: string) => {
    const sup = data?.suppliers?.find((s) => s.id === id);
    const supName = sup?.name || 'this supplier';
    if (!window.confirm(`Are you sure you want to delete ${supName}? This will remove all associated accounts payable records.`)) {
      return;
    }
    try {
      await api.deleteSupplier(id);
      if (selectedSupplierId === id) {
        handleBackToSuppliers();
      }
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete supplier');
    }
  };

  // Record / Modify Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;
    const amt = Number(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingPaymentId) {
        await api.updateSupplierPayment(editingPaymentId, {
          amount: amt,
          paymentDate: payDate,
          paymentMethod: paymentMode,
          referenceNo: reference,
          notes: payNotes,
        });
        setUpdateSuccessMessage(`Settlement payment updated and ledger balance recalculated successfully.`);
      } else {
        await api.recordSupplierPayment(currentSupplier.id, {
          amount: amt,
          paymentDate: payDate,
          date: payDate,
          paymentMethod: paymentMode,
          paymentMode,
          referenceNo: reference,
          reference,
          notes: payNotes,
        });
        setUpdateSuccessMessage(`Settlement payment of ${formatINR(amt)} recorded successfully.`);
      }

      await onRefreshData();
      setIsPaymentOpen(false);
      setEditingPaymentId(null);
      setPayAmount('');
      setReference('');
      setPayNotes('');
      setTimeout(() => setUpdateSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record supplier payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditPayment = (payment: SupplierPayment) => {
    setEditingPaymentId(payment.id);
    setPayAmount(payment.amount);
    setPayDate(payment.paymentDate || new Date().toISOString().split('T')[0]);
    setPaymentMode((payment.paymentMethod as any) || 'Bank');
    setReference(payment.referenceNo || '');
    setPayNotes(payment.notes || '');
    setErrorMessage('');
    setIsPaymentOpen(true);
  };

  // Supplier Ledger Edit & Direct Adjustment Handlers
  const handleSaveLedgerEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingLedgerEntry) {
        await api.updateSupplierLedgerEntry(editingLedgerEntry.id, {
          date: ledgerDate,
          type: ledgerType,
          referenceNo: ledgerReferenceNo,
          description: ledgerDescription,
          notes: ledgerNotes,
          debit: Number(ledgerDebit) || 0,
          credit: Number(ledgerCredit) || 0,
        });
        setUpdateSuccessMessage(`Supplier transaction updated and running balance recalculated successfully.`);
      } else {
        await api.createSupplierLedgerEntry({
          supplierId: currentSupplier.id,
          date: ledgerDate,
          type: ledgerType,
          referenceNo: ledgerReferenceNo,
          description: ledgerDescription,
          notes: ledgerNotes,
          debit: Number(ledgerDebit) || 0,
          credit: Number(ledgerCredit) || 0,
        });
        setUpdateSuccessMessage(`Supplier khata adjustment recorded and balance updated successfully.`);
      }

      await onRefreshData();
      setIsLedgerModalOpen(false);
      setEditingLedgerEntry(null);
      setTimeout(() => setUpdateSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save supplier khata entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditLedger = (entry: SupplierLedgerEntry) => {
    setEditingLedgerEntry(entry);
    setLedgerDate(entry.date || new Date().toISOString().split('T')[0]);
    setLedgerType((entry.type as any) || 'Adjustment');
    setLedgerReferenceNo(entry.referenceNo || entry.referenceId || '');
    setLedgerDescription(entry.description || entry.notes || '');
    setLedgerNotes(entry.notes || '');
    setLedgerDebit(entry.debit > 0 ? entry.debit : '');
    setLedgerCredit(entry.credit > 0 ? entry.credit : '');
    setErrorMessage('');
    setIsLedgerModalOpen(true);
  };

  const handleOpenNewLedgerAdjustment = () => {
    setEditingLedgerEntry(null);
    setLedgerDate(new Date().toISOString().split('T')[0]);
    setLedgerType('Adjustment');
    setLedgerReferenceNo(`ADJ-${Date.now().toString().slice(-6)}`);
    setLedgerDescription('');
    setLedgerNotes('');
    setLedgerDebit('');
    setLedgerCredit('');
    setErrorMessage('');
    setIsLedgerModalOpen(true);
  };

  // Download PDF Statement
  const handleDownloadPDF = (sup: Supplier) => {
    try {
      generateSupplierStatementPDF(sup, data.settings, supplierLedger);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate Supplier Statement PDF.');
    }
  };

  // Print Statement
  const handlePrintStatement = () => {
    window.print();
  };

  // Export Ledger CSV
  const handleExportLedgerCSV = () => {
    if (!currentSupplier) return;
    const headers = ['Date', 'Type', 'Reference No', 'Description', 'Debit (+)', 'Credit (-)', 'Running Balance'];
    const rows = supplierLedger.map((l) => [
      formatDate(l.date),
      (l.type || 'ENTRY').toUpperCase(),
      l.referenceNo || l.referenceId || '-',
      l.description || l.notes || '-',
      l.debit || 0,
      l.credit || 0,
      l.balance || 0,
    ]);
    downloadCSV(`${currentSupplier.name.replace(/\s+/g, '_')}_Supplier_Ledger`, headers, rows);
  };

  // Export Suppliers List CSV
  const handleExportSuppliersCSV = () => {
    const headers = ['Supplier Name', 'Contact Person', 'Phone', 'Address', 'City', 'State', 'GSTIN', 'Total Purchases', 'Total Paid', 'Outstanding Payable'];
    const rows = (data?.suppliers || []).map((s) => [
      s.name,
      s.contactPerson || '',
      s.phone || '',
      s.address || '',
      s.city || '',
      s.state || '',
      s.gstNumber || '',
      s.totalPurchases || 0,
      s.totalPaid || s.paymentsMade || 0,
      s.outstandingPayable || 0,
    ]);
    downloadCSV(`Suppliers_Directory_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // =========================================================================
  // VIEW MODE 1: SUPPLIER DETAILS SCREEN
  // =========================================================================
  if (selectedSupplierId) {
    if (!data || !data.suppliers) {
      return (
        <div className="py-24 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-semibold text-slate-700 font-heading">Loading supplier details...</p>
          <p className="text-xs text-slate-400">Retrieving inward lot ledger and settlements history...</p>
        </div>
      );
    }

    if (!currentSupplier) {
      return (
        <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            !
          </div>
          <h2 className="text-base font-bold text-slate-900 font-heading">Supplier Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The requested supplier ID <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{selectedSupplierId}</code> could not be found or may have been deleted.
          </p>
          <button
            onClick={handleBackToSuppliers}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Suppliers</span>
          </button>
        </div>
      );
    }

    const totalPurchases = currentSupplier.totalPurchases || 0;
    const totalPaid = currentSupplier.totalPaid ?? (currentSupplier.paymentsMade ?? 0);
    const outstandingPayable = currentSupplier.outstandingPayable || 0;

    return (
      <div className="space-y-6 pb-20 lg:pb-8">
        {/* PRINT ONLY: OFFICIAL HFC BRANDING HEADER FOR SUPPLIER SETTLEMENT */}
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
              Supplier Settlement Statement
            </span>
            <p className="text-xs text-slate-500">Statement Date: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* TOP PROFILE / ACTION HEADER */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 print:border-none print:shadow-none">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Back Button & Supplier Header */}
            <div className="flex items-start sm:items-center gap-3.5">
              <button
                type="button"
                onClick={handleBackToSuppliers}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 print:hidden"
                title="Back to Suppliers List"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                    {currentSupplier.name || 'Supplier'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                    Mandi Grower / Orchardist
                  </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {currentSupplier.city || 'Mandi'}{currentSupplier.state ? `, ${currentSupplier.state}` : ''}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {currentSupplier.phone || '—'}
                  </span>
                  {currentSupplier.gstNumber && (
                    <span className="font-mono text-[11px] text-slate-400">
                      GSTIN: {currentSupplier.gstNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap print:hidden">
              <button
                type="button"
                onClick={() => handleOpenEdit(currentSupplier)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Edit Supplier Information"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit Supplier</span>
              </button>

              <button
                type="button"
                onClick={handlePrintStatement}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Print Statement"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPDF(currentSupplier)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Download PDF Statement"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPayAmount('');
                  setReference('');
                  setPayNotes('');
                  setErrorMessage('');
                  setIsPaymentOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Settlement Payment</span>
              </button>
            </div>
          </div>

          {/* Success banner */}
          {updateSuccessMessage && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">{updateSuccessMessage}</span>
              </div>
              <button
                onClick={() => setUpdateSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 font-bold"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* 1. FINANCIAL SUMMARY METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchases Inward</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              {formatINR(totalPurchases)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total wholesale produce supplied</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payments Settled</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 font-mono mt-1">
              {formatINR(totalPaid)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Cleared via Bank / Cash / UPI</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Outstanding Payable Due</p>
            <p className="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-1">
              {formatINR(outstandingPayable)}
            </p>
            <p className="text-xs text-rose-500 font-medium mt-0.5">Current settlement liability</p>
          </div>
        </div>

        {/* 2. SUPPLIER INFORMATION CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Supplier Profile & Banking Coordinates
              </h2>
            </div>
            <button
              onClick={() => handleOpenEdit(currentSupplier)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Modify</span>
            </button>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Supplier / Orchard Name</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{currentSupplier.name || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Contact Person</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentSupplier.contactPerson || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Mobile Phone</span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block">{currentSupplier.phone || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Email Address</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentSupplier.email || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Mandi / City</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentSupplier.city || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">State / Region</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentSupplier.state || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">GSTIN Number</span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block">{currentSupplier.gstNumber || 'Unregistered'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Opening Payable</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{formatINR(currentSupplier.openingBalance || 0)}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Account Created</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentSupplier.createdAt ? formatDate(currentSupplier.createdAt) : '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Bank Account / IFSC</span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block">{currentSupplier.bankDetails || '—'}</span>
            </div>

            <div className="col-span-2 sm:col-span-3 lg:col-span-5">
              <span className="text-[11px] text-slate-400 block">Mandi Address / Farm Location</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentSupplier.address || '—'}</span>
            </div>
          </div>
        </div>

        {/* 3. SEGMENTED TRANSACTION TABS */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-100 px-5 pt-3 gap-2 bg-slate-50/40">
            <button
              onClick={() => setActiveTab('khata')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'khata'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Supplier Khata / Ledger</span>
              <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono">
                {supplierLedger.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'purchases'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Inward Purchase Lots</span>
              <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono">
                {supplierPurchases.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Settlement Payments</span>
              <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono">
                {supplierPayments.length}
              </span>
            </button>
          </div>

          {/* TAB 1: SUPPLIER LEDGER */}
          {activeTab === 'khata' && (
            <div className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Supplier Khata Running Statement
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chronological ledger entries with purchases and settlement payments
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportLedgerCSV}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={handleOpenNewLedgerAdjustment}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adjust Khata</span>
                  </button>

                  <button
                    onClick={() => {
                      setPayAmount('');
                      setReference('');
                      setPayNotes('');
                      setErrorMessage('');
                      setIsPaymentOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>

              <div className="table-container border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3.5">Date</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Reference #</th>
                      <th className="py-3 px-3">Description / Particulars</th>
                      <th className="py-3 px-3 text-right">Debit (-)</th>
                      <th className="py-3 px-3 text-right">Credit (+)</th>
                      <th className="py-3 px-3.5 text-right">Balance</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierLedger.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          No transactions recorded in this supplier ledger yet.
                        </td>
                      </tr>
                    ) : (
                      supplierLedger.map((entry) => {
                        const isDebit = entry.debit > 0;
                        const isCredit = entry.credit > 0;
                        return (
                          <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                              {formatDate(entry.date)}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  entry.type === 'Payment'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : entry.type === 'Purchase'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {entry.type || 'ENTRY'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                              {entry.referenceNo || entry.referenceId || '—'}
                            </td>
                            <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                              {entry.description || entry.notes || 'Transaction'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                              {isDebit ? formatINR(entry.debit) : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                              {isCredit ? formatINR(entry.credit) : '—'}
                            </td>
                            <td className="py-3 px-3.5 text-right font-mono font-extrabold text-slate-900">
                              {formatINR(entry.balance)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleOpenEditLedger(entry)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Edit / Modify Transaction"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-xs font-semibold">Edit</span>
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
          )}

          {/* TAB 2: PURCHASES */}
          {activeTab === 'purchases' && (
            <div className="p-5">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Inward Produce Lots from {currentSupplier.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Showing all purchase lots received from this grower/supplier
                </p>
              </div>

              <div className="table-container border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3.5">Purchase #</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Fruit / Variety</th>
                      <th className="py-3 px-3">Grade</th>
                      <th className="py-3 px-3 text-right">Net Weight</th>
                      <th className="py-3 px-3 text-right">Purchase Rate</th>
                      <th className="py-3 px-3 text-right">Total Cost</th>
                      <th className="py-3 px-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          No purchases recorded from this supplier yet.
                        </td>
                      </tr>
                    ) : (
                      supplierPurchases.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                            {p.purchaseNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {formatDate(p.purchaseDate)}
                          </td>
                          <td className="py-3 px-3 text-slate-800 font-medium">
                            {p.fruitName} ({p.variety})
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {p.grade}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {(p.netWeightKg || p.netWeight || 0).toLocaleString('en-IN')} kg
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-700">
                            {formatINR(p.purchaseRate)}/kg
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatINR(p.totalCost || p.purchaseValue)}
                          </td>
                          <td className="py-3 px-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (p.dueAmount || 0) === 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : (p.paidAmount || 0) > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {(p.dueAmount || 0) === 0 ? 'Settled' : (p.paidAmount || 0) > 0 ? 'Partial' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SETTLEMENTS */}
          {activeTab === 'payments' && (
            <div className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Settlement Payments Disbursed
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    History of payments made to this supplier via Bank, Cash, or RTGS
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPayAmount('');
                    setReference('');
                    setPayNotes('');
                    setErrorMessage('');
                    setIsPaymentOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </div>

              <div className="table-container border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3.5">Payment Date</th>
                      <th className="py-3 px-3">Reference / UTR #</th>
                      <th className="py-3 px-3">Payment Method</th>
                      <th className="py-3 px-3">Notes</th>
                      <th className="py-3 px-3.5 text-right">Amount Settled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          No settlement payments recorded for this supplier yet.
                        </td>
                      </tr>
                    ) : (
                      supplierPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">
                            {payment.referenceNo || '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {payment.paymentMethod || 'Bank'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-sm truncate">
                            {payment.notes || 'Lot settlement'}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-extrabold text-emerald-600">
                            {formatINR(payment.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODALS RENDERED BELOW */}
        {renderSupplierFormModal()}
        {renderSupplierPaymentModal()}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: SUPPLIERS DIRECTORY DASHBOARD
  // =========================================================================
  const totalSuppliersCount = data?.suppliers?.length || 0;
  const totalPayableAmount = (data?.suppliers || []).reduce((acc, s) => acc + (s.outstandingPayable || 0), 0);
  const totalInwardPurchases = (data?.suppliers || []).reduce((acc, s) => acc + (s.totalPurchases || 0), 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
            Suppliers & Mandi Growers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage orchardists, commission agents, and supplier payables settlement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportSuppliersCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Suppliers</p>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">{totalSuppliersCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Growers & orchardists</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Total Outstanding Payable</p>
          <p className="text-xl font-black text-rose-600 font-mono mt-1">{formatINR(totalPayableAmount)}</p>
          <p className="text-[10px] text-rose-500 font-medium mt-0.5">Current settlement liability</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Purchases Inward</p>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">{formatINR(totalInwardPurchases)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Lifetime inward produce value</p>
        </div>
      </div>

      {/* SEARCH AND DIRECTORY LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search supplier, mandi, contact person, or phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredSuppliers.length} of {totalSuppliersCount}
          </span>
        </div>

        {/* Suppliers List */}
        <div className="divide-y divide-slate-100">
          {filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Truck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Suppliers Found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? `No supplier matches "${searchTerm}". Try another query.`
                  : 'Add your first mandi grower or commission supplier.'}
              </p>
            </div>
          ) : (
            filteredSuppliers.map((sup) => (
              <div
                key={sup.id}
                className="p-5 hover:bg-slate-50/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Supplier Info (Clicking Name opens Supplier Details) */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSelectSupplier(sup.id)}
                      className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors text-left cursor-pointer font-heading"
                      title="Click to view supplier details"
                    >
                      {sup.name}
                    </button>
                    <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                      Mandi Grower
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {sup.city || 'Mandi'}{sup.state ? `, ${sup.state}` : ''}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {sup.phone}
                    </span>
                    {sup.contactPerson && (
                      <span className="text-[11px] text-slate-400">
                        Contact: {sup.contactPerson}
                      </span>
                    )}
                  </div>
                </div>

                {/* Center: Outstanding Payable */}
                <div className="text-left md:text-right shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payable Due</p>
                  <p className="text-lg font-black text-rose-600 font-mono">
                    {formatINR(sup.outstandingPayable)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Paid: {formatINR(sup.totalPaid || sup.paymentsMade || 0)}
                  </p>
                </div>

                {/* Right: Actions including prominent [ View Details ] */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectSupplier(sup.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer border border-emerald-200/60"
                    title="View Supplier Details"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(sup)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Edit Supplier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSupplierId(sup.id);
                      setPayAmount('');
                      setReference('');
                      setPayNotes('');
                      setErrorMessage('');
                      setIsPaymentOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title="Record Settlement Payment"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSupplier(sup.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Supplier"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODALS RENDERED BELOW */}
      {renderSupplierFormModal()}
      {renderSupplierPaymentModal()}
    </div>
  );

  // =========================================================================
  // MODAL 1: ADD / EDIT SUPPLIER
  // =========================================================================
  function renderSupplierFormModal() {
    if (!isAddOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm font-heading">
                  {editingSupplier ? 'Edit Supplier Profile' : 'Add New Mandi Grower / Supplier'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingSupplier ? `Updating record for ${editingSupplier.name}` : 'Supplier accounts registration'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveSupplier} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Farm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kashmir Valley Orchard Farms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ghulam Nabi"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. supplier@orchards.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mandi / City</label>
                <input
                  type="text"
                  placeholder="e.g. Sopore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  placeholder="e.g. Jammu & Kashmir"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="01ABCDE1234F1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account & IFSC Coordinates</label>
              <input
                type="text"
                placeholder="e.g. J&K Bank A/c 01234567890123, IFSC: JAKA0SOPORI"
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {!editingSupplier && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Opening Balance Payable (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={openingPayable}
                  onChange={(e) => setOpeningPayable(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Existing payable brought forward from previous settlement cycle
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mandi Stall / Orchard Address</label>
              <input
                type="text"
                placeholder="e.g. Fruit Complex Yard, Sopore Mandi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Quality notes, commission rates, or seasonal harvest notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : editingSupplier ? 'Update Supplier' : 'Save Supplier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODAL 2: RECORD SUPPLIER SETTLEMENT PAYMENT
  // =========================================================================
  function renderSupplierPaymentModal() {
    if (!isPaymentOpen || !currentSupplier) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 sm:p-5 bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white" />
              <div>
                <h3 className="font-bold text-sm font-heading">Record Settlement Payment</h3>
                <p className="text-xs text-emerald-100">{currentSupplier.name}</p>
              </div>
            </div>
            <button
              onClick={() => setIsPaymentOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-900">Outstanding Payable Due:</span>
              <span className="text-base font-extrabold text-rose-600 font-mono">
                {formatINR(currentSupplier.outstandingPayable)}
              </span>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount to Disburse (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Disbursement Amount"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disbursement Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                >
                  <option value="Bank">Bank Transfer (NEFT / RTGS)</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="Cash">Cash at Mandi</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UTR # / Bank Reference / Cheque #
              </label>
              <input
                type="text"
                placeholder="e.g. NEFT-SBIN490192"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes</label>
              <input
                type="text"
                placeholder="e.g. Advance clearance for Apple truck lot #104"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !payAmount}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Recording...' : 'Save & Update Khata'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};
