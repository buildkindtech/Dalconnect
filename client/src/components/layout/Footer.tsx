import { Link } from "wouter";
import { Globe, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-2 rounded-xl">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-2xl text-white font-ko">DalConnect</h3>
            </div>
            <p className="text-sm text-slate-400 max-w-xs mb-6 leading-relaxed font-ko">
              달라스-포트워스 한인 커뮤니티를 연결하는 플랫폼
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Dallas-Fort Worth, TX</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <a href="mailto:info@buildkind.tech" className="hover:text-primary transition-colors">
                  info@buildkind.tech
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+14696132763" className="hover:text-primary transition-colors">
                  (469) 613-2763
                </a>
              </div>
            </div>
            
            {/* Social Media Links */}
            <div className="mt-6 flex gap-3">
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary flex items-center justify-center transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary flex items-center justify-center transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-primary flex items-center justify-center transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
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
        
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span>&copy; {new Date().getFullYear()} DalConnect. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span>Built with</span>
              <span className="text-red-500">❤️</span>
              <span>for the DFW Korean Community by</span>
              <a 
                href="https://buildkind.tech" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline ml-1"
              >
                BuildKind Tech
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
