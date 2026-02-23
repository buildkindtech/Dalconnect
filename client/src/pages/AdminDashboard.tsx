import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Building2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalBusinesses: 0,
    premiumBusinesses: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    // TODO: Fetch from API
    setStats({
      totalRevenue: 8450,
      monthlyRevenue: 1275,
      totalBusinesses: 47,
      premiumBusinesses: 12,
      pendingApprovals: 3,
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-ko mb-2">관리자 대시보드</h1>
          <p className="text-muted-foreground">DalConnect 플랫폼 관리</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                이번 달 수익
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.monthlyRevenue}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">+23.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 수익
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground mt-1">
                전체 누적 수익
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                등록 비즈니스
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalBusinesses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.premiumBusinesses}개 프리미엄
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                승인 대기
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground mt-1">
                검토 필요
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>승인 대기 중인 비즈니스</CardTitle>
            <CardDescription>새로운 비즈니스 등록을 검토하고 승인하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock data */}
              {[
                { id: 1, name: "Seoul BBQ House", category: "한식당", tier: "premium" },
                { id: 2, name: "Elegant Hair Salon", category: "미용실", tier: "elite" },
                { id: 3, name: "K-Market Dallas", category: "한인마트", tier: "free" },
              ].map((business) => (
                <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{business.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{business.category}</span>
                      <Badge variant={business.tier === "free" ? "secondary" : "default"}>
                        {business.tier}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      승인
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" />
                      거부
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>최근 구독</CardTitle>
            <CardDescription>최근 프리미엄/엘리트 멤버십 가입 내역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Golden Tiger Restaurant", tier: "premium", date: "2시간 전", amount: "$49" },
                { name: "Dallas Korean Church", tier: "elite", date: "5시간 전", amount: "$99" },
                { name: "Best Hair Studio", tier: "premium", date: "1일 전", amount: "$49" },
              ].map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{sub.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{sub.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={sub.tier === "elite" ? "default" : "secondary"}>
                      {sub.tier}
                    </Badge>
                    <p className="text-sm font-semibold mt-1">{sub.amount}/월</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
