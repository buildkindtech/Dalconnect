import { useParams, Link } from "wouter";
import { MapPin, Phone, Globe, Clock, Star, Share2, Navigation, ChevronLeft, ChevronRight, AlertCircle, MessageCircle, Building2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBusiness } from "@/lib/api";
import { getCategoryImage, proxyPhotoUrl } from "@/lib/imageDefaults";
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
  
  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimData, setClaimData] = useState({
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    password: "",
    password_confirm: "",
  });
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

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

  // Image gallery setup — proxy Google Places photo URLs through server-side endpoint
  const coverImage = business.cover_url ? proxyPhotoUrl(business.cover_url) : null;
  const photoImages = business.photos?.map(p => proxyPhotoUrl(p)).filter(Boolean) as string[] || [];
  const allImages = coverImage 
    ? [coverImage, ...photoImages.filter(p => p !== coverImage)]
    : photoImages.length > 0 
      ? photoImages 
      : [getCategoryImage(business.category, null)];
  const images = allImages.filter(Boolean) as string[];
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
    const kakao = (window as any).Kakao;
    if (!kakao || !kakao.isInitialized()) {
      toast({ title: '카카오톡 공유 불가', description: '카카오 SDK를 불러오지 못했습니다.' });
      return;
    }
    kakao.Share.sendDefault({
      objectType: 'location',
      address: business.address || '달라스, TX',
      addressTitle: business.name,
      content: {
        title: business.name,
        description: `${business.category || ''} · ${business.city || 'Dallas'} | DalKonnect 달라스 한인 업소록`,
        imageUrl: business.photos?.[0] || 'https://dalkonnect.com/logo.png',
        link: {
          mobileWebUrl: `https://dalkonnect.com/business/${business.id}`,
          webUrl: `https://dalkonnect.com/business/${business.id}`,
        },
      },
      buttons: [{
        title: '업소 보기',
        link: {
          mobileWebUrl: `https://dalkonnect.com/business/${business.id}`,
          webUrl: `https://dalkonnect.com/business/${business.id}`,
        },
      }],
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

  const handleClaimSubmit = async () => {
    const errors: Record<string, string> = {};
    
    if (!claimData.owner_name.trim()) errors.owner_name = "이름은 필수입니다";
    if (!claimData.owner_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimData.owner_email)) {
      errors.owner_email = "올바른 이메일을 입력해주세요";
    }
    if (!claimData.owner_phone.trim() || !/^[\d\s\-\+\(\)]{10,20}$/.test(claimData.owner_phone)) {
      errors.owner_phone = "올바른 전화번호를 입력해주세요";
    }
    if (!claimData.password || claimData.password.length < 8) {
      errors.password = "비밀번호는 최소 8자 이상이어야 합니다";
    }
    if (claimData.password !== claimData.password_confirm) {
      errors.password_confirm = "비밀번호가 일치하지 않습니다";
    }
    
    if (Object.keys(errors).length > 0) {
      setClaimErrors(errors);
      return;
    }
    
    setIsSubmittingClaim(true);
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          business_id: id,
          owner_name: claimData.owner_name,
          owner_email: claimData.owner_email,
          owner_phone: claimData.owner_phone,
          password: claimData.password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "클레임 요청 완료!",
          description: "관리자 검토 후 승인됩니다. 승인 시 이메일로 알려드립니다.",
        });
        setClaimModalOpen(false);
        setClaimData({
          owner_name: "",
          owner_email: "",
          owner_phone: "",
          password: "",
          password_confirm: "",
        });
        setClaimErrors({});
      } else {
        toast({
          title: "클레임 요청 실패",
          description: data.error || "오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "클레임 요청 실패",
        description: error.message || "네트워크 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

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
                {business.updated_at && (
                  <p className="text-xs text-slate-400 mb-3">
                    <Clock className="h-3 w-3 inline mr-1" />
                    정보 업데이트: {new Date(business.updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
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
                      <p className="font-medium group-hover:text-primary">
                        웹사이트 방문 →
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
              <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-none">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Building2 className="h-6 w-6 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold mb-2">이 업체의 사장님이신가요?</h3>
                      <p className="text-sm opacity-90">
                        업체를 클레임하고 정보를 직접 관리하세요
                      </p>
                    </div>
                  </div>
                  
                  <Dialog open={claimModalOpen} onOpenChange={setClaimModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" className="w-full mb-2">
                        내 업체로 등록하기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>업체 클레임</DialogTitle>
                        <DialogDescription>
                          {business.name_ko || business.name_en} 업체의 소유자임을 인증해주세요
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="claim_owner_name">대표자 이름 *</Label>
                          <Input
                            id="claim_owner_name"
                            value={claimData.owner_name}
                            onChange={(e) => {
                              setClaimData(prev => ({ ...prev, owner_name: e.target.value }));
                              setClaimErrors(prev => ({ ...prev, owner_name: "" }));
                            }}
                            placeholder="홍길동"
                            className={claimErrors.owner_name ? "border-red-500" : ""}
                          />
                          {claimErrors.owner_name && (
                            <p className="text-sm text-red-600 mt-1">{claimErrors.owner_name}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="claim_owner_email">이메일 (로그인용) *</Label>
                          <Input
                            id="claim_owner_email"
                            type="email"
                            value={claimData.owner_email}
                            onChange={(e) => {
                              setClaimData(prev => ({ ...prev, owner_email: e.target.value }));
                              setClaimErrors(prev => ({ ...prev, owner_email: "" }));
                            }}
                            placeholder="owner@email.com"
                            className={claimErrors.owner_email ? "border-red-500" : ""}
                          />
                          {claimErrors.owner_email && (
                            <p className="text-sm text-red-600 mt-1">{claimErrors.owner_email}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="claim_owner_phone">전화번호 *</Label>
                          <Input
                            id="claim_owner_phone"
                            value={claimData.owner_phone}
                            onChange={(e) => {
                              setClaimData(prev => ({ ...prev, owner_phone: e.target.value }));
                              setClaimErrors(prev => ({ ...prev, owner_phone: "" }));
                            }}
                            placeholder="(214) 123-4567"
                            className={claimErrors.owner_phone ? "border-red-500" : ""}
                          />
                          {claimErrors.owner_phone && (
                            <p className="text-sm text-red-600 mt-1">{claimErrors.owner_phone}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="claim_password">비밀번호 (최소 8자) *</Label>
                          <Input
                            id="claim_password"
                            type="password"
                            value={claimData.password}
                            onChange={(e) => {
                              setClaimData(prev => ({ ...prev, password: e.target.value }));
                              setClaimErrors(prev => ({ ...prev, password: "" }));
                            }}
                            placeholder="••••••••"
                            className={claimErrors.password ? "border-red-500" : ""}
                          />
                          {claimErrors.password && (
                            <p className="text-sm text-red-600 mt-1">{claimErrors.password}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="claim_password_confirm">비밀번호 확인 *</Label>
                          <Input
                            id="claim_password_confirm"
                            type="password"
                            value={claimData.password_confirm}
                            onChange={(e) => {
                              setClaimData(prev => ({ ...prev, password_confirm: e.target.value }));
                              setClaimErrors(prev => ({ ...prev, password_confirm: "" }));
                            }}
                            placeholder="••••••••"
                            className={claimErrors.password_confirm ? "border-red-500" : ""}
                          />
                          {claimErrors.password_confirm && (
                            <p className="text-sm text-red-600 mt-1">{claimErrors.password_confirm}</p>
                          )}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-900">
                            관리자 검토 후 승인됩니다. 승인 시 이메일로 알려드립니다.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setClaimModalOpen(false)}
                          className="flex-1"
                          disabled={isSubmittingClaim}
                        >
                          취소
                        </Button>
                        <Button
                          onClick={handleClaimSubmit}
                          className="flex-1"
                          disabled={isSubmittingClaim}
                        >
                          {isSubmittingClaim ? "제출 중..." : "인증 요청"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Link href="/pricing">
                    <Button variant="ghost" className="w-full text-white hover:text-white hover:bg-white/20">
                      프리미엄 플랜 보기
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
