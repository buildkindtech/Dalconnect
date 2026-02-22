import { Link, useLocation } from "wouter";
import { Search, Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Header() {
  const [location, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/">
            <a className="flex items-center space-x-2" data-testid="link-home">
              <div className="bg-primary text-white p-1.5 rounded-md">
                <Globe className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl font-ko inline-block">DFW Hanin</span>
            </a>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/listings">
              <a className={`text-sm font-medium transition-colors hover:text-primary ${location === '/listings' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="link-nav-listings">업소록</a>
            </Link>
            <Link href="/news">
              <a className={`text-sm font-medium transition-colors hover:text-primary ${location === '/news' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="link-nav-news">뉴스</a>
            </Link>
            <Link href="/pricing">
              <a className={`text-sm font-medium transition-colors hover:text-primary ${location === '/pricing' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="link-nav-pricing">업체 등록</a>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64 items-center">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="업체 검색..."
              className="w-full bg-muted/50 pl-8 rounded-full"
              data-testid="input-global-search"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="font-ko font-medium">English</Button>
            <Button className="hidden md:flex bg-primary hover:bg-primary/90 rounded-full" data-testid="button-login">
              로그인
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}