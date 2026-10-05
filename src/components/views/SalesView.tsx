import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Printer,
  Share2,
  Trash2,
  Download,
  Filter,
  CheckCircle2,
  Receipt,
  X,
  UserPlus,
  AlertCircle,
  Edit2,
  Scale,
  Wallet,
  ChevronDown,
  Sparkles,
  Building,
} from 'lucide-react';
import { ERPDataStore, Sale, SaleItem, Customer, CompanyBillProfile, Fruit } from '../../types';
import { formatINR, formatCurrencyAmount, formatDate, downloadCSV, buildWhatsAppLink } from '../../utils/formatters';
import { api } from '../../services/api';
import { CustomerAvatar } from '../CustomerAvatar';
import { FruitAvatar } from '../FruitAvatar';
import { CompanyBillProfileModal } from '../CompanyBillProfileModal';
import { QuickAddFruitModal } from '../QuickAddFruitModal';

interface SalesViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
  onViewInvoice: (sale: Sale) => void;
  initialCreateModalOpen?: boolean;
}

export const SalesView: React.FC<SalesViewProps> = ({
  data,
  onRefreshData,
  onViewInvoice,
  initialCreateModalOpen = false,
}) => {
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(initialCreateModalOpen);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'partial' | 'credit'>('all');

  // Company Bill Profiles (Part A)
  const companyProfiles = useMemo(() => {
    if (data.companyProfiles && data.companyProfiles.length > 0) {
      return data.companyProfiles.filter((cp) => cp.isActive !== false);
    }
    return [
      {
        id: 'comp-1',
        companyName: data.settings?.businessName || 'Hari Kripa Fruit Company',
        tradeName: data.settings?.shortName || 'HFC',
        logo: data.settings?.logoUrl || '/assets/hfc-logo.svg',
        address: data.settings?.address || 'Shop- A/6 Wholesale Fruit Market Camp-2, Power House, Bhilai (C.G.)',
        phone: data.settings?.phone1 || data.settings?.phone || '+91 7566996333',
        email: data.settings?.email || 'harikripafruitco@gmail.com',
        website: 'www.harikripafruit.com',
        gstin: data.settings?.gstNumber || data.settings?.gstin || '',
        pan: 'AAAFH1234F',
        bankDetails: data.settings?.bankDetails || '',
        upi: data.settings?.upiId || '',
        termsConditions: data.settings?.invoiceTerms || '',
        signature: '',
        authorizedPerson: 'Rajesh Patel (Proprietor)',
        isDefault: true,
        isActive: true,
      } as CompanyBillProfile,
    ];
  }, [data.companyProfiles, data.settings]);

  const defaultCompanyProfileId = useMemo(() => {
    const def = companyProfiles.find((cp) => cp.isDefault) || companyProfiles[0];
    return def ? def.id : 'comp-1';
  }, [companyProfiles]);

  const [selectedCompanyProfileId, setSelectedCompanyProfileId] = useState<string>(defaultCompanyProfileId);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isQuickAddFruitModalOpen, setIsQuickAddFruitModalOpen] = useState(false);

  const selectedCompany = useMemo(() => {
    return (
      companyProfiles.find((cp) => cp.id === selectedCompanyProfileId) ||
      companyProfiles.find((cp) => cp.isDefault) ||
      companyProfiles[0]
    );
  }, [companyProfiles, selectedCompanyProfileId]);

  React.useEffect(() => {
    if (initialCreateModalOpen) {
      setEditingSale(null);
      setIsNewSaleOpen(true);
    }
  }, [initialCreateModalOpen]);

  // New Sale Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

  // Left-Side Balance / Crate Panel State
  const [balanceCrates, setBalanceCrates] = useState<string | number>('1');
  const [weightPerCrate, setWeightPerCrate] = useState<string>('20 KG');

  // Items in Cart (No Grade!)
  const [items, setItems] = useState<
    {
      id?: string;
      fruitId: string;
      productName: string;
      fruitName: string;
      variety: string;
      quantity: string;
      kg: string;
      unit: string;
      rate: number;
      amount: number;
    }[]
  >([]);

  // Current Product Item Line Inputs (Product, Quantity, Unit, KG, Rate, Amount)
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState('1');
  const [currentUnit, setCurrentUnit] = useState('KG');
  const [currentKg, setCurrentKg] = useState('1');
  const [baseUnitKg, setBaseUnitKg] = useState<number>(1);
  const [currentRate, setCurrentRate] = useState<number | ''>('');

  // Right-Side Financial Summary State
  const [expense, setExpense] = useState<number | ''>(0);
  const [discount, setDiscount] = useState<number | ''>(0);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Credit'>('Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected customer object derived from latest data
  const selectedCustomer = data.customers.find((c) => c.id === selectedCustomerId) || null;

  // Real-time matching old customers for search
  const matchingCustomers = useMemo(() => {
    if (!customerSearchTerm.trim()) return data.customers;
    const term = customerSearchTerm.trim().toLowerCase();
    return data.customers.filter((c) => {
      const nameMatch = (c.name || '').toLowerCase().includes(term);
      const bizMatch = (c.businessName || '').toLowerCase().includes(term);
      const phoneMatch = (c.phone || '').includes(term);
      const cityMatch = (c.city || '').toLowerCase().includes(term);
      return nameMatch || bizMatch || phoneMatch || cityMatch;
    });
  }, [customerSearchTerm, data.customers]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerSearchTerm(c.name);
    setIsCustomerDropdownOpen(false);
    setErrorMessage('');
  };

  // Helper to parse numeric part of flexible quantity (e.g. "5 crates", "20 kg", "1 box")
  const parseQuantityNumber = (qtyStr: string | number): number => {
    if (typeof qtyStr === 'number') return qtyStr;
    const match = String(qtyStr).match(/[\d.]+/);
    if (match) {
      const val = parseFloat(match[0]);
      return isNaN(val) || val <= 0 ? 1 : val;
    }
    return 1;
  };

  // Matching products from Fruit/Product Master with Smart Search (PART G)
  // Searches fruit name, short name, product code, category & variety
  const matchingProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return data.fruits;
    const term = productSearchTerm.trim().toLowerCase();
    return data.fruits.filter((f) => {
      const nameMatch = (f.name || '').toLowerCase().includes(term);
      const shortMatch = (f.shortName || '').toLowerCase().includes(term);
      const codeMatch = (f.code || f.productCode || '').toLowerCase().includes(term);
      const catMatch = (f.category || '').toLowerCase().includes(term);
      const varMatch = (f.variety || '').toLowerCase().includes(term);
      return nameMatch || shortMatch || codeMatch || catMatch || varMatch;
    });
  }, [productSearchTerm, data.fruits]);

  // When an existing product is selected from smart suggestions
  const handleSelectProduct = (fruit: any) => {
    setSelectedProductId(fruit.id);
    setProductSearchTerm(fruit.name);
    setIsProductDropdownOpen(false);

    // Auto-fill quantity if empty
    const qty = currentQuantity.trim() || '1';
    setCurrentQuantity(qty);
    const parsedQty = parseQuantityNumber(qty);

    const fruitUnit = (fruit.unit || 'KG').trim();
    setCurrentUnit(fruitUnit);

    const isKgUnit = fruitUnit.toUpperCase() === 'KG';
    const unitKg = isKgUnit ? 1 : 20;
    setBaseUnitKg(unitKg);
    setCurrentKg(String(Math.round(parsedQty * unitKg)));

    // Auto-fill Rate from fruit.defaultRate, dailyRates, or fruit grades
    const dailyRateObj = data.dailyRates.find(
      (dr) => dr.fruitId === fruit.id && dr.date === saleDate
    );
    if (dailyRateObj && dailyRateObj.wholesaleRate > 0) {
      setCurrentRate(dailyRateObj.wholesaleRate);
    } else if (fruit.defaultRate !== undefined && fruit.defaultRate !== null) {
      setCurrentRate(fruit.defaultRate);
    } else {
      const primaryRate = fruit.grades?.[0]?.wholesaleRate || 80;
      setCurrentRate(primaryRate);
    }
    setErrorMessage('');
  };

  // When a brand new fruit is created via QuickAddFruitModal while on this bill
  const handleFruitCreated = (newFruit: Fruit) => {
    setSelectedProductId(newFruit.id);
    setProductSearchTerm(newFruit.name);

    const fruitUnit = (newFruit.unit || 'KG').trim();
    setCurrentUnit(fruitUnit);

    const qty = currentQuantity.trim() || '1';
    setCurrentQuantity(qty);
    const parsedQty = parseQuantityNumber(qty);

    const isKgUnit = fruitUnit.toUpperCase() === 'KG';
    const unitKg = isKgUnit ? 1 : 20;
    setBaseUnitKg(unitKg);
    setCurrentKg(String(Math.round(parsedQty * unitKg)));

    const rateVal =
      newFruit.defaultRate !== undefined && newFruit.defaultRate !== null
        ? Number(newFruit.defaultRate)
        : newFruit.grades?.[0]?.wholesaleRate || 100;
    setCurrentRate(rateVal);

    setIsProductDropdownOpen(false);
    setErrorMessage('');
  };

  // Smart quantity change: updates total KG based on baseUnitKg (e.g. 1 box -> 20 KG, 2 boxes -> 40 KG, or 10 KG -> 10)
  const handleQuantityChange = (newQty: string) => {
    setCurrentQuantity(newQty);
    const parsedQty = parseQuantityNumber(newQty);
    const isKgUnit = (currentUnit || '').trim().toUpperCase() === 'KG';
    if (isKgUnit || baseUnitKg === 1) {
      setCurrentKg(newQty);
    } else if (parsedQty > 0 && baseUnitKg > 0) {
      setCurrentKg(String(Math.round(parsedQty * baseUnitKg)));
    }
  };

  // Unit change: handles user switching between KG, BOX, CRATE, etc.
  const handleUnitChange = (newUnit: string) => {
    setCurrentUnit(newUnit);
    const isKgUnit = newUnit.trim().toUpperCase() === 'KG';
    if (isKgUnit) {
      setBaseUnitKg(1);
      setCurrentKg(currentQuantity);
    }
  };

  // Smart KG change: allows manual kanta / weight bridge scale override while updating baseUnitKg ratio
  const handleKgChange = (newKg: string) => {
    setCurrentKg(newKg);
    const parsedKg = parseFloat(newKg.replace(/[^\d.]/g, ''));
    const parsedQty = parseQuantityNumber(currentQuantity);
    if (parsedKg > 0 && parsedQty > 0) {
      setBaseUnitKg(parsedKg / parsedQty);
    }
  };

  // Calculate line item amount:
  // Amount = Quantity × Rate (or KG × Rate when unit is weight/KG)
  const calculateLineAmount = (qtyStr: string, kgVal: string | number, rateVal: number | ''): number => {
    const rate = Number(rateVal) || 0;
    if (rate <= 0) return 0;

    const qNum = parseQuantityNumber(qtyStr);
    const isKgUnit = (currentUnit || '').trim().toUpperCase() === 'KG';
    if (isKgUnit) {
      return Math.round(qNum * rate);
    }

    const kgNum = parseFloat(String(kgVal).replace(/[^\d.]/g, '')) || 0;
    if (kgNum > 0) {
      return Math.round(kgNum * rate);
    }
    return Math.round(qNum * rate);
  };

  // Live item amount calculation for currently active input line
  const currentItemAmount = calculateLineAmount(currentQuantity, currentKg, currentRate);

  // Add line item to cart (No Grade!)
  const handleAddItem = () => {
    const prodName = productSearchTerm.trim();
    if (!prodName) {
      setErrorMessage('Please enter or select a product.');
      return;
    }

    if (!String(currentQuantity).trim()) {
      setErrorMessage('Please enter a quantity (e.g. 1, 2, 5 boxes).');
      return;
    }

    const rate = Number(currentRate);
    if (isNaN(rate) || rate <= 0) {
      setErrorMessage('Please enter a valid rate (₹).');
      return;
    }

    const existingFruit = data.fruits.find(
      (f) => f.id === selectedProductId || f.name.toLowerCase() === prodName.toLowerCase()
    );

    const amount = currentItemAmount || Math.round(parseQuantityNumber(currentQuantity) * rate);

    setItems((prev) => [
      ...prev,
      {
        fruitId: existingFruit ? existingFruit.id : (selectedProductId || `custom-${Date.now()}`),
        productName: prodName,
        fruitName: prodName,
        variety: existingFruit?.variety || 'Standard',
        quantity: String(currentQuantity).trim(),
        kg: String(currentKg || currentQuantity).trim(),
        unit: currentUnit.trim() || existingFruit?.unit || 'KG',
        rate,
        amount,
      },
    ]);

    // Reset current item inputs
    setProductSearchTerm('');
    setSelectedProductId('');
    setCurrentQuantity('1');
    setCurrentUnit('KG');
    setCurrentKg('1');
    setBaseUnitKg(1);
    setCurrentRate('');
    setErrorMessage('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditCartItem = (index: number) => {
    const item = items[index];
    if (!item) return;
    setProductSearchTerm(item.productName);
    setSelectedProductId(item.fruitId);
    setCurrentQuantity(item.quantity);
    setCurrentUnit(item.unit || 'KG');
    setCurrentKg(item.kg || item.quantity);
    setCurrentRate(item.rate);
    const isKgUnit = (item.unit || 'KG').trim().toUpperCase() === 'KG';
    setBaseUnitKg(isKgUnit ? 1 : 20);
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Left-Side Balance / Crate Panel calculations
  const parsedCrates = parseFloat(String(balanceCrates).replace(/[^\d.]/g, '')) || 0;
  const parsedWeightPerCrate = parseFloat(String(weightPerCrate).replace(/[^\d.]/g, '')) || 0;
  const totalCrateWeight = Math.round(parsedCrates * (parsedWeightPerCrate || 20));

  // Right-Side Financial Summary Calculations
  // Total (Subtotal of all items)
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const numExpense = Number(expense) || 0;
  const numDiscount = Number(discount) || 0;
  const netTotal = Math.max(0, total + numExpense - numDiscount);
  const oldBalance = selectedCustomer ? Number(selectedCustomer.outstandingBalance) || 0 : 0;
  const totalBalance = netTotal + oldBalance;

  const numPaid = paidAmount === ''
    ? (paymentMethod === 'Credit' ? 0 : netTotal)
    : Number(paidAmount);
  const finalBalanceDue = Math.max(0, totalBalance - numPaid);

  const handleOpenCreateSale = () => {
    setEditingSale(null);
    setSelectedCustomerId('');
    setCustomerSearchTerm('');
    setIsCustomerDropdownOpen(false);
    setSaleDate(new Date().toISOString().split('T')[0]);
    setItems([]);
    setProductSearchTerm('');
    setSelectedProductId('');
    setIsProductDropdownOpen(false);
    setCurrentQuantity('1');
    setCurrentUnit('KG');
    setCurrentKg('1');
    setBaseUnitKg(1);
    setCurrentRate('');
    setBalanceCrates('1');
    setWeightPerCrate('20 KG');
    setExpense(0);
    setDiscount(0);
    setPaidAmount('');
    setPaymentMethod('Cash');
    setNotes('');
    setErrorMessage('');
    setSelectedCompanyProfileId(defaultCompanyProfileId);
    setIsNewSaleOpen(true);
  };

  const handleOpenEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSelectedCompanyProfileId(sale.companyProfileId || sale.companySnapshot?.id || defaultCompanyProfileId);
    setSelectedCustomerId(sale.customerId);
    setCustomerSearchTerm(sale.customerName || '');
    setIsCustomerDropdownOpen(false);
    setSaleDate(sale.saleDate ? sale.saleDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setItems(
      (sale.items || []).map((i) => ({
        id: i.id,
        fruitId: i.fruitId,
        productName: (i as any).productName || i.fruitName,
        fruitName: i.fruitName,
        variety: i.variety || 'Standard',
        quantity: i.quantity ? String(i.quantity) : `${i.crates || 1}`,
        kg: String((i as any).kg || (i.weightKg ? Math.round(i.weightKg / (parseQuantityNumber(i.quantity) || 1)) : 20)),
        unit: i.unit || 'KG',
        rate: Number(i.rate || i.ratePerKg || 0),
        amount: Number(i.amount || i.totalPrice || i.total || 0),
      }))
    );
    setProductSearchTerm('');
    setSelectedProductId('');
    setIsProductDropdownOpen(false);
    setCurrentQuantity('1');
    setCurrentUnit('KG');
    setCurrentKg('1');
    setBaseUnitKg(1);
    setCurrentRate('');
    setBalanceCrates(sale.balanceCrates !== undefined ? sale.balanceCrates : '1');
    setWeightPerCrate(sale.weightPerCrate !== undefined ? String(sale.weightPerCrate) : '20 KG');
    setExpense(sale.expense || 0);
    setDiscount(sale.discount || 0);
    setPaidAmount(sale.paidAmount);
    setPaymentMethod((sale.paymentMethod as any) || 'Cash');
    setNotes(sale.notes || '');
    setErrorMessage('');
    setIsNewSaleOpen(true);
  };

  const handleSaveSale = async () => {
    const custName = customerSearchTerm.trim();
    if (!selectedCustomerId && !custName) {
      setErrorMessage('Please select or enter a customer for this wholesale sale.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one product item.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Resolve Customer:
      // If user selected existing, use that.
      // If user typed name without selecting, find matching customer by name or auto-create in database!
      let effectiveCustomerId = selectedCustomerId;
      let effectiveCustomerName = custName;
      let targetCustomer = data.customers.find((c) => c.id === selectedCustomerId);

      if (!targetCustomer && custName) {
        const found = data.customers.find((c) => c.name.toLowerCase() === custName.toLowerCase());
        if (found) {
          targetCustomer = found;
          effectiveCustomerId = found.id;
          effectiveCustomerName = found.name;
        } else {
          // Auto-create new customer so it is stored in database and appears in future searches!
          try {
            const newCustRes = await api.createCustomer({
              name: custName,
              businessName: custName,
              phone: '9820000000',
              city: 'Mumbai',
              type: 'Wholesale Buyer',
              openingBalance: 0,
            });
            if (newCustRes?.customer) {
              targetCustomer = newCustRes.customer;
              effectiveCustomerId = newCustRes.customer.id;
              effectiveCustomerName = newCustRes.customer.name;
            }
          } catch {
            // Server fallback will also handle it
          }
        }
      }

      // Check credit limit if existing customer
      if (
        targetCustomer &&
        finalBalanceDue > 0 &&
        targetCustomer.outstandingBalance + finalBalanceDue > targetCustomer.creditLimit
      ) {
        const allowed = window.confirm(
          `Notice: This sale will exceed ${targetCustomer.name}'s credit limit of ${formatINR(
            targetCustomer.creditLimit
          )} (Current Balance: ${formatINR(targetCustomer.outstandingBalance)}). Proceed anyway?`
        );
        if (!allowed) {
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Resolve Products:
      // For any new product typed without an existing fruitId, check if it exists by name or auto-create in Fruit/Product Master!
      const resolvedItems: any[] = [];
      for (const it of items) {
        let fId = it.fruitId;
        const prodName = it.productName || it.fruitName;

        if (!fId) {
          const matchFruit = data.fruits.find((f) => f.name.toLowerCase() === prodName.toLowerCase());
          if (matchFruit) {
            fId = matchFruit.id;
          } else {
            try {
              const newFruitRes = await api.createFruit({
                name: prodName,
                variety: it.variety || 'Standard',
                unit: it.unit || 'KG',
                image: '🍎',
                minStockAlertKg: 50,
                grades: [{ grade: 'Standard' as any, wholesaleRate: it.rate, retailRate: it.rate * 1.2 }],
              });
              if (newFruitRes?.fruit) {
                fId = newFruitRes.fruit.id;
              }
            } catch {
              // Server fallback
            }
          }
        }

        const qNum = parseQuantityNumber(it.quantity);
        const kgNum = parseFloat(String(it.kg).replace(/[^\d.]/g, '')) || 0;
        const totalWeight = it.quantity.toLowerCase().includes('kg') ? qNum : (kgNum > 0 ? qNum * kgNum : qNum);

        resolvedItems.push({
          fruitId: fId || `frt-custom-${Date.now()}`,
          fruitName: prodName,
          productName: prodName,
          variety: it.variety || 'Standard',
          quantity: it.quantity,
          kg: it.kg,
          unit: it.unit || 'KG',
          rate: it.rate,
          ratePerKg: it.rate,
          amount: it.amount,
          totalPrice: it.amount,
          total: it.amount,
          crates: it.quantity.toLowerCase().includes('crate') || it.quantity.toLowerCase().includes('box') ? qNum : 0,
          weightKg: totalWeight,
        });
      }

      const payload = {
        customerId: effectiveCustomerId || `cust-${Date.now()}`,
        customerName: effectiveCustomerName,
        customerBusiness: effectiveCustomerName,
        customerType: targetCustomer?.type || 'Wholesale Buyer',
        companyProfileId: selectedCompany?.id || selectedCompanyProfileId,
        companySnapshot: selectedCompany
          ? {
              id: selectedCompany.id,
              companyName: selectedCompany.companyName,
              tradeName: selectedCompany.tradeName,
              logo: selectedCompany.logo,
              address: selectedCompany.address,
              gstin: selectedCompany.gstin,
              pan: selectedCompany.pan,
              phone: selectedCompany.phone,
              email: selectedCompany.email,
              website: selectedCompany.website,
              bankDetails: selectedCompany.bankDetails,
              upi: selectedCompany.upi,
              termsConditions: selectedCompany.termsConditions,
              signature: selectedCompany.signature,
              authorizedPerson: selectedCompany.authorizedPerson,
              isActive: selectedCompany.isActive,
            }
          : undefined,
        saleDate,
        items: resolvedItems,
        total,
        subtotal: total,
        expense: numExpense,
        discount: numDiscount,
        netTotal,
        grandTotal: netTotal,
        oldBalance,
        totalBalance,
        balanceCrates,
        weightPerCrate,
        paymentMethod,
        paidAmount: numPaid,
        notes,
      };

      let res: any;
      if (editingSale) {
        res = await api.updateSale(editingSale.id, payload);
      } else {
        res = await api.createSale(payload);
      }

      await onRefreshData();
      setIsNewSaleOpen(false);
      setEditingSale(null);
      setItems([]);
      setSelectedCustomerId('');
      setCustomerSearchTerm('');
      setProductSearchTerm('');
      setSelectedProductId('');
      setExpense(0);
      setDiscount(0);
      setPaidAmount('');
      setNotes('');

      if (res?.sale) {
        onViewInvoice(res.sale);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save sale invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered sales list
  const filteredSales = data.sales.filter((sale) => {
    const matchesSearch =
      sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || sale.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Items Count', 'Subtotal', 'Discount', 'Grand Total', 'Paid', 'Balance Due', 'Payment Method', 'Status'];
    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      formatDate(s.saleDate),
      s.customerName,
      s.items.length,
      s.subtotal,
      s.discount,
      s.grandTotal,
      s.paidAmount,
      s.balanceDue,
      s.paymentMethod,
      s.paymentStatus,
    ]);
    downloadCSV(`Sales_Report_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
            Sales & Wholesale Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Issue wholesale invoices, APMC cash memos, and update customer khata balances
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
            onClick={handleOpenCreateSale}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Sale</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <label htmlFor="sales-search-input" className="sr-only">Search invoices or customers</label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            id="sales-search-input"
            aria-label="Search invoices or customers"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number or customer..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'paid', 'partial', 'credit'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Invoices List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="table-container">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Fruits Sold</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No sales invoices match your filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(sale.saleDate)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <CustomerAvatar
                          customer={data.customers?.find((c) => c.id === sale.customerId || c.name === sale.customerName)}
                          name={sale.customerName}
                          size="xs"
                          shape="circle"
                        />
                        <span className="font-bold text-slate-900">{sale.customerName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {sale.items.map((i) => `${i.fruitName} (${i.weightKg}kg)`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono">
                      {formatINR(sale.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700 font-mono">
                      {formatINR(sale.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold font-mono">
                      <span className={sale.balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'}>
                        {formatINR(sale.balanceDue)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sale.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditSale(sale)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer mr-1.5"
                        title="Edit / Modify Sale"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => onViewInvoice(sale)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Print / View Invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bill</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW SALE (POS) MODAL */}
      {isNewSaleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base font-heading">
                    {editingSale ? `Edit Wholesale Sale #${editingSale.invoiceNumber}` : 'New Wholesale Sale / Cash Memo'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingSale ? 'Modify items, pricing & recalculate customer ledger & stock' : 'Live APMC Mandi Billing Terminal'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsNewSaleOpen(false);
                  setEditingSale(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* PART A: Bill From / Company Selection */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <label htmlFor="sales-company-select" className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Bill From / Company *
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddCompanyModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New Company</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-8">
                    <select
                      id="sales-company-select"
                      value={selectedCompanyProfileId}
                      onChange={(e) => setSelectedCompanyProfileId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                    >
                      {companyProfiles.map((cp) => (
                        <option key={cp.id} value={cp.id}>
                          {cp.companyName} {cp.tradeName ? `(${cp.tradeName})` : ''} {cp.isDefault ? '★ (Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-4 text-[11px] text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 truncate">
                    {selectedCompany ? (
                      <span title={`${selectedCompany.address} • Ph: ${selectedCompany.phone}`}>
                        📍 {selectedCompany.address ? selectedCompany.address.split(',')[0] : 'Mandi'} • 📞 {selectedCompany.phone}
                      </span>
                    ) : (
                      <span>No company profile selected</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Row: Customer Selector (Smart Searchable) & Invoice Date */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* Select Customer * - NO separate "+ Add New Wholesale Customer" button */}
                  <div className="md:col-span-8 relative">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      Select Customer *
                    </label>

                    {selectedCustomer ? (
                      /* Loaded Existing Customer Banner */
                      <div className="p-2.5 sm:p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <CustomerAvatar customer={selectedCustomer} size="sm" shape="circle" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-900">{selectedCustomer.name}</span>
                              {selectedCustomer.businessName && selectedCustomer.businessName !== selectedCustomer.name && (
                                <span className="text-xs text-slate-500">({selectedCustomer.businessName})</span>
                              )}
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Old Customer
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>📞 {selectedCustomer.phone}</span>
                              {selectedCustomer.city && <span>📍 {selectedCustomer.city}</span>}
                              <span className="text-rose-600 font-semibold">Khata Due: {formatINR(selectedCustomer.outstandingBalance)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId('');
                            setCustomerSearchTerm('');
                            setIsCustomerDropdownOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ml-2"
                        >
                          Change / Search
                        </button>
                      </div>
                    ) : (
                      /* Smart Searchable Customer Input Box */
                      <div className="relative">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Type customer name (e.g. Green Fruit Traders, Gupta, Goyal)..."
                            value={customerSearchTerm}
                            onChange={(e) => {
                              setCustomerSearchTerm(e.target.value);
                              setIsCustomerDropdownOpen(true);
                            }}
                            onFocus={() => setIsCustomerDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Customer Autocomplete Dropdown */}
                        {isCustomerDropdownOpen && customerSearchTerm.trim().length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                            {matchingCustomers.length > 0 ? (
                              <div>
                                <div className="px-3 py-1.5 bg-slate-100/90 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between border-b border-slate-200">
                                  <span>Matching Customers ({matchingCustomers.length})</span>
                                  <span className="text-[9px] text-emerald-600 font-normal">Click to auto-fill</span>
                                </div>
                                {matchingCustomers.map((cust) => (
                                  <div
                                    key={cust.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleSelectCustomer(cust);
                                    }}
                                    className="px-3 py-2 hover:bg-emerald-50/70 border-b border-slate-100 last:border-0 cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <CustomerAvatar customer={cust} size="xs" shape="circle" />
                                        <span className="text-xs font-bold text-slate-900">{cust.name}</span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                          Old Customer
                                        </span>
                                      </div>
                                      <span className="text-[11px] font-bold text-rose-600 font-mono">
                                        Due: {formatINR(cust.outstandingBalance)}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                      {cust.businessName && cust.businessName !== cust.name && (
                                        <span>{cust.businessName}</span>
                                      )}
                                      <span>📞 {cust.phone}</span>
                                      {cust.city && <span>📍 {cust.city}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3 text-center text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">"{customerSearchTerm}"</span> not found in existing records.
                                <div className="text-[11px] text-emerald-600 mt-0.5">
                                  ✓ Will automatically be created as a new customer when saving this Cash Memo.
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Direct Indicator for New Customer Name */}
                        {customerSearchTerm.trim().length > 0 && !selectedCustomer && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <span>
                              New Customer: <strong>{customerSearchTerm}</strong> (will be registered in database on save)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Invoice Date */}
                  <div className="md:col-span-4">
                    <label htmlFor="sales-date" className="block text-xs font-bold text-slate-800 mb-1 uppercase tracking-wider">
                      Invoice Date
                    </label>
                    <input
                      id="sales-date"
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2-Column Mandi Layout: Left-Side Balance / Crate Panel + Right-Side Items Entry */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* ============================================================== */}
                {/* LEFT-SIDE BALANCE / CRATE PANEL & PAYMENT                     */}
                {/* ============================================================== */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Customer Balance & Crate Panel */}
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-emerald-700" />
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                        Customer Balance
                      </h4>
                    </div>

                    {selectedCustomer ? (
                      <div className="space-y-3">
                        {/* Balance summary cards */}
                        <div className="bg-white p-3 rounded-xl border border-emerald-200/60 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-medium">Previous Due:</span>
                            <span className="font-mono font-bold text-rose-600">{formatINR(oldBalance)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 font-medium">Credit Limit:</span>
                            <span className="font-mono text-slate-700">{formatINR(selectedCustomer.creditLimit)}</span>
                          </div>
                        </div>

                        {/* Editable Crate Balance & Weight per Crate */}
                        <div className="bg-white p-3 rounded-xl border border-emerald-200/60 space-y-2.5">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Balance Crates
                            </label>
                            <input
                              type="text"
                              value={balanceCrates}
                              onChange={(e) => setBalanceCrates(e.target.value)}
                              placeholder="1"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              1 Crate = (Weight per Crate)
                            </label>
                            <input
                              type="text"
                              value={weightPerCrate}
                              onChange={(e) => setWeightPerCrate(e.target.value)}
                              placeholder="20 KG"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                            />
                          </div>

                          <div className="p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-800 flex items-center justify-between">
                            <span className="text-slate-600">Calculated Crate Weight:</span>
                            <span className="font-bold font-mono">
                              {parsedCrates} × {parsedWeightPerCrate} = {totalCrateWeight} KG
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs text-slate-500 text-center">
                        Select an existing wholesale customer above to display their Khata and crate balance.
                      </div>
                    )}
                  </div>

                  {/* Payment Method & Delivery Notes */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Payment & Dispatch
                    </h4>

                    <div>
                      <label htmlFor="sales-payment-method" className="block text-[11px] font-bold text-slate-600 mb-1">
                        Payment Method
                      </label>
                      <select
                        id="sales-payment-method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Cash">Cash Payment</option>
                        <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                        <option value="Credit">Credit (Add to Customer Khata)</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="sales-paid-amount" className="block text-[11px] font-bold text-slate-600 mb-1">
                        Paid Amount (₹)
                      </label>
                      <input
                        id="sales-paid-amount"
                        type="number"
                        placeholder={paymentMethod === 'Credit' ? '0' : String(netTotal)}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="sales-notes" className="block text-[11px] font-bold text-slate-600 mb-1">
                        Notes / Vehicle / Tempo No.
                      </label>
                      <input
                        id="sales-notes"
                        type="text"
                        placeholder="e.g. Loaded in Tempo MH-43-AK-2026"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* RIGHT-SIDE / MAIN: ADD FRUIT ITEMS (RENAME TO PRODUCT, NO GRADE!) */}
                {/* ============================================================== */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Add Fruit Items Section */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Add Fruit Items
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        Product Smart Search & Auto Calculation
                      </span>
                    </div>

                    {/* Responsive Billing Form Row: Product | Quantity | Unit | Rate (₹) | Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
                      {/* 1. Product (Smart Search Input with + Add New Fruit) */}
                      <div className="col-span-12 md:col-span-4 relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Product *
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsQuickAddFruitModalOpen(true)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer transition-colors"
                            title="Add a new fruit to catalog without leaving bill"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add New Fruit</span>
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="🔍 Search Fruit/Product................"
                            value={productSearchTerm}
                            onChange={(e) => {
                              setProductSearchTerm(e.target.value);
                              setSelectedProductId('');
                              setIsProductDropdownOpen(true);
                            }}
                            onFocus={() => setIsProductDropdownOpen(true)}
                            onBlur={() => setTimeout(() => setIsProductDropdownOpen(false), 200)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddItem();
                              }
                            }}
                            className="w-full h-10 px-3 py-2 pr-9 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-2xs"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        </div>

                        {/* Product Autocomplete Dropdown with Fruit Avatars & + Add Fruit Button */}
                        {isProductDropdownOpen && productSearchTerm.trim().length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                            {matchingProducts.length > 0 ? (
                              <div>
                                <div className="px-3 py-1.5 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                  <span>Fruit Results ({matchingProducts.length})</span>
                                  <span className="text-[9px] text-emerald-600 font-medium">Click to select</span>
                                </div>
                                {matchingProducts.map((fruit) => {
                                  const displayRate =
                                    fruit.defaultRate !== undefined && fruit.defaultRate !== null
                                      ? fruit.defaultRate
                                      : fruit.grades?.[0]?.wholesaleRate || 80;
                                  return (
                                    <div
                                      key={fruit.id}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectProduct(fruit);
                                      }}
                                      className="px-3 py-2 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <FruitAvatar fruit={fruit} size="xs" shape="square" />
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-xs font-bold text-slate-900 truncate">
                                                {fruit.name}
                                              </span>
                                              {fruit.code && (
                                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                                                  {fruit.code}
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 truncate">
                                              {fruit.category} • {fruit.unit || 'KG'}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="text-xs font-bold text-emerald-700 font-mono">
                                            ₹{displayRate}
                                          </span>
                                          <span className="text-[10px] text-slate-400">/{fruit.unit || 'KG'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="p-3 text-center text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">"{productSearchTerm}"</span> not found in Fruit Master.
                              </div>
                            )}

                            {/* Dropdown Quick Add Fruit Action */}
                            <div
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setIsQuickAddFruitModalOpen(true);
                              }}
                              className="p-2.5 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-between border-t border-emerald-100 cursor-pointer transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                <span>+ Add New Fruit "{productSearchTerm}"</span>
                              </span>
                              <span className="text-[9px] bg-white px-1.5 py-0.5 rounded text-emerald-700 shadow-2xs font-semibold">
                                Quick Modal
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Direct Indicator for New Product Name */}
                        {productSearchTerm.trim().length > 0 && !selectedProductId && (
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className="text-emerald-700 font-medium">
                              New Fruit: <strong>{productSearchTerm}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsQuickAddFruitModalOpen(true)}
                              className="text-emerald-600 font-bold hover:underline cursor-pointer"
                            >
                              + Set Details &amp; Icon
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 2. Quantity (Flexible input) */}
                      <div className="col-span-6 sm:col-span-1 md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Quantity *
                        </label>
                        <input
                          type="text"
                          placeholder="10"
                          value={currentQuantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem();
                            }
                          }}
                          className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-center shadow-2xs"
                        />
                      </div>

                      {/* 3. Unit (Editable input) */}
                      <div className="col-span-6 sm:col-span-1 md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Unit
                        </label>
                        <input
                          type="text"
                          placeholder="KG"
                          value={currentUnit}
                          onChange={(e) => handleUnitChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem();
                            }
                          }}
                          className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono uppercase text-center shadow-2xs"
                        />
                      </div>

                      {/* 4. Rate (Editable input) */}
                      <div className="col-span-6 sm:col-span-1 md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Rate (₹) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="120.00"
                          value={currentRate}
                          onChange={(e) => setCurrentRate(e.target.value === '' ? '' : Number(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem();
                            }
                          }}
                          className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-right shadow-2xs"
                        />
                      </div>

                      {/* 5. Amount (Auto Calculated Box) */}
                      <div className="col-span-12 sm:col-span-12 md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Amount
                        </label>
                        <input
                          type="text"
                          readOnly
                          tabIndex={-1}
                          value={formatCurrencyAmount(currentItemAmount)}
                          className="w-full h-10 px-3 py-2 bg-emerald-50/80 border border-emerald-300 rounded-xl text-xs font-black text-emerald-800 font-mono text-right focus:outline-none cursor-default select-none shadow-2xs"
                          aria-label="Calculated line amount"
                        />
                      </div>
                    </div>

                    {/* Action Bar & Live Calculation Note */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-200/80">
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-700">Calculation:</span>
                        {productSearchTerm.trim() && currentRate ? (
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="text-slate-800 font-bold">{currentQuantity} {currentUnit || 'KG'}</span>
                            <span className="text-slate-400">×</span>
                            <span className="text-slate-800 font-bold">₹{Number(currentRate).toFixed(2)}</span>
                            <span className="text-slate-400">=</span>
                            <span className="font-mono font-black text-emerald-700 text-sm">
                              {formatCurrencyAmount(currentItemAmount)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Amount = Quantity × Rate (updates automatically)
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Item to Bill</span>
                      </button>
                    </div>

                    {/* Items in Cart Table (NO GRADE!) */}
                    {items.length > 0 ? (
                      <div className="mt-3 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">#</th>
                              <th className="p-2.5">Product</th>
                              <th className="p-2.5 text-center">Quantity</th>
                              <th className="p-2.5 text-center">Unit</th>
                              <th className="p-2.5 text-right">Rate (₹)</th>
                              <th className="p-2.5 text-right">Amount</th>
                              <th className="p-2.5 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60">
                                <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                                <td className="p-2.5 font-bold text-slate-900">
                                  {(() => {
                                    const matchedFruit =
                                      data.fruits.find(
                                        (f) =>
                                          f.id === item.fruitId ||
                                          f.name.toLowerCase() === item.productName.toLowerCase()
                                      ) || ({ name: item.productName, image: '🍎' } as Fruit);
                                    return (
                                      <div className="flex items-center gap-2">
                                        <FruitAvatar fruit={matchedFruit} size="xs" shape="square" />
                                        <span>{item.productName}</span>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="p-2.5 text-center font-bold text-slate-800 font-mono">
                                  {item.quantity}
                                </td>
                                <td className="p-2.5 text-center font-semibold text-slate-700 font-mono">
                                  {item.unit || item.kg || 'KG'}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-700">
                                  {formatCurrencyAmount(item.rate)}
                                </td>
                                <td className="p-2.5 text-right font-black text-slate-900 font-mono">
                                  {formatCurrencyAmount(item.amount)}
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleEditCartItem(idx)}
                                      title="Edit item in billing form"
                                      className="text-slate-500 hover:text-emerald-700 p-1 cursor-pointer transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(idx)}
                                      title="Remove item"
                                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No products added to this Cash Memo yet. Type product name, enter quantity & unit, and click <strong>+ Add Item to Bill</strong>.
                      </div>
                    )}
                  </div>

                  {/* Financial Summary Card */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Financial Calculation & Khata Impact
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Items Total</div>
                        <div className="text-sm font-black text-slate-900 font-mono mt-0.5">{formatINR(total)}</div>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Expense / Hamali (₹)</div>
                        <input
                          type="number"
                          min="0"
                          value={expense}
                          onChange={(e) => setExpense(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="0"
                          className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Discount (₹)</div>
                        <input
                          type="number"
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="0"
                          className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Net Current Bill:</span>
                        <span className="font-bold text-slate-900 font-mono">{formatINR(netTotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Customer Old Balance:</span>
                        <span className="font-mono text-slate-700">{formatINR(oldBalance)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
                        <span>Total Balance (Bill + Old Due):</span>
                        <span className="font-mono text-slate-900">{formatINR(totalBalance)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Paid Now:</span>
                        <span className="font-mono font-bold">-{formatINR(numPaid)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold pt-1.5 border-t border-slate-200">
                        <span>Final Khata Balance Due:</span>
                        <span className={finalBalanceDue > 0 ? 'text-rose-600 font-mono' : 'text-emerald-600 font-mono'}>
                          {formatINR(finalBalanceDue)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewSaleOpen(false);
                          setEditingSale(null);
                        }}
                        className="w-1/3 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer text-center"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveSale}
                        disabled={isSubmitting || items.length === 0 || (!selectedCustomerId && !customerSearchTerm.trim())}
                        className="w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <span>Saving APMC Invoice...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{editingSale ? 'Save Invoice Changes' : 'Generate Invoice & Update Khata'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Company Profile Modal (Part A) */}
      <CompanyBillProfileModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onSaved={(newProfile) => {
          setSelectedCompanyProfileId(newProfile.id);
        }}
        onRefreshData={onRefreshData}
      />

      {/* Quick Add Fruit Modal right inside Bill creation (Part F) */}
      <QuickAddFruitModal
        isOpen={isQuickAddFruitModalOpen}
        onClose={() => setIsQuickAddFruitModalOpen(false)}
        prefilledName={productSearchTerm}
        onFruitCreated={handleFruitCreated}
        onRefreshData={onRefreshData}
      />
    </div>
  );
};
