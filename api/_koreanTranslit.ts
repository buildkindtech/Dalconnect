/**
 * Korean ↔ English transliteration utility
 * Converts Korean text to romanized English and vice versa
 * for fuzzy cross-language business name search.
 *
 * This is NOT imported as a module (Vercel serverless issue).
 * Instead, copy the functions inline or require at build time.
 */

// ─── Korean → Romanized English ───────────────────────────────────
// Based on Revised Romanization of Korean

const INITIAL_CONSONANTS = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss',
  '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'
];

const MEDIAL_VOWELS = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'
];

const FINAL_CONSONANTS = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'l', 'l', 'l',
  'l', 'l', 'l', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't',
  'k', 't', 'p', 't'
];

export function koreanToRoman(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Hangul syllable range: 0xAC00 ~ 0xD7A3
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const offset = code - 0xAC00;
      const initialIdx = Math.floor(offset / (21 * 28));
      const medialIdx = Math.floor((offset % (21 * 28)) / 28);
      const finalIdx = offset % 28;

      result += INITIAL_CONSONANTS[initialIdx];
      result += MEDIAL_VOWELS[medialIdx];
      result += FINAL_CONSONANTS[finalIdx];
    } else {
      result += text[i];
    }
  }
  return result;
}

// ─── Common Korean name/word romanization patterns ────────────────
// These handle the most common patterns people use when typing
// Korean names/words in English or vice versa

const KOREAN_TO_ENGLISH_MAP: [RegExp, string][] = [
  // Common Korean syllables → typical English spellings
  [/해나/g, 'hanna'],
  [/한나/g, 'hanna'],
  [/신/g, 'shin'],
  [/김/g, 'kim'],
  [/이/g, 'lee'],
  [/박/g, 'park'],
  [/정/g, 'jung'],
  [/최/g, 'choi'],
  [/조/g, 'cho'],
  [/윤/g, 'yoon'],
  [/장/g, 'jang'],
  [/임/g, 'lim'],
  [/한/g, 'han'],
  [/오/g, 'oh'],
  [/서/g, 'seo'],
  [/송/g, 'song'],
  [/강/g, 'kang'],
  [/황/g, 'hwang'],
  [/안/g, 'ahn'],
  [/류/g, 'ryu'],
  [/전/g, 'jeon'],
  [/홍/g, 'hong'],
  [/문/g, 'moon'],
  [/양/g, 'yang'],
  [/배/g, 'bae'],
  [/백/g, 'baek'],
  [/권/g, 'kwon'],
  [/남/g, 'nam'],
  [/유/g, 'yoo'],
  [/차/g, 'cha'],
  [/주/g, 'joo'],
  [/우/g, 'woo'],
  [/구/g, 'goo'],
  [/노/g, 'noh'],
  [/민/g, 'min'],
  [/성/g, 'sung'],
  [/하/g, 'ha'],
  [/지/g, 'ji'],
  [/수/g, 'soo'],
  [/영/g, 'young'],
  [/미/g, 'mi'],
  [/진/g, 'jin'],
  [/현/g, 'hyun'],
  [/은/g, 'eun'],
  [/혜/g, 'hye'],
  [/연/g, 'yeon'],
  [/경/g, 'kyung'],
  [/동/g, 'dong'],
  [/상/g, 'sang'],
  [/준/g, 'jun'],
  [/재/g, 'jae'],
  [/승/g, 'seung'],
  [/태/g, 'tae'],
  [/원/g, 'won'],
  [/호/g, 'ho'],
  [/석/g, 'suk'],
  [/선/g, 'sun'],
  [/필/g, 'phil'],
  [/라/g, 'ra'],
  [/마/g, 'ma'],
  [/나/g, 'na'],
  [/다/g, 'da'],
  [/사/g, 'sa'],
  [/가/g, 'ga'],
  [/바/g, 'ba'],
  [/아/g, 'ah'],
  [/자/g, 'ja'],
  [/타/g, 'ta'],
  [/카/g, 'ka'],
  [/파/g, 'pa'],
];

