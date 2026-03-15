import { Link } from "wouter";
import { Users, Shield, Heart, Sparkles, MapPin, Newspaper, BookOpen, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-700 via-primary to-teal-600 text-white py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-block bg-white/10 border border-white/20 px-5 py-2 rounded-full text-sm font-semibold tracking-widest mb-8 uppercase">
            DFW Korean Community
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-ko leading-tight">
            달라스·포트워스 한인 커뮤니티의<br />
            <span className="text-teal-200">모든 정보를 한곳에</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 leading-relaxed">
            DalKonnect는 DFW 한인 커뮤니티를 위한 생활 정보 허브입니다.<br />
            업소 정보부터 뉴스, 생활 가이드까지 — 한글로, 한곳에서.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-bold tracking-widest text-primary uppercase mb-4">Our Story</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-10 font-ko">왜 DalKonnect를 만들었나요?</h2>
            <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
              <p>
                달라스에 처음 정착하는 한인들이 가장 먼저 겪는 어려움은 언어가 아닙니다.
                <strong className="text-slate-800"> 정보의 부재</strong>입니다.
              </p>
              <p>
                아이 학교 정보를 찾는 학부모, 믿을 수 있는 한인 의사를 찾는 어르신,
                첫 사업을 시작하려는 청년 — 모두가 제각각 찾아 헤매야 했습니다.
              </p>
              <p className="text-xl font-semibold text-slate-800 border-l-4 border-primary pl-6 text-left">
                "DFW 한인이 필요한 정보를, 한글로, 한곳에서 찾을 수 있어야 한다."
              </p>
              <p>
                그 하나의 생각이 DalKonnect의 출발점이었습니다.
                지금 이 순간에도 더 많은 정보, 더 나은 서비스를 만들어가고 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-bold tracking-widest text-primary uppercase mb-4">Our Values</p>
            <h2 className="text-3xl md:text-4xl font-bold font-ko">DalKonnect가 지키는 원칙</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-content-center mb-5 flex items-center justify-center">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-ko">커뮤니티 우선</h3>
              <p className="text-slate-600 leading-relaxed">
                1,100개가 넘는 한인 업체가 등록되어 있습니다.
                각 업체 하나하나가 이 도시에서 꿈을 이어가는 우리 이웃임을 잊지 않습니다.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                <Shield className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-ko">검증된 정보만</h3>
              <p className="text-slate-600 leading-relaxed">
                실제 운영 중인 업체, 신뢰할 수 있는 뉴스 소스, 검증된 생활 정보만을 제공합니다.
                정확하지 않은 정보는 싣지 않습니다.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-5">
                <Heart className="h-7 w-7 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-ko">한글 접근성</h3>
              <p className="text-slate-600 leading-relaxed">
                언어의 장벽으로 놓쳤던 정보들을 이제 한글로 편하게 찾을 수 있습니다.
                뉴스, 업체 정보, 생활 가이드 — 전부 한국어로 제공합니다.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
                <Sparkles className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-ko">지속적인 개선</h3>
              <p className="text-slate-600 leading-relaxed">
                뉴스와 정보는 매일 업데이트됩니다.
                완성형 서비스가 아닌, 커뮤니티와 함께 성장하는 플랫폼을 지향합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-bold tracking-widest text-primary uppercase mb-4">By the Numbers</p>
            <h2 className="text-3xl md:text-4xl font-bold font-ko">DalKonnect 현황</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <MapPin className="h-8 w-8 text-primary mx-auto mb-4" />
              <p className="text-4xl font-bold text-primary mb-2">1,170+</p>
              <p className="text-sm text-slate-500 font-medium">등록 한인 업체</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <Newspaper className="h-8 w-8 text-primary mx-auto mb-4" />
              <p className="text-4xl font-bold text-primary mb-2">1,600+</p>
              <p className="text-sm text-slate-500 font-medium">한글 뉴스 기사</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <BookOpen className="h-8 w-8 text-primary mx-auto mb-4" />
              <p className="text-4xl font-bold text-primary mb-2">59+</p>
              <p className="text-sm text-slate-500 font-medium">생활 가이드</p>
            </div>
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border hover:shadow-md transition-shadow">
              <Globe className="h-8 w-8 text-primary mx-auto mb-4" />
              <p className="text-4xl font-bold text-primary mb-2">매일</p>
              <p className="text-sm text-slate-500 font-medium">정보 업데이트</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl text-primary/20 font-serif leading-none mb-4">"</div>
            <p className="text-2xl md:text-3xl font-medium text-slate-700 leading-relaxed font-ko">
              처음 달라스에 왔을 때 이런 플랫폼이 있었다면,
              그 시간들이 훨씬 덜 외로웠을 것입니다.
            </p>
            <p className="mt-6 text-slate-400 text-sm tracking-wide">
              — DalKonnect 창립 배경
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-700 via-primary to-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-bold tracking-widest uppercase mb-6 opacity-80">Join Us</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-ko">
            DFW 한인 커뮤니티의 일원이 되세요
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto opacity-90 leading-relaxed">
            업체를 운영하고 계신가요?<br />
            달커넥트에 무료로 등록하고 더 많은 한인 이웃들에게 알려보세요.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/businesses">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold">
                업체 찾아보기
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold bg-transparent text-white border-white hover:bg-white/10">
                무료 업체 등록
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
