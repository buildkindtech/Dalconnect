import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  MapPin, DollarSign, Calendar, Users, Home, Search,
  Plus, Bath, BedDouble, Wifi, Car, PawPrint, Cigarette,
  ChevronRight, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const roomTypes = [
  { value: 'all', label: '전체' },
  { value: '하숙', label: '🍚 하숙 (식사포함)' },
  { value: '룸메이트', label: '🏠 룸메이트' },
  { value: '1베드룸', label: '🛏 1베드룸' },
  { value: '스튜디오', label: '📦 스튜디오' },
  { value: '개인방', label: '🚪 개인방' },
];

const genderPrefs = [
  { value: 'all', label: '성별무관' },
  { value: 'male', label: '남성만' },
  { value: 'female', label: '여성만' },
  { value: 'any', label: '상관없음' },
];

const dfwAreas = [
  'all', 'Plano', 'Frisco', 'Allen', 'McKinney', 'Dallas',
  'Carrollton', 'Irving', 'Richardson', 'Garland', 'Lewisville', 'Denton',
];

// 더미 데이터 (DB 연동 전 UI 확인용)
const DUMMY_POSTS = [
  {
    id: '1', type: '하숙', title: '플라노 한인 하숙 - 아줌마 집밥 제공 🍚',
    address: 'Plano, TX', rent: 900, utilities_included: true,
    available_date: '2026-04-01', gender_pref: 'any',
    description: '한인 아파트 2층, 조용한 환경. 아침+저녁 한식 제공. 주차 무료. 한국어 OK.',
    amenities: ['wifi', 'parking', 'laundry'], views: 142, created_at: '2026-03-10',
    contact: '469-555-0101', thumbnail: null,
  },
  {
    id: '2', type: '룸메이트', title: 'Frisco 아파트 룸메이트 구합니다 (여성만)',
    address: 'Frisco, TX', rent: 750, utilities_included: false,
    available_date: '2026-04-15', gender_pref: 'female',
    description: '2B/2B 아파트 빈방. 유틸 약 $100/mo 추가. 고양이 1마리 있음. 깔끔하게 생활하시는 분 환영.',
    amenities: ['wifi', 'parking', 'gym'], views: 87, created_at: '2026-03-12',
    contact: '214-555-0202', thumbnail: null,
  },
  {
    id: '3', type: '1베드룸', title: 'Carrollton 1베드룸 서브렛 (4월~8월)',
    address: 'Carrollton, TX', rent: 1100, utilities_included: true,
    available_date: '2026-04-01', gender_pref: 'any',
    description: '유학/출장으로 단기 서브렛. 유틸 포함. 가구 모두 있음. 4개월 계약 가능.',
    amenities: ['wifi', 'parking', 'furnished'], views: 203, created_at: '2026-03-14',
    contact: 'kakaotalk: kr_home', thumbnail: null,
  },
];

function AmenityBadge({ type }: { type: string }) {
  const map: Record<string, { icon: any; label: string }> = {
    wifi: { icon: Wifi, label: 'WiFi' },
    parking: { icon: Car, label: '주차' },
    laundry: { icon: Home, label: '세탁기' },
    gym: { icon: Users, label: '헬스장' },
    furnished: { icon: BedDouble, label: '가구 포함' },
    pets: { icon: PawPrint, label: '반려동물 OK' },
    smoking: { icon: Cigarette, label: '흡연 가능' },
  };
  const info = map[type];
  if (!info) return null;
  const Icon = info.icon;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
      <Icon className="w-3 h-3" />
      {info.label}
    </span>
  );
}

