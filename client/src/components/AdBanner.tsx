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
  const n = Number(r);
  return isNaN(n) ? "0.0" : n.toFixed(1);
}

type AdSize = 
  | "leaderboard"    // 728x90 — 홈 섹션 사이 (데스크탑)
  | "banner"         // 320x50 — 모바일 배너
  | "rectangle"      // 300x250 — 사이드바
  | "inline"         // 전체폭 인피드 카드
  | "infeed-strip"   // 3-카드 가로 광고 스트립
  | "sidebar-tall";  // 300x600 — 사이드바 롱

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
    <Link href={`/business/${business.id}`}>
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
  const imageUrl = hasValidImage(business.cover_url) ? proxyPhotoUrl(business.cover_url!) : null;

  return (
    <Link href={`/business/${business.id}`}>
      <div className="group cursor-pointer rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-all">
        {/* 사진 배경 */}
        <div className="relative h-28"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
            backgroundSize: 'cover', backgroundPosition: 'center',
            backgroundColor: imageUrl ? undefined : '#1e40af',
          }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-2 left-2">
            <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-bold">광고</span>
          </div>
          <div className="absolute bottom-0 p-2.5">
            <p className="text-white text-xs font-bold leading-tight line-clamp-2">{name}</p>
            <p className="text-white/70 text-[10px] mt-0.5">⭐ {toRating(business.rating)} · {business.category}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// 인피드 3-카드 광고 스트립
function InfeedStrip({ businesses }: { businesses: Business[] }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (businesses.length <= 3) return;
    const t = setInterval(() => setOffset(o => o + 3), 7000);
    return () => clearInterval(t);
  }, [businesses.length]);
  const pool = businesses.filter(b => b.cover_url);
  if (pool.length === 0) return null;
  const slice = [
    pool[(offset) % pool.length],
    pool[(offset + 1) % pool.length],
    pool[(offset + 2) % pool.length],
  ].filter(Boolean);

  return (
    <div className="my-6 p-3 bg-slate-50 rounded-2xl border border-slate-100">
      <p className="text-[10px] text-slate-400 font-semibold mb-2 text-center uppercase tracking-wide">추천 업체</p>
      <div className="grid grid-cols-3 gap-2">
        {slice.map((biz: Business) => <InfeedAdCard key={biz.id} business={biz} />)}
      </div>
    </div>
  );
}

// 리더보드 배너 — 사진 배경 + 슬라이드
function LeaderboardBanner({ businesses }: { businesses: Business[] }) {
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (businesses.length <= 1) return;
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIdx(i => i + 1); setFade(true); }, 300);
    }, 5000);
    return () => clearInterval(t);
  }, [businesses.length]);

  if (businesses.length === 0) return null;
  const biz = businesses[idx % businesses.length];
  const name = biz?.name_ko || biz?.name_en || "";
  const imgUrl = biz?.cover_url ? proxyPhotoUrl(biz.cover_url) : null;

  return (
    <Link href={`/business/${biz.id}`}>
      <div
        className="group cursor-pointer relative w-full h-24 md:h-28 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
        style={{
          backgroundImage: imgUrl ? `url(${imgUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: imgUrl ? undefined : '#1e40af',
        }}
      >
        {/* 다크 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

        {/* 콘텐츠 */}
        <div
          className="relative h-full flex items-center justify-between px-4 gap-3"
          style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-full font-bold flex-shrink-0">광고</span>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm md:text-base truncate drop-shadow">{name}</p>
              <p className="text-white/80 text-xs truncate">
                ⭐ {toRating(biz.rating)} · {biz.category} · {biz.city}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs bg-white/90 text-gray-900 font-bold px-3 py-1.5 rounded-lg group-hover:bg-white transition-colors shadow">
              보기 →
            </span>
          </div>
        </div>

        {/* 인디케이터 */}
        {businesses.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {businesses.slice(0, 8).map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full transition-all ${i === idx % businesses.length ? 'bg-white w-3' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
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

  if (size === "infeed-strip") {
    return <InfeedStrip businesses={pool} />;
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
    <Link href={`/business/${biz.id}`}>
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
