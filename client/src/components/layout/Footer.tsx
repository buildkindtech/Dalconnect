export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-xl text-white mb-4 font-ko">DFW Hanin</h3>
          <p className="text-sm text-slate-400 max-w-xs">
            달라스-포트워스 지역 한인 비즈니스와 주민들을 위한 최고의 디렉토리 및 커뮤니티 포털입니다.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">빠른 링크</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">소개</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">업소록</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">커뮤니티 뉴스</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">이벤트 캘린더</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">비즈니스 센터</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">업체 등록</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">소유권 확인</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">광고 안내</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">가격 플랜</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">고객 지원</h4>
          <ul className="space-y-2 text-sm">
            <li>info@dfwhanin.com</li>
            <li>(214) 555-0199</li>
            <li>Carrollton, TX 75007</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 text-center">
        &copy; {new Date().getFullYear()} DFW Hanin. All rights reserved.
      </div>
    </footer>
  );
}