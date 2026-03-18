export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 font-ko">개인정보처리방침</h1>
        <p className="text-sm text-muted-foreground mb-8">Privacy Policy · 최종 수정일: 2026년 3월 17일</p>

        <div className="bg-white rounded-xl border p-8 space-y-8 text-sm leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">1. 수집하는 정보 / Information We Collect</h2>
            <p className="text-muted-foreground mb-2 font-ko">DalKonnect는 다음과 같은 정보를 수집합니다:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-ko">
              <li>게시물 작성 시 닉네임 (실명 아님)</li>
              <li>게시물/댓글 내용 및 첨부 사진</li>
              <li>연락처 (사고팔기 게시물에서 자발적으로 입력한 경우)</li>
              <li>IP 주소 (해시 처리하여 저장, 원본 비저장)</li>
              <li>사이트 이용 통계 (방문자 수, 조회수)</li>
              <li>쿠키/로컬스토리지 (좋아요 기록, 쿠키 동의 여부)</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">
              We collect: nicknames (not real names), post/comment content, photos, voluntarily provided contact info, hashed IP addresses, usage statistics, and cookies/local storage for likes and consent records.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">2. 정보 이용 목적 / How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-ko">
              <li>커뮤니티 서비스 운영 및 개선</li>
              <li>스팸·악성 게시물 차단 (IP 해시 기반)</li>
              <li>서비스 이용 통계 분석</li>
              <li>법적 의무 이행 (수사기관 요청 등)</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">
              We use your information to operate and improve our services, prevent spam and abuse, analyze usage statistics, and comply with legal obligations.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">3. 제3자 서비스 / Third-Party Services</h2>
            <p className="text-muted-foreground mb-2 font-ko">DalKonnect는 다음 제3자 서비스를 이용합니다:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-ko">
              <li><strong>Neon (PostgreSQL)</strong> — 게시물, 댓글, 업체 정보 저장</li>
              <li><strong>Firebase Storage (Google)</strong> — 업로드된 사진 저장</li>
              <li><strong>Google Maps API</strong> — 업체 위치 표시</li>
              <li><strong>Vercel</strong> — 웹사이트 호스팅</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">
              We use Neon (PostgreSQL) for data storage, Firebase Storage (Google) for uploaded images, Google Maps API for business location display, and Vercel for hosting. Each service has its own privacy policy.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">4. 데이터 보존 기간 / Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-ko">
              <li>게시물/댓글: 삭제 요청 시 즉시 삭제</li>
              <li>업로드 사진: 게시물 삭제 시 함께 삭제</li>
              <li>IP 해시: 스팸 방지 목적으로 최대 90일 보관</li>
              <li>사이트 통계: 익명화된 상태로 무기한 보관</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">
              Posts/comments are deleted upon request. Uploaded photos are deleted with the post. Hashed IPs are retained up to 90 days for spam prevention. Anonymized statistics are retained indefinitely.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">5. 귀하의 권리 / Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-ko">
              <li>게시물 삭제: 작성 시 입력한 비밀번호로 직접 삭제 가능</li>
              <li>데이터 삭제 요청: info@dalkonnect.com 으로 이메일 문의</li>
              <li>쿠키 거부: 브라우저 설정에서 쿠키 비활성화 가능</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">
              You may delete your own posts using your post password. For data deletion requests, email info@dalkonnect.com. You may disable cookies via your browser settings.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">6. 쿠키 / Cookies</h2>
            <p className="text-muted-foreground font-ko">
              DalKonnect는 다음 목적으로 쿠키 및 로컬스토리지를 사용합니다: 좋아요 기록 저장, 쿠키 동의 여부 기억. 광고 또는 추적 목적의 쿠키는 사용하지 않습니다.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              We use cookies and local storage only for: saving your likes and remembering your cookie consent. We do not use advertising or tracking cookies.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">7. 미성년자 / Children</h2>
            <p className="text-muted-foreground font-ko">
              DalKonnect는 13세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다. 13세 미만인 경우 본 서비스를 이용하지 마십시오.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              We do not knowingly collect personal information from children under 13. If you are under 13, please do not use this service.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">8. 문의 / Contact</h2>
            <p className="text-muted-foreground font-ko">
              개인정보 관련 문의사항은 아래로 연락주세요:
            </p>
            <p className="mt-2 font-medium">info@dalkonnect.com</p>
            <p className="text-muted-foreground text-xs mt-1">DalKonnect · Dallas-Fort Worth, TX</p>
          </section>

        </div>
      </div>
    </div>
  );
}