function RoomCard({ post }: { post: typeof DUMMY_POSTS[0] }) {
  const typeColor: Record<string, string> = {
    '하숙': 'bg-orange-100 text-orange-700',
    '룸메이트': 'bg-blue-100 text-blue-700',
    '1베드룸': 'bg-green-100 text-green-700',
    '스튜디오': 'bg-purple-100 text-purple-700',
    '개인방': 'bg-pink-100 text-pink-700',
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* 이미지 영역 */}
      <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
        {post.thumbnail ? (
          <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <Home className="w-12 h-12 text-blue-300" />
        )}
        <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${typeColor[post.type] || 'bg-gray-100 text-gray-600'}`}>
          {post.type}
        </span>
        {post.gender_pref !== 'any' && (
          <span className="absolute top-2 right-2 text-xs bg-white/90 text-gray-600 px-2 py-0.5 rounded-full">
            {post.gender_pref === 'female' ? '여성만' : '남성만'}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-2 line-clamp-2">
          {post.title}
        </h3>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <MapPin className="w-3 h-3" />
          {post.address}
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-lg font-bold text-blue-600">
            ${post.rent.toLocaleString()}/월
          </span>
          {post.utilities_included && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">유틸 포함</span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
          <Calendar className="w-3 h-3" />
          입주가능: {post.available_date}
        </div>

        {/* 어메니티 */}
        <div className="flex flex-wrap gap-1 mb-3">
          {post.amenities.slice(0, 3).map(a => <AmenityBadge key={a} type={a} />)}
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Eye className="w-3 h-3" />{post.views}
          </span>
          <Button size="sm" variant="outline" className="text-xs h-7">
            상세보기 <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function Roommate() {
  const [search, setSearch] = useState('');
  const [roomType, setRoomType] = useState('all');
  const [area, setArea] = useState('all');
  const [maxRent, setMaxRent] = useState('');
  const [gender, setGender] = useState('all');

  const filtered = DUMMY_POSTS.filter(p => {
    if (roomType !== 'all' && p.type !== roomType) return false;
    if (area !== 'all' && !p.address.includes(area)) return false;
    if (maxRent && p.rent > parseInt(maxRent)) return false;
    if (gender !== 'all' && p.gender_pref !== 'any' && p.gender_pref !== gender) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">🏠 룸메이트 · 하숙</h1>
          <p className="text-blue-100 text-sm mb-6">DFW 한인 룸메이트, 하숙, 단기렌트 정보</p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="지역, 하숙, 룸메이트 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white text-gray-900 border-0 shadow"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 필터 바 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Select value={roomType} onValueChange={setRoomType}>
            <SelectTrigger className="w-40 bg-white text-sm">
              <SelectValue placeholder="방 유형" />
            </SelectTrigger>
            <SelectContent>
              {roomTypes.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="w-36 bg-white text-sm">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent>
              {dfwAreas.map(a => (
                <SelectItem key={a} value={a}>{a === 'all' ? '전체 지역' : a}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="w-32 bg-white text-sm">
              <SelectValue placeholder="성별" />
            </SelectTrigger>
            <SelectContent>
              {genderPrefs.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500 whitespace-nowrap">최대 $</span>
            <Input
              type="number"
              placeholder="1500"
              value={maxRent}
              onChange={e => setMaxRent(e.target.value)}
              className="w-24 bg-white text-sm"
            />
          </div>

          <Link href="/roommate/new">
            <Button className="ml-auto gap-1 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" />
              글 올리기
            </Button>
          </Link>
        </div>

        {/* 안내 배너 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800 flex gap-2 items-start">
          <span className="text-lg">⚠️</span>
          <div>
            <strong>안전 거래 안내</strong>: 직접 방문 후 계약하세요. 선입금 요구나 사진만으로 계약 유도는 사기일 수 있습니다.
            의심스러운 게시물은 <a href="mailto:info@dalkonnect.com" className="underline">신고</a>해주세요.
          </div>
        </div>

        {/* 결과 수 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">{filtered.length}개</span> 게시물
          </p>
        </div>

        {/* 목록 */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">조건에 맞는 게시물이 없습니다.</p>
            <p className="text-sm mt-1">필터를 조정하거나 직접 글을 올려보세요.</p>
            <Link href="/roommate/new">
              <Button className="mt-4 gap-1">
                <Plus className="w-4 h-4" /> 방 정보 올리기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(post => <RoomCard key={post.id} post={post} />)}
          </div>
        )}

        {/* 하단 CTA */}
        <div className="mt-10 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
          <p className="font-semibold text-gray-800 mb-1">방을 구하거나 구인하고 계신가요?</p>
          <p className="text-sm text-gray-500 mb-4">DFW 한인 커뮤니티에 무료로 올리세요.</p>
          <Link href="/roommate/new">
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" />
              무료로 글 올리기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
