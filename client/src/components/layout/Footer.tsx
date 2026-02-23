import { Link } from "wouter";
import { Globe, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary text-white p-1.5 rounded-md">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-xl text-white">DalConnect</h3>
          </div>
          <p className="text-sm text-slate-400 max-w-xs">
            달라스-포트워스 지역 한인 커뮤니티를 위한 최고의 비즈니스 디렉토리
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Dallas-Fort Worth, TX</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href="mailto:info@dalconnect.com" className="hover:text-primary">
                info@dalconnect.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href="tel:+14696132763" className="hover:text-primary">
                (469) 613-2763
              </a>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">빠른 링크</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/">
                <a className="hover:text-primary transition-colors">홈</a>
              </Link>
            </li>
            <li>
              <Link href="/businesses">
                <a className="hover:text-primary transition-colors">업체 찾기</a>
              </Link>
            </li>
            <li>
              <Link href="/news">
                <a className="hover:text-primary transition-colors">커뮤니티 뉴스</a>
              </Link>
            </li>
            <li>
              <Link href="/about">
                <a className="hover:text-primary transition-colors">소개</a>
              </Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">비즈니스</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/pricing">
                <a className="hover:text-primary transition-colors">업체 등록</a>
              </Link>
            </li>
            <li>
              <Link href="/pricing">
                <a className="hover:text-primary transition-colors">가격 플랜</a>
              </Link>
            </li>
            <li>
              <Link href="/contact">
                <a className="hover:text-primary transition-colors">광고 문의</a>
              </Link>
            </li>
            <li>
              <Link href="/contact">
                <a className="hover:text-primary transition-colors">파트너십</a>
              </Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">지원</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/contact">
                <a className="hover:text-primary transition-colors">문의하기</a>
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">FAQ</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">이용약관</a>
            </li>
            <li>
              <a href="#" className="hover:text-primary transition-colors">개인정보처리방침</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 text-center">
        <p>&copy; {new Date().getFullYear()} DalConnect. All rights reserved.</p>
        <p className="mt-2">Built with ❤️ for the DFW Korean Community</p>
      </div>
    </footer>
  );
}
