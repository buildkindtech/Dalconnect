import { useParams, Link } from "wouter";
import { MapPin, Phone, Globe, Clock, Star, Share2, Navigation, ChevronLeft, ChevronRight, AlertCircle, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useBusiness } from "@/lib/api";
import { getCategoryImage } from "@/lib/imageDefaults";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Image gallery setup
  const images = business.cover_url ? [business.cover_url] : [getCategoryImage(business.category, null)];
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const googleMapsEmbedUrl = business.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(business.address)}&output=embed&z=15`
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
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: '링크 복사 완료!',
        description: '클립보드에 링크가 복사되었습니다.',
      });
    }
  };

  const handleShareKakao = () => {
    // Kakao share would require Kakao SDK integration
    toast({
      title: '카카오톡 공유',
      description: '카카오톡 공유 기능은 준비 중입니다.',
    });
  };

  // Check if business is open now
  const isOpenNow = () => {
    if (!business.hours || Object.keys(business.hours).length === 0) return null;
    
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentHours = business.hours[currentDay];
    
    if (!currentHours || currentHours.toLowerCase().includes('closed')) return false;
    
    // Simple check - this could be improved with actual time parsing
    return true;
  };

  const openStatus = isOpenNow();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cover Image Gallery */}
      <div className="w-full h-[400px] bg-slate-900 relative overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center transition-all duration-300"
          style={{ backgroundImage: `url(${images[currentImageIndex]})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Gallery Navigation */}
          {hasMultipleImages && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-70 hover:opacity-100"
                onClick={prevImage}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-70 hover:opacity-100"
                onClick={nextImage}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          <div className="absolute bottom-8 left-0 right-0 container mx-auto px-4">
            <div className="flex items-end justify-between flex-wrap gap-4">
              <div className="text-white">
                {business.featured && (
                  <Badge variant="default" className="mb-2">⭐ 추천 업체</Badge>
                )}
                <h1 className="text-4xl md:text-5xl font-bold mb-2 font-ko">
                  {business.name_ko || business.name_en}
                </h1>
                {business.name_ko && business.name_en && (
                  <p className="text-lg text-slate-200 opacity-90">{business.name_en}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="gap-2" onClick={handleShareKakao}>
                  <MessageCircle className="h-4 w-4" />
                  카카오톡
                </Button>
                <Button variant="secondary" size="sm" className="gap-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  링크복사
                </Button>
              </div>
            </div>
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
                  <Badge variant="secondary" className="text-base px-4 py-2 font-ko">
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Clock className="h-6 w-6" />
                      영업시간
                    </h2>
                    {openStatus !== null && (
                      <Badge className={openStatus ? "bg-green-600" : "bg-red-600"}>
                        {openStatus ? "영업중" : "영업종료"}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(business.hours).map(([day, hours]) => {
                      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                      const today = dayNames[new Date().getDay()];
                      const isToday = day.toLowerCase() === today;
                      
                      return (
                        <div 
                          key={day} 
                          className={`flex justify-between py-2 border-b last:border-0 ${
                            isToday ? 'bg-blue-50 -mx-2 px-2 rounded font-semibold' : ''
                          }`}
                        >
                          <span className={isToday ? 'text-primary' : 'font-medium'}>
                            {DAYS_KO[day.toLowerCase()] || day}
                            {isToday && ' (오늘)'}
                          </span>
                          <span className={isToday ? 'text-primary' : 'text-slate-600'}>
                            {hours}
                          </span>
                        </div>
                      );
                    })}
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
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 mb-2 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        전화번호
                      </p>
                      <p className="text-2xl font-bold text-gray-900">{business.phone}</p>
                    </div>
                    <a href={`tel:${business.phone}`} className="block">
                      <Button size="lg" className="w-full gap-2 bg-green-600 hover:bg-green-700 text-lg h-14">
                        <Phone className="h-5 w-5" />
                        전화 걸기
                      </Button>
                    </a>
                  </>
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

                {/* Report Link */}
                <Separator className="my-4" />
                <Link href="/contact">
                  <button className="w-full text-sm text-slate-600 hover:text-primary flex items-center justify-center gap-2 py-2">
                    <AlertCircle className="h-4 w-4" />
                    이 업체 정보가 잘못되었나요?
                  </button>
                </Link>
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
