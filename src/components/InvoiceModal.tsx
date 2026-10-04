import React from 'react';
import { X, Printer, Share2, Download, CheckCircle2 } from 'lucide-react';
import { Sale, BusinessSettings } from '../types';
import { formatINR, formatCurrencyAmount, formatDate, buildWhatsAppLink, formatDateTime } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { DEFAULT_COMPANY_PROFILE } from '../config/companyProfile';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: BusinessSettings;
  customerPhone?: string;
  previousBalance?: number;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
  customerPhone,
  previousBalance = 0,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      generateInvoicePDF(sale, settings, previousBalance, customerPhone);
    } catch (err) {
      alert('Failed to generate PDF. You can also use the Print button to Save as PDF.');
    }
  };

  const handleWhatsAppShare = () => {
    const phone = customerPhone || '919820123456';
    const itemsList = sale.items
      .map(
        (it) =>
          `• ${it.fruitName}${it.variety ? ` (${it.variety})` : ''}: ${it.quantity || `${it.weightKg} ${it.unit || 'KG'}`} @ ₹${it.rate || it.ratePerKg || 0} = ₹${it.totalPrice || it.total || it.amount || 0}`
      )
      .join('\n');

    const totalKhataBalance = previousBalance + sale.balanceDue;

    const message = `*Hari Kripa Fruit Company*
FRESHNESS • QUALITY • TRUST
--------------------------------
*WHOLESALE TAX INVOICE: ${sale.invoiceNumber}*
Date: ${formatDate(sale.saleDate)}
Customer: *${sale.customerName}*
--------------------------------
*Items:*
${itemsList}
--------------------------------
Subtotal: ₹${sale.subtotal.toLocaleString('en-IN')}
Discount: ₹${sale.discount.toLocaleString('en-IN')}
*Grand Total: ₹${sale.grandTotal.toLocaleString('en-IN')}*
Amount Paid (${sale.paymentMethod}): ₹${sale.paidAmount.toLocaleString('en-IN')}
*Invoice Balance Due: ₹${sale.balanceDue.toLocaleString('en-IN')}*
${
  totalKhataBalance > 0
    ? `*Total Outstanding Khata Balance: ₹${totalKhataBalance.toLocaleString('en-IN')}*`
    : 'Khata Status: Cleared ✅'
}
--------------------------------
Thank you for your business!
_Phones: +91 7566996333 | +91 9329599950 (RJ) | +91 9300910015 (DJ)_
_Email: harikripafruitco@gmail.com | Bhilai (C.G.)_`;

    window.open(buildWhatsAppLink(phone, message), '_blank');
  };

  const currentKhataTotal = previousBalance + sale.balanceDue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-base">📄</span>
            <span className="font-bold text-sm font-heading">Wholesale Tax Invoice</span>
            <span className="text-xs text-slate-400">({sale.invoiceNumber})</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-6 sm:p-10 text-slate-900 font-sans text-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
            <div className="flex items-start gap-3 sm:gap-4">
              <img
                src={settings.logoUrl || DEFAULT_COMPANY_PROFILE.logo}
                alt="Hari Kripa Fruit Company"
                className="h-16 sm:h-20 w-auto object-contain shrink-0"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
                  {settings.businessName || DEFAULT_COMPANY_PROFILE.name}
                </h1>
                <p className="text-emerald-700 font-bold text-xs uppercase tracking-wider mt-0.5">
                  {settings.tagline || DEFAULT_COMPANY_PROFILE.tagline}
                </p>
                <p className="text-slate-600 mt-1 max-w-sm leading-relaxed text-[11px]">
                  {settings.address || DEFAULT_COMPANY_PROFILE.address}
                </p>
                <div className="text-slate-600 mt-1 text-[11px] space-y-0.5">
                  <p>
                    <span className="font-semibold text-slate-700">Phone:</span>{' '}
                    <span>{settings.phone1 || settings.phone || DEFAULT_COMPANY_PROFILE.phone1}</span> •{' '}
                    <span>{DEFAULT_COMPANY_PROFILE.phone2} ({DEFAULT_COMPANY_PROFILE.phone2Label})</span> •{' '}
                    <span>{DEFAULT_COMPANY_PROFILE.phone3} ({DEFAULT_COMPANY_PROFILE.phone3Label})</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Email:</span>{' '}
                    <span>{settings.email || DEFAULT_COMPANY_PROFILE.email}</span>
                  </p>
                  {(settings.gstNumber || settings.gstin) && (
                    <p>
                      <span className="font-semibold text-slate-700">GSTIN:</span>{' '}
                      <span>{settings.gstNumber || settings.gstin}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:text-right w-full sm:w-auto p-3 sm:p-0 bg-slate-50 sm:bg-transparent rounded-xl shrink-0">
              <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs uppercase tracking-wider mb-2">
                Wholesale Cash Memo / Invoice
              </span>
              <p className="text-slate-500 font-medium">Invoice No:</p>
              <p className="text-base font-extrabold text-slate-900 font-mono">{sale.invoiceNumber}</p>
              <p className="text-slate-500 mt-1">Date: <span className="font-semibold text-slate-700">{formatDate(sale.saleDate)}</span></p>
              <p className="text-slate-500">Status: <span className="font-bold text-slate-900 uppercase">{sale.paymentStatus}</span></p>
            </div>
          </div>

          {/* Customer & Bill To Details */}
          <div className="py-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To (Customer):</p>
              <h2 className="text-sm font-bold text-slate-900">{sale.customerName}</h2>
              {customerPhone && <p className="text-slate-600 mt-0.5">Phone: {customerPhone}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method:</p>
              <p className="font-bold text-slate-800">{sale.paymentMethod}</p>
              <p className="text-[11px] text-slate-500">APMC Mandi Cash/Credit Memo</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-4 table-container">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Fruit Item</th>
                  <th className="py-2.5 px-2">Variety / Unit</th>
                  <th className="py-2.5 px-2 text-right">Quantity</th>
                  <th className="py-2.5 px-2 text-right">Rate</th>
                  <th className="py-2.5 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sale.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-2.5 px-2 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-2 font-bold text-slate-900">{item.fruitName}</td>
                    <td className="py-2.5 px-2 font-semibold text-slate-600">{item.variety || item.unit || 'Standard'}</td>
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-800">
                      {item.quantity ? String(item.quantity) : `${item.weightKg} ${item.unit || 'KG'}`}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700">{formatCurrencyAmount(item.rate || item.ratePerKg || 0)}</td>
                    <td className="py-2.5 px-2 text-right font-black text-slate-900 font-mono">{formatCurrencyAmount(item.totalPrice || item.total || item.amount || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="max-w-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Khata Summary</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Previous Due:</span>
                  <span>{formatINR(previousBalance)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>This Invoice Balance:</span>
                  <span className="font-semibold">{formatINR(sale.balanceDue)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                  <span>Total Due in Khata:</span>
                  <span className="text-rose-600">{formatINR(currentKhataTotal)}</span>
                </div>
              </div>

              {sale.notes && (
                <p className="text-[11px] text-slate-500 mt-2 italic">Notes: {sale.notes}</p>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatINR(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-semibold">-{formatINR(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-emerald-700">{formatINR(sale.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-700 pt-1">
                <span>Paid Amount:</span>
                <span className="font-bold text-emerald-600">{formatINR(sale.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                <span>Balance Due:</span>
                <span className={sale.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {formatINR(sale.balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Signatures */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-500">
            <div>
              <p className="font-bold text-slate-700 mb-0.5">Terms & Conditions:</p>
              <p>1. {settings.invoiceTerms || 'Immediate settlement required for mandi wholesale lots.'}</p>
              <p>2. Payment due strictly as per agreed wholesale credit cycle.</p>
              <p>3. Subject to Bhilai (C.G.) jurisdiction.</p>
              <p className="mt-2 text-slate-400 font-medium">Powered by Klyia Technology</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="h-10 border-b border-slate-300 w-40 mb-1" />
              <p className="font-bold text-slate-800">Authorized Signatory</p>
              <p className="text-[9px] text-slate-400">{settings.businessName || DEFAULT_COMPANY_PROFILE.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
