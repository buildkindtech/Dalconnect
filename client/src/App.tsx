import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { CityProvider } from "./contexts/CityContext";

// 페이지 이동 시 맨 위로 + GA4 페이지뷰 트래킹
// 단, 뒤로가기(popstate)는 스크롤 복원 허용
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // 뒤로가기인지 확인 — sessionStorage에 저장된 스크롤 위치가 있으면 복원
    const savedKey = `scroll:${location}`;
    const savedY = sessionStorage.getItem(savedKey);
    if (savedY !== null) {
      // 약간 지연 후 복원 (DOM 렌더링 완료 후)
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedY), behavior: 'instant' });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    // GA4 SPA 페이지뷰 전송
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-KSNNMJTP4C', { page_path: location });
    }
  }, [location]);

  // 페이지 떠나기 전 스크롤 위치 저장
  useEffect(() => {
    const saveScroll = () => {
      sessionStorage.setItem(`scroll:${location}`, String(window.scrollY));
    };
    window.addEventListener('beforeunload', saveScroll);
    return () => {
      saveScroll(); // 라우트 변경 시 저장
      window.removeEventListener('beforeunload', saveScroll);
    };
  }, [location]);

  return null;
}

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import MobileNav from "./components/layout/MobileNav";

// Pages
import Home from "./pages/Home";
import Businesses from "./pages/Businesses";
import BusinessDetail from "./pages/BusinessDetail";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Marketplace from "./pages/Marketplace";
import MarketplaceDetail from "./pages/MarketplaceDetail";
import MarketplaceNew from "./pages/MarketplaceNew";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import SetupRequired from "./pages/SetupRequired";
import RegisterBusiness from "./pages/RegisterBusiness";
import Community from "./pages/Community";
import CommunityPost from "./pages/CommunityPost";
import CommunityNew from "./pages/CommunityNew";
import Charts from "./pages/Charts";
import Deals from "./pages/Deals";
import Shopping from "./pages/Shopping";

// 양쪽 광고 한 줄 배너 (히어로 아래 콘텐츠 구간에 표시)
function SideAdStrip({ biz, side }: { biz: any; side: 'left' | 'right' }) {
  if (!biz) return <div className="hidden xl:block w-[150px] flex-shrink-0" />;
  const name = biz.name_ko || biz.name_en || '';
  return (
    <a
      href={`/business/${biz.id}`}
      className="hidden xl:block w-[150px] flex-shrink-0 self-start mt-[620px] group"
    >
      <div className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100">
        {biz.cover_url ? (
          <div
            className="relative h-[200px]"
            style={{ backgroundImage: `url(${biz.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute top-2 left-2">
              <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-bold">광고</span>
            </div>
            <div className="absolute bottom-0 p-2.5">
              <p className="text-white text-xs font-bold leading-tight line-clamp-2">{name}</p>
              <p className="text-white/70 text-[10px] mt-0.5">⭐ {Number(biz.rating || 0).toFixed(1)} · {biz.category}</p>
            </div>
          </div>
        ) : (
          <div className="h-[200px] bg-gradient-to-br from-blue-600 to-indigo-700 flex flex-col items-center justify-center p-3 gap-2">
            <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-bold">광고</span>
            <p className="text-white text-xs font-bold text-center leading-tight">{name}</p>
            <p className="text-white/70 text-[10px]">⭐ {Number(biz.rating || 0).toFixed(1)}</p>
          </div>
        )}
      </div>
    </a>
  );
}

function Router() {
  const [currentPath] = useLocation();
  const [adBusinesses, setAdBusinesses] = useState<any[]>([]);
  const [location] = useLocation();

  useEffect(() => {
    fetch('/api/featured')
      .then(r => r.json())
      .then(d => setAdBusinesses(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const leftAd = adBusinesses.find((b: any) => b.cover_url);
  const rightAd = adBusinesses.filter((b: any) => b.cover_url)[1] || adBusinesses[1];

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <div className="flex gap-4 max-w-[1440px] mx-auto">
          <SideAdStrip biz={leftAd} side="left" />
          <div className="flex-1 min-w-0">
        <ErrorBoundary resetKey={currentPath}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/businesses" component={Businesses} />
          <Route path="/business/:id" component={BusinessDetail} />
          <Route path="/register-business" component={RegisterBusiness} />
          <Route path="/news" component={News} />
          <Route path="/news/:id" component={NewsDetail} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogDetail} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/marketplace/new" component={MarketplaceNew} />
          <Route path="/marketplace/:id" component={MarketplaceDetail} />
          <Route path="/community" component={Community} />
          <Route path="/community/new" component={CommunityNew} />
          <Route path="/community/:id" component={CommunityPost} />
          <Route path="/deals" component={Deals} />
          <Route path="/charts" component={Charts} />
          <Route path="/shopping" component={Shopping} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/admin" component={AdminDashboard} />
          <Route component={NotFound} />
        </Switch>
        </ErrorBoundary>
          </div>
          <SideAdStrip biz={rightAd} side="right" />
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CityProvider>
          <Toaster />
          <Router />
        </CityProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
