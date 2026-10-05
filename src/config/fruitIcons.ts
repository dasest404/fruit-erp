export interface FruitIconOption {
  id: string;
  label: string;
  icon: string;
  category: 'Pome & Stone' | 'Tropical & Mango' | 'Citrus' | 'Berries & Grapes' | 'Melons' | 'Exotic & Dry Fruits' | 'Packaging';
  colorBg?: string;
  description?: string;
}

export const DEFAULT_FRUIT_ICONS: FruitIconOption[] = [
  // Pome & Stone Fruits
  { id: 'apple', label: 'Apple', icon: '🍎', category: 'Pome & Stone', colorBg: 'bg-rose-50 text-rose-700 border-rose-200', description: 'Royal Gala, Kashmiri Delicious, Kinnaur' },
  { id: 'green_apple', label: 'Green Apple', icon: '🍏', category: 'Pome & Stone', colorBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', description: 'Granny Smith, Sour Crisp' },
  { id: 'pear', label: 'Pear', icon: '🍐', category: 'Pome & Stone', colorBg: 'bg-lime-50 text-lime-700 border-lime-200', description: 'Nashpati, Bartlett, Asian Pear' },
  { id: 'peach', label: 'Peach', icon: '🍑', category: 'Pome & Stone', colorBg: 'bg-orange-50 text-orange-700 border-orange-200', description: 'Aadu, Sharbati, Imported Sweet' },
  { id: 'cherry', label: 'Cherry', icon: '🍒', category: 'Pome & Stone', colorBg: 'bg-red-50 text-red-700 border-red-200', description: 'Kashmir Sweet, Imported Box' },

  // Tropical & Mango
  { id: 'mango', label: 'Mango', icon: '🥭', category: 'Tropical & Mango', colorBg: 'bg-amber-50 text-amber-700 border-amber-200', description: 'Alphonso, Kesar, Dasheri, Badami, Chausa' },
  { id: 'banana', label: 'Banana', icon: '🍌', category: 'Tropical & Mango', colorBg: 'bg-yellow-50 text-yellow-700 border-yellow-200', description: 'Robusta G9, Yelakki, Red Banana' },
  { id: 'pineapple', label: 'Pineapple', icon: '🍍', category: 'Tropical & Mango', colorBg: 'bg-yellow-50 text-amber-800 border-yellow-200', description: 'Kew, Queen, Giant Mandi Crates' },
  { id: 'papaya', label: 'Papaya', icon: '🥭', category: 'Tropical & Mango', colorBg: 'bg-orange-50 text-amber-800 border-orange-200', description: 'Taiwan Red Lady, Semi-Ripe' },
  { id: 'coconut', label: 'Coconut', icon: '🥥', category: 'Tropical & Mango', colorBg: 'bg-amber-50 text-amber-900 border-amber-200', description: 'Tender Green, Brown Nariyal' },
  { id: 'guava', label: 'Guava', icon: '🍈', category: 'Tropical & Mango', colorBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', description: 'Allahabad Safeda, Thai Pink' },

  // Citrus
  { id: 'orange', label: 'Orange', icon: '🍊', category: 'Citrus', colorBg: 'bg-orange-50 text-orange-700 border-orange-200', description: 'Nagpur Santra, Malta, Kinnow' },
  { id: 'mandarin', label: 'Mandarin', icon: '🍊', category: 'Citrus', colorBg: 'bg-amber-50 text-amber-700 border-amber-200', description: 'Sweet Clementine, Darjeeling' },
  { id: 'lemon', label: 'Lemon', icon: '🍋', category: 'Citrus', colorBg: 'bg-yellow-50 text-yellow-700 border-yellow-200', description: 'Kagzi Nimbu, Eureka, Seedless' },

  // Berries & Grapes
  { id: 'grapes', label: 'Grapes', icon: '🍇', category: 'Berries & Grapes', colorBg: 'bg-purple-50 text-purple-700 border-purple-200', description: 'Tas-A-Ganesh, Sharad Seedless, Sonaka, Flame' },
  { id: 'strawberry', label: 'Strawberry', icon: '🍓', category: 'Berries & Grapes', colorBg: 'bg-rose-50 text-rose-700 border-rose-200', description: 'Mahabaleshwar Winter Dawn, Sweet Charlie' },
  { id: 'blueberry', label: 'Blueberry', icon: '🫐', category: 'Berries & Grapes', colorBg: 'bg-indigo-50 text-indigo-700 border-indigo-200', description: 'Imported Punnet, Fresh Blueberries' },

  // Melons
  { id: 'watermelon', label: 'Watermelon', icon: '🍉', category: 'Melons', colorBg: 'bg-red-50 text-red-700 border-red-200', description: 'Kiran Dark, Sugar Baby, Yellow Meat' },
  { id: 'melon', label: 'Melon', icon: '🍈', category: 'Melons', colorBg: 'bg-lime-50 text-lime-700 border-lime-200', description: 'Kharbooja, Cantaloupe, Honeydew' },

  // Exotic & Dry Fruits
  { id: 'pomegranate', label: 'Pomegranate', icon: '🍎', category: 'Exotic & Dry Fruits', colorBg: 'bg-rose-50 text-rose-700 border-rose-200', description: 'Bhagwa Sindhuri, Arakta, Ruby' },
  { id: 'kiwi', label: 'Kiwi', icon: '🥝', category: 'Exotic & Dry Fruits', colorBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', description: 'Zespri Green, SunGold, Hayward' },
  { id: 'avocado', label: 'Avocado', icon: '🥑', category: 'Exotic & Dry Fruits', colorBg: 'bg-green-50 text-green-700 border-green-200', description: 'Hass Butter Fruit, Indian Ooty' },
  { id: 'dry_fruit', label: 'Dry Fruits', icon: '🌰', category: 'Exotic & Dry Fruits', colorBg: 'bg-amber-50 text-amber-800 border-amber-200', description: 'Badam, Kaju, Kishmish, Pista, Walnut' },

  // Packaging & Assorted
  { id: 'fruit_basket', label: 'Fruit Basket', icon: '🧺', category: 'Packaging', colorBg: 'bg-amber-50 text-amber-800 border-amber-200', description: 'Assorted Gift Hamper, Festival Mandi Pack' },
  { id: 'fruit_crate', label: 'Fruit Crate', icon: '📦', category: 'Packaging', colorBg: 'bg-slate-50 text-slate-700 border-slate-200', description: 'Wholesale Mandi Box / Bulk Wooden Crate' },
];

export function findFruitIcon(idOrIcon?: string): FruitIconOption | undefined {
  if (!idOrIcon) return undefined;
  const trimmed = idOrIcon.trim();
  return DEFAULT_FRUIT_ICONS.find(
    (i) => i.id === trimmed || i.icon === trimmed || i.label.toLowerCase() === trimmed.toLowerCase()
  );
}

/**
 * Standard System Default Fruit icon
 */
export const SYSTEM_DEFAULT_FRUIT_ICON = '🍎';
