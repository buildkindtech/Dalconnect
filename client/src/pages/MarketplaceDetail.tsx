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
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MarketplaceDetail() {
  const { id } = useParams();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${id}`);
      if (!response.ok) throw new Error('Failed to fetch listing');
      return response.json();
    },
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Category & Status */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{listing.category}</Badge>
                {listing.price_type === 'free' && (
                  <Badge className="bg-green-600">무료나눔</Badge>
                )}
                {listing.status === 'sold' && (
                  <Badge variant="destructive">판매완료</Badge>
                )}
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
                  <Eye className="w-4 h-4" />
                  조회 {listing.views || 0}회
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(listing.created_at)}
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
                <h4 className="font-medium mb-3">연락처</h4>
                {listing.contact_info ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <ContactIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        {contactLabels[listing.contact_method]?.label || '연락처'}:
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded font-mono text-sm">
                      {listing.contact_info}
                    </div>
                    
                    {listing.contact_method === 'phone' && (
                      <a href={`tel:${listing.contact_info}`}>
                        <Button className="w-full gap-2 mt-2">
                          <Phone className="w-4 h-4" />
                          전화 걸기
                        </Button>
                      </a>
                    )}
                    
                    {listing.contact_method === 'email' && (
                      <a href={`mailto:${listing.contact_info}`}>
                        <Button className="w-full gap-2 mt-2">
                          <Mail className="w-4 h-4" />
                          이메일 보내기
                        </Button>
                      </a>
                    )}

                    {listing.contact_method === 'message' && (
                      <a href={`sms:${listing.contact_info}`}>
                        <Button className="w-full gap-2 mt-2">
                          <MessageCircle className="w-4 h-4" />
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
      </div>
    </div>
  );
}
