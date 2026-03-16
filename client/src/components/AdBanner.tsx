import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Star, Phone, Globe, MapPin } from "lucide-react";
import { getCategoryIcon, getCategoryColor, proxyPhotoUrl, hasValidImage } from "@/lib/imageDefaults";

interface Business {
  id: string | number;
  name_ko?: string;
  name_en?: string;
  category: string;
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  cover_url?: string;
  rating?: number | string;
  review_count?: number;
  featured?: boolean;
}

// rating이 string으로 내려올 수 있음 (DB varchar) → number로 변환
function toRating(r?: number | string): string {
  if (r == null) return "0.0";
  const n = typeof r === "string" ? parseFloat(r) : r;
  return isNaN(n) ? "0.0" : n.toFixed(1);
}

type AdSize = 
  | "leaderboard"   // 728x90 — 홈 섹션 사이 (데스크탑)
  | "banner"        // 320x50 — 모바일 배너
  | "rectangle"     // 300x250 — 사이드바
  | "inline"        // 전체폭 인피드 카드
  | "sidebar-tall"; // 300x600 — 사이드바 롱

interface AdBannerProps {
  size: AdSize;
  businesses?: Business[];
  category?: string;
  className?: string;
  label?: string;
}

// 사이드바 업체 카드 (300x250)
function FeaturedBusinessCard({ business }: { business: Business }) {
  const name = business.name_ko || business.name_en || "";
  const icon = getCategoryIcon(business.category);
  const colorClass = getCategoryColor(business.category);
  const imageUrl = hasValidImage(business.cover_url) ? proxyPhotoUrl(business.cover_url!) : null;

  return (
    <Link href={`/businesses/${business.id}`}>
      <div className="group cursor-pointer rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* 이미지 */}
        <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${colorClass} bg-opacity-10`}>
              <span className="text-4xl">{icon}</span>
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✨ 추천업체</span>
          </div>
        </div>

        {/* 정보 */}
        <div className="p-3">
          <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">{name}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-500 text-xs">⭐</span>
            <span className="text-xs font-medium text-gray-700">{toRating(business.rating)}</span>
            <span className="text-xs text-gray-400">({business.review_count})</span>
          </div>
          {business.city && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{business.city}</span>
            </div>
          )}
          <div className="mt-2 text-xs text-blue-600 font-medium group-hover:underline">자세히 보기 →</div>
        </div>
      </div>
    </Link>
  );
}

// 인피드 광고 카드 (전체폭)
function InfeedAdCard({ business }: { business: Business }) {
  const name = business.name_ko || business.name_en || "";
  const icon = getCategoryIcon(business.category);
  const colorClass = getCategoryColor(business.category);
  const imageUrl = hasValidImage(business.cover_url) ? proxyPhotoUrl(business.cover_url!) : null;

  return (
    <Link href={`/businesses/${business.id}`}>
      <div className="group cursor-pointer flex gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition-all duration-200">
        {/* 썸네일 */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${colorClass} bg-opacity-10`}>
              <span className="text-2xl">{icon}</span>
            </div>
          )}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">광고</span>
            <span className="text-xs text-gray-400">{business.category}</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-blue-600">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-yellow-500 text-xs">⭐</span>
            <span className="text-xs font-medium">{toRating(business.rating)}</span>
            <span className="text-xs text-gray-400">· {business.city}</span>
          </div>
          {business.phone && (
            <div className="flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">{business.phone}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// 리더보드 배너 (홈 섹션 구분자)
function LeaderboardBanner({ businesses }: { businesses: Business[] }) {
  const [idx, setIdx] = useState(0);
  const biz = businesses[idx % businesses.length];
  const name = biz?.name_ko || biz?.name_en || "";

  useEffect(() => {
    if (businesses.length <= 1) return;
    const t = setInterval(() => setIdx(i => i + 1), 5000);
    return () => clearInterval(t);
  }, [businesses.length]);

  if (!biz) return null;

  return (
    <Link href={`/businesses/${biz.id}`}>
      <div className="group cursor-pointer w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0">광고</span>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{name}</p>
            <p className="text-blue-200 text-xs truncate">
              ⭐ {toRating(biz.rating)} · {biz.category} · {biz.city}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="text-xs bg-white text-blue-700 font-bold px-3 py-1.5 rounded-lg group-hover:bg-blue-50 transition-colors">
            보기 →
          </span>
        </div>
      </div>
    </Link>
  );
}

// 사이드바 스택 (여러 업체)
function SidebarStack({ businesses, label }: { businesses: Business[]; label?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label || "✨ 추천 업체"}</span>
      </div>
      {businesses.slice(0, 3).map(biz => (
        <FeaturedBusinessCard key={biz.id} business={biz} />
      ))}
      <Link href="/businesses?sort=featured">
        <div className="text-center text-xs text-blue-500 hover:text-blue-700 cursor-pointer py-1">
          더 보기 →
        </div>
      </Link>
    </div>
  );
}

// 메인 AdBanner 컴포넌트
export function AdBanner({ size, businesses = [], category, className = "", label }: AdBannerProps) {
  const filtered = category
    ? businesses.filter(b => b.category === category)
    : businesses;

  const pool = filtered.length > 0 ? filtered : businesses;

  if (pool.length === 0) return null;

  if (size === "leaderboard") {
    return (
      <div className={`w-full ${className}`}>
        <LeaderboardBanner businesses={pool} />
      </div>
    );
  }

  if (size === "rectangle" || size === "sidebar-tall") {
    return (
      <div className={`w-full ${className}`}>
        <SidebarStack businesses={pool} label={label} />
      </div>
    );
  }

  if (size === "inline") {
    const biz = pool[Math.floor(Math.random() * pool.length)];
    return (
      <div className={`${className}`}>
        <InfeedAdCard business={biz} />
      </div>
    );
  }

  // banner (모바일 320x50 스타일)
  const biz = pool[0];
  const name = biz?.name_ko || biz?.name_en || "";
  return (
    <Link href={`/businesses/${biz.id}`}>
      <div className={`group cursor-pointer flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg px-3 py-2 ${className}`}>
        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold flex-shrink-0">광고</span>
        <span className="text-sm font-medium text-gray-800 truncate flex-1">{name}</span>
        <span className="text-xs text-blue-600 font-medium flex-shrink-0">보기 →</span>
      </div>
    </Link>
  );
}

// 훅: featured 업체 가져오기
export function useFeaturedBusinesses(limit = 12) {
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    fetch(`/api/businesses?featured=true&limit=${limit}&sort=rating`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.businesses || data.data || [];
        setBusinesses(list);
      })
      .catch(() => {});
  }, [limit]);

  return businesses;
}
