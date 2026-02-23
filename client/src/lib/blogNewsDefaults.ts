// Blog/News category gradients and emojis

export const blogCategoryStyles: Record<string, { gradient: string; emoji: string }> = {
  '맛집/식당': { gradient: 'from-red-500 to-orange-500', emoji: '🍜' },
  '맛집': { gradient: 'from-red-500 to-orange-500', emoji: '🍜' },
  '볼거리/엔터테인먼트': { gradient: 'from-purple-500 to-pink-500', emoji: '🎭' },
  '볼거리': { gradient: 'from-purple-500 to-pink-500', emoji: '🎭' },
  '가볼만한곳': { gradient: 'from-blue-500 to-cyan-500', emoji: '📍' },
  '유행/트렌드': { gradient: 'from-red-600 to-orange-600', emoji: '🔥' },
  '유행': { gradient: 'from-red-600 to-orange-600', emoji: '🔥' },
  '스포츠': { gradient: 'from-green-500 to-emerald-500', emoji: '⚽' },
  '육아/교육': { gradient: 'from-yellow-500 to-amber-500', emoji: '📚' },
  '육아': { gradient: 'from-yellow-500 to-amber-500', emoji: '📚' },
  '교육': { gradient: 'from-yellow-500 to-amber-500', emoji: '📚' },
  '부동산': { gradient: 'from-indigo-500 to-blue-500', emoji: '🏠' },
  '이민/비자': { gradient: 'from-sky-500 to-blue-600', emoji: '✈️' },
  '이민': { gradient: 'from-sky-500 to-blue-600', emoji: '✈️' },
  '비자': { gradient: 'from-sky-500 to-blue-600', emoji: '✈️' },
  '건강/웰빙': { gradient: 'from-teal-500 to-green-500', emoji: '💪' },
  '건강': { gradient: 'from-teal-500 to-green-500', emoji: '💪' },
  '뷰티/패션': { gradient: 'from-pink-500 to-rose-600', emoji: '💄' },
  '뷰티': { gradient: 'from-pink-500 to-rose-600', emoji: '💄' },
  '패션': { gradient: 'from-pink-500 to-rose-600', emoji: '💄' },
  '커뮤니티 이벤트': { gradient: 'from-violet-500 to-purple-600', emoji: '🎉' },
  '커뮤니티': { gradient: 'from-violet-500 to-purple-600', emoji: '🎉' },
  '이벤트': { gradient: 'from-violet-500 to-purple-600', emoji: '🎉' },
  '생활정보': { gradient: 'from-slate-500 to-gray-600', emoji: '📋' },
};

export const newsCategoryStyles: Record<string, { gradient: string; emoji: string }> = {
  '로컬뉴스': { gradient: 'from-slate-600 to-gray-700', emoji: '📰' },
  '한국뉴스': { gradient: 'from-blue-500 to-indigo-600', emoji: '🇰🇷' },
  '미국뉴스': { gradient: 'from-red-500 to-blue-600', emoji: '🇺🇸' },
  '월드뉴스': { gradient: 'from-green-500 to-blue-500', emoji: '🌍' },
  '연예/드라마': { gradient: 'from-purple-500 to-pink-600', emoji: '🎬' },
  'K-POP': { gradient: 'from-pink-400 to-purple-500', emoji: '🎤' },
  '스포츠': { gradient: 'from-green-500 to-emerald-600', emoji: '⚽' },
  '패션/뷰티': { gradient: 'from-rose-400 to-pink-500', emoji: '👗' },
  '건강': { gradient: 'from-teal-500 to-green-600', emoji: '💪' },
  '육아': { gradient: 'from-amber-400 to-orange-500', emoji: '👶' },
  '부동산/숙소': { gradient: 'from-indigo-500 to-blue-600', emoji: '🏠' },
  '이민/비자': { gradient: 'from-sky-500 to-blue-600', emoji: '✈️' },
  '이민': { gradient: 'from-sky-500 to-blue-600', emoji: '✈️' },
  '비자': { gradient: 'from-sky-500 to-blue-600', emoji: '✈️' },
  '생활정보': { gradient: 'from-slate-500 to-gray-600', emoji: '📋' },
  '커뮤니티': { gradient: 'from-violet-500 to-purple-600', emoji: '🤝' },
  '이벤트': { gradient: 'from-pink-500 to-rose-600', emoji: '🎉' },
};

export function getBlogCategoryStyle(category: string | null | undefined): { gradient: string; emoji: string } {
  if (!category) {
    return { gradient: 'from-slate-400 to-gray-500', emoji: '📄' };
  }
  
  // Try exact match first
  if (blogCategoryStyles[category]) {
    return blogCategoryStyles[category];
  }
  
  // Try partial match
  const normalizedCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(blogCategoryStyles)) {
    if (normalizedCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedCategory)) {
      return value;
    }
  }
  
  return { gradient: 'from-slate-400 to-gray-500', emoji: '📄' };
}

export function getNewsCategoryStyle(category: string | null | undefined): { gradient: string; emoji: string } {
  if (!category) {
    return { gradient: 'from-slate-600 to-gray-700', emoji: '📰' };
  }
  
  // Try exact match first
  if (newsCategoryStyles[category]) {
    return newsCategoryStyles[category];
  }
  
  // Try partial match
  const normalizedCategory = category.toLowerCase();
  for (const [key, value] of Object.entries(newsCategoryStyles)) {
    if (normalizedCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedCategory)) {
      return value;
    }
  }
  
  return { gradient: 'from-slate-600 to-gray-700', emoji: '📰' };
}
