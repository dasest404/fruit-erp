import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  BookOpen,
  Phone,
  Share2,
  Download,
  CreditCard,
  X,
  CheckCircle2,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  FileText,
  MapPin,
  Edit2,
  Trash2,
  ArrowLeft,
  Printer,
  Eye,
  Building,
  Calendar,
  DollarSign,
  Clock,
  Mail,
  RefreshCw,
  Camera,
  Palette,
  Sparkles,
} from 'lucide-react';
import { ERPDataStore, Customer, CustomerLedgerEntry, Sale, CustomerPayment } from '../../types';
import { formatINR, formatDate, downloadCSV, buildWhatsAppLink } from '../../utils/formatters';
import { generateCustomerStatementPDF } from '../../utils/pdfGenerator';
import { api } from '../../services/api';
import { DEFAULT_COMPANY_PROFILE } from '../../config/companyProfile';
import { CustomerAvatar } from '../CustomerAvatar';
import { CustomerIconPickerModal } from '../CustomerIconPickerModal';
import { compressImageFile, validateImageFile } from '../../utils/imageUtils';

interface CustomersViewProps {
  data: ERPDataStore;
  onRefreshData: () => Promise<void>;
  onOpenNewSaleForCustomer?: (customerId: string) => void;
  initialCustomerId?: string;
  onCustomerSelect?: (customerId: string | undefined) => void;
  onViewInvoice?: (sale: Sale) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  data,
  onRefreshData,
  onOpenNewSaleForCustomer,
  initialCustomerId,
  onCustomerSelect,
  onViewInvoice,
}) => {
  // Selected Customer ID state (synced with initialCustomerId prop)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomerId || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'khata' | 'sales' | 'payments' | 'info'>('khata');
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Customer Form State
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [pan, setPan] = useState('');
  const [customerType, setCustomerType] = useState('Wholesale Buyer');
  const [creditLimit, setCreditLimit] = useState<number | ''>(100000);
  const [creditPeriodDays, setCreditPeriodDays] = useState<number | ''>(15);
  const [openingBalance, setOpeningBalance] = useState<number | ''>(0);
  const [customerNotes, setCustomerNotes] = useState('');

  // Customer Avatar / Photo / DP State
  const [photoUrl, setPhotoUrl] = useState('');
  const [avatarIcon, setAvatarIcon] = useState('👤');
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isDirectIconPickerOpen, setIsDirectIconPickerOpen] = useState(false);
  const [isQuickPhotoPickerOpen, setIsQuickPhotoPickerOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState('');
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = React.useRef<HTMLInputElement>(null);

  // Smart suggestions & existing customer selection state
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState<Customer | null>(null);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showBusinessSuggestions, setShowBusinessSuggestions] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [showBuyerTypeSuggestions, setShowBuyerTypeSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [dismissedDuplicateWarning, setDismissedDuplicateWarning] = useState(false);

  // Auto-fill all fields from an existing saved customer
  const fillFromExistingCustomer = (c: Customer) => {
    setSelectedExistingCustomer(c);
    setName(c.name || '');
    setBusinessName(c.businessName || '');
    setContactPerson(c.contactPerson || c.name || '');
    setPhone(c.phone || '');
    setWhatsapp(c.whatsapp || c.phone || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setCity(c.city || 'Mumbai');
    setState(c.state || 'Maharashtra');
    setAadhaarNumber(c.aadhaarNumber || (c as any).aadhaar || '');
    setPan(c.pan || '');
    setCustomerType(c.type || 'Wholesale Buyer');
    setCreditLimit(c.creditLimit ?? 100000);
    setCreditPeriodDays(c.creditPeriodDays ?? 15);
    setOpeningBalance(c.outstandingBalance ?? c.openingBalance ?? 0);
    setCustomerNotes(c.notes || '');
    setPhotoUrl(c.photoUrl || '');
    setAvatarIcon(c.avatarIcon || '👤');
    setCustomIconUrl(c.customIconUrl || '');
    setPhotoUploadError('');
    setErrorMessage('');
    setShowNameSuggestions(false);
    setShowBusinessSuggestions(false);
    setShowPhoneSuggestions(false);
    setShowBuyerTypeSuggestions(false);
    setShowCitySuggestions(false);
    setShowStateSuggestions(false);
    setDismissedDuplicateWarning(true);
  };

  // Real-time matching customers for Customer / Contact Name field
  const matchingCustomers = useMemo(() => {
    const term = name.trim().toLowerCase();
    if (!term) return [];
    return (data?.customers || []).filter((c) => {
      const cName = (c.name || '').toLowerCase();
      const cContact = (c.contactPerson || '').toLowerCase();
      const cBiz = (c.businessName || '').toLowerCase();
      const cPhone = (c.phone || '').toLowerCase();
      const cCity = (c.city || '').toLowerCase();
      return (
        cName.includes(term) ||
        cContact.includes(term) ||
        cBiz.includes(term) ||
        cPhone.includes(term) ||
        cCity.includes(term)
      );
    });
  }, [name, data?.customers]);

  // Real-time matching for Business Name
  const matchingBusinesses = useMemo(() => {
    const term = businessName.trim().toLowerCase();
    if (!term) return [];
    return (data?.customers || []).filter((c) => (c.businessName || '').toLowerCase().includes(term));
  }, [businessName, data?.customers]);

  // Real-time matching for Mobile Phone
  const matchingPhones = useMemo(() => {
    const term = phone.trim();
    if (!term || term.length < 3) return [];
    return (data?.customers || []).filter((c) => (c.phone || '').includes(term));
  }, [phone, data?.customers]);

  // Real-time suggestions for Buyer Type
  const existingBuyerTypes = useMemo(() => {
    const types = new Set<string>(['Wholesale Buyer', 'Retail Mart', 'Commission Buyer', 'Hotel/Catering']);
    (data?.customers || []).forEach((c) => {
      if (c.type && c.type.trim()) types.add(c.type.trim());
    });
    return Array.from(types);
  }, [data?.customers]);

  const matchingBuyerTypes = useMemo(() => {
    const term = customerType.trim().toLowerCase();
    if (!term) return existingBuyerTypes;
    return existingBuyerTypes.filter((t) => t.toLowerCase().includes(term));
  }, [customerType, existingBuyerTypes]);

  // Suggestions for City
  const existingCities = useMemo(() => {
    const cities = new Set<string>(['Mumbai', 'Navi Mumbai', 'Thane', 'Pune', 'Nashik', 'Nagpur', 'Surat', 'Ahmedabad', 'Delhi']);
    (data?.customers || []).forEach((c) => {
      if (c.city && c.city.trim()) cities.add(c.city.trim());
    });
    return Array.from(cities);
  }, [data?.customers]);

  const matchingCities = useMemo(() => {
    const term = city.trim().toLowerCase();
    if (!term) return existingCities.slice(0, 8);
    return existingCities.filter((c) => c.toLowerCase().includes(term));
  }, [city, existingCities]);

  // Suggestions for State
  const existingStates = useMemo(() => {
    const states = new Set<string>(['Maharashtra', 'Gujarat', 'Karnataka', 'Madhya Pradesh', 'Rajasthan', 'Delhi', 'Punjab', 'Himachal Pradesh']);
    (data?.customers || []).forEach((c) => {
      if (c.state && c.state.trim()) states.add(c.state.trim());
    });
    return Array.from(states);
  }, [data?.customers]);

  const matchingStates = useMemo(() => {
    const term = state.trim().toLowerCase();
    if (!term) return existingStates.slice(0, 8);
    return existingStates.filter((s) => s.toLowerCase().includes(term));
  }, [state, existingStates]);

  // Duplicate customer detection (checks existing database for close/exact match by name or phone)
  const duplicateCustomerMatch = useMemo(() => {
    if (editingCustomer || selectedExistingCustomer || dismissedDuplicateWarning) return null;
    const trimmedName = name.trim().toLowerCase();
    const rawPhone = phone.replace(/\D/g, '');
    if (trimmedName.length < 2 && rawPhone.length < 7) return null;

    return (data?.customers || []).find((c) => {
      const cName = (c.name || '').trim().toLowerCase();
      const cPhone = (c.phone || '').replace(/\D/g, '');
      const nameMatch = trimmedName.length >= 2 && (cName === trimmedName || (trimmedName.length >= 4 && cName.includes(trimmedName)));
      const phoneMatch = rawPhone.length >= 7 && cPhone.length >= 7 && cPhone === rawPhone;
      return nameMatch || phoneMatch;
    }) || null;
  }, [name, phone, data?.customers, editingCustomer, selectedExistingCustomer, dismissedDuplicateWarning]);

  // Payment Form State
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Khata Ledger Edit / Direct Adjustment State
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [editingLedgerEntry, setEditingLedgerEntry] = useState<CustomerLedgerEntry | null>(null);
  const [ledgerDate, setLedgerDate] = useState(new Date().toISOString().split('T')[0]);
  const [ledgerType, setLedgerType] = useState<'Payment' | 'Sale' | 'Adjustment' | 'Opening'>('Adjustment');
  const [ledgerReferenceNo, setLedgerReferenceNo] = useState('');
  const [ledgerDescription, setLedgerDescription] = useState('');
  const [ledgerNotes, setLedgerNotes] = useState('');
  const [ledgerDebit, setLedgerDebit] = useState<number | ''>('');
  const [ledgerCredit, setLedgerCredit] = useState<number | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state if initialCustomerId changes from parent (e.g. URL change / search / browser nav)
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  // Derive current selected customer safely from latest data
  const currentCustomer = selectedCustomerId
    ? data?.customers?.find((c) => c.id === selectedCustomerId) || null
    : null;

  // Safe customer ledger entries (safely handling property naming differences)
  const allCustomerLedgers: CustomerLedgerEntry[] =
    data?.customerLedger || (data as any)?.customerLedgers || [];

  const customerLedger: CustomerLedgerEntry[] = currentCustomer
    ? allCustomerLedgers.filter((l) => l && l.customerId === currentCustomer.id)
    : [];

  // Safe customer sales
  const customerSales: Sale[] = currentCustomer
    ? (data?.sales || []).filter((s) => s && s.customerId === currentCustomer.id)
    : [];

  // Safe customer payments
  const customerPayments: CustomerPayment[] = currentCustomer
    ? (data?.customerPayments || []).filter((p) => p && p.customerId === currentCustomer.id)
    : [];

  // Handle selecting a customer (opens Customer Details and notifies parent)
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab('khata');
    setUpdateSuccessMessage(null);
    setErrorMessage('');
    if (onCustomerSelect) {
      onCustomerSelect(customerId);
    }
  };

  // Handle returning to customer list (Back to Customers)
  const handleBackToCustomers = () => {
    setSelectedCustomerId(null);
    setUpdateSuccessMessage(null);
    setErrorMessage('');
    if (onCustomerSelect) {
      onCustomerSelect(undefined);
    }
  };

  // Filtered customer list for directory
  const filteredCustomers = (data?.customers || []).filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.businessName || '').toLowerCase().includes(term) ||
      (c.phone || '').includes(term) ||
      (c.city || '').toLowerCase().includes(term) ||
      (c.contactPerson || '').toLowerCase().includes(term)
    );
  });

  // Photo upload and profile avatar handlers
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setPhotoUploadError(validation.error || 'Please upload a valid image file (JPG, JPEG, PNG, WEBP).');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setPhotoUploadError('');
      const compressed = await compressImageFile(file, {
        maxWidth: 400,
        maxHeight: 400,
        cropToSquare: true,
        quality: 0.88,
      });
      setPhotoUrl(compressed);
    } catch (err: any) {
      setPhotoUploadError(err.message || 'Failed to process customer photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleProfilePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentCustomer) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error || 'Please select a valid image file (JPG, JPEG, PNG, WEBP).');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImageFile(file, {
        maxWidth: 400,
        maxHeight: 400,
        cropToSquare: true,
        quality: 0.88,
      });
      await api.updateCustomer(currentCustomer.id, {
        photoUrl: compressed,
      });
      await onRefreshData();
      setUpdateSuccessMessage(`Customer profile photo updated successfully.`);
      setTimeout(() => setUpdateSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile photo.');
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDirectChooseIcon = async (icon: string) => {
    if (!currentCustomer) return;
    try {
      await api.updateCustomer(currentCustomer.id, {
        photoUrl: '',
        avatarIcon: icon,
        customIconUrl: '',
      });
      await onRefreshData();
      setUpdateSuccessMessage(`Customer avatar icon updated.`);
      setTimeout(() => setUpdateSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to update avatar icon.');
    }
  };

  const handleDirectChooseCustomIcon = async (dataUrl: string) => {
    if (!currentCustomer) return;
    try {
      await api.updateCustomer(currentCustomer.id, {
        photoUrl: '',
        customIconUrl: dataUrl,
        avatarIcon: '',
      });
      await onRefreshData();
      setUpdateSuccessMessage(`Customer custom logo / icon updated successfully.`);
      setTimeout(() => setUpdateSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to update custom icon.');
    }
  };

  const handleDirectRemovePhoto = async () => {
    if (!currentCustomer) return;
    if (!window.confirm('Remove photo/avatar icon and revert to system default customer icon?')) {
      return;
    }
    try {
      await api.updateCustomer(currentCustomer.id, {
        photoUrl: '',
        customIconUrl: '',
        avatarIcon: '👤',
      });
      await onRefreshData();
      setUpdateSuccessMessage(`Customer photo removed. System default icon restored.`);
      setTimeout(() => setUpdateSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to remove photo.');
    }
  };

  // Open Edit Customer Modal
  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setSelectedExistingCustomer(c);
    setDismissedDuplicateWarning(true);
    setName(c.name || '');
    setBusinessName(c.businessName || '');
    setContactPerson(c.contactPerson || c.name || '');
    setPhone(c.phone || '');
    setWhatsapp(c.whatsapp || c.phone || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setCity(c.city || 'Mumbai');
    setState(c.state || 'Maharashtra');
    setAadhaarNumber(c.aadhaarNumber || (c as any).aadhaar || '');
    setPan(c.pan || '');
    setCustomerType(c.type || 'Wholesale Buyer');
    setCreditLimit(c.creditLimit ?? 100000);
    setCreditPeriodDays(c.creditPeriodDays ?? 15);
    setOpeningBalance(c.openingBalance ?? 0);
    setCustomerNotes(c.notes || '');
    setPhotoUrl(c.photoUrl || '');
    setAvatarIcon(c.avatarIcon || '👤');
    setCustomIconUrl(c.customIconUrl || '');
    setPhotoUploadError('');
    setErrorMessage('');
    setShowNameSuggestions(false);
    setShowBusinessSuggestions(false);
    setShowPhoneSuggestions(false);
    setShowBuyerTypeSuggestions(false);
    setShowCitySuggestions(false);
    setShowStateSuggestions(false);
    setIsAddCustomerOpen(true);
  };

  // Open Add Customer Modal
  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setSelectedExistingCustomer(null);
    setDismissedDuplicateWarning(false);
    setName('');
    setBusinessName('');
    setContactPerson('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setCity('Mumbai');
    setState('Maharashtra');
    setAadhaarNumber('');
    setPan('');
    setCustomerType('Wholesale Buyer');
    setCreditLimit(100000);
    setCreditPeriodDays(15);
    setOpeningBalance(0);
    setCustomerNotes('');
    setPhotoUrl('');
    setAvatarIcon('👤');
    setCustomIconUrl('');
    setPhotoUploadError('');
    setErrorMessage('');
    setShowNameSuggestions(false);
    setShowBusinessSuggestions(false);
    setShowPhoneSuggestions(false);
    setShowBuyerTypeSuggestions(false);
    setShowCitySuggestions(false);
    setShowStateSuggestions(false);
    setIsAddCustomerOpen(true);
  };

  // Save Customer (handles both Add, Edit, and Existing Selection)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }

    // Prevent accidental duplicate if close/exact match exists and user hasn't explicitly chosen to continue
    if (!editingCustomer && !selectedExistingCustomer && duplicateCustomerMatch && !dismissedDuplicateWarning) {
      setErrorMessage('An existing customer with this name was found. Select the existing customer to use its saved information.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const targetExisting = editingCustomer || selectedExistingCustomer;
      if (targetExisting) {
        // Update existing customer record (preserves ID, does not create duplicate)
        await api.updateCustomer(targetExisting.id, {
          name: name.trim(),
          businessName: businessName.trim() || name.trim(),
          contactPerson: contactPerson.trim() || name.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim() || 'Mumbai',
          state: state.trim() || 'Maharashtra',
          aadhaarNumber: aadhaarNumber.trim(),
          pan: pan.trim(),
          type: customerType.trim() || 'Wholesale Buyer',
          creditLimit: Number(creditLimit) || 0,
          creditPeriodDays: Number(creditPeriodDays) || 0,
          notes: customerNotes.trim(),
          photoUrl: photoUrl.trim(),
          avatarIcon: avatarIcon.trim() || '👤',
          customIconUrl: customIconUrl.trim(),
        });

        await onRefreshData();
        setIsAddCustomerOpen(false);
        setEditingCustomer(null);
        setSelectedExistingCustomer(null);
        handleSelectCustomer(targetExisting.id);
        setUpdateSuccessMessage(`Customer record for ${name.trim()} updated and Digital Khata opened.`);
        setTimeout(() => setUpdateSuccessMessage(null), 5000);
      } else {
        // Create new customer record
        const res = await api.createCustomer({
          name: name.trim(),
          businessName: businessName.trim() || name.trim(),
          contactPerson: contactPerson.trim() || name.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim() || 'Mumbai',
          state: state.trim() || 'Maharashtra',
          aadhaarNumber: aadhaarNumber.trim(),
          pan: pan.trim(),
          type: customerType.trim() || 'Wholesale Buyer',
          creditLimit: Number(creditLimit) || 0,
          creditPeriodDays: Number(creditPeriodDays) || 0,
          openingBalance: Number(openingBalance) || 0,
          notes: customerNotes.trim(),
          photoUrl: photoUrl.trim(),
          avatarIcon: avatarIcon.trim() || '👤',
          customIconUrl: customIconUrl.trim(),
        });

        await onRefreshData();
        setIsAddCustomerOpen(false);
        setSelectedExistingCustomer(null);
        if (res?.customer?.id) {
          handleSelectCustomer(res.customer.id);
          setUpdateSuccessMessage('Customer created and Digital Khata opened successfully.');
          setTimeout(() => setUpdateSuccessMessage(null), 5000);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (id: string) => {
    const cust = data?.customers?.find((c) => c.id === id);
    const custName = cust?.name || 'this customer';
    if (!window.confirm(`Are you sure you want to delete ${custName}? All digital khata records will be permanently removed.`)) {
      return;
    }
    try {
      await api.deleteCustomer(id);
      if (selectedCustomerId === id) {
        handleBackToCustomers();
      }
      await onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  // Record / Modify Khata Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingPaymentId) {
        await api.updateCustomerPayment(editingPaymentId, {
          amount: amt,
          paymentDate,
          paymentMethod: paymentMode,
          referenceNo: paymentReference,
          notes: paymentNotes,
        });
        setUpdateSuccessMessage(`Payment updated and ledger balance recalculated successfully.`);
      } else {
        await api.recordCustomerPayment(currentCustomer.id, {
          amount: amt,
          date: paymentDate,
          paymentDate,
          paymentMethod: paymentMode,
          paymentMode,
          referenceNo: paymentReference,
          reference: paymentReference,
          notes: paymentNotes,
        });
        setUpdateSuccessMessage(`Payment of ${formatINR(amt)} recorded successfully.`);
      }

      await onRefreshData();
      setIsPaymentModalOpen(false);
      setEditingPaymentId(null);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentNotes('');
      setTimeout(() => setUpdateSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record customer payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditPayment = (payment: CustomerPayment) => {
    setEditingPaymentId(payment.id);
    setPaymentAmount(payment.amount);
    setPaymentDate(payment.paymentDate || new Date().toISOString().split('T')[0]);
    setPaymentMode((payment.paymentMethod as any) || 'UPI');
    setPaymentReference(payment.referenceNo || '');
    setPaymentNotes(payment.notes || '');
    setErrorMessage('');
    setIsPaymentModalOpen(true);
  };

  // Khata Ledger Edit & Direct Adjustment Handlers
  const handleSaveLedgerEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (editingLedgerEntry) {
        await api.updateCustomerLedgerEntry(editingLedgerEntry.id, {
          date: ledgerDate,
          type: ledgerType,
          referenceNo: ledgerReferenceNo,
          description: ledgerDescription,
          notes: ledgerNotes,
          debit: Number(ledgerDebit) || 0,
          credit: Number(ledgerCredit) || 0,
        });
        setUpdateSuccessMessage(`Transaction updated and running balance recalculated successfully.`);
      } else {
        await api.createCustomerLedgerEntry({
          customerId: currentCustomer.id,
          date: ledgerDate,
          type: ledgerType,
          referenceNo: ledgerReferenceNo,
          description: ledgerDescription,
          notes: ledgerNotes,
          debit: Number(ledgerDebit) || 0,
          credit: Number(ledgerCredit) || 0,
        });
        setUpdateSuccessMessage(`Khata adjustment recorded and balance updated successfully.`);
      }

      await onRefreshData();
      setIsLedgerModalOpen(false);
      setEditingLedgerEntry(null);
      setTimeout(() => setUpdateSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save khata ledger entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditLedger = (entry: CustomerLedgerEntry) => {
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

  // WhatsApp Khata Balance & Statement
  const handleShareWhatsAppKhata = (cust: Customer) => {
    const message = `*Khata Statement - ${data.settings?.businessName || 'FreshERP'}*
To: *${cust.name} (${cust.businessName || cust.name})*
Date: ${formatDate(new Date().toISOString())}
--------------------------------
Total Wholesale Purchases: ${formatINR(cust.totalPurchases || 0)}
Total Payments Received: ${formatINR(cust.totalPaid || cust.totalPayments || 0)}
--------------------------------
*Current Outstanding Khata Balance: ${formatINR(cust.outstandingBalance || 0)}*
Credit Limit: ${formatINR(cust.creditLimit || 0)}
Payment Terms: ${cust.creditPeriodDays || 15} Days
--------------------------------
Please review your account statement. For UPI or NEFT transfers, please contact ${data.settings?.phone || 'our accounts office'}.
Thank you for your business!`;

    window.open(buildWhatsAppLink(cust.phone, message), '_blank');
  };

  // Download PDF Statement
  const handleDownloadPDF = (cust: Customer) => {
    try {
      generateCustomerStatementPDF(cust, data.settings, customerLedger);
    } catch (err) {
      console.error('PDF error:', err);
      alert('Failed to generate Customer Statement PDF. Please try again.');
    }
  };

  // Print Statement
  const handlePrintStatement = () => {
    window.print();
  };

  // Export Ledger CSV
  const handleExportLedgerCSV = () => {
    if (!currentCustomer) return;
    const headers = ['Date', 'Type', 'Reference No', 'Notes / Particulars', 'Debit (+)', 'Credit (-)', 'Running Balance'];
    const rows = customerLedger.map((l) => [
      formatDate(l.date),
      (l.type || 'ENTRY').toUpperCase(),
      l.referenceId || l.referenceNo || '-',
      l.notes || l.description || '-',
      l.debit || 0,
      l.credit || 0,
      l.balance || 0,
    ]);
    downloadCSV(`${currentCustomer.name.replace(/\s+/g, '_')}_Khata_Ledger`, headers, rows);
  };

  // Export Customers List CSV
  const handleExportCustomersCSV = () => {
    const headers = ['Customer Name', 'Business / Shop', 'Contact Person', 'Phone', 'City', 'State', 'GSTIN', 'Total Purchases', 'Total Paid', 'Outstanding Due', 'Credit Limit'];
    const rows = (data?.customers || []).map((c) => [
      c.name,
      c.businessName || c.name,
      c.contactPerson || c.name,
      c.phone,
      c.city,
      c.state || 'Maharashtra',
      c.gstin || c.gstNumber || '',
      c.totalPurchases || 0,
      c.totalPaid || c.totalPayments || 0,
      c.outstandingBalance || 0,
      c.creditLimit || 0,
    ]);
    downloadCSV(`Customers_Directory_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // =========================================================================
  // VIEW MODE 1: CUSTOMER DETAILS SCREEN (When selectedCustomerId is active)
  // =========================================================================
  if (selectedCustomerId) {
    // Loading State
    if (!data || !data.customers) {
      return (
        <div className="py-24 text-center space-y-3">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-sm font-semibold text-slate-700 font-heading">Loading customer details...</p>
          <p className="text-xs text-slate-400">Retrieving wholesale khata ledger and transactional history...</p>
        </div>
      );
    }

    // Customer Not Found State (Prevents blank/black screen)
    if (!currentCustomer) {
      return (
        <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            !
          </div>
          <h2 className="text-base font-bold text-slate-900 font-heading">Customer Not Found</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The requested customer ID <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{selectedCustomerId}</code> could not be found or may have been deleted.
          </p>
          <button
            onClick={handleBackToCustomers}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Customers</span>
          </button>
        </div>
      );
    }

    // Calculations for Financial Summary
    const totalPurchases = currentCustomer.totalPurchases || 0;
    const totalPaid = currentCustomer.totalPaid ?? (currentCustomer.totalPayments ?? 0);
    const outstanding = currentCustomer.outstandingBalance || 0;
    const limit = currentCustomer.creditLimit || 0;
    const creditUsedPercent = limit > 0 ? Math.min(100, Math.round((outstanding / limit) * 100)) : 0;
    const availableCredit = Math.max(0, limit - outstanding);
    const creditCycle = currentCustomer.creditPeriodDays || 15;

    return (
      <div className="space-y-6 pb-20 lg:pb-8">
        {/* PRINT ONLY: OFFICIAL HFC BRANDING HEADER FOR DIGITAL KHATA STATEMENT */}
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
              Customer Digital Khata
            </span>
            <p className="text-xs text-slate-500">Statement Date: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* TOP PROFILE / ACTION HEADER */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 print:border-none print:shadow-none">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Back Button, Large Customer Avatar & Customer Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                type="button"
                onClick={handleBackToCustomers}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 print:hidden"
                title="Back to Customers List"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Large Customer Avatar with Profile Photo Controls */}
              <div className="relative group shrink-0">
                <CustomerAvatar
                  customer={currentCustomer}
                  size="xl"
                  shape="circle"
                  className="ring-4 ring-emerald-500/20 shadow-md"
                />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                    {currentCustomer.name || 'Customer'}
                  </h1>
                  {currentCustomer.businessName && currentCustomer.businessName !== currentCustomer.name && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                      {currentCustomer.businessName}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                    {currentCustomer.type || 'Wholesale Buyer'}
                  </span>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 mt-1.5 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {currentCustomer.city || 'Mumbai'}{currentCustomer.state ? `, ${currentCustomer.state}` : ''}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {currentCustomer.phone || '—'}
                  </span>
                  {(currentCustomer.gstin || currentCustomer.gstNumber) && (
                    <span className="font-mono text-[11px] text-slate-400">
                      GSTIN: {currentCustomer.gstin || currentCustomer.gstNumber}
                    </span>
                  )}
                </div>

                {/* Direct DP Quick Action Buttons: Change Photo | Choose Icon | Remove Photo */}
                <div className="flex items-center gap-2 mt-2.5 print:hidden">
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleProfilePhotoFileChange}
                    className="hidden"
                    id="profile-dp-upload-input"
                  />
                  <label
                    htmlFor="profile-dp-upload-input"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                    title="Upload customer photo"
                  >
                    <Camera className="w-3 h-3 text-slate-500" />
                    <span>{currentCustomer.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setAvatarIcon(currentCustomer.avatarIcon || '👤');
                      setCustomIconUrl(currentCustomer.customIconUrl || '');
                      setIsDirectIconPickerOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                    title="Choose default icon or fruit avatar"
                  >
                    <Palette className="w-3 h-3 text-emerald-600" />
                    <span>Choose Icon</span>
                  </button>

                  {(currentCustomer.photoUrl || currentCustomer.customIconUrl || (currentCustomer.avatarIcon && currentCustomer.avatarIcon !== '👤')) && (
                    <button
                      type="button"
                      onClick={handleDirectRemovePhoto}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors"
                      title="Remove custom photo / icon"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap print:hidden">
              <button
                type="button"
                onClick={() => handleOpenEdit(currentCustomer)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Edit Customer Information"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit Customer</span>
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
                onClick={() => handleDownloadPDF(currentCustomer)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Download PDF Statement"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareWhatsAppKhata(currentCustomer)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                title="WhatsApp Statement"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentAmount('');
                  setPaymentReference('');
                  setPaymentNotes('');
                  setErrorMessage('');
                  setIsPaymentModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/25 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Receive Payment</span>
              </button>
            </div>
          </div>

          {/* Success message banner */}
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

        {/* 1. FINANCIAL SUMMARY METRICS (7 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {/* Total Sales */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Sales</p>
            <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1">
              {formatINR(totalPurchases)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Lifetime wholesale</p>
          </div>

          {/* Total Paid */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Paid</p>
            <p className="text-base sm:text-lg font-black text-emerald-600 font-mono mt-1">
              {formatINR(totalPaid)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Collections cleared</p>
          </div>

          {/* Outstanding Due */}
          <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
            <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Outstanding Due</p>
            <p className="text-base sm:text-lg font-black text-rose-600 font-mono mt-1">
              {formatINR(outstanding)}
            </p>
            <p className="text-[10px] text-rose-500 font-medium mt-0.5">Current Khata balance</p>
          </div>

          {/* Credit Limit */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Credit Limit</p>
            <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1">
              {formatINR(limit)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Approved ceiling</p>
          </div>

          {/* Used Credit */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Used Credit</p>
            <p className={`text-base sm:text-lg font-black font-mono mt-1 ${creditUsedPercent > 85 ? 'text-rose-600' : 'text-slate-900'}`}>
              {creditUsedPercent}%
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full ${creditUsedPercent > 85 ? 'bg-rose-500' : creditUsedPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${creditUsedPercent}%` }}
              />
            </div>
          </div>

          {/* Available Credit */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Available Credit</p>
            <p className="text-base sm:text-lg font-black text-emerald-600 font-mono mt-1">
              {formatINR(availableCredit)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Safe order headroom</p>
          </div>

          {/* Payment Terms */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Terms Cycle</p>
            <p className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1">
              {creditCycle} Days
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Payment settlement</p>
          </div>
        </div>

        {/* 2. CUSTOMER INFORMATION PROFILE ACCORDION/CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Customer Profile & Mandi Business Details
              </h2>
            </div>
            <button
              onClick={() => handleOpenEdit(currentCustomer)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>Modify</span>
            </button>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-6 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Customer Name</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{currentCustomer.name || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Business / Shop Name</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{currentCustomer.businessName || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Contact Person</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentCustomer.contactPerson || currentCustomer.name || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Mobile Phone</span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block">{currentCustomer.phone || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">WhatsApp Phone</span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block">{currentCustomer.whatsapp || currentCustomer.phone || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Email Address</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentCustomer.email || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">City / Mandi Area</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentCustomer.city || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">State</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentCustomer.state || 'Maharashtra'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">GSTIN Number</span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block">{currentCustomer.gstin || currentCustomer.gstNumber || 'Unregistered'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">PAN Number</span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block">{currentCustomer.pan || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Aadhaar Number</span>
              <span className="font-mono font-medium text-slate-800 mt-0.5 block">{currentCustomer.aadhaarNumber || (currentCustomer as any).aadhaar || '—'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Customer Type</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentCustomer.type || 'Wholesale Buyer'}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Credit Limit</span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">{formatINR(currentCustomer.creditLimit || 0)}</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Payment Terms</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentCustomer.creditPeriodDays || 15} Days</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Account Created</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentCustomer.createdAt ? formatDate(currentCustomer.createdAt) : '—'}</span>
            </div>

            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
              <span className="text-[11px] text-slate-400 block">Shop Address / Stall #</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{currentCustomer.address || '—'}</span>
            </div>
          </div>
        </div>

        {/* 3. SEGMENTED TRANSACTION TABS (Digital Khata Ledger, Sales History, Payment Receipts) */}
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
              <BookOpen className="w-3.5 h-3.5" />
              <span>Digital Khata Ledger</span>
              <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono">
                {customerLedger.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sales')}
              className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sales'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Sales & Invoices</span>
              <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono">
                {customerSales.length}
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
              <span>Payment Receipts</span>
              <span className="px-1.5 py-0.2 bg-slate-100 rounded-full text-[10px] font-mono">
                {customerPayments.length}
              </span>
            </button>
          </div>

          {/* TAB 1: DIGITAL KHATA LEDGER */}
          {activeTab === 'khata' && (
            <div className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Running Digital Khata Statement
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chronological ledger entries with debit, credit, and running balance tracking
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
                      setPaymentAmount('');
                      setPaymentReference('');
                      setPaymentNotes('');
                      setErrorMessage('');
                      setIsPaymentModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Receive Payment</span>
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
                      <th className="py-3 px-3 text-right">Debit (+)</th>
                      <th className="py-3 px-3 text-right">Credit (-)</th>
                      <th className="py-3 px-3.5 text-right">Balance</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerLedger.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          No transactions recorded in this customer khata ledger yet.
                        </td>
                      </tr>
                    ) : (
                      customerLedger.map((entry) => {
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
                                  entry.type === 'Sale'
                                    ? 'bg-rose-50 text-rose-700'
                                    : entry.type === 'Payment'
                                    ? 'bg-emerald-50 text-emerald-700'
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
                              {entry.notes || entry.description || 'Transaction'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                              {isDebit ? formatINR(entry.debit) : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
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

          {/* TAB 2: SALES & INVOICES HISTORY */}
          {activeTab === 'sales' && (
            <div className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Wholesale Sales Invoices for {currentCustomer.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Showing all invoices issued strictly to this buyer
                  </p>
                </div>

                {onOpenNewSaleForCustomer && (
                  <button
                    onClick={() => onOpenNewSaleForCustomer(currentCustomer.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Sale Invoice</span>
                  </button>
                )}
              </div>

              <div className="table-container border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3.5">Invoice #</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Produce Items</th>
                      <th className="py-3 px-3 text-right">Grand Total</th>
                      <th className="py-3 px-3 text-right">Paid Amount</th>
                      <th className="py-3 px-3 text-right">Due Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerSales.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          No sales invoices recorded for this customer yet.
                        </td>
                      </tr>
                    ) : (
                      customerSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                            {sale.invoiceNumber}
                          </td>
                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            {formatDate(sale.saleDate)}
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                            {sale.items?.map((i) => `${i.fruitName} (${i.weightKg} kg)`).join(', ') || 'Produce items'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatINR(sale.grandTotal)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                            {formatINR(sale.paidAmount || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                            {formatINR(sale.dueAmount || 0)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                (sale.dueAmount || 0) === 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : (sale.paidAmount || 0) > 0
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {(sale.dueAmount || 0) === 0 ? 'Fully Paid' : (sale.paidAmount || 0) > 0 ? 'Partial' : 'Credit Due'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            {onViewInvoice && (
                              <button
                                onClick={() => onViewInvoice(sale)}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                View Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT RECEIPTS HISTORY */}
          {activeTab === 'payments' && (
            <div className="p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Payment Receipts Cleared
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    History of khata collections, UPI transfers, cash, and cheques received
                  </p>
                </div>

                <button
                  onClick={() => {
                    setPaymentAmount('');
                    setPaymentReference('');
                    setPaymentNotes('');
                    setErrorMessage('');
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Receive Payment</span>
                </button>
              </div>

              <div className="table-container border border-slate-100 rounded-2xl">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3.5">Payment Date</th>
                      <th className="py-3 px-3">Receipt / Ref #</th>
                      <th className="py-3 px-3">Payment Mode</th>
                      <th className="py-3 px-3">Notes</th>
                      <th className="py-3 px-3.5 text-right">Amount Received</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400">
                          No payments recorded for this customer yet.
                        </td>
                      </tr>
                    ) : (
                      customerPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">
                            {payment.referenceNo || '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {payment.paymentMethod || 'UPI'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-sm truncate">
                            {payment.notes || 'Khata collection'}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-extrabold text-emerald-600">
                            {formatINR(payment.amount)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleOpenEditPayment(payment)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Edit / Modify Payment"
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
          )}
        </div>

        {/* MODALS RENDERED BELOW */}
        {renderCustomerFormModal()}
        {renderPaymentModal()}
        {renderLedgerModal()}
        {renderIconPickerModals()}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: CUSTOMERS & DIGITAL KHATA DIRECTORY (Combined Dashboard)
  // =========================================================================
  const totalCustomersCount = data?.customers?.length || 0;
  const totalKhataReceivable = (data?.customers || []).reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
  const totalCreditLimitApproved = (data?.customers || []).reduce((acc, c) => acc + (c.creditLimit || 0), 0);
  const overLimitCustomersCount = (data?.customers || []).filter((c) => (c.outstandingBalance || 0) > (c.creditLimit || 0)).length;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
            Customers & Digital Khata
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track credit limits, wholesale receivables, and automated WhatsApp statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCustomersCSV}
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
            <span>+ Add New Customer</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Customers</p>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">{totalCustomersCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Active wholesale accounts</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Total Khata Due</p>
          <p className="text-xl font-black text-rose-600 font-mono mt-1">{formatINR(totalKhataReceivable)}</p>
          <p className="text-[10px] text-rose-500 font-medium mt-0.5">Outstanding market balance</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Credit Extended</p>
          <p className="text-xl font-black text-slate-900 font-mono mt-1">{formatINR(totalCreditLimitApproved)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total credit limits approved</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Over-Limit Risk</p>
          <p className={`text-xl font-black font-mono mt-1 ${overLimitCustomersCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {overLimitCustomersCount} {overLimitCustomersCount === 1 ? 'Buyer' : 'Buyers'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Exceeded credit ceiling</p>
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
              placeholder="Search customer by name, business, phone, or city..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredCustomers.length} of {totalCustomersCount}
          </span>
        </div>

        {/* Customer Cards Grid */}
        <div className="divide-y divide-slate-100">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Customers Found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchTerm
                  ? `No customer matches "${searchTerm}". Try another search term.`
                  : 'Get started by creating your first wholesale customer record.'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const creditUsed = Math.min(100, Math.round(((cust.outstandingBalance || 0) / (cust.creditLimit || 1)) * 100));
              return (
                <div
                  key={cust.id}
                  className="p-5 hover:bg-slate-50/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Customer DP / Avatar, Profile & Contact (Clicking Customer Name opens Customer Details) */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <CustomerAvatar
                      customer={cust}
                      size="md"
                      shape="circle"
                      onClick={() => handleSelectCustomer(cust.id)}
                      className="shrink-0 ring-2 ring-slate-100 shadow-2xs"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSelectCustomer(cust.id)}
                          className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors text-left cursor-pointer font-heading"
                          title="Click to view customer details"
                        >
                          {cust.name}
                        </button>
                        {cust.businessName && cust.businessName !== cust.name && (
                          <span className="text-xs text-slate-500">({cust.businessName})</span>
                        )}
                        <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {cust.type || 'Wholesale Buyer'}
                        </span>
                      </div>

                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {cust.city || 'Mumbai'}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {cust.phone}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Terms: {cust.creditPeriodDays || 15} Days
                      </span>
                    </div>

                    {/* Credit Bar */}
                    <div className="mt-2.5 max-w-xs">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Limit: {formatINR(cust.creditLimit)}</span>
                        <span className={creditUsed > 85 ? 'text-rose-600 font-bold' : ''}>
                          {creditUsed}% utilized
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            creditUsed > 85 ? 'bg-rose-500' : creditUsed > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${creditUsed}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Center: Outstanding Due */}
                  <div className="text-left md:text-right shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Khata Due</p>
                    <p className="text-lg font-black text-rose-600 font-mono">
                      {formatINR(cust.outstandingBalance)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Paid: {formatINR(cust.totalPaid || cust.totalPayments || 0)}
                    </p>
                  </div>

                  {/* Right Column: Actions including clearly visible [ View Details ] */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* 1. Dedicated View Details button */}
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer(cust.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors cursor-pointer border border-emerald-200/60"
                      title="View Customer Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Details</span>
                    </button>

                    {/* 2. Edit Customer */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cust)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Edit Customer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* 3. WhatsApp statement */}
                    <button
                      type="button"
                      onClick={() => handleShareWhatsAppKhata(cust)}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                      title="Send WhatsApp Khata Statement"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* 4. Receive Payment */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(cust.id);
                        setPaymentAmount('');
                        setPaymentReference('');
                        setPaymentNotes('');
                        setErrorMessage('');
                        setIsPaymentModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      title="Receive Khata Payment"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay</span>
                    </button>

                    {/* 5. Delete Customer */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(cust.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODALS RENDERED BELOW */}
      {renderCustomerFormModal()}
      {renderPaymentModal()}
      {renderLedgerModal()}
      {renderIconPickerModals()}
    </div>
  );

  // =========================================================================
  // MODAL 1: ADD / EDIT CUSTOMER FORM
  // =========================================================================
  function renderCustomerFormModal() {
    if (!isAddCustomerOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm font-heading">
                  {editingCustomer
                    ? 'Edit Customer Profile'
                    : selectedExistingCustomer
                    ? 'Update Existing Customer & Open Digital Khata'
                    : 'Add New Customer & Open Digital Khata'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingCustomer
                    ? `Updating record for ${editingCustomer.name}`
                    : selectedExistingCustomer
                    ? `Auto-filled record for ${selectedExistingCustomer.name}`
                    : 'Wholesale buyer registration'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddCustomerOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            {/* Existing customer loaded alert badge */}
            {selectedExistingCustomer && !editingCustomer && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Existing customer <strong>{selectedExistingCustomer.name}</strong> loaded. Submitting will update their profile and open their Digital Khata.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExistingCustomer(null);
                    setDismissedDuplicateWarning(false);
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer ml-2 shrink-0"
                >
                  Clear / New Customer
                </button>
              </div>
            )}

            {/* Duplicate detection warning */}
            {duplicateCustomerMatch && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-900 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">An existing customer with this name was found.</span> Select the existing customer to use its saved information.
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      Found: <span className="font-semibold">{duplicateCustomerMatch.name}</span> ({duplicateCustomerMatch.phone || duplicateCustomerMatch.city})
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => fillFromExistingCustomer(duplicateCustomerMatch)}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Use Existing Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedDuplicateWarning(true)}
                    className="px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[11px] font-medium cursor-pointer"
                  >
                    Continue as New Record
                  </button>
                </div>
              </div>
            )}

            {/* Customer Photo / DP & Profile Icon Section */}
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Customer Photo / DP
              </label>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Current Avatar Presentation */}
                <div className="relative group shrink-0">
                  <CustomerAvatar
                    photoUrl={photoUrl}
                    customIconUrl={customIconUrl}
                    avatarIcon={avatarIcon}
                    name={name || 'Customer'}
                    size="xl"
                    shape="circle"
                    className="ring-4 ring-white shadow-md bg-white"
                  />
                </div>

                {/* Actions: Upload Photo / Change Photo, Choose Icon, Remove */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handlePhotoFileChange}
                      className="hidden"
                      id="modal-customer-photo-input"
                    />
                    <label
                      htmlFor="modal-customer-photo-input"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsIconPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Choose Icon</span>
                    </button>

                    {(photoUrl || customIconUrl || (avatarIcon && avatarIcon !== '👤')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('');
                          setCustomIconUrl('');
                          setAvatarIcon('👤');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500">
                    JPG, PNG, or WEBP photo. If no photo, choose from fruit & business icons or upload a custom logo.
                  </p>

                  {photoUploadError && (
                    <p className="text-xs text-rose-600 font-medium">{photoUploadError}</p>
                  )}
                  {isUploadingPhoto && (
                    <p className="text-xs text-emerald-600 font-medium">Compressing & optimizing photo...</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Field 1: Customer / Contact Name with Autocomplete */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Customer / Contact Name *</label>
                  {selectedExistingCustomer && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Auto-Filled
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Gupta / Green Fruit Traders"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setShowNameSuggestions(true);
                      if (selectedExistingCustomer && e.target.value !== selectedExistingCustomer.name) {
                        setSelectedExistingCustomer(null);
                        setDismissedDuplicateWarning(false);
                      }
                    }}
                    onFocus={() => setShowNameSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowNameSuggestions(false), 200)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 pr-8"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {/* Suggestions Dropdown */}
                {showNameSuggestions && name.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                    {matchingCustomers.length > 0 ? (
                      <div>
                        <div className="px-3 py-1.5 bg-slate-100/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Matching Saved Customers ({matchingCustomers.length})</span>
                          <span className="text-[9px] text-emerald-600 font-normal">Click to auto-fill</span>
                        </div>
                        {matchingCustomers.map((cust) => (
                          <div
                            key={cust.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              fillFromExistingCustomer(cust);
                            }}
                            className="px-3 py-2 hover:bg-emerald-50/70 border-b border-slate-100 last:border-0 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{cust.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                {cust.type || 'Wholesale Buyer'}
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
                        <span className="font-semibold text-slate-700">"{name}"</span> not found in existing customers.
                        <div className="text-[11px] text-emerald-600 mt-0.5">
                          ✓ Will be saved as a new customer record.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Field 2: Shop / Business Name */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">Shop / Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gupta Fruits & Sons"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    setShowBusinessSuggestions(true);
                  }}
                  onFocus={() => setShowBusinessSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBusinessSuggestions(false), 200)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                {showBusinessSuggestions && businessName.trim().length > 0 && matchingBusinesses.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-slate-100/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Matching Saved Businesses
                    </div>
                    {matchingBusinesses.map((b) => (
                      <div
                        key={b.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          fillFromExistingCustomer(b);
                        }}
                        className="px-3 py-2 hover:bg-emerald-50/70 border-b border-slate-100 last:border-0 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-900">{b.businessName}</div>
                        <div className="text-[11px] text-slate-500">Contact: {b.name} • 📞 {b.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Field 3: Mobile Phone */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9820123456"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setShowPhoneSuggestions(true);
                  }}
                  onFocus={() => setShowPhoneSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowPhoneSuggestions(false), 200)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                {showPhoneSuggestions && phone.trim().length >= 3 && matchingPhones.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-slate-100/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Matching Phone Number
                    </div>
                    {matchingPhones.map((p) => (
                      <div
                        key={p.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          fillFromExistingCustomer(p);
                        }}
                        className="px-3 py-2 hover:bg-emerald-50/70 border-b border-slate-100 last:border-0 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-slate-900 font-mono">{p.phone}</div>
                        <div className="text-[11px] text-slate-500">{p.name} ({p.businessName || p.city})</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9820123456"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. guptafruits@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Field 6: City / Mandi */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">City / Mandi</label>
                <input
                  type="text"
                  placeholder="e.g. Vashi, Navi Mumbai"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                {showCitySuggestions && matchingCities.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                    <div className="px-3 py-1 bg-slate-100/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Suggested Cities
                    </div>
                    {matchingCities.map((c) => (
                      <div
                        key={c}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCity(c);
                          setShowCitySuggestions(false);
                        }}
                        className="px-3 py-1.5 hover:bg-slate-50 text-xs font-medium text-slate-800 cursor-pointer"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 7: State */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setShowStateSuggestions(true);
                  }}
                  onFocus={() => setShowStateSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowStateSuggestions(false), 200)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                {showStateSuggestions && matchingStates.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                    <div className="px-3 py-1 bg-slate-100/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Suggested States
                    </div>
                    {matchingStates.map((s) => (
                      <div
                        key={s}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setState(s);
                          setShowStateSuggestions(false);
                        }}
                        className="px-3 py-1.5 hover:bg-slate-50 text-xs font-medium text-slate-800 cursor-pointer"
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Field 8: Buyer Type (Editable Input Box with Suggestions) */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Type</label>
                <input
                  type="text"
                  placeholder="e.g. Wholesale Buyer / Retail Mart"
                  value={customerType}
                  onChange={(e) => {
                    setCustomerType(e.target.value);
                    setShowBuyerTypeSuggestions(true);
                  }}
                  onFocus={() => setShowBuyerTypeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBuyerTypeSuggestions(false), 200)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                {showBuyerTypeSuggestions && matchingBuyerTypes.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    <div className="px-3 py-1 bg-slate-100/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Suggested Buyer Types
                    </div>
                    {matchingBuyerTypes.map((bt) => (
                      <div
                        key={bt}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCustomerType(bt);
                          setShowBuyerTypeSuggestions(false);
                        }}
                        className="px-3 py-1.5 hover:bg-emerald-50 text-xs font-medium text-slate-800 cursor-pointer flex items-center justify-between"
                      >
                        <span>{bt}</span>
                        {customerType === bt && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Field: Aadhaar Number (Optional) & PAN Number (Optional) - GSTIN COMPLETELY REMOVED */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1234 5678 9012"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number (Optional)</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Credit Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={creditPeriodDays}
                  onChange={(e) => setCreditPeriodDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {!editingCustomer && !selectedExistingCustomer && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Opening Balance Due (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Existing khata balance from notebook if transferring over
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Shop Address / Mandi Stall #</label>
              <input
                type="text"
                placeholder="e.g. Gala #14, Sector 19, APMC Fruit Market"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes</label>
              <textarea
                rows={2}
                placeholder="Any special payment habits, delivery instructions, or notes..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingCustomer
                  ? 'Update Customer'
                  : selectedExistingCustomer
                  ? 'Update & Open Digital Khata'
                  : 'Save Customer & Khata'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODAL 2: RECEIVE KHATA PAYMENT
  // =========================================================================
  function renderPaymentModal() {
    if (!isPaymentModalOpen || !currentCustomer) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 sm:p-5 bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white" />
              <div>
                <h3 className="font-bold text-sm font-heading">
                  {editingPaymentId ? 'Edit Khata Payment' : 'Receive Khata Payment'}
                </h3>
                <p className="text-xs text-emerald-100">{currentCustomer.name} ({currentCustomer.businessName || currentCustomer.name})</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsPaymentModalOpen(false);
                setEditingPaymentId(null);
              }}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-900">Current Outstanding Due:</span>
              <span className="text-base font-extrabold text-rose-600 font-mono">
                {formatINR(currentCustomer.outstandingBalance)}
              </span>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="Payment Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash (Mandi Counter)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reference No / UPI UTR / Cheque #
              </label>
              <input
                type="text"
                placeholder="e.g. UPI-928374981"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes</label>
              <input
                type="text"
                placeholder="e.g. Partial clearance for Apple crate lot"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setEditingPaymentId(null);
                }}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !paymentAmount}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : editingPaymentId ? 'Save Changes' : 'Save & Update Khata'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODAL 3: EDIT KHATA LEDGER / DIRECT ADJUSTMENT
  // =========================================================================
  function renderLedgerModal() {
    if (!isLedgerModalOpen || !currentCustomer) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm font-heading">
                  {editingLedgerEntry ? 'Edit Khata Ledger Entry' : 'New Khata Adjustment / Entry'}
                </h3>
                <p className="text-xs text-slate-300">
                  {currentCustomer.name} ({currentCustomer.businessName || currentCustomer.name})
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsLedgerModalOpen(false);
                setEditingLedgerEntry(null);
              }}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveLedgerEntry} className="p-5 space-y-4">
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entry Type *</label>
                <select
                  value={ledgerType}
                  onChange={(e) => setLedgerType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                >
                  <option value="Adjustment">Adjustment</option>
                  <option value="Payment">Payment</option>
                  <option value="Sale">Sale / Debit</option>
                  <option value="Opening">Opening Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={ledgerDate}
                  onChange={(e) => setLedgerDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-rose-700 mb-1">
                  Debit (+) Receivable (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={ledgerDebit}
                  onChange={(e) => setLedgerDebit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-700 font-mono"
                />
                <span className="text-[10px] text-slate-400">Increases customer due</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-700 mb-1">
                  Credit (-) Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={ledgerCredit}
                  onChange={(e) => setLedgerCredit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 font-mono"
                />
                <span className="text-[10px] text-slate-400">Reduces customer due</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reference / Bill / UTR No
              </label>
              <input
                type="text"
                placeholder="e.g. ADJ-001 or UTR-8291"
                value={ledgerReferenceNo}
                onChange={(e) => setLedgerReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description / Particulars *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Quality dispute discount adjustment"
                value={ledgerDescription}
                onChange={(e) => setLedgerDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes</label>
              <input
                type="text"
                placeholder="Optional notes or reason for correction"
                value={ledgerNotes}
                onChange={(e) => setLedgerNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLedgerModalOpen(false);
                  setEditingLedgerEntry(null);
                }}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : editingLedgerEntry ? 'Save Changes' : 'Record Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODAL 4: CUSTOMER ICON PICKER MODALS
  // =========================================================================
  function renderIconPickerModals() {
    return (
      <>
        {isDirectIconPickerOpen && currentCustomer && (
          <CustomerIconPickerModal
            isOpen={isDirectIconPickerOpen}
            onClose={() => setIsDirectIconPickerOpen(false)}
            selectedIcon={currentCustomer.avatarIcon}
            customIconUrl={currentCustomer.customIconUrl}
            onSelectIcon={handleDirectChooseIcon}
            onSelectCustomIcon={handleDirectChooseCustomIcon}
          />
        )}
        {isIconPickerOpen && (
          <CustomerIconPickerModal
            isOpen={isIconPickerOpen}
            onClose={() => setIsIconPickerOpen(false)}
            selectedIcon={avatarIcon}
            customIconUrl={customIconUrl}
            onSelectIcon={(icon) => {
              setAvatarIcon(icon);
              setCustomIconUrl('');
            }}
            onSelectCustomIcon={(dataUrl) => {
              setCustomIconUrl(dataUrl);
              setAvatarIcon('');
            }}
          />
        )}
      </>
    );
  }
};
