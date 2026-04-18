#!/usr/bin/env node
/**
 * 기존 tts-script.txt로 v1beta1 TTS 재생성 → word-timings.json + voice_raw.mp3 저장
 * 사용법: node tts-regen-marks.cjs YYYY-MM-DD
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';

const dateArg = process.argv[2];
if (!dateArg || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error('사용법: node tts-regen-marks.cjs YYYY-MM-DD');
  process.exit(1);
}
const reelDir = path.join(BASE, 'memory', 'morning-reels', dateArg);
const scriptPath = path.join(reelDir, 'tts-script.txt');
if (!fs.existsSync(scriptPath)) { console.error('tts-script.txt 없음:', scriptPath); process.exit(1); }

const apiKeysEnv = fs.readFileSync('/Users/aaron/.claude/api-keys.env', 'utf8');
const ttsKey = (apiKeysEnv.match(/GOOGLE_TTS_KEY=(.+)/) || [])[1]?.trim();
if (!ttsKey) { console.error('GOOGLE_TTS_KEY 없음'); process.exit(1); }

const ttsScript = fs.readFileSync(scriptPath, 'utf8').trim();

// ── buildSSMLWithMarks (briefing-tts-gen.cjs 와 동일) ──────────
function buildSSMLWithMarks(plainText) {
  const PHONETICS = [
    ['LAFC','엘에이에프씨'],['NFL','엔에프엘'],['NBA','엔비에이'],
    ['MLB','메이저리그'],['MLS','메이저리그사커'],['LPGA','엘피지에이'],
    ['KLPGA','케이엘피지에이'],['PGA','피지에이'],['WBC','월드베이스볼클래식'],
    ['NASA','나사'],['ICE','아이씨이'],['H1B','에이치원비자'],
    ['USCIS','유에스씨아이에스'],['BTS','비티에스'],['AI','에이아이'],
    ['CEO','씨이오'],['DFW','디에프더블유'],['SNS','에스엔에스'],
    ['GDP','지디피'],['UN','유엔'],['EU','유럽연합'],['IT','아이티'],
    ['NCT','엔시티'],['Rock Solid','록 솔리드'],['SWIM','스윔'],
  ];
  const CATEGORY_BREAKS = [
    '달라스 로컬 소식입니다',
    '미국 뉴스입니다',
    '한국 뉴스입니다',
    '스포츠 소식입니다',
    '연예 소식입니다',
    '오늘 달커넥트 뉴스 여기까지입니다',
  ];

  const rawWords = plainText.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(w => w);
  const wordList = rawWords;
  const parts = [];
  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i];
    let w = word.replace(/&/g, '&amp;');
    const isCategoryStart = CATEGORY_BREAKS.some(kb =>
      rawWords.slice(i, i + kb.split(' ').length).join(' ') === kb);
    if (isCategoryStart) parts.push('<break time="600ms"/>');
    parts.push(`<mark name="w_${i}"/>`);
    for (const [en, ko] of PHONETICS) {
      w = w.replace(new RegExp(`\\b${en}\\b`, 'g'), `<sub alias="${ko}">${en}</sub>`);
    }
    parts.push(w);
    if (/[.!?]$/.test(word)) parts.push('<break time="350ms"/>');
  }
  return { ssml: `<speak>${parts.join(' ')}</speak>`, wordList };
}

async function callTTS(ssml, key) {
  const body = JSON.stringify({
    input: { ssml },
    voice: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C' },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
    enableTimePointing: ['SSML_MARK'],
  });
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      path: `/v1beta1/text:synthesize?key=${key}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (r) => {
      let buf = '';
      r.on('data', c => buf += c);
      r.on('end', () => { try { res(JSON.parse(buf)); } catch (e) { rej(e); } });
    });
    req.on('error', rej);
    req.write(body);
    req.end();
  });
}

(async () => {
  const { ssml: ssmlFull, wordList } = buildSSMLWithMarks(ttsScript);
  console.log(`📝 단어 수: ${wordList.length}, SSML 길이: ${ssmlFull.length}자`);

  // 청크 분할 (mark 태그 경계)
  const ssmlInner = ssmlFull.replace(/^<speak>/, '').replace(/<\/speak>$/, '');
  const markParts = ssmlInner.split(/(?=<mark name="w_)/);
  const ssmlChunks = [];
  const chunkStartWords = [];
  let cur = ''; let chunkStart = 0;
  for (const part of markParts) {
    const m = part.match(/<mark name="w_(\d+)"\/>/);
    if (m && (cur + part).length > 4000 && cur.length > 0) {
      ssmlChunks.push(`<speak>${cur}</speak>`);
      chunkStartWords.push(chunkStart);
      chunkStart = parseInt(m[1]);
      cur = part;
    } else {
      cur += part;
    }
  }
  if (cur.trim()) { ssmlChunks.push(`<speak>${cur}</speak>`); chunkStartWords.push(chunkStart); }
  console.log(`🔄 청크 수: ${ssmlChunks.length}`);

  const audioBuffers = [];
  const allTimepoints = [];
  let chunkTimeOffset = 0;

  for (let i = 0; i < ssmlChunks.length; i++) {
    console.log(`  청크 ${i+1}/${ssmlChunks.length}...`);
    const result = await callTTS(ssmlChunks[i], ttsKey);
    if (!result.audioContent) {
      console.error('  ❌ 실패:', JSON.stringify(result.error || result).slice(0, 200));
      continue;
    }
    const audioBuf = Buffer.from(result.audioContent, 'base64');
    audioBuffers.push(audioBuf);

    if (result.timepoints && result.timepoints.length > 0) {
      console.log(`  ✅ timepoints: ${result.timepoints.length}개`);
      for (const tp of result.timepoints) {
        const wordIdx = parseInt(tp.markName.replace('w_', ''));
        allTimepoints.push({ word: wordList[wordIdx] || '', wordIdx, time: tp.timeSeconds + chunkTimeOffset });
      }
    } else {
      console.warn('  ⚠️ timepoints 없음');
    }

    if (ssmlChunks.length > 1) {
      const tmpMp3 = path.join(reelDir, `_probe_${i}.mp3`);
      fs.writeFileSync(tmpMp3, audioBuf);
      try {
        const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${tmpMp3}"`, { encoding: 'utf8' }).trim());
        chunkTimeOffset += dur;
      } catch (_) {}
      fs.unlinkSync(tmpMp3);
    }
  }

  // 오디오 저장
  const voicePath = path.join(reelDir, 'voice_raw.mp3');
  if (audioBuffers.length === 1) {
    fs.writeFileSync(voicePath, audioBuffers[0]);
  } else if (audioBuffers.length > 1) {
    const tmpFiles = audioBuffers.map((buf, i) => {
      const f = path.join(reelDir, `_chunk_${i}.mp3`);
      fs.writeFileSync(f, buf);
      return f;
    });
    const listFile = path.join(reelDir, '_chunks.txt');
    fs.writeFileSync(listFile, tmpFiles.map(f => `file '${f}'`).join('\n'));
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${voicePath}"`);
    tmpFiles.forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });
    fs.unlinkSync(listFile);
  }
  console.log(`✅ voice_raw.mp3 저장: ${voicePath}`);

  // word-timings.json 저장
  if (allTimepoints.length > 0) {
    const timingsPath = path.join(reelDir, 'word-timings.json');
    fs.writeFileSync(timingsPath, JSON.stringify(allTimepoints, null, 2));
    console.log(`✅ word-timings.json 저장: ${timingsPath} (${allTimepoints.length}개)`);
    // 샘플 출력
    console.log('첫 10개:');
    allTimepoints.slice(0, 10).forEach(t => console.log(`  w_${t.wordIdx} "${t.word}" → ${t.time.toFixed(3)}s`));
  } else {
    console.error('❌ timepoints 없음 — word-timings.json 저장 안 됨');
  }
})().catch(e => { console.error(e); process.exit(1); });
