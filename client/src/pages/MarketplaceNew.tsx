import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const categories = [
  { value: '이사/가구', label: '🏠 이사/가구', emoji: '🏠' },
  { value: '자동차', label: '🚗 자동차', emoji: '🚗' },
  { value: '전자기기', label: '📱 전자기기', emoji: '📱' },
  { value: '유아/키즈', label: '👶 유아/키즈', emoji: '👶' },
  { value: '교재/서적', label: '📚 교재/서적', emoji: '📚' },
  { value: '티켓/양도', label: '🎫 티켓/양도', emoji: '🎫' },
  { value: '구인/구직', label: '💼 구인/구직', emoji: '💼' },
  { value: '렌트/룸메이트', label: '🏡 렌트/룸메이트', emoji: '🏡' },
  { value: '레슨/과외', label: '🎓 레슨/과외', emoji: '🎓' },
  { value: '무료나눔', label: '🆓 무료나눔', emoji: '🆓' },
  { value: '기타', label: '기타', emoji: '📦' },
];

const conditions = [
  { value: 'new', label: '새것' },
  { value: 'like_new', label: '거의새것' },
  { value: 'good', label: '좋음' },
  { value: 'fair', label: '보통' },
];

const priceTypes = [
  { value: 'fixed', label: '정가' },
  { value: 'negotiable', label: '가격협의' },
  { value: 'free', label: '무료나눔' },
  { value: 'contact', label: '문의' },
];

const contactMethods = [
  { value: 'phone', label: '전화' },
  { value: 'message', label: '문자' },
  { value: 'email', label: '이메일' },
  { value: 'kakao', label: '카카오톡' },
];

const locations = [
  'Plano', 'Frisco', 'Allen', 'McKinney', 'Dallas', 
  'Carrollton', 'Irving', 'Richardson', 'Garland', 'Mesquite'
];

export default function MarketplaceNew() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_type: 'fixed',
    category: '',
    condition: 'good',
    contact_method: 'phone',
    contact_info: '',
    author_name: '',
    location: '',
    image_urls: ['', '', ''],
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newImageUrls = [...prev.image_urls];
      newImageUrls[index] = value;
      return { ...prev, image_urls: newImageUrls };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.category || !formData.contact_info) {
      toast({
        title: '필수 항목을 입력해주세요',
        description: '제목, 카테고리, 연락처는 필수 항목입니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        price: formData.price_type === 'free' ? null : formData.price || null,
      };

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to create listing');
      }

      const newListing = await response.json();

      toast({
        title: '매물이 등록되었습니다! 🎉',
        description: '성공적으로 등록되었습니다.',
      });

      navigate(`/marketplace/${newListing.id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: '등록 실패',
        description: '매물 등록 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/marketplace')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>

        <Card className="max-w-3xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-2">새 매물 등록</h1>
          <p className="text-gray-600 mb-6">
            간단한 정보만 입력하시면 무료로 등록할 수 있습니다!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="예: 삼성 냉장고 팝니다"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                maxLength={200}
                required
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Type & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price_type">가격 유형</Label>
                <Select
                  value={formData.price_type}
                  onValueChange={(value) => handleChange('price_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.price_type !== 'free' && formData.price_type !== 'contact' && (
                <div>
                  <Label htmlFor="price">가격 ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="100"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            {/* Condition */}
            <div>
              <Label htmlFor="condition">상태</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleChange('condition', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((cond) => (
                    <SelectItem key={cond.value} value={cond.value}>
                      {cond.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">상세 설명</Label>
              <Textarea
                id="description"
                placeholder="물품에 대한 자세한 설명을 입력해주세요"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={6}
              />
            </div>

            {/* Image URLs (Optional) */}
            <div>
              <Label>사진 (선택, 최대 3장)</Label>
              <p className="text-sm text-gray-500 mb-2">이미지 URL을 입력하세요. 나중에 업로드 기능이 추가될 예정입니다.</p>
              <div className="space-y-2">
                {formData.image_urls.map((url, index) => (
                  <Input
                    key={index}
                    type="url"
                    placeholder={`이미지 URL ${index + 1}`}
                    value={url}
                    onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  />
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">지역</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => handleChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Method & Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_method">연락 방법 *</Label>
                <Select
                  value={formData.contact_method}
                  onValueChange={(value) => handleChange('contact_method', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contactMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contact_info">
                  {formData.contact_method === 'kakao' ? '카카오톡 ID' : '연락처'} *
                </Label>
                <Input
                  id="contact_info"
                  placeholder={
                    formData.contact_method === 'kakao'
                      ? 'kakao_id'
                      : formData.contact_method === 'email'
                      ? 'email@example.com'
                      : '469-555-0123'
                  }
                  value={formData.contact_info}
                  onChange={(e) => handleChange('contact_info', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Author Name */}
            <div>
              <Label htmlFor="author_name">이름</Label>
              <Input
                id="author_name"
                placeholder="홍길동"
                value={formData.author_name}
                onChange={(e) => handleChange('author_name', e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? '등록 중...' : '무료로 등록하기'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/marketplace')}
              >
                취소
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              * 표시된 항목은 필수 입력 사항입니다. 등록된 매물은 30일 후 자동으로 만료됩니다.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
