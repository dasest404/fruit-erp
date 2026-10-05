import React from 'react';
import { X, Printer, Share2, Download, CheckCircle2, Building, QrCode } from 'lucide-react';
import { Sale, BusinessSettings } from '../types';
import { formatINR, formatCurrencyAmount, formatDate, buildWhatsAppLink } from '../utils/formatters';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { DEFAULT_COMPANY_PROFILE } from '../config/companyProfile';
import { FruitAvatar } from './FruitAvatar';

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

  // Resolve the exclusive company profile for this bill (Historical Company Snapshot Rule)
  const company = sale.companySnapshot || {
    id: sale.companyProfileId || 'default',
    companyName: settings.businessName || DEFAULT_COMPANY_PROFILE.name,
    tradeName: settings.shortName || DEFAULT_COMPANY_PROFILE.shortName,
    logo: settings.logoUrl || DEFAULT_COMPANY_PROFILE.logo,
    address: settings.address || DEFAULT_COMPANY_PROFILE.address,
    phone: settings.phone1 || settings.phone || DEFAULT_COMPANY_PROFILE.phone1,
    email: settings.email || DEFAULT_COMPANY_PROFILE.email,
    website: (settings as any).website || '',
    gstin: settings.gstNumber || settings.gstin || '',
    pan: (settings as any).pan || '',
    bankDetails: settings.bankDetails || 'Bank: State Bank of India | A/C: 38920192831 | IFSC: SBIN0004321',
    upi: settings.upiId || 'harikripa@upi',
    termsConditions:
      settings.invoiceTerms ||
      '1. Immediate settlement required for mandi wholesale lots.\n2. Payment due strictly as per agreed wholesale credit cycle.\n3. Subject to local APMC Mandi jurisdiction.',
    signature: (settings as any).signatureUrl || '',
    authorizedPerson: (settings as any).authorizedPerson || 'Authorized Signatory',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    try {
      generateInvoicePDF(sale, settings, previousBalance, customerPhone);
    } catch {
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

    const message = `*${company.companyName}*
${company.tradeName ? `(${company.tradeName})\n` : ''}${company.address}
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
_Phone: ${company.phone}_
${company.email ? `_Email: ${company.email}_` : ''}`;

    window.open(buildWhatsAppLink(phone, message), '_blank');
  };

  const currentKhataTotal = previousBalance + sale.balanceDue;

  // Generate UPI QR URI for payment if UPI ID available
  const upiQrUrl = company.upi
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
        `upi://pay?pa=${company.upi}&pn=${encodeURIComponent(company.companyName)}&am=${sale.balanceDue > 0 ? sale.balanceDue : sale.grandTotal}&cu=INR`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-base">📄</span>
            <span className="font-bold text-sm font-heading">Wholesale Tax Invoice</span>
            <span className="text-xs text-slate-400">({sale.invoiceNumber})</span>
            {sale.companySnapshot && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold">
                Billed from: {company.companyName}
              </span>
            )}
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
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-6 sm:p-10 text-slate-900 font-sans text-xs bg-white">
          {/* Header - ONLY the Selected Company Profile Printed */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
            <div className="flex items-start gap-3 sm:gap-4">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.companyName}
                  className="h-16 sm:h-20 w-auto max-w-[120px] object-contain shrink-0 rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xl shrink-0">
                  {company.companyName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
                  {company.companyName}
                </h1>
                {company.tradeName && company.tradeName !== company.companyName && (
                  <p className="text-emerald-700 font-bold text-xs uppercase tracking-wider mt-0.5">
                    {company.tradeName}
                  </p>
                )}
                <p className="text-slate-600 mt-1 max-w-sm leading-relaxed text-[11px]">
                  {company.address}
                </p>
                <div className="text-slate-600 mt-1 text-[11px] space-y-0.5">
                  <p>
                    <span className="font-semibold text-slate-700">Phone:</span>{' '}
                    <span>{company.phone}</span>
                    {company.email && <span> • {company.email}</span>}
                  </p>
                  {company.website && (
                    <p>
                      <span className="font-semibold text-slate-700">Website:</span>{' '}
                      <span>{company.website}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    {company.gstin && (
                      <p>
                        <span className="font-semibold text-slate-700">GSTIN:</span>{' '}
                        <span className="font-mono font-bold">{company.gstin}</span>
                      </p>
                    )}
                    {company.pan && (
                      <p>
                        <span className="font-semibold text-slate-700">PAN:</span>{' '}
                        <span className="font-mono font-bold">{company.pan}</span>
                      </p>
                    )}
                  </div>
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
              {sale.customerBusiness && sale.customerBusiness !== sale.customerName && (
                <p className="text-[11px] text-slate-500">Business: {sale.customerBusiness}</p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Method:</p>
              <p className="font-bold text-slate-800">{sale.paymentMethod}</p>
              <p className="text-[11px] text-slate-500">APMC Mandi Cash / Credit Memo</p>
            </div>
          </div>

          {/* Itemized Table with Fruit Avatar/Icon */}
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
                {sale.items.map((item, idx) => {
                  const fruitVisual = {
                    name: item.fruitName,
                    photoUrl: item.photoUrl,
                    customIconUrl: item.customIconUrl,
                    avatarIcon: item.avatarIcon || (item as any).fruitIcon || '🍎',
                    image: item.photoUrl || item.customIconUrl || item.avatarIcon || (item as any).fruitIcon || '🍎',
                  };
                  return (
                    <tr key={item.id || idx}>
                      <td className="py-2.5 px-2 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FruitAvatar fruit={fruitVisual as any} size="xs" shape="square" />
                          <span>{item.fruitName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-600">
                        {item.variety || item.unit || 'Standard'}
                      </td>
                      <td className="py-2.5 px-2 text-right font-semibold text-slate-800">
                        {item.quantity ? String(item.quantity) : `${item.weightKg} ${item.unit || 'KG'}`}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        {formatCurrencyAmount(item.rate || item.ratePerKg || 0)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-slate-900 font-mono">
                        {formatCurrencyAmount(item.totalPrice || item.total || item.amount || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary & Bank/UPI */}
          <div className="pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-6">
            {/* Left Box: Khata & Bank Details */}
            <div className="max-w-xs space-y-3">
              <div>
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
              </div>

              {/* Bank Details & UPI Info */}
              {(company.bankDetails || company.upi) && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Bank &amp; Digital UPI</p>
                    {company.bankDetails && (
                      <p className="text-slate-600 text-[10px] truncate">{company.bankDetails}</p>
                    )}
                    {company.upi && (
                      <p className="text-emerald-700 font-bold text-[10px]">UPI: {company.upi}</p>
                    )}
                  </div>
                  {upiQrUrl && (
                    <img
                      src={upiQrUrl}
                      alt="UPI QR"
                      className="w-12 h-12 rounded border border-slate-300 p-0.5 shrink-0 bg-white"
                      title="Scan to Pay via UPI"
                    />
                  )}
                </div>
              )}

              {sale.notes && (
                <p className="text-[11px] text-slate-500 italic">Notes: {sale.notes}</p>
              )}
            </div>

            {/* Right Box: Calculations */}
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
            <div className="max-w-sm">
              <p className="font-bold text-slate-700 mb-0.5">Terms &amp; Conditions:</p>
              <div className="whitespace-pre-line text-slate-600">
                {company.termsConditions || '1. Immediate settlement required for mandi wholesale lots.\n2. Subject to local jurisdiction.'}
              </div>
              <p className="mt-2 text-slate-400 font-medium">Billed with Klyia FreshERP</p>
            </div>
            <div className="text-center sm:text-right">
              {company.signature ? (
                <div className="h-12 w-36 ml-auto mb-1 flex items-center justify-end">
                  <img src={company.signature} alt="Sign" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-10 border-b border-slate-300 w-40 mb-1 ml-auto" />
              )}
              <p className="font-bold text-slate-800">
                {company.authorizedPerson || 'Authorized Signatory'}
              </p>
              <p className="text-[9px] text-slate-400">{company.companyName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
