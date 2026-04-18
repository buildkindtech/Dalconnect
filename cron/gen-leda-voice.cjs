#!/usr/bin/env node
/**
 * Leda(Chirp3-HD) TTS 생성
 * - 단락별 청크 분할 → 각각 SSML <break> 적용 → ffmpeg 연결
 * 사용법: node gen-leda-voice.cjs YYYY-MM-DD
 */
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const BASE = '/Users/aaron/.openclaw/workspace-manager/projects/dalconnect';

const dateArg = process.argv[2];
if (!dateArg || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error('사용법: node gen-leda-voice.cjs YYYY-MM-DD');
  process.exit(1);
}

const reelDir = path.join(BASE, 'memory', 'morning-reels', dateArg);
const scriptPath = path.join(reelDir, 'tts-script.txt');
if (!fs.existsSync(scriptPath)) {
  console.error('tts-script.txt 없음:', scriptPath);
  process.exit(1);
}

const apiKeysEnv = fs.readFileSync('/Users/aaron/.claude/api-keys.env', 'utf8');
const ttsKey = (apiKeysEnv.match(/GOOGLE_TTS_KEY=(.+)/) || [])[1]?.trim();
if (!ttsKey) { console.error('GOOGLE_TTS_KEY 없음'); process.exit(1); }

const scriptText = fs.readFileSync(scriptPath, 'utf8').trim();

// plain text → SSML 변환 (콤마/마침표 뒤 자연스러운 포즈)
// Chirp3-HD는 <mark> 미지원이지만 <break>는 지원
function textToSsml(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const withBreaks = escaped
    .replace(/,\s*/g, ', <break time="350ms"/>')    // 콤마 뒤 짧은 숨
    .replace(/\.\s+/g, '. <break time="550ms"/>')   // 마침표 뒤 문장 구분
    .replace(/\n/g, ' <break time="200ms"/> ');      // 줄바꿈 미세 포즈
  return `<speak>${withBreaks}</speak>`;
}

// 단락별로 청크 분할 (빈 줄 기준, 각 청크 4000바이트 이하)
function splitChunks(text, maxBytes = 3500) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = '';
  for (const para of paragraphs) {
    const candidate = current ? current + '\n\n' + para : para;
    const ssml = textToSsml(candidate);
    if (Buffer.byteLength(ssml, 'utf8') > maxBytes && current) {
      chunks.push(current);
      current = para;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// 단일 청크 TTS 호출
async function callLedaTTS(ssml, key) {
  const body = JSON.stringify({
    input: { ssml },
    voice: { languageCode: 'ko-KR', name: 'ko-KR-Chirp3-HD-Leda' },
    audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
  });
  return new Promise((res, rej) => {
    const req = https.request({
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${key}`,
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
  console.log('🎙️  Leda TTS 생성 중 (SSML <break> 적용)...');

  const chunks = splitChunks(scriptText);
  console.log(`  → 청크 ${chunks.length}개로 분할`);

  const chunkPaths = [];
  for (let i = 0; i < chunks.length; i++) {
    const ssml = textToSsml(chunks[i]);
    console.log(`  청크 ${i + 1}/${chunks.length} (${Buffer.byteLength(ssml, 'utf8')}bytes)...`);
    const result = await callLedaTTS(ssml, ttsKey);
    if (!result.audioContent) {
      console.error(`❌ 청크 ${i + 1} 실패:`, JSON.stringify(result.error || result).slice(0, 300));
      process.exit(1);
    }
    const chunkPath = path.join(reelDir, `voice_chunk_${i}.mp3`);
    fs.writeFileSync(chunkPath, Buffer.from(result.audioContent, 'base64'));
    chunkPaths.push(chunkPath);
  }

  // 청크 연결 (ffmpeg concat)
  const rawPath = path.join(reelDir, 'voice_raw.mp3');
  if (chunkPaths.length === 1) {
    fs.copyFileSync(chunkPaths[0], rawPath);
  } else {
    const concatList = path.join(reelDir, 'concat_chunks.txt');
    fs.writeFileSync(concatList, chunkPaths.map(p => `file '${p}'`).join('\n'));
    execSync(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${rawPath}"`, { stdio: 'pipe' });
    // 청크 파일 정리
    chunkPaths.forEach(p => fs.unlinkSync(p));
    fs.unlinkSync(concatList);
  }

  const rawDur = parseFloat(execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${rawPath}"`).toString().trim());
  console.log(`✅ voice_raw.mp3 저장 (${rawDur.toFixed(1)}s)`);

  // voice_1.20x.mp3 생성 (atempo 1.2x)
  const speedPath = path.join(reelDir, 'voice_1.20x.mp3');
  execSync(`ffmpeg -y -i "${rawPath}" -filter:a "atempo=1.2" -vn "${speedPath}"`, { stdio: 'pipe' });
  const speedDur = parseFloat(execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${speedPath}"`).toString().trim());
  console.log(`✅ voice_1.20x.mp3 저장 (${speedDur.toFixed(1)}s)`);

})().catch(e => { console.error(e); process.exit(1); });
