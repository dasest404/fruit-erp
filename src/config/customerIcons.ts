export interface CustomerIconOption {
  id: string;
  label: string;
  icon: string;
  category: 'General' | 'People' | 'Business' | 'Fruits';
  colorBg?: string;
  description?: string;
}

export const DEFAULT_CUSTOMER_ICONS: CustomerIconOption[] = [
  // General
  { id: 'person', label: 'Default Person', icon: '👤', category: 'General', colorBg: 'bg-slate-100 text-slate-700', description: 'Standard individual account' },
  { id: 'vip', label: 'VIP Customer', icon: '⭐', category: 'General', colorBg: 'bg-amber-100 text-amber-800', description: 'High volume wholesale client' },

  // People
  { id: 'customer_male', label: 'Customer', icon: '👨', category: 'People', colorBg: 'bg-blue-100 text-blue-800', description: 'Individual wholesale buyer' },
  { id: 'customer_female', label: 'Customer', icon: '👩', category: 'People', colorBg: 'bg-rose-100 text-rose-800', description: 'Individual wholesale buyer' },
  { id: 'business_customer', label: 'Business Customer', icon: '👨‍💼', category: 'People', colorBg: 'bg-indigo-100 text-indigo-800', description: 'Commercial merchant / distributor' },

  // Business / Commercial
  { id: 'company', label: 'Company', icon: '🏢', category: 'Business', colorBg: 'bg-sky-100 text-sky-800', description: 'Registered trading firm' },
  { id: 'shop', label: 'Shop', icon: '🏪', category: 'Business', colorBg: 'bg-teal-100 text-teal-800', description: 'Local market retail fruit store' },
  { id: 'transport', label: 'Supplier/Transport', icon: '🚚', category: 'Business', colorBg: 'bg-cyan-100 text-cyan-800', description: 'Hauler, tempo or mandi transporter' },

  // Fruits
  { id: 'fruit_apple', label: 'Fruit Customer', icon: '🍎', category: 'Fruits', colorBg: 'bg-red-100 text-red-800', description: 'General fruit market buyer' },
  { id: 'mango', label: 'Mango', icon: '🥭', category: 'Fruits', colorBg: 'bg-amber-100 text-amber-800', description: 'Seasonal king of fruits client' },
  { id: 'orange', label: 'Orange', icon: '🍊', category: 'Fruits', colorBg: 'bg-orange-100 text-orange-800', description: 'Nagpur & imported citrus buyer' },
  { id: 'banana', label: 'Banana', icon: '🍌', category: 'Fruits', colorBg: 'bg-yellow-100 text-yellow-800', description: 'Bulk banana mandi distributor' },
  { id: 'grapes', label: 'Grapes', icon: '🍇', category: 'Fruits', colorBg: 'bg-purple-100 text-purple-800', description: 'Nashik / export grade buyer' },
  { id: 'watermelon', label: 'Watermelon', icon: '🍉', category: 'Fruits', colorBg: 'bg-emerald-100 text-emerald-800', description: 'Summer bulk tonnage dealer' },
  { id: 'pineapple', label: 'Pineapple', icon: '🍍', category: 'Fruits', colorBg: 'bg-lime-100 text-lime-800', description: 'Tropical crate reseller' },
  { id: 'strawberry', label: 'Strawberry', icon: '🍓', category: 'Fruits', colorBg: 'bg-rose-100 text-rose-800', description: 'Mahabaleshwar berry vendor' },
  { id: 'kiwi', label: 'Kiwi', icon: '🥝', category: 'Fruits', colorBg: 'bg-green-100 text-green-800', description: 'Imported fruit merchant' },
  { id: 'pear', label: 'Pear', icon: '🍐', category: 'Fruits', colorBg: 'bg-lime-100 text-lime-800', description: 'Kashmir / Himachal pear trader' },
  { id: 'peach', label: 'Peach', icon: '🍑', category: 'Fruits', colorBg: 'bg-orange-100 text-orange-800', description: 'Stone fruit wholesaler' },
  { id: 'cherry', label: 'Cherry', icon: '🍒', category: 'Fruits', colorBg: 'bg-red-100 text-red-800', description: 'Premium box distributor' },
  { id: 'coconut', label: 'Coconut', icon: '🥥', category: 'Fruits', colorBg: 'bg-amber-100 text-amber-900', description: 'Coastal produce retailer' },
  { id: 'fruit_basket', label: 'Fruit Basket', icon: '🧺', category: 'Fruits', colorBg: 'bg-yellow-100 text-yellow-900', description: 'Gift hampers & assorted client' },
];

export function findCustomerIcon(idOrIcon?: string): CustomerIconOption | undefined {
  if (!idOrIcon) return undefined;
  return DEFAULT_CUSTOMER_ICONS.find(
    (i) => i.id === idOrIcon || i.icon === idOrIcon || i.label.toLowerCase() === idOrIcon.toLowerCase()
  );
}
