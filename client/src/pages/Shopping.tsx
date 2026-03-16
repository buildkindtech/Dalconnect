import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ShoppingCart, ExternalLink, TrendingUp, Clock, ArrowRight, Youtube, Play, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type MartVideo = {
  id: number;
  video_id: string;
  title: string;
  title_clean: string;
  store: string;
  channel_name: string;
  thumbnail_url: string;
  date: string;
  youtube_url: string;
};

type StoreId = "costco" | "traderjoes" | "centralmarket" | "heb";

const STORES = [
  {
    id: "costco" as StoreId,
    name: "Costco",
    nameKo: "코스트코",
    emoji: "🔴",
    color: "from-red-600 to-red-700",
    bgLight: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    badgeColor: "bg-red-600",
    tagline: "대용량 & 가성비 신상",
    description: "코스트코 DFW 인기 신상품과 핫딜 정보",
    website: "https://www.costco.com",
    items: [
      {
        id: 1,
        name: "Kirkland Organic Coconut Oil 84oz",
        nameKo: "커클랜드 유기농 코코넛 오일",
        price: "$19.99",
        category: "식품",
        hot: true,
        note: "SNS에서 난리난 아이템 — 요리/스킨케어 다용도",
        youtube: "https://youtube.com/channel/UCzikZfE3N5Lx3t9xWlh8wUg",
      },
      {
        id: 2,
        name: "Kirkland Signature Chicken Breast",
        nameKo: "커클랜드 닭가슴살 6팩",
        price: "$12.99",
        category: "단백질",
        hot: false,
        note: "헬스하는 분들 필수템. 1팩당 약 $2.16",
        youtube: null,
      },
      {
        id: 3,
        name: "Stonemill Kitchens Hummus",
        nameKo: "스톤밀 키친 후머스 (3팩)",
        price: "$7.99",
        category: "간식",
        hot: false,
        note: "크래커랑 같이 먹으면 최고",
        youtube: null,
      },
      {
        id: 4,
        name: "Bibigo Mandu Pork & Vegetable",
        nameKo: "비비고 만두 (4.4 lbs)",
        price: "$14.99",
        category: "한식",
        hot: true,
        note: "코스트코 한식 베스트셀러 — 재고 빨리 나감!",
        youtube: "https://youtube.com/channel/UCzikZfE3N5Lx3t9xWlh8wUg",
      },
    ],
  },
  {
    id: "traderjoes" as StoreId,
    name: "Trader Joe's",
    nameKo: "트레이더 조",
    emoji: "🌿",
    color: "from-red-500 to-orange-500",
    bgLight: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-700",
    badgeColor: "bg-orange-500",
    tagline: "유니크 아이템 & 시즌 특산",
    description: "트레이더 조 숨겨진 인기 아이템과 신상품",
    website: "https://www.traderjoes.com",
    items: [
      {
        id: 1,
        name: "Mandarin Orange Chicken",
        nameKo: "만다린 오렌지 치킨",
        price: "$6.99",
        category: "냉동식품",
        hot: true,
        note: "TJ's 레전드 아이템. 에어프라이어로 10분 완성",
        youtube: "https://youtube.com/channel/UCzikZfE3N5Lx3t9xWlh8wUg",
      },
      {
        id: 2,
        name: "Everything But The Bagel Seasoning",
        nameKo: "에브리씽 베이글 시즈닝",
        price: "$2.99",
        category: "양념",
        hot: true,
        note: "계란, 아보카도토스트, 샐러드에 올리면 레벨업",
        youtube: null,
      },
      {
        id: 3,
        name: "Speculoos Cookie Butter",
        nameKo: "스페큘로스 쿠키 버터",
        price: "$3.99",
        category: "스프레드",
        hot: false,
        note: "아이들 간식으로 최고. 빵에 바르거나 아이스크림 토핑",
        youtube: null,
      },
      {
        id: 4,
        name: "Korean Style Beef Bulgogi",
        nameKo: "트레이더 조 불고기",
        price: "$5.99",
        category: "한식",
        hot: false,
        note: "밥 지을 시간 없을 때 구세주",
        youtube: null,
      },
    ],
  },
  {
    id: "centralmarket" as StoreId,
    name: "Central Market",
    nameKo: "센트럴 마켓",
    emoji: "🌟",
    color: "from-green-600 to-emerald-700",
    bgLight: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
    badgeColor: "bg-green-600",
    tagline: "프리미엄 & 특별 식재료",
    description: "센트럴 마켓 프리미엄 신상품과 시즌 컬렉션",
    website: "https://www.centralmarket.com",
    items: [
      {
        id: 1,
        name: "Imported Burrata Cheese",
        nameKo: "이탈리아 부라타 치즈",
        price: "$8.99",
        category: "유제품",
        hot: true,
        note: "생토마토 + 올리브오일 + 바질 = 완벽한 카프레제",
        youtube: null,
      },
      {
        id: 2,
        name: "Wild-Caught Salmon (fresh)",
        nameKo: "자연산 연어 (신선)",
        price: "lb당 $14.99",
        category: "해산물",
        hot: false,
        note: "회질로 먹어도 ok. 월-금 아침 입고",
        youtube: null,
      },
      {
        id: 3,
        name: "Organic Acai Berry Puree",
        nameKo: "유기농 아사이베리 퓨레",
        price: "$6.99",
        category: "건강식품",
        hot: true,
        note: "아사이볼 만들기 완벽한 재료. 냉동 코너",
        youtube: null,
      },
      {
        id: 4,
        name: "Artisan Sourdough Bread",
        nameKo: "아티산 사워도우 빵 (당일 베이킹)",
        price: "$7.49",
        category: "베이커리",
        hot: false,
        note: "당일 구운 것만 판매. 오후 3시 이후 방문 추천",
        youtube: null,
      },
    ],
  },
  {
    id: "heb" as StoreId,
    name: "H-E-B",
    nameKo: "HEB",
    emoji: "🤠",
    color: "from-red-700 to-red-800",
    bgLight: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    badgeColor: "bg-red-700",
    tagline: "텍사스 로컬 & 신상 발견",
    description: "HEB 텍사스 전용 신상품과 이번 주 핫딜",
    website: "https://www.heb.com",
    items: [
      {
        id: 1,
        name: "HEB Mi Tienda Tamales",
        nameKo: "HEB 미 티엔다 타말레스",
        price: "$6.99",
        category: "텍멕",
        hot: true,
        note: "HEB에서만 파는 텍사스 정통 타말레스",
        youtube: null,
      },
      {
        id: 2,
        name: "Central Market Organics Salsa",
        nameKo: "CM 오가닉 살사 (HEB 전용)",
        price: "$3.99",
        category: "소스",
        hot: false,
        note: "한국 사람들도 반한 살사. 매운맛 추천",
        youtube: null,
      },
      {
        id: 3,
        name: "H-E-B Creamy Creations Ice Cream",
        nameKo: "HEB 크리미 크리에이션 아이스크림",
        price: "$4.99",
        category: "디저트",
        hot: true,
        note: "텍사스 한정! Peaches & Cream 맛이 최고",
        youtube: null,
      },
      {
        id: 4,
        name: "Texas Red Grapefruit (3-pack)",
        nameKo: "텍사스 레드 자몽 3팩",
        price: "$3.49",
        category: "과일",
        hot: false,
        note: "텍사스산 자몽 = 전국 최고 퀄리티. 시즌 중",
        youtube: null,
      },
    ],
  },
];

