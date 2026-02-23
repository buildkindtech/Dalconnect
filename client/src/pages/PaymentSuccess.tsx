import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function PaymentSuccess() {
  // Get session_id from URL params if needed
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center shadow-xl">
        <CardHeader className="pb-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold font-ko">결제 완료!</CardTitle>
          <CardDescription className="text-lg mt-2">
            프리미엄 멤버십 구독이 시작되었습니다.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">다음 단계:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>✓ 비즈니스 정보를 업데이트하세요</li>
              <li>✓ 사진을 추가하여 더 많은 고객을 유치하세요</li>
              <li>✓ 영업 시간과 웹사이트를 등록하세요</li>
              <li>✓ 리뷰에 답글을 달아 고객과 소통하세요</li>
            </ul>
          </div>

          {sessionId && (
            <p className="text-xs text-muted-foreground">
              주문 번호: {sessionId.substring(0, 20)}...
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                대시보드로 이동
              </Button>
            </Link>
            
            <Link href="/businesses">
              <Button variant="outline" className="w-full">
                비즈니스 목록 보기
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              궁금한 점이 있으신가요?{" "}
              <a href="mailto:support@dalconnect.com" className="text-primary hover:underline">
                support@dalconnect.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
