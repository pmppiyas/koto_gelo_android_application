import { Feather } from '@expo/vector-icons';

export interface CategoryInfo {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bgColor: string;
  subcategories: string[];
}

export const GROUP_EXPENSE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'food-groceries',
    slug: 'food-groceries',
    name: 'Food & Groceries',
    emoji: '🍲',
    icon: 'coffee',
    color: '#F97316',
    bgColor: '#FFF7ED',
    subcategories: [
      'Daily Bazaar',
      'Fish & Meat',
      'Rice, Oil & Spices',
      'Snacks & Tea',
      'Cook / Bua Bill',
      'Dining Out',
      'Drinking Water',
      'Other Groceries',
    ],
  },
  {
    id: 'housing-rent',
    slug: 'housing-rent',
    name: 'Housing & Rent',
    emoji: '🏠',
    icon: 'home',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    subcategories: [
      'House Rent',
      'Service Charge',
      'Security Guard',
      'Garage Rent',
      'Other Housing',
    ],
  },
  {
    id: 'bills-utilities',
    slug: 'bills-utilities',
    name: 'Bills & Utilities',
    emoji: '💡',
    icon: 'zap',
    color: '#EAB308',
    bgColor: '#FEF9C3',
    subcategories: [
      'Electricity',
      'Gas Bill / Cylinder',
      'WiFi / Internet',
      'Garbage Bill',
      'Water Bill',
      'Other Utilities',
    ],
  },
  {
    id: 'cleaning-household',
    slug: 'cleaning-household',
    name: 'Cleaning & Household',
    emoji: '🧼',
    icon: 'trash-2',
    color: '#06B6D4',
    bgColor: '#ECFEFF',
    subcategories: [
      'Cleaning Supplies',
      'Room Essentials',
      'Tissue & Detergent',
      'Other Household',
    ],
  },
  {
    id: 'tour-travel',
    slug: 'tour-travel',
    name: 'Tour & Travel',
    emoji: '✈️',
    icon: 'navigation',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    subcategories: [
      'Bus',
      'Train',
      'Air Ticket',
      'Boat / Launch',
      'Hotel / Resort',
      'Local Transport / Rental',
      'Sightseeing & Entry Fee',
      'Other Tour Expenses',
    ],
  },
  {
    id: 'events-hangout',
    slug: 'events-hangout',
    name: 'Events & Hangout',
    emoji: '🎮',
    icon: 'activity',
    color: '#EC4899',
    bgColor: '#FDF2F8',
    subcategories: [
      'Party / Celebration',
      'Sports & Games',
      'Movies & Hangout',
      'BBQ / Picnic',
    ],
  },
  {
    id: 'donation-charity',
    slug: 'donation-charity',
    name: 'Donation & Charity',
    emoji: '🤲',
    icon: 'heart',
    color: '#059669',
    bgColor: '#ECFDF5',
    subcategories: [
      'Mosque / Madrasa',
      'Group Relief & Help',
      'Charity',
      'Tips',
    ],
  },
  {
    id: 'other-group',
    slug: 'other-group',
    name: 'Other Group Expense',
    emoji: '📦',
    icon: 'folder',
    color: '#64748B',
    bgColor: '#F8FAFC',
    subcategories: ['Miscellaneous', 'General'],
  },
];

