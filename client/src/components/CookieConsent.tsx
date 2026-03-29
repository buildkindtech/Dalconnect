import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "dk_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      // 0.5초 딜레이 후 표시
      const t = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-700 shadow-2xl">
      {/* Mobile: slim single line */}
      <div className="md:hidden px-4 py-2 flex items-center gap-2">
        <p className="text-xs text-slate-300 flex-1 truncate">
          🍪 쿠키 사용 동의{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-2">
            더보기
          </Link>
        </p>
        <Button size="sm" variant="ghost" onClick={decline} className="text-slate-400 hover:text-slate-200 text-xs h-7 px-2 shrink-0">
          거부
        </Button>
        <Button size="sm" onClick={accept} className="bg-primary text-white hover:bg-primary/90 text-xs h-7 px-3 shrink-0">
          동의
        </Button>
        <button onClick={decline} className="text-slate-500 hover:text-slate-300 shrink-0" aria-label="닫기">
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Desktop: full layout */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 pr-4">
              <p className="text-sm text-slate-300 font-ko leading-relaxed">
                🍪 DalKonnect는 서비스 개선을 위해 쿠키 및 로컬스토리지를 사용합니다.
                광고·추적 목적의 쿠키는 사용하지 않습니다.{" "}
                <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">
                  개인정보처리방침
                </Link>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                We use cookies only for service functionality (likes, preferences). No advertising or tracking cookies.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={decline} className="text-slate-400 hover:text-slate-200 text-xs">
                거부
              </Button>
              <Button size="sm" onClick={accept} className="bg-primary text-white hover:bg-primary/90 text-xs px-4">
                동의
              </Button>
              <button onClick={decline} className="text-slate-500 hover:text-slate-300 ml-1" aria-label="닫기">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
