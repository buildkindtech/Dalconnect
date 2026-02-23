import { Link } from "wouter";
import { Users, Target, Heart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-primary/80 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">DalConnect 소개</h1>
          <p className="text-xl max-w-3xl mx-auto opacity-90">
            달라스-포트워스 한인 커뮤니티를 연결하는 최고의 플랫폼
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">우리의 미션</h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                DalConnect는 DFW 지역의 한인 업체와 커뮤니티를 하나로 연결합니다.
                믿을 수 있는 한인 비즈니스 정보와 최신 뉴스를 제공하여,
                한인들이 더 쉽게 필요한 서비스를 찾고 소통할 수 있도록 돕습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">커뮤니티</h3>
                  <p className="text-slate-600">
                    365개 이상의 한인 업체와 수천 명의 한인들을 연결합니다
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">정확성</h3>
                  <p className="text-slate-600">
                    실시간으로 업데이트되는 정확하고 신뢰할 수 있는 정보
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">신뢰</h3>
                  <p className="text-slate-600">
                    검증된 업체와 실제 고객 리뷰로 신뢰를 구축합니다
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">성장</h3>
                  <p className="text-slate-600">
                    한인 비즈니스의 성장을 돕고 커뮤니티를 확장합니다
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">DalConnect의 성장</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary mb-2">365+</p>
              <p className="text-xl text-slate-600">등록된 한인 업체</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-primary mb-2">10+</p>
              <p className="text-xl text-slate-600">카테고리</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-primary mb-2">24/7</p>
              <p className="text-xl text-slate-600">실시간 업데이트</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">함께 성장하세요</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            DalConnect와 함께 DFW 한인 커뮤니티를 더욱 강하게 만들어갑니다
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/businesses">
              <Button size="lg" variant="secondary">
                업체 찾아보기
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                업체 등록하기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
