const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT = path.join(__dirname, '..', 'sns-cards', 'concept-compare.png');

const html = `
<html><head>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" rel="stylesheet">
  <style>*{margin:0;padding:0;box-sizing:border-box;}body{width:1080px;height:1080px;overflow:hidden;}</style>
</head><body>
<div style="width:1080px;height:1080px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;font-family:'Noto Sans KR',sans-serif;">

  <!-- A: 서울밤 -->
  <div style="background:linear-gradient(160deg,#0D0D1A,#12122A);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px;position:relative;overflow:hidden;border-right:2px solid #000;border-bottom:2px solid #000;">
    <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(123,47,255,0.3) 0%,transparent 70%);"></div>
    <div style="position:absolute;bottom:-40px;left:-30px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(255,45,120,0.25) 0%,transparent 70%);"></div>
    <div style="font-size:13px;letter-spacing:3px;color:#FF2D78;font-weight:700;margin-bottom:10px;">OPTION A</div>
    <div style="font-size:40px;font-weight:900;color:#fff;margin-bottom:8px;text-align:center;line-height:1.2;">서울밤</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:20px;text-align:center;">Seoul Night</div>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <div style="width:28px;height:28px;border-radius:50%;background:#0D0D1A;border:2px solid #FF2D78;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:#FF2D78;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:#7B2FFF;"></div>
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;">다크 + 네온 핑크 + 퍼플<br/>힙하고 젊은 느낌</div>
    <div style="margin-top:16px;background:linear-gradient(90deg,#FF2D78,#7B2FFF);padding:8px 22px;border-radius:50px;font-size:13px;font-weight:700;color:#fff;">dalkonnect.com</div>
  </div>

  <!-- B: 프리미엄 다크 -->
  <div style="background:linear-gradient(160deg,#111111,#1A1A1A);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px;position:relative;overflow:hidden;border-bottom:2px solid #000;">
    <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,0.2) 0%,transparent 70%);"></div>
    <div style="font-size:13px;letter-spacing:3px;color:#C9A84C;font-weight:700;margin-bottom:10px;">OPTION B</div>
    <div style="font-size:40px;font-weight:900;color:#fff;margin-bottom:8px;text-align:center;line-height:1.2;">프리미엄<br/>다크</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:20px;text-align:center;">Premium Dark</div>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <div style="width:28px;height:28px;border-radius:50%;background:#1A1A1A;border:2px solid #C9A84C;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:#C9A84C;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:#E8E8E8;border:1px solid #333;"></div>
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;">소프트 블랙 + 골드<br/>고급 매거진 느낌</div>
    <div style="margin-top:16px;background:#C9A84C;padding:8px 22px;border-radius:50px;font-size:13px;font-weight:700;color:#111;">dalkonnect.com</div>
  </div>

  <!-- C: 모던 뉴스 -->
  <div style="background:#FFFFFF;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px;position:relative;overflow:hidden;border-right:2px solid #000;">
    <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#C41E3A,#1B2B4B);"></div>
    <div style="font-size:13px;letter-spacing:3px;color:#C41E3A;font-weight:700;margin-bottom:10px;">OPTION C</div>
    <div style="font-size:40px;font-weight:900;color:#1B2B4B;margin-bottom:8px;text-align:center;line-height:1.2;">모던<br/>뉴스</div>
    <div style="font-size:13px;color:#999;margin-bottom:20px;text-align:center;">Modern News</div>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <div style="width:28px;height:28px;border-radius:50%;background:#FFFFFF;border:2px solid #1B2B4B;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:#C41E3A;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:#1B2B4B;"></div>
    </div>
    <div style="font-size:13px;color:#888;text-align:center;line-height:1.6;">화이트 + 레드 + 딥네이비<br/>신문/정보 포털 느낌</div>
    <div style="margin-top:16px;background:#1B2B4B;padding:8px 22px;border-radius:50px;font-size:13px;font-weight:700;color:#fff;">dalkonnect.com</div>
  </div>

  <!-- D: 슬레이트 + 코랄 -->
  <div style="background:linear-gradient(160deg,#1E2A3A,#243345);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px;position:relative;overflow:hidden;">
    <div style="position:absolute;bottom:-30px;right:-30px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(232,93,59,0.25) 0%,transparent 70%);"></div>
    <div style="font-size:13px;letter-spacing:3px;color:#E85D3B;font-weight:700;margin-bottom:10px;">OPTION D</div>
    <div style="font-size:40px;font-weight:900;color:#F5F5F0;margin-bottom:8px;text-align:center;line-height:1.2;">슬레이트<br/>+ 코랄</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:20px;text-align:center;">Slate + Coral</div>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <div style="width:28px;height:28px;border-radius:50%;background:#1E2A3A;border:2px solid #E85D3B;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:#E85D3B;"></div>
      <div style="width:28px;height:28px;border-radius:50%;background:#F5F5F0;border:1px solid #555;"></div>
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;">슬레이트 + 웜 코랄<br/>현대적이고 친근한 느낌</div>
    <div style="margin-top:16px;background:#E85D3B;padding:8px 22px;border-radius:50px;font-size:13px;font-weight:700;color:#fff;">dalkonnect.com</div>
  </div>

</div>
</body></html>`;

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: OUTPUT, type: 'png', clip: { x:0,y:0,width:1080,height:1080 } });
  await browser.close();
  console.log('✅ concept-compare.png');
})();
