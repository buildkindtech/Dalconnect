// Category default images from Unsplash
export const categoryImageDefaults: Record<string, string> = {
  'Korean Restaurant': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80',
  '식당': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80',
  '한식당': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80',
  'Restaurant': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=800&q=80',
  '교회': 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&q=80',
  'Church': 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&q=80',
  '병원': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  '치과': 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80',
  'Medical': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  'Dental': 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80',
  '미용실': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  'Beauty Salon': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
  'Hair Salon': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80',
  '부동산': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
  'Real Estate': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
  '법률/회계': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'Law': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
  'Accounting': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
  '자동차': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
  'Auto Repair': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
  '학원': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  'Education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
  'Tutoring': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  '한인마트': 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
  'Grocery Store': 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
  'Other': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80',
  '기타': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80',
};

export function getCategoryImage(category: string | null | undefined, coverUrl?: string | null): string {
  // If cover_url exists, use it
  if (coverUrl) return coverUrl;
  
  // Otherwise, use category default
  if (category && categoryImageDefaults[category]) {
    return categoryImageDefaults[category];
  }
  
  // Ultimate fallback: Dallas skyline
  return 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80';
}