export default function Shopping() {
  const [activeStore, setActiveStore] = useState<StoreId>("costco");
  const [videos, setVideos] = useState<MartVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const store = STORES.find((s) => s.id === activeStore)!;

  useEffect(() => {
    setLoading(true);
    setVideos([]);
    fetch(`/api/mart-videos?store=${activeStore}&limit=6`)
      .then(r => r.json())
      .then(data => { setVideos(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeStore]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">마트 픽 🛒</h1>
          </div>
          <p className="text-slate-600 text-lg">
            DFW 한인들이 자주 가는 마트 신상 & 인기 아이템 정리
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              매주 업데이트
            </Badge>
            <Badge variant="outline" className="gap-1 text-red-600 border-red-200">
              <Youtube className="h-3 w-3" />
              Glass Cart 유튜브 연동
            </Badge>
          </div>
        </div>
      </div>

      {/* 마트 탭 */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {STORES.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStore(s.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                  activeStore === s.id
                    ? `bg-gradient-to-r ${s.color} text-white shadow-md`
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{s.emoji}</span>
                <span>{s.nameKo}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 마트 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        {/* 마트 소개 배너 */}
        <div className={`rounded-2xl bg-gradient-to-r ${store.color} text-white p-6 mb-8 flex items-center justify-between`}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-4xl">{store.emoji}</span>
              <h2 className="text-2xl font-bold">{store.nameKo}</h2>
            </div>
            <p className="text-white/90 text-lg">{store.tagline}</p>
            <p className="text-white/70 text-sm mt-1">{store.description}</p>
          </div>
          <a
            href={store.website}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 bg-white/20 hover:bg-white/30 transition px-4 py-2 rounded-full text-sm font-medium"
          >
            공식 사이트 <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* 최신 유튜브 영상 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-600" />
            <h3 className="text-xl font-bold">유리카트 최신 영상</h3>
            <Badge className="bg-red-600 text-xs">자동 업데이트</Badge>
          </div>
          <a href="https://youtube.com/channel/UCzikZfE3N5Lx3t9xWlh8wUg" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="gap-1 text-red-600">
              채널 보기 <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {loading ? (
            [1,2,3,4,5,6].map(i => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="w-full h-40 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : videos.length > 0 ? (
            videos.map((video) => (
              <a key={video.id} href={video.youtube_url} target="_blank" rel="noopener noreferrer">
                <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group h-full">
                  <CardContent className="p-0">
                    {/* 썸네일 */}
                    <div className="relative">
                      <div
                        className="w-full h-40 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{ backgroundImage: `url(${video.thumbnail_url})` }}
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                          <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-600 text-xs">유리카트</Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-slate-800 text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-2">
                        {video.title_clean || video.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(video.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))
          ) : (
            /* 유튜브 데이터 없을 때 (트레이더조/HEB/CM) — 준비 중 메시지 */
            <div className="col-span-3">
              <div className={`rounded-2xl ${store.bgLight} ${store.borderColor} border-2 p-8 text-center`}>
                <Youtube className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 mb-1">{store.nameKo} 콘텐츠 준비 중</p>
                <p className="text-sm text-slate-500">곧 {store.nameKo} 전문 유튜브 채널이 연동될 예정입니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* 채널 링크 배너 */}
        <div className={`rounded-2xl ${store.bgLight} ${store.borderColor} border-2 p-6`}>
          <div className="flex items-center gap-3 mb-3">
            <Youtube className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-bold">유리카트 채널</h3>
            <Badge variant="outline" className="text-xs text-green-600 border-green-300">✅ 연동 완료</Badge>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            코스트코 세일정보, 신상품, 가성비 픽 영상을 매주 업데이트하는 채널입니다.
            구독하면 DFW 코스트코 쇼핑이 더 스마트해져요!
          </p>
          <a
            href="https://youtube.com/channel/UCzikZfE3N5Lx3t9xWlh8wUg"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="gap-2 text-red-600 border-red-300 hover:bg-red-50">
              <Youtube className="h-4 w-4" />
              Glass Cart 채널 방문
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </div>

        {/* 다른 마트 빠른 이동 */}
        <div className="mt-10">
          <h3 className="text-lg font-bold mb-4 text-slate-700">다른 마트 보기</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STORES.filter((s) => s.id !== activeStore).map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveStore(s.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex items-center gap-2 p-4 bg-white rounded-xl border hover:shadow-md transition-all group"
              >
                <span className="text-2xl">{s.emoji}</span>
                <div className="text-left">
                  <div className="font-semibold text-sm text-slate-800 group-hover:text-primary">{s.nameKo}</div>
                  <div className="text-xs text-slate-500">{s.items.length}개 아이템</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 정보 제공 안내 */}
      <div className="container mx-auto px-4 pb-12">
        <p className="text-xs text-slate-400 text-center">
          ※ 가격 및 재고는 매장 상황에 따라 다를 수 있습니다. Glass Cart 유튜브 채널 콘텐츠 기반.
        </p>
      </div>
    </div>
  );
}