export const PERSONAL_EXPENSE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'food-dining',
    slug: 'food-dining',
    name: 'Food & Dining',
    emoji: '🍔',
    icon: 'shopping-bag',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    subcategories: [
      'Breakfast & Lunch',
      'Dinner',
      'Tea, Coffee & Snacks',
      'Food Delivery',
      'Personal Grocery',
      'Street Food',
    ],
  },
  {
    id: 'transportation',
    slug: 'transportation',
    name: 'Transportation',
    emoji: '🚗',
    icon: 'map-pin',
    color: '#0EA5E9',
    bgColor: '#E0F2FE',
    subcategories: [
      'Rickshaw',
      'Auto / CNG',
      'Bus',
      'Train',
      'Boat / Launch',
      'Rideshare (Uber / Pathao)',
      'Fuel / Petrol',
      'Vehicle Maintenance',
    ],
  },
  {
    id: 'smoking-habits',
    slug: 'smoking-habits',
    name: 'Smoking & Tobacco',
    emoji: '🚬',
    icon: 'wind',
    color: '#78716C',
    bgColor: '#F5F5F4',
    subcategories: ['Cigarettes', 'Vape / Pods', 'Other Tobacco'],
  },
  {
    id: 'shopping-lifestyle',
    slug: 'shopping-lifestyle',
    name: 'Shopping & Lifestyle',
    emoji: '🛍️',
    icon: 'tag',
    color: '#A855F7',
    bgColor: '#FAF5FF',
    subcategories: [
      'Clothing & Shoes',
      'Personal Care & Grooming',
      'Electronics & Gadgets',
      'Salon / Barber',
      'Watch & Accessories',
    ],
  },
  {
    id: 'bills-mobile',
    slug: 'bills-mobile',
    name: 'Bills & Mobile',
    emoji: '📱',
    icon: 'phone',
    color: '#10B981',
    bgColor: '#D1FAE5',
    subcategories: [
      'Mobile Recharge & Data',
      'Personal Internet',
      'Subscriptions (Netflix, Spotify)',
    ],
  },
  {
    id: 'health-medical',
    slug: 'health-medical',
    name: 'Health & Medical',
    emoji: '💊',
    icon: 'heart',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    subcategories: [
      'Doctor Consultation',
      'Medicine & Pharmacy',
      'Tests & Diagnostic',
      'Dental & Eye Care',
    ],
  },
  {
    id: 'education-learning',
    slug: 'education-learning',
    name: 'Education & Learning',
    emoji: '🎓',
    icon: 'book-open',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    subcategories: [
      'Course & Tuition Fee',
      'Books & Stationery',
      'Exam & Certificate Fee',
    ],
  },
  {
    id: 'donation-charity',
    slug: 'donation-charity',
    name: 'Donation & Charity',
    emoji: '🤲',
    icon: 'heart',
    color: '#059669',
    bgColor: '#ECFDF5',
    subcategories: [
      'Sadakah / Dan',
      'Zakat',
      'Mosque / Madrasa',
      'Help Poor / Relative',
      'Tips',
    ],
  },
  {
    id: 'family-friends',
    slug: 'family-friends',
    name: 'Family & Friends',
    emoji: '👨‍👩‍👧',
    icon: 'users',
    color: '#14B8A6',
    bgColor: '#CCFBF1',
    subcategories: [
      'Family Send Money',
      'Gifts & Treats',
      'Friend Hangout',
      'Loan Given / Repaid',
    ],
  },
  {
    id: 'other-personal',
    slug: 'other-personal',
    name: 'Other Personal Expense',
    emoji: '📦',
    icon: 'folder',
    color: '#64748B',
    bgColor: '#F8FAFC',
    subcategories: ['Miscellaneous', 'General Expense'],
  },
];

// Combined default list for backwards compatibility
export const EXPENSE_CATEGORIES: CategoryInfo[] = [
  ...PERSONAL_EXPENSE_CATEGORIES,
  ...GROUP_EXPENSE_CATEGORIES.filter(
    gc => !PERSONAL_EXPENSE_CATEGORIES.some(pc => pc.id === gc.id),
  ),
];

export const getExpenseCategories = (
  type: 'PERSONAL' | 'GROUP' | 'ALL' = 'ALL',
): CategoryInfo[] => {
  if (type === 'GROUP') return GROUP_EXPENSE_CATEGORIES;
  if (type === 'PERSONAL') return PERSONAL_EXPENSE_CATEGORIES;
  return EXPENSE_CATEGORIES;
};

export const getCategoryByIdOrName = (
  query: string,
  type?: 'PERSONAL' | 'GROUP',
): CategoryInfo | undefined => {
  if (!query) return undefined;
  const list = type ? getExpenseCategories(type) : EXPENSE_CATEGORIES;
  const lower = query.toLowerCase();
  return (
    list.find(
      c =>
        c.id.toLowerCase() === lower ||
        c.slug.toLowerCase() === lower ||
        c.name.toLowerCase() === lower,
    ) ||
    EXPENSE_CATEGORIES.find(
      c =>
        c.id.toLowerCase() === lower ||
        c.slug.toLowerCase() === lower ||
        c.name.toLowerCase() === lower,
    )
  );
};

export const SPLIT_TYPES = {
  EQUAL: 'EQUAL',
  EXACT: 'EXACT',
  PERCENTAGE: 'PERCENTAGE',
  SHARES: 'SHARES',
} as const;

export type SplitType = keyof typeof SPLIT_TYPES;
