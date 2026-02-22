import { useParams } from "wouter";
import { MapPin, Phone, Globe, Clock, Star, Share2, Heart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness } from "@/lib/api";
import NotFound from "./not-found";

export default function BusinessDetail() {
  const params = useParams();
  const { data: business, isLoading, error } = useBusiness(params.id || "");

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen pb-20">
        <Skeleton className="h-[400px] w-full" />
        <div className="container mx-auto px-4 mt-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-8">
            <div className="bg-white rounded-xl p-8"><Skeleton className="h-6 w-1/3 mb-4" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></div>
          </div>
          <div className="w-full md:w-[350px]"><Skeleton className="h-64 w-full rounded-xl" /></div>
        </div>
      </div>
    );
  }

  if (error || !business) return <NotFound />;

  const websiteHostname = business.website ? (() => { try { return new URL(business.website).hostname.replace('www.', ''); } catch { return business.website; } })() : null;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="relative h-[300px] md:h-[400px]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${business.cover_url})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        <div className="container mx-auto px-4 h-full relative z-10 flex items-end pb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end w-full">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-xl border-4 border-white bg-white overflow-hidden shadow-lg shrink-0">
              <img src={business.logo_url || ''} alt={business.name_en} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/20 text-blue-100 hover:bg-primary/30 border-blue-400/30 uppercase tracking-wider backdrop-blur-sm">{business.category}</Badge>
                {business.claimed && (
                  <Badge variant="outline" className="bg-green-500/20 text-green-100 border-green-400/30 backdrop-blur-sm">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> 소유주 확인됨
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-bold font-ko mb-2 drop-shadow-md" data-testid="text-business-name">
                {business.name_ko || business.name_en} <span className="text-2xl md:text-3xl font-medium text-slate-300 ml-2">{business.name_en}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-slate-200">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-secondary fill-secondary mr-1.5" />
                  <span className="font-bold text-white">{business.rating}</span>
                  <span className="ml-1 opacity-80">({business.review_count}개의 리뷰)</span>
                </div>
                <span>•</span>
                <div className="flex items-center"><MapPin className="h-4 w-4 mr-1.5 opacity-70" />{business.city}, TX</div>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
              <Button className="flex-1 md:flex-none rounded-full px-6" size="lg" data-testid="button-write-review">리뷰 작성</Button>
              <Button variant="outline" size="icon" className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm h-11 w-11 shrink-0"><Heart className="h-5 w-5" /></Button>
              <Button variant="outline" size="icon" className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm h-11 w-11 shrink-0"><Share2 className="h-5 w-5" /></Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
            <h2 className="text-2xl font-bold mb-4 font-ko">업체 소개</h2>
            <p className="text-slate-600 leading-relaxed text-lg">{business.description}</p>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-sm border border-border">
            <h2 className="text-2xl font-bold mb-6 font-ko">갤러리</h2>
            {business.photos && business.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {business.photos.map((photo, i) => (
                  <div key={i} className="aspect-video rounded-lg overflow-hidden relative group cursor-pointer">
                    <img src={photo} alt={`Photo ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-muted-foreground">업로드된 사진이 없습니다.</p>
                {business.claimed && <Button variant="outline" className="mt-4">사진 업로드</Button>}
              </div>
            )}
          </div>
        </div>

        <aside className="w-full md:w-[350px] shrink-0 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0 mr-3" />
                <div>
                  <p className="font-medium text-slate-900">{business.address}</p>
                  <p className="text-slate-500">{business.city}, TX</p>
                  <a href="#" className="text-primary text-sm font-medium hover:underline mt-1 inline-block">찾아오는 길</a>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-primary shrink-0 mr-3" />
                <a href={`tel:${business.phone}`} className="font-medium text-slate-900 hover:text-primary transition-colors">{business.phone}</a>
              </div>
              {business.website && websiteHostname && (
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-primary shrink-0 mr-3" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate">{websiteHostname}</a>
                </div>
              )}
            </div>
            <div className="h-48 bg-slate-200 relative w-full">
              <iframe width="100%" height="100%" style={{border:0}} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${encodeURIComponent((business.address || '') + ' ' + (business.city || '') + ' TX')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}></iframe>
            </div>
          </div>

          {business.hours && (
            <div className="bg-white rounded-xl shadow-sm border border-border p-6">
              <div className="flex items-center mb-4"><Clock className="h-5 w-5 text-primary mr-2" /><h3 className="font-bold text-lg">영업 시간</h3></div>
              <ul className="space-y-3 text-sm">
                {Object.entries(business.hours).map(([day, hours]) => (
                  <li key={day} className="flex justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-slate-700">{day}</span>
                    <span className="text-slate-600">{hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!business.claimed && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
              <h3 className="font-bold mb-2 text-slate-900">비즈니스 소유주이신가요?</h3>
              <p className="text-sm text-slate-600 mb-4">비즈니스 정보를 업데이트하고 고객 리뷰에 응답하시려면 소유권 확인을 진행하세요.</p>
              <Button className="w-full" data-testid="button-claim-listing">소유권 확인 신청</Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
