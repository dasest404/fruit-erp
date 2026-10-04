import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, Supplier, BusinessSettings, CustomerLedgerEntry, SupplierLedgerEntry } from '../types';
import { formatINR, formatDate } from './formatters';
import { DEFAULT_COMPANY_PROFILE } from '../config/companyProfile';

function getCompanyInfo(settings: BusinessSettings) {
  const name = settings.businessName || DEFAULT_COMPANY_PROFILE.name;
  const tagline = settings.tagline || DEFAULT_COMPANY_PROFILE.tagline;
  const address = settings.address || DEFAULT_COMPANY_PROFILE.address;
  const phone = `${settings.phone1 || settings.phone || DEFAULT_COMPANY_PROFILE.phone1} | ${DEFAULT_COMPANY_PROFILE.phone2} (${DEFAULT_COMPANY_PROFILE.phone2Label}) | ${DEFAULT_COMPANY_PROFILE.phone3} (${DEFAULT_COMPANY_PROFILE.phone3Label})`;
  const email = settings.email || DEFAULT_COMPANY_PROFILE.email;
  const gstinPart = (settings.gstNumber || settings.gstin) ? ` | GSTIN: ${settings.gstNumber || settings.gstin}` : '';
  const subtitle = `${address} | Phones: ${phone} | ${email}${gstinPart}`;
  return { name, tagline, address, phone, email, subtitle };
}

