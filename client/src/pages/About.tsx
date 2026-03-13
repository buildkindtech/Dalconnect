import { Link } from "wouter";
import { Users, Shield, Heart, Sparkles, MapPin, Newspaper, BookOpen, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-700 via-primary to-teal-600 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-5 font-ko">
            낯선 땅에서 찾은 우리 동네
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 leading-relaxed">
            처음 달라스에 왔을 때의 막막함을 기억합니다.<br />
            한글로 된 정보 하나 찾기 어려웠던 그 시간들.<br />
            DalKonnect는 그 경험에서 시작되었습니다.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 font-ko">우리가 만드는 이유</h2>
            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
              <p>
                한국에서 미국으로. 익숙한 모든 것을 두고 온 사람들이
                <br className="hidden md:block" />
                이 도시에서 다시 삶을 세워가고 있습니다.
              </p>
              <p>
                아이 학교를 알아봐야 하는 엄마,
                <br className="hidden md:block" />
                처음 사업을 시작하는 청년,
                <br className="hidden md:block" />
                병원 하나 찾기 막막한 어르신까지 —
              </p>
              <p className="text-xl text-slate-800 font-medium">
                <em>"필요한 정보를, 한글로, 한곳에서."</em>
              </p>
              <p>
                그게 DalKonnect가 매일 하는 일입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 font-ko">우리의 약속</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-ko">이웃의 마음으로</h3>
              <p className="text-slate-600 leading-relaxed">
                1,100개가 넘는 한인 업체가 등록되어 있지만,
                우리에게 이건 숫자가 아닙니다. 
                각자의 꿈을 안고 이 도시에서 버티고 있는 이웃들입니다.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <Shield className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-ko">가짜 없는 진짜 정보</h3>
              <p className="text-slate-600 leading-relaxed">
                AI가 만들어낸 허구가 아닌, 실제 운영 중인 업체,
                실제 뉴스, 실제 가격만 다룹니다.
                당신의 시간이 소중하니까요.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-5">
                <Heart className="h-7 w-7 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-ko">한글이 편한 사람들을 위해</h3>
              <p className="text-slate-600 leading-relaxed">
                영어가 불편해서 포기했던 정보들,
                이제 한글로 다 찾을 수 있습니다.
                뉴스도, 업체도, 블로그도 — 전부 우리말로.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
                <Sparkles className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-ko">매일 더 나아지는 중</h3>
              <p className="text-slate-600 leading-relaxed">
                매일 새로운 뉴스가 올라오고,
                새로운 업체가 등록됩니다.
                완벽하지 않지만, 어제보다 오늘이 더 나은 서비스를 약속합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — real numbers */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-ko">지금까지의 여정</h2>
          <p className="text-center text-slate-500 mb-14">그리고 아직 시작에 불과합니다</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary mb-1">1,100+</p>
              <p className="text-sm text-slate-500">등록된 한인 업체</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border">
              <Newspaper className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary mb-1">500+</p>
              <p className="text-sm text-slate-500">한글 뉴스 기사</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary mb-1">80+</p>
              <p className="text-sm text-slate-500">생활 가이드 블로그</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border">
              <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary mb-1">24/7</p>
              <p className="text-sm text-slate-500">매일 자동 업데이트</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-2xl md:text-3xl font-medium text-slate-700 leading-relaxed font-ko italic">
              "내가 처음 왔을 때 이런 게 있었으면 좋았을 텐데."
            </p>
            <p className="mt-6 text-slate-400">
              — DalKonnect를 만들게 된 한 마디
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-700 via-primary to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-ko">
            당신도 이 커뮤니티의 일부입니다
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto opacity-90">
            업체를 운영하고 계신가요?<br />
            더 많은 한인 이웃들에게 알려보세요.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/businesses">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-medium">
                업체 찾아보기
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium bg-transparent text-white border-white hover:bg-white/10">
                무료 업체 등록
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
