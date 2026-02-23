// Category color gradients for businesses without images
export const categoryColors: Record<string, string> = {
  'Korean Restaurant': 'from-red-500 to-orange-500',
  '식당': 'from-red-500 to-orange-500',
  '한식당': 'from-red-500 to-orange-500',
  'Restaurant': 'from-red-500 to-orange-500',
  '교회': 'from-purple-500 to-indigo-500',
  'Church': 'from-purple-500 to-indigo-500',
  '병원': 'from-blue-500 to-cyan-500',
  '치과': 'from-teal-500 to-blue-500',
  'Medical': 'from-blue-500 to-cyan-500',
  'Dental': 'from-teal-500 to-blue-500',
  '미용실': 'from-pink-500 to-rose-500',
  'Beauty Salon': 'from-pink-500 to-rose-500',
  'Hair Salon': 'from-pink-400 to-pink-600',
  '부동산': 'from-green-500 to-emerald-500',
  'Real Estate': 'from-green-500 to-emerald-500',
  '법률/회계': 'from-indigo-500 to-blue-600',
  'Law': 'from-indigo-600 to-purple-600',
  'Accounting': 'from-blue-600 to-indigo-600',
  '자동차': 'from-orange-500 to-red-500',
  'Auto Repair': 'from-orange-500 to-red-500',
  '학원': 'from-yellow-500 to-amber-500',
  'Education': 'from-yellow-500 to-amber-500',
  'Tutoring': 'from-amber-500 to-orange-500',
  '한인마트': 'from-teal-500 to-green-500',
  'Grocery Store': 'from-teal-500 to-green-500',
  'Other': 'from-slate-500 to-gray-600',
  '기타': 'from-slate-500 to-gray-600',
};

// Category icons (using Lucide icon names)
export const categoryIcons: Record<string, string> = {
  'Korean Restaurant': 'UtensilsCrossed',
  '식당': 'UtensilsCrossed',
  '한식당': 'UtensilsCrossed',
  'Restaurant': 'UtensilsCrossed',
  '교회': 'Church',
  'Church': 'Church',
  '병원': 'Heart',
  '치과': 'Smile',
  'Medical': 'Heart',
  'Dental': 'Smile',
  '미용실': 'Scissors',
  'Beauty Salon': 'Scissors',
  'Hair Salon': 'Scissors',
  '부동산': 'Home',
  'Real Estate': 'Home',
  '법률/회계': 'Scale',
  'Law': 'Gavel',
  'Accounting': 'Calculator',
  '자동차': 'Car',
  'Auto Repair': 'Wrench',
  '학원': 'GraduationCap',
  'Education': 'GraduationCap',
  'Tutoring': 'BookOpen',
  '한인마트': 'ShoppingCart',
  'Grocery Store': 'ShoppingBag',
  'Other': 'Building',
  '기타': 'Building',
};

export function getCategoryColor(category: string | null | undefined): string {
  if (category && categoryColors[category]) {
    return categoryColors[category];
  }
  return 'from-slate-400 to-slate-600'; // Default gradient
}

export function getCategoryIcon(category: string | null | undefined): string {
  if (category && categoryIcons[category]) {
    return categoryIcons[category];
  }
  return 'Building'; // Default icon
}

// Check if image URL is valid (not null and not empty)
export function hasValidImage(url: string | null | undefined): boolean {
  return Boolean(url && url.trim().length > 0);
}

// Get category image - returns actual image or null (for fallback rendering)
export function getCategoryImage(category: string | null | undefined, imageUrl: string | null | undefined): string | null {
  if (hasValidImage(imageUrl)) {
    return imageUrl!;
  }
  return null; // Let the component handle the fallback rendering
}