export function generateCustomerStatementPDF(
  customer: Customer,
  settings: BusinessSettings,
  ledger: CustomerLedgerEntry[] = []
): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const company = getCompanyInfo(settings);

    // 1. Header & Branding Banner
    doc.setFillColor(16, 185, 129); // Emerald 600
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(company.name, 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(236, 253, 245);
    doc.text(company.subtitle, 14, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${company.tagline} • CUSTOMER DIGITAL KHATA & ACCOUNT STATEMENT`, 14, 24);

    // 2. Statement Metadata (Top Right)
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 12, { align: 'right' });
    doc.text('A/C Statement', pageWidth - 14, 18, { align: 'right' });

    // 3. Customer Info Box
    let startY = 36;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate 900
    doc.text('BILL TO / CUSTOMER:', 14, startY);

    doc.setFontSize(13);
    doc.setTextColor(5, 150, 105); // emerald 600
    doc.text(customer.name, 14, startY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // slate 600
    let infoLine = 12;
    if (customer.businessName) {
      doc.text(`Shop / Firm: ${customer.businessName}`, 14, startY + infoLine);
      infoLine += 5;
    }
    doc.text(`Mobile: ${customer.phone || 'N/A'}`, 14, startY + infoLine);
    infoLine += 5;
    if (customer.address || customer.city) {
      doc.text(`Address: ${customer.address || ''}${customer.address && customer.city ? ', ' : ''}${customer.city || ''}`, 14, startY + infoLine);
      infoLine += 5;
    }
    if (customer.gstin || customer.gstNumber) {
      doc.text(`GSTIN: ${customer.gstin || customer.gstNumber}`, 14, startY + infoLine);
      infoLine += 5;
    }

    // 4. Financial Summary Cards on the Right
    const summaryX = pageWidth - 80;
    doc.setFillColor(248, 250, 252); // slate 50
    doc.setDrawColor(226, 232, 240); // slate 200
    doc.roundedRect(summaryX, startY - 2, 66, 36, 3, 3, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('FINANCIAL SUMMARY', summaryX + 6, startY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Total Purchases:', summaryX + 6, startY + 11);
    doc.text(formatINR(customer.totalPurchases), summaryX + 60, startY + 11, { align: 'right' });

    doc.text('Total Paid:', summaryX + 6, startY + 17);
    doc.setTextColor(5, 150, 105);
    doc.text(formatINR(customer.totalPaid || customer.totalPayments || 0), summaryX + 60, startY + 17, { align: 'right' });

    doc.setTextColor(71, 85, 105);
    doc.text('Credit Limit:', summaryX + 6, startY + 23);
    doc.text(formatINR(customer.creditLimit || 0), summaryX + 60, startY + 23, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // rose 600
    doc.text('Outstanding Due:', summaryX + 6, startY + 30);
    doc.text(formatINR(customer.outstandingBalance), summaryX + 60, startY + 30, { align: 'right' });

    // 5. Digital Khata Transactions Table
    const tableStartY = Math.max(startY + infoLine + 6, startY + 42);

    const tableRows = ledger.map((entry) => [
      formatDate(entry.date),
      entry.type ? String(entry.type).toUpperCase() : 'ENTRY',
      entry.referenceId || entry.referenceNo || '-',
      entry.notes || entry.description || 'Transaction',
      entry.debit > 0 ? formatINR(entry.debit) : '-',
      entry.credit > 0 ? formatINR(entry.credit) : '-',
      formatINR(entry.balance),
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Date', 'Type', 'Ref No', 'Particulars / Description', 'Debit (+)', 'Credit (-)', 'Balance']],
      body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'No transactions recorded in this ledger', '-', '-', formatINR(customer.outstandingBalance)]],
      headStyles: {
        fillColor: [15, 23, 42], // slate 900
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 24, halign: 'right', textColor: [225, 29, 72] }, // red
        5: { cellWidth: 24, halign: 'right', textColor: [5, 150, 105] }, // green
        6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });

    // 6. Footer Notes & Payment Info
    const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 250;
    if (finalY < 270) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Payment Terms & Instructions:', 14, finalY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const terms = settings.invoiceTerms || 'Please settle overdue balance promptly via UPI or NEFT. Contact us for any clarifications.';
      const splitTerms = doc.splitTextToSize(terms, pageWidth - 28);
      doc.text(splitTerms, 14, finalY + 4);

      if (settings.phone) {
        doc.text(`For payment queries, contact: ${settings.phone}`, 14, finalY + 4 + (splitTerms.length * 4));
      }
    }

    // Page number
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${i} of ${totalPages} • Powered by Klyia Technology • This is a computer-generated digital account statement`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      );
    }

    const safeName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${safeName}_Khata_Statement.pdf`);
  } catch (err) {
    console.error('Failed to generate Customer Statement PDF:', err);
    throw err;
  }
}

export function generateSupplierStatementPDF(
  supplier: Supplier,
  settings: BusinessSettings,
  ledger: SupplierLedgerEntry[] = []
): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const company = getCompanyInfo(settings);

    // 1. Header & Branding Banner
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(company.name, 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(company.subtitle, 14, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${company.tagline} • SUPPLIER LOT & PAYMENT SETTLEMENT STATEMENT`, 14, 24);

    // 2. Metadata (Top Right)
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 12, { align: 'right' });
    doc.text('Supplier Ledger', pageWidth - 14, 18, { align: 'right' });

    // 3. Supplier Info Box
    const startY = 36;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('SUPPLIER / GROWER / MANDI TRADER:', 14, startY);

    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(supplier.name, 14, startY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    let infoLine = 12;
    if (supplier.contactPerson) {
      doc.text(`Contact Person: ${supplier.contactPerson}`, 14, startY + infoLine);
      infoLine += 5;
    }
    doc.text(`Mobile: ${supplier.phone || 'N/A'}`, 14, startY + infoLine);
    infoLine += 5;
    if (supplier.city || supplier.state || supplier.address) {
      doc.text(`Location: ${supplier.address ? `${supplier.address}, ` : ''}${supplier.city || ''}${supplier.state ? `, ${supplier.state}` : ''}`, 14, startY + infoLine);
      infoLine += 5;
    }
    if (supplier.gstNumber) {
      doc.text(`GSTIN: ${supplier.gstNumber}`, 14, startY + infoLine);
      infoLine += 5;
    }
    if (supplier.bankDetails) {
      doc.text(`Bank / UPI: ${supplier.bankDetails}`, 14, startY + infoLine);
      infoLine += 5;
    }

    // 4. Financial Summary Cards on the Right
    const summaryX = pageWidth - 80;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(summaryX, startY - 2, 66, 36, 3, 3, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('SETTLEMENT SUMMARY', summaryX + 6, startY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Total Inward Purchases:', summaryX + 6, startY + 11);
    doc.text(formatINR(supplier.totalPurchases || 0), summaryX + 60, startY + 11, { align: 'right' });

    doc.text('Total Settled / Paid:', summaryX + 6, startY + 17);
    doc.setTextColor(5, 150, 105);
    doc.text(formatINR(supplier.totalPaid ?? supplier.paymentsMade ?? 0), summaryX + 60, startY + 17, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text('Balance Payable:', summaryX + 6, startY + 28);
    doc.text(formatINR(supplier.outstandingPayable || 0), summaryX + 60, startY + 28, { align: 'right' });

    // 5. Supplier Ledger Transactions Table
    const tableStartY = Math.max(startY + infoLine + 6, startY + 42);

    const tableRows = ledger.map((entry) => [
      formatDate(entry.date),
      entry.type ? String(entry.type).toUpperCase() : 'ENTRY',
      entry.referenceId || entry.referenceNo || '-',
      entry.notes || entry.description || 'Transaction',
      entry.debit > 0 ? formatINR(entry.debit) : '-',
      entry.credit > 0 ? formatINR(entry.credit) : '-',
      formatINR(entry.balance),
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Date', 'Type', 'Ref No', 'Particulars / Memo', 'Paid / Debit (-)', 'Inward / Credit (+)', 'Balance']],
      body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'No transactions recorded for this supplier', '-', '-', formatINR(supplier.outstandingPayable)]],
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 26, halign: 'right', textColor: [5, 150, 105] },
        5: { cellWidth: 26, halign: 'right', textColor: [225, 29, 72] },
        6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${i} of ${totalPages} • Powered by Klyia Technology • Computer-generated supplier settlement ledger`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      );
    }

    const safeName = (supplier.name || 'Supplier').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`${safeName}_Supplier_Statement.pdf`);
  } catch (err) {
    console.error('Failed to generate Supplier Statement PDF:', err);
    throw err;
  }
}

export function generateInvoicePDF(
  sale: any,
  settings: BusinessSettings,
  previousBalance: number = 0,
  customerPhone?: string
): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const company = getCompanyInfo(settings);

    // Top Header Banner
    doc.setFillColor(16, 185, 129); // Emerald 600
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(company.name, 14, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(236, 253, 245);
    doc.text(company.subtitle, 14, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${company.tagline} • WHOLESALE CASH MEMO / INVOICE`, 14, 24);

    // Metadata Right
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice: ${sale.invoiceNumber}`, pageWidth - 14, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Date: ${formatDate(sale.saleDate)}`, pageWidth - 14, 18, { align: 'right' });
    doc.text(`Status: ${(sale.paymentStatus || 'PAID').toUpperCase()}`, pageWidth - 14, 24, { align: 'right' });

    // Customer / Bill To Box
    const startY = 36;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('BILLED TO (CUSTOMER):', 14, startY);

    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105);
    doc.text(sale.customerName || 'Customer', 14, startY + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    let line = 12;
    if (customerPhone) {
      doc.text(`Phone: ${customerPhone}`, 14, startY + line);
      line += 5;
    }
    doc.text(`Payment Mode: ${sale.paymentMethod || 'Cash'}`, 14, startY + line);

    // Invoice Items Table
    const tableStartY = startY + line + 8;
    const tableRows = (sale.items || []).map((it: any, idx: number) => {
      const qtyStr = it.quantity ? String(it.quantity) : `${it.weightKg || it.kg || 0} ${it.unit || 'KG'}`;
      const rateVal = it.rate || it.ratePerKg || 0;
      const amtVal = it.totalPrice || it.total || it.amount || 0;
      return [
        idx + 1,
        it.fruitName,
        it.variety || it.unit || 'Standard',
        qtyStr,
        formatINR(rateVal),
        formatINR(amtVal),
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Product Item', 'Variety / Unit', 'Quantity / Weight', 'Rate', 'Amount']],
      body: tableRows,
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25 },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });

    const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 150;

    // Calculation Box
    const calcBoxX = pageWidth - 80;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(calcBoxX, finalY, 66, 38, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Subtotal:', calcBoxX + 5, finalY + 6);
    doc.text(formatINR(sale.subtotal), calcBoxX + 61, finalY + 6, { align: 'right' });

    if (sale.discount > 0) {
      doc.text('Discount:', calcBoxX + 5, finalY + 12);
      doc.text(`-${formatINR(sale.discount)}`, calcBoxX + 61, finalY + 12, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Grand Total:', calcBoxX + 5, finalY + 19);
    doc.text(formatINR(sale.grandTotal), calcBoxX + 61, finalY + 19, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text('Amount Paid:', calcBoxX + 5, finalY + 25);
    doc.text(formatINR(sale.paidAmount), calcBoxX + 61, finalY + 25, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    if (sale.balanceDue > 0) {
      doc.setTextColor(225, 29, 72);
    } else {
      doc.setTextColor(5, 150, 105);
    }
    doc.text('Invoice Due:', calcBoxX + 5, finalY + 32);
    doc.text(formatINR(sale.balanceDue), calcBoxX + 61, finalY + 32, { align: 'right' });

    // Khata Summary on the left
    const khataTotal = previousBalance + (sale.balanceDue || 0);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY, 70, 38, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('CUSTOMER KHATA SUMMARY', 18, finalY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Previous Due:', 18, finalY + 13);
    doc.text(formatINR(previousBalance), 80, finalY + 13, { align: 'right' });

    doc.text('This Invoice Due:', 18, finalY + 19);
    doc.text(formatINR(sale.balanceDue), 80, finalY + 19, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text('Total Khata Outstanding:', 18, finalY + 28);
    doc.text(formatINR(khataTotal), 80, finalY + 28, { align: 'right' });

    // Terms and Signatures
    const termsY = finalY + 46;
    if (termsY < 270) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Terms: ${settings.invoiceTerms || 'All sales are final.'}`, 14, termsY);
      doc.text('Subject to Bhilai (C.G.) Jurisdiction • Powered by Klyia Technology', 14, termsY + 4);

      doc.setFont('helvetica', 'bold');
      doc.text('Authorized Signatory', pageWidth - 14, termsY + 4, { align: 'right' });
    }

    doc.save(`${sale.invoiceNumber}.pdf`);
  } catch (err) {
    console.error('Failed to generate Invoice PDF:', err);
    throw err;
  }
}
