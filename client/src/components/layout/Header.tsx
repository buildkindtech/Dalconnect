import { Link, useLocation } from "wouter";
import { Search, Menu, Globe, X, ChevronDown, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCityContext, City, CITIES } from "@/contexts/CityContext";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentCity, setCurrentCity, activeCities } = useCityContext();
  const [comingSoonCity, setComingSoonCity] = useState<City | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCityClick = (city: City) => {
    if (city.active) {
      setCurrentCity(city);
    } else {
      setComingSoonCity(city);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          name,
          city: comingSoonCity?.id 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "등록 완료!",
          description: `${comingSoonCity?.name} 오픈 시 알려드릴게요 🎉`,
        });
        setComingSoonCity(null);
        setEmail("");
        setName("");
      } else {
        toast({
          title: "오류",
          description: data.error || "등록에 실패했습니다",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "네트워크 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary text-white p-1.5 rounded-md">
                <Globe className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl">DalKonnect</span>
            </Link>
            
            {/* City label - single city for now */}
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="hidden md:inline">{currentCity.name}</span>
            </span>
            
            <nav className="hidden xl:flex gap-6">
              <Link href="/businesses" className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location === '/businesses' ? 'text-primary' : 'text-muted-foreground'}`}>
                업체
              </Link>
              <Link href="/deals" className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location === '/deals' ? 'text-primary' : 'text-muted-foreground'}`}>
                딜 🔥
              </Link>
              <Link href="/marketplace" className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location.startsWith('/marketplace') ? 'text-primary' : 'text-muted-foreground'}`}>
                사고팔기
              </Link>
              <Link href="/community" className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location.startsWith('/community') ? 'text-primary' : 'text-muted-foreground'}`}>
                커뮤니티
              </Link>
              <Link href="/charts" className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location === '/charts' ? 'text-primary' : 'text-muted-foreground'}`}>
                차트 🏆
              </Link>
              <Link href="/news" className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location === '/news' ? 'text-primary' : 'text-muted-foreground'}`}>
                뉴스
              </Link>
              <Link href="/blog" className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location === '/blog' || location.startsWith('/blog/') ? 'text-primary' : 'text-muted-foreground'}`}>
                블로그
              </Link>
              <Link href="/about" className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location === '/about' ? 'text-primary' : 'text-muted-foreground'}`}>
                소개
              </Link>
              <Link href="/contact" className={`text-sm font-medium whitespace-nowrap transition-colors hover:text-primary ${location === '/contact' ? 'text-primary' : 'text-muted-foreground'}`}>
                문의
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/register-business">
              <Button className="hidden xl:flex bg-primary hover:bg-primary/90 rounded-full">
                업체 등록
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="xl:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t bg-background">
            <nav className="container mx-auto flex flex-col gap-4 p-4">
              <Link 
                href="/businesses" 
                className={`text-base font-medium transition-colors hover:text-primary ${location === '/businesses' ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                업체
              </Link>
              <Link 
                href="/deals" 
                className={`text-base font-medium transition-colors hover:text-primary ${location === '/deals' ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                딜 🔥
              </Link>
              <Link 
                href="/marketplace" 
                className={`text-base font-medium transition-colors hover:text-primary ${location.startsWith('/marketplace') ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                사고팔기
              </Link>
              <Link 
                href="/community" 
                className={`text-base font-medium transition-colors hover:text-primary ${location.startsWith('/community') ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                커뮤니티
              </Link>
              <Link 
                href="/charts" 
                className={`text-base font-medium transition-colors hover:text-primary ${location === '/charts' ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                차트 🏆
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
              <Link href="/register-business">
                <Button className="w-full bg-primary hover:bg-primary/90 rounded-full mt-2" onClick={() => setMobileMenuOpen(false)}>
                  업체 등록
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Coming Soon Modal */}
      <Dialog open={!!comingSoonCity} onOpenChange={() => setComingSoonCity(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              🚀 {comingSoonCity?.name} 곧 오픈합니다!
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {comingSoonCity?.name} 지역 서비스가 곧 시작됩니다.
              이메일을 등록하시면 오픈 시 바로 알려드릴게요!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                이름 (선택)
              </label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일 <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setComingSoonCity(null)}
                className="w-full sm:w-auto"
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "등록 중..." : "알림 받기"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
