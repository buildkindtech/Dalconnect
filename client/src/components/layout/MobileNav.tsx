import { Link, useLocation } from 'wouter';
import { Home, Building2, Flame, MessageCircle, Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  { path: '/', icon: Home, label: '홈' },
  { path: '/businesses', icon: Building2, label: '업체' },
  { path: '/deals', icon: Flame, label: '딜' },
  { path: '/community', icon: MessageCircle, label: '커뮤니티' },
];

export default function MobileNav() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                    active
                      ? 'text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                  <span className={`text-xs mt-1 ${active ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
          
          {/* More Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center w-full h-full text-gray-600 hover:text-gray-900">
                <Menu className="w-5 h-5" />
                <span className="text-xs mt-1">더보기</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetHeader>
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-2">
                <Link href="/news">
                  <Button variant="ghost" className="w-full justify-start text-base" onClick={() => setIsMenuOpen(false)}>
                    📰 뉴스
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="ghost" className="w-full justify-start text-base" onClick={() => setIsMenuOpen(false)}>
                    🛍️ 사고팔기
                  </Button>
                </Link>
                <Link href="/charts">
                  <Button variant="ghost" className="w-full justify-start text-base" onClick={() => setIsMenuOpen(false)}>
                    🏆 차트
                  </Button>
                </Link>
                <Link href="/roommate">
                  <Button variant="ghost" className="w-full justify-start text-base" onClick={() => setIsMenuOpen(false)}>
                    🏠 룸메이트
                  </Button>
                </Link>
                <Link href="/blog">
                  <Button variant="ghost" className="w-full justify-start text-base" onClick={() => setIsMenuOpen(false)}>
                    📝 블로그
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="ghost" className="w-full justify-start text-base" onClick={() => setIsMenuOpen(false)}>
                    소개
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="ghost" className="w-full justify-start text-base" onClick={() => setIsMenuOpen(false)}>
                    문의
                  </Button>
                </Link>
                <Link href="/register-business">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-base mt-4" onClick={() => setIsMenuOpen(false)}>
                    업체 등록
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      {/* Bottom padding for content */}
      <div className="md:hidden h-16" />
    </>
  );
}
