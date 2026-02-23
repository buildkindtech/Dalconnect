import { Link, useLocation } from "wouter";
import { Search, Menu, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary text-white p-1.5 rounded-md">
              <Globe className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl">DalConnect</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/businesses" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/businesses' ? 'text-primary' : 'text-muted-foreground'}`}>
              업체
            </Link>
            <Link href="/marketplace" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith('/marketplace') ? 'text-primary' : 'text-muted-foreground'}`}>
              사고팔기
            </Link>
            <Link href="/news" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/news' ? 'text-primary' : 'text-muted-foreground'}`}>
              뉴스
            </Link>
            <Link href="/blog" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/blog' || location.startsWith('/blog/') ? 'text-primary' : 'text-muted-foreground'}`}>
              블로그
            </Link>
            <Link href="/about" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/about' ? 'text-primary' : 'text-muted-foreground'}`}>
              소개
            </Link>
            <Link href="/contact" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/contact' ? 'text-primary' : 'text-muted-foreground'}`}>
              문의
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/pricing">
            <Button className="hidden md:flex bg-primary hover:bg-primary/90 rounded-full">
              업체 등록
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto flex flex-col gap-4 p-4">
            <Link 
              href="/businesses" 
              className={`text-base font-medium transition-colors hover:text-primary ${location === '/businesses' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              업체
            </Link>
            <Link 
              href="/marketplace" 
              className={`text-base font-medium transition-colors hover:text-primary ${location.startsWith('/marketplace') ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              사고팔기
            </Link>
            <Link 
              href="/news" 
              className={`text-base font-medium transition-colors hover:text-primary ${location === '/news' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              뉴스
            </Link>
            <Link 
              href="/blog" 
              className={`text-base font-medium transition-colors hover:text-primary ${location === '/blog' || location.startsWith('/blog/') ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              블로그
            </Link>
            <Link 
              href="/about" 
              className={`text-base font-medium transition-colors hover:text-primary ${location === '/about' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              소개
            </Link>
            <Link 
              href="/contact" 
              className={`text-base font-medium transition-colors hover:text-primary ${location === '/contact' ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              문의
            </Link>
            <Link href="/pricing">
              <Button className="w-full bg-primary hover:bg-primary/90 rounded-full mt-2">
                업체 등록
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
