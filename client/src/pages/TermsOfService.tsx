export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2 font-ko">이용약관</h1>
        <p className="text-sm text-muted-foreground mb-8">Terms of Service · 최종 수정일: 2026년 3월 17일</p>

        <div className="bg-white rounded-xl border p-8 space-y-8 text-sm leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">1. 서비스 소개 / About DalKonnect</h2>
            <p className="text-muted-foreground font-ko">
              DalKonnect는 달라스-포트워스 지역 한인 커뮤니티를 위한 정보 플랫폼입니다. 본 약관은 DalKonnect 웹사이트(dalkonnect.com) 이용에 적용됩니다.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              DalKonnect is a community information platform for the Korean community in the Dallas-Fort Worth area. These terms apply to your use of dalkonnect.com.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">2. 이용자 의무 / User Responsibilities</h2>
            <p className="text-muted-foreground mb-2 font-ko">다음 행위는 엄격히 금지됩니다:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-ko">
              <li>허위 정보, 사기성 게시물 작성</li>
              <li>타인을 비방하거나 명예를 훼손하는 내용</li>
              <li>불법 물품 거래 (총기, 마약, 도용 물품 등)</li>
              <li>성인 콘텐츠 또는 폭력적 콘텐츠</li>
              <li>타인의 개인정보 무단 게시</li>
              <li>스팸, 광고 도배</li>
              <li>자동화 봇을 통한 대량 게시</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">
              Strictly prohibited: false or fraudulent posts, defamation, illegal item sales (firearms, drugs, stolen goods), adult or violent content, posting others' personal information without consent, spam, and automated bulk posting.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">3. 사고팔기 거래 면책 / Marketplace Disclaimer</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
              <p className="text-amber-800 font-semibold font-ko text-sm">⚠️ 중요 고지</p>
            </div>
            <p className="text-muted-foreground font-ko">
              DalKonnect 사고팔기 서비스는 <strong>게시판 제공</strong>에 불과합니다. DalKonnect는 게시물에 나열된 상품의 품질, 안전성, 합법성을 보증하지 않으며, 거래 당사자 간의 분쟁에 일절 책임지지 않습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-3 font-ko">
              <li>모든 거래는 구매자와 판매자 간의 직접 거래입니다</li>
              <li>직거래 시 안전한 공공장소에서 만나시기 바랍니다</li>
              <li>선입금 요구 거래는 사기 가능성이 높습니다</li>
              <li>의심스러운 게시물은 신고해 주십시오</li>
            </ul>
            <p className="text-muted-foreground mt-3 text-xs">
              DalKonnect's marketplace is a bulletin board only. We do not guarantee the quality, safety, or legality of listed items and are not responsible for disputes between buyers and sellers. All transactions are directly between users. Meet in public places for in-person trades.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">4. 콘텐츠 소유권 / Content Ownership</h2>
            <p className="text-muted-foreground font-ko">
              이용자가 게시한 콘텐츠(글, 사진)의 저작권은 이용자 본인에게 있습니다. 다만, DalKonnect에 게시함으로써 서비스 운영에 필요한 범위 내에서 해당 콘텐츠를 표시·전송·저장할 수 있는 비독점적 라이선스를 DalKonnect에 부여하는 것으로 간주합니다.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              You retain copyright of content you post. By posting on DalKonnect, you grant us a non-exclusive license to display, transmit, and store that content as necessary to operate the service.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">5. 콘텐츠 삭제 권한 / Content Removal</h2>
            <p className="text-muted-foreground font-ko">
              DalKonnect는 본 약관을 위반하는 게시물을 사전 통보 없이 삭제할 수 있습니다. 또한 서비스 운영상 필요한 경우 콘텐츠를 수정하거나 접근을 제한할 수 있습니다.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              DalKonnect may remove content that violates these terms without prior notice. We may also modify content or restrict access as necessary for service operation.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">6. 서비스 변경 및 중단 / Service Changes</h2>
            <p className="text-muted-foreground font-ko">
              DalKonnect는 서비스 내용을 예고 없이 변경하거나 중단할 수 있습니다. 서비스 중단으로 인한 손해에 대해 DalKonnect는 책임지지 않습니다.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              We may modify or discontinue the service without notice. DalKonnect is not liable for damages caused by service interruption.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">7. 준거법 / Governing Law</h2>
            <p className="text-muted-foreground font-ko">
              본 약관은 미국 텍사스주 법률에 따라 해석되고 적용됩니다.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              These Terms shall be governed by the laws of the State of Texas, United States.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">8. 약관 변경 / Changes to Terms</h2>
            <p className="text-muted-foreground font-ko">
              본 약관은 변경될 수 있으며, 변경 시 웹사이트에 게시합니다. 변경 후 서비스를 계속 이용하면 변경된 약관에 동의한 것으로 간주합니다.
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              We may update these Terms and will post changes on the website. Continued use of the service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold mb-3 font-ko">9. 문의 / Contact</h2>
            <p className="text-muted-foreground font-ko">약관 관련 문의:</p>
            <p className="mt-2 font-medium">info@dalkonnect.com</p>
            <p className="text-muted-foreground text-xs mt-1">DalKonnect · Dallas-Fort Worth, TX</p>
          </section>

        </div>
      </div>
    </div>
  );
}
