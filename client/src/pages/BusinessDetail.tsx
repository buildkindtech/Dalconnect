import { useParams, Link } from "wouter";
import { MapPin, Phone, Globe, Clock, Star, Share2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useBusiness } from "@/lib/api";
import { getCategoryImage } from "@/lib/imageDefaults";

const GOOGLE_MAPS_API_KEY = "AIzaSyAzcujFS2IfcaxVmtYvFEb4omQhVlOQCOE";

const DAYS_KO: Record<string, string> = {
  'monday': '월요일',
  'tuesday': '화요일',
  'wednesday': '수요일',
  'thursday': '목요일',
  'friday': '금요일',
  'saturday': '토요일',
  'sunday': '일요일',
};

export default function BusinessDetail() {
  const { id } = useParams();
  const { data: business, isLoading, error } = useBusiness(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Skeleton className="w-full h-[400px]" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-24" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">업체를 찾을 수 없습니다</h1>
          <p className="text-slate-600 mb-6">요청하신 업체 정보를 불러올 수 없습니다.</p>
          <Link href="/businesses">
            <Button>업체 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = getCategoryImage(business.category, business.cover_url);
  const googleMapsEmbedUrl = business.address
    ? `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(business.address)}`
    : null;
  const googleMapsDirectionsUrl = business.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`
    : null;

  const handleShare = async () => {
    const shareData = {
      title: business.name_ko || business.name_en,
      text: `${business.name_ko || business.name_en} - ${business.category}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cover Image */}
      <div 
        className="w-full h-[400px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 container mx-auto px-4">
          <div className="flex items-end justify-between">
            <div className="text-white">
              {business.featured && (
                <Badge variant="default" className="mb-2">추천 업체</Badge>
              )}
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {business.name_ko || business.name_en}
              </h1>
              {business.name_ko && business.name_en && (
                <p className="text-xl text-slate-200">{business.name_en}</p>
              )}
            </div>
            <Button variant="secondary" className="gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              공유
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category & Rating */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {business.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-xl font-bold">{business.rating || 'N/A'}</span>
                    </div>
                    <span className="text-slate-600">
                      ({business.review_count || 0} 리뷰)
                    </span>
                  </div>
                </div>
                {business.description && (
                  <p className="text-slate-700 leading-relaxed">{business.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Business Hours */}
            {business.hours && Object.keys(business.hours).length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="h-6 w-6" />
                    영업시간
                  </h2>
                  <div className="space-y-2">
                    {Object.entries(business.hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between py-2 border-b last:border-0">
                        <span className="font-medium">{DAYS_KO[day.toLowerCase()] || day}</span>
                        <span className="text-slate-600">{hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Google Map */}
            {googleMapsEmbedUrl && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="h-6 w-6" />
                    위치
                  </h2>
                  <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={googleMapsEmbedUrl}
                      allowFullScreen
                    />
                  </div>
                  {googleMapsDirectionsUrl && (
                    <a href={googleMapsDirectionsUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full gap-2">
                        <Navigation className="h-4 w-4" />
                        길찾기
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">연락처</h2>
                <Separator />
                
                {business.phone && (
                  <a href={`tel:${business.phone}`} className="flex items-start gap-3 group">
                    <Phone className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">전화번호</p>
                      <p className="font-medium group-hover:text-primary">{business.phone}</p>
                    </div>
                  </a>
                )}

                {business.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">주소</p>
                      <p className="font-medium">{business.address}</p>
                      {business.city && (
                        <p className="text-sm text-slate-500">{business.city}</p>
                      )}
                    </div>
                  </div>
                )}

                {business.website && (
                  <a 
                    href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 group"
                  >
                    <Globe className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-600">웹사이트</p>
                      <p className="font-medium group-hover:text-primary break-all">
                        {business.website}
                      </p>
                    </div>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* CTA */}
            {!business.claimed && (
              <Card className="bg-primary text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-2">업체 관계자이신가요?</h3>
                  <p className="text-sm mb-4 opacity-90">
                    업체를 등록하고 더 많은 정보를 제공하세요
                  </p>
                  <Link href="/pricing">
                    <Button variant="secondary" className="w-full">
                      업체 등록하기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
