import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle, 
  Eye, 
  Calendar,
  ArrowLeft,
  DollarSign,
  Tag,
  User,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function MarketplaceDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${id}`);
      if (!response.ok) throw new Error('Failed to fetch listing');
      return response.json();
    },
  });

  const { data: relatedListings } = useQuery({
    queryKey: ['listings', 'related', listing?.category],
    queryFn: async () => {
      if (!listing?.category) return [];
      const response = await fetch(`/api/listings?category=${encodeURIComponent(listing.category)}&limit=4`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.items?.filter((item: any) => item.id !== id) || [];
    },
    enabled: !!listing?.category,
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">로딩중...</div>;
  }

  if (!listing) {
    return <div className="container mx-auto px-4 py-8">매물을 찾을 수 없습니다.</div>;
  }

  const formatPrice = () => {
    if (listing.price_type === 'free') return '무료나눔';
    if (listing.price_type === 'contact') return '가격문의';
    if (!listing.price) return '가격협의';
    return `$${parseFloat(listing.price).toLocaleString()}`;
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const handleShare = async () => {
    const shareData = {
      title: listing.title,
      text: `${listing.title} - ${formatPrice()}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: '링크가 복사되었습니다!',
        description: '클립보드에 링크가 복사되었습니다.',
      });
    }
  };

  const images = listing?.image_urls?.filter((url: string) => url && url.trim()) || [];
  const hasImages = images.length > 0;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const conditionLabels: Record<string, string> = {
    new: '새상품',
    like_new: '거의 새것',
    good: '좋음',
    fair: '보통',
  };

  const contactLabels: Record<string, { icon: any; label: string }> = {
    phone: { icon: Phone, label: '전화' },
    email: { icon: Mail, label: '이메일' },
    kakao: { icon: MessageCircle, label: '카카오톡' },
    message: { icon: MessageCircle, label: '문자' },
  };

  const ContactIcon = contactLabels[listing.contact_method]?.icon || Phone;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/marketplace">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {hasImages && (
              <Card className="overflow-hidden">
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={images[currentImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                  {images.length > 1 && (
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
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}

            <Card className="p-6">
              {/* Category & Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{listing.category}</Badge>
                  {listing.price_type === 'free' && (
                    <Badge className="bg-green-600">무료나눔</Badge>
                  )}
                  {listing.status === 'sold' && (
                    <Badge variant="destructive">판매완료</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  공유
                </Button>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold mb-4">{listing.title}</h1>

              {/* Price */}
              <div className="flex items-center gap-2 text-3xl font-bold text-blue-600 mb-6">
                {listing.price_type !== 'free' && listing.price && (
                  <DollarSign className="w-8 h-8" />
                )}
                {formatPrice()}
                {listing.price_type === 'negotiable' && (
                  <span className="text-sm text-gray-500 font-normal">(협상가능)</span>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatRelativeTime(listing.created_at)}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  조회 {listing.views || 0}회
                </div>
                {listing.condition && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    상태: {conditionLabels[listing.condition] || listing.condition}
                  </div>
                )}
                {listing.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {listing.location}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">상세 설명</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {listing.description || '상세 설명이 없습니다.'}
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar - Contact Info */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">판매자 정보</h3>
              
              {listing.author_name && (
                <div className="flex items-center gap-2 mb-4 text-gray-700">
                  <User className="w-4 h-4" />
                  {listing.author_name}
                </div>
              )}

              {listing.location && (
                <div className="flex items-center gap-2 mb-4 text-gray-700">
                  <MapPin className="w-4 h-4" />
                  {listing.location}
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">연락하기</h4>
                {listing.contact_info ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                        <ContactIcon className="w-4 h-4" />
                        <span className="font-medium">
                          {contactLabels[listing.contact_method]?.label || '연락처'}
                        </span>
                      </div>
                      <div className="font-mono text-lg font-semibold text-gray-900">
                        {listing.contact_info}
                      </div>
                    </div>
                    
                    {listing.contact_method === 'phone' && (
                      <a href={`tel:${listing.contact_info}`}>
                        <Button size="lg" className="w-full gap-2 bg-green-600 hover:bg-green-700">
                          <Phone className="w-5 h-5" />
                          전화 걸기
                        </Button>
                      </a>
                    )}
                    
                    {listing.contact_method === 'email' && (
                      <a href={`mailto:${listing.contact_info}`}>
                        <Button size="lg" className="w-full gap-2">
                          <Mail className="w-5 h-5" />
                          이메일 보내기
                        </Button>
                      </a>
                    )}

                    {listing.contact_method === 'kakao' && (
                      <div className="space-y-2">
                        <Button size="lg" className="w-full gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900">
                          <MessageCircle className="w-5 h-5" />
                          카카오톡으로 연락하기
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          카카오톡 ID: {listing.contact_info}
                        </p>
                      </div>
                    )}

                    {listing.contact_method === 'message' && (
                      <a href={`sms:${listing.contact_info}`}>
                        <Button size="lg" className="w-full gap-2">
                          <MessageCircle className="w-5 h-5" />
                          문자 보내기
                        </Button>
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">연락처 정보가 없습니다.</p>
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-500">
                  💡 거래 시 안전을 위해 직거래를 권장하며, 개인정보 보호에 유의하세요.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Related Listings */}
        {relatedListings && relatedListings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">같은 카테고리의 다른 매물</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedListings.slice(0, 4).map((related: any) => (
                <Link key={related.id} href={`/marketplace/${related.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    {related.image_urls?.[0] && (
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        <img
                          src={related.image_urls[0]}
                          alt={related.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {related.category}
                      </Badge>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                        {related.title}
                      </h3>
                      <p className="text-lg font-bold text-blue-600">
                        {related.price_type === 'free' 
                          ? '무료나눔' 
                          : related.price 
                            ? `$${parseFloat(related.price).toLocaleString()}` 
                            : '가격협의'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatRelativeTime(related.created_at)}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
