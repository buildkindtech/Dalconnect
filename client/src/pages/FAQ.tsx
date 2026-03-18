import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const faqs: FAQItem[] = [
  // 일반
  {
    category: '일반',
    q: 'DalKonnect는 어떤 사이트인가요?',
    a: 'DalKonnect는 달라스-포트워스(DFW) 한인 커뮤니티를 위한 정보 플랫폼입니다. 한인 업체 정보, 지역 뉴스, 중고 거래, 룸메이트 구하기, 커뮤니티 게시판 등 DFW 한인 생활에 필요한 모든 것을 한곳에서 제공합니다.',
  },
  {
    category: '일반',
    q: '가입 없이 이용할 수 있나요?',
    a: '네, 대부분의 기능은 회원가입 없이 이용 가능합니다. 뉴스 읽기, 업체 검색, 커뮤니티 글 보기는 누구나 자유롭게 이용하실 수 있습니다. 글 작성 시에는 닉네임과 비밀번호만 입력하면 됩니다.',
  },
  {
    category: '일반',
    q: '이용 요금이 있나요?',
    a: '일반 사용자에게는 무료입니다. 업체를 등록하고 홍보하려는 비즈니스 오너분들에게는 유료 플랜이 있습니다. 자세한 내용은 가격 안내 페이지를 확인해주세요.',
  },

  // 업체 등록
  {
    category: '업체 등록',
    q: '한인 업체는 어떻게 등록하나요?',
    a: '상단 메뉴의 "업체 등록" 버튼을 클릭하시거나 /register-business 페이지에서 신청하실 수 있습니다. 업체명, 카테고리, 주소, 연락처, 영업시간 등을 입력하면 검토 후 등록됩니다.',
  },
  {
    category: '업체 등록',
    q: '업체 정보를 수정하고 싶어요.',
    a: '업체 정보 수정은 info@dalkonnect.com으로 업체명과 수정 내용을 보내주시면 처리해드립니다. 추후 업체 오너 직접 수정 기능을 제공할 예정입니다.',
  },
  {
    category: '업체 등록',
    q: '광고나 프리미엄 등록은 어떻게 하나요?',
    a: '메인 페이지 배너, 사이드 광고, 카테고리 상단 노출 등 다양한 광고 옵션이 있습니다. 자세한 문의는 info@dalkonnect.com 또는 문의하기 페이지를 통해 연락해 주세요.',
  },

  // 사고팔기
  {
    category: '사고팔기',
    q: '중고 물건은 어떻게 올리나요?',
    a: '"사고팔기" 메뉴에서 "글 올리기" 버튼을 클릭하세요. 제목, 가격, 카테고리, 설명, 사진(최대 5장), 연락처를 입력하면 됩니다. 닉네임과 비밀번호를 설정하면 나중에 수정/삭제도 가능합니다.',
  },
  {
    category: '사고팔기',
    q: '거래 안전은 어떻게 보장되나요?',
    a: 'DalKonnect는 중개 플랫폼으로, 실제 거래는 당사자 간에 이루어집니다. 직거래 시 공공장소(마트, 경찰서 앞 등)에서 만나시길 권장하며, 선입금 요구 등 의심스러운 거래는 피해주세요. 사기 의심 게시물은 신고 기능을 이용해주세요.',
  },
  {
    category: '사고팔기',
    q: '올린 글을 수정하거나 삭제할 수 있나요?',
    a: '글 작성 시 설정한 비밀번호로 수정/삭제 가능합니다. 비밀번호를 분실한 경우 info@dalkonnect.com으로 문의해 주세요.',
  },

  // 룸메이트/렌트
  {
    category: '룸메이트/렌트',
    q: '룸메이트나 하숙 방은 어떻게 올리나요?',
    a: '"룸메이트" 메뉴에서 방 정보를 등록할 수 있습니다. 위치, 월세, 방 타입, 입주 가능일, 연락처 등을 입력하세요. 사진을 첨부하면 관심도가 높아집니다.',
  },
  {
    category: '룸메이트/렌트',
    q: '렌트비 외에 유틸리티 비용이 포함되나요?',
    a: '포함 여부는 게시자가 글에 직접 명시합니다. 글 본문을 확인하시거나 연락처로 직접 문의하세요. 일반적으로 DFW 지역 하숙은 유틸리티 포함, 아파트 룸메이트는 별도인 경우가 많습니다.',
  },

  // 커뮤니티
  {
    category: '커뮤니티',
    q: '커뮤니티에 글을 쓰려면 어떻게 하나요?',
    a: '"커뮤니티" 메뉴에서 "글쓰기" 버튼을 클릭하세요. 닉네임, 비밀번호, 제목, 내용을 입력하면 됩니다. 별도 회원가입은 필요 없습니다.',
  },
  {
    category: '커뮤니티',
    q: '부적절한 게시물은 어떻게 신고하나요?',
    a: '각 게시물 하단의 신고 버튼을 이용하거나 info@dalkonnect.com으로 해당 글 링크와 신고 이유를 보내주세요. 스팸, 사기, 욕설 등 불건전 콘텐츠는 검토 후 삭제됩니다.',
  },

  // 개인정보
  {
    category: '개인정보',
    q: '제 개인정보는 어떻게 보호되나요?',
    a: 'DalKonnect는 서비스 운영에 필요한 최소한의 정보만 수집합니다. 닉네임, 게시물 내용, IP 주소(해시 처리)만 저장하며, 제3자에게 판매하거나 광고 목적으로 공유하지 않습니다. 자세한 내용은 개인정보처리방침을 확인해주세요.',
  },
  {
    category: '개인정보',
    q: '제 게시물과 정보를 삭제하고 싶어요.',
    a: '글 삭제는 작성 시 입력한 비밀번호로 직접 가능합니다. 계정 정보 삭제나 데이터 삭제 요청은 info@dalkonnect.com으로 문의해주세요. 90일 이내 처리해드립니다.',
  },
];

const categories = ['전체', '일반', '업체 등록', '사고팔기', '룸메이트/렌트', '커뮤니티', '개인정보'];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [search, setSearch] = useState('');

  const filtered = faqs.filter(item => {
    const matchCat = activeCategory === '전체' || item.category === activeCategory;
    const matchSearch = search === '' ||
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <HelpCircle className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">자주 묻는 질문</h1>
          <p className="text-blue-100 mb-8">궁금한 점이 있으신가요? 아래에서 찾아보세요.</p>

          {/* 검색 */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="질문 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 bg-white text-gray-900 border-0 shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ 목록 */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-xl border transition-all ${
                    isOpen ? 'border-blue-200 shadow-md' : 'border-gray-100 shadow-sm hover:shadow'
                  }`}
                >
                  <button
                    className="w-full text-left px-5 py-4 flex items-start gap-3"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                  >
                    <span className="text-blue-600 font-bold text-sm mt-0.5 flex-shrink-0">Q</span>
                    <span className="flex-1 font-medium text-gray-800 text-sm leading-relaxed">
                      {item.q}
                    </span>
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    }
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 flex gap-3">
                      <span className="text-green-600 font-bold text-sm flex-shrink-0">A</span>
                      <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 문의 CTA */}
        <div className="mt-12 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
          <p className="text-gray-700 font-medium mb-1">원하는 답변을 찾지 못하셨나요?</p>
          <p className="text-gray-500 text-sm mb-4">직접 문의주시면 빠르게 답변해드립니다.</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            문의하기
          </a>
        </div>
      </div>
    </div>
  );
}