const ENGLISH_TO_KOREAN_MAP: [RegExp, string][] = [
  // Common English spellings → Korean
  [/hanna/gi, '한나'],
  [/hannah/gi, '한나'],
  [/shin/gi, '신'],
  [/kim/gi, '김'],
  [/lee/gi, '이'],
  [/park/gi, '박'],
  [/jung/gi, '정'],
  [/jeong/gi, '정'],
  [/choi/gi, '최'],
  [/cho/gi, '조'],
  [/yoon/gi, '윤'],
  [/jang/gi, '장'],
  [/chang/gi, '장'],
  [/lim/gi, '임'],
  [/han/gi, '한'],
  [/seo/gi, '서'],
  [/song/gi, '송'],
  [/kang/gi, '강'],
  [/gang/gi, '강'],
  [/hwang/gi, '황'],
  [/ahn/gi, '안'],
  [/ryu/gi, '류'],
  [/jeon/gi, '전'],
  [/hong/gi, '홍'],
  [/moon/gi, '문'],
  [/yang/gi, '양'],
  [/bae/gi, '배'],
  [/baek/gi, '백'],
  [/kwon/gi, '권'],
  [/nam/gi, '남'],
  [/yoo/gi, '유'],
  [/cha/gi, '차'],
  [/joo/gi, '주'],
  [/woo/gi, '우'],
  [/goo/gi, '구'],
  [/noh/gi, '노'],
  [/min/gi, '민'],
  [/sung/gi, '성'],
  [/ha/gi, '하'],
  [/ji/gi, '지'],
  [/soo/gi, '수'],
  [/young/gi, '영'],
  [/hyun/gi, '현'],
  [/eun/gi, '은'],
  [/hye/gi, '혜'],
  [/yeon/gi, '연'],
  [/kyung/gi, '경'],
  [/dong/gi, '동'],
  [/sang/gi, '상'],
  [/jun/gi, '준'],
  [/jae/gi, '재'],
  [/seung/gi, '승'],
  [/tae/gi, '태'],
  [/won/gi, '원'],
  [/phil/gi, '필'],
];

/**
 * Detect if text contains Korean characters
 */
export function hasKorean(text: string): boolean {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);
}

/**
 * Detect if text contains English letters
 */
export function hasEnglish(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}

/**
 * Generate alternative search terms for cross-language matching.
 * Returns an array of possible transliterations.
 */
export function getSearchAlternatives(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const alternatives: string[] = [];

  if (hasKorean(trimmed)) {
    // Korean input → generate romanized alternatives
    // 1. Systematic romanization
    const roman = koreanToRoman(trimmed);
    if (roman && roman !== trimmed) {
      alternatives.push(roman);
    }

    // 2. Common name pattern matching
    let mapped = trimmed;
    for (const [pattern, replacement] of KOREAN_TO_ENGLISH_MAP) {
      mapped = mapped.replace(pattern, replacement);
    }
    if (mapped !== trimmed && mapped !== roman) {
      alternatives.push(mapped);
    }

    // 3. Individual words
    const words = trimmed.split(/\s+/);
    if (words.length > 1) {
      for (const word of words) {
        const wordRoman = koreanToRoman(word);
        if (wordRoman) alternatives.push(wordRoman);
        let wordMapped = word;
        for (const [pattern, replacement] of KOREAN_TO_ENGLISH_MAP) {
          wordMapped = wordMapped.replace(pattern, replacement);
        }
        if (wordMapped !== word && wordMapped !== wordRoman) {
          alternatives.push(wordMapped);
        }
      }
    }
  }

  if (hasEnglish(trimmed)) {
    // English input → generate Korean alternatives
    let mapped = trimmed.toLowerCase();
    // Sort by length descending to match longer patterns first
    const sortedMap = [...ENGLISH_TO_KOREAN_MAP].sort((a, b) =>
      b[0].source.length - a[0].source.length
    );
    for (const [pattern, replacement] of sortedMap) {
      mapped = mapped.replace(pattern, replacement);
    }
    if (mapped !== trimmed.toLowerCase()) {
      alternatives.push(mapped);
    }

    // Individual words
    const words = trimmed.split(/\s+/);
    if (words.length > 1) {
      for (const word of words) {
        let wordMapped = word.toLowerCase();
        for (const [pattern, replacement] of sortedMap) {
          wordMapped = wordMapped.replace(pattern, replacement);
        }
        if (wordMapped !== word.toLowerCase()) {
          alternatives.push(wordMapped);
        }
      }
    }
  }

  // Deduplicate
  return [...new Set(alternatives)].filter(a => a.length > 0);
}
