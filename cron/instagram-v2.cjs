#!/usr/bin/env node
'use strict';

/**
 * DalKonnect Instagram V2 preview generator.
 *
 * Generates a rights-cleared, source-backed real-photo Reel package.
 * It never publishes or sends messages. Public posting stays behind review.
 *
 * Usage:
 *   node cron/instagram-v2.cjs
 *   node cron/instagram-v2.cjs --date=2026-07-16
 *   node cron/instagram-v2.cjs --topic=tornado-watch-warning
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');

const BASE = process.env.DALCONNECT_DIR || path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(BASE, 'config', 'instagram-v2-topics.json');
const HISTORY_FILE = path.join(BASE, 'data', 'instagram-v2-history.json');
const RIGHTS_FILE = path.join(BASE, 'data', 'instagram-photo-rights.json');
const USER_AGENT = 'DalKonnectContentBot/2.0 (https://dalkonnect.com; info@dalkonnect.com)';
const ALLOWED_LICENSES = /^(CC0|Public domain|CC BY(?:-SA)?(?: [0-9.]+)?)$/i;

function licenseUrlFor(license = '') {
  if (/^CC0$/i.test(license)) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (/^Public domain$/i.test(license)) return 'https://creativecommons.org/publicdomain/mark/1.0/';
  const match = license.match(/^CC (BY(?:-SA)?) ([0-9.]+)$/i);
  return match ? `https://creativecommons.org/licenses/${match[1].toLowerCase()}/${match[2]}/` : null;
}

function parseArgs(argv) {
  return Object.fromEntries(argv.slice(2).filter(v => v.startsWith('--')).map(v => {
    const [key, ...rest] = v.slice(2).split('=');
    return [key, rest.length ? rest.join('=') : true];
  }));
}

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function saveJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function fileDigest(file) {
  const data = fs.readFileSync(file);
  return { bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') };
}

function voiceConfigFingerprint(voice) {
  return crypto.createHash('sha256').update(JSON.stringify(voice)).digest('hex');
}

function existingPackageIsValid(manifestFile, config) {
  const manifest = loadJson(manifestFile, null);
  const readyGates = ['realPhotos', 'rightsCleared', 'attributionComplete', 'factualSources',
    'sourceReachability', 'photoArtistDiversity', 'voiceover', 'under30Seconds',
    'vertical9x16', 'editorialQuality'];
  if (manifest?.status !== 'preview_ready' || manifest.publishApproved !== false ||
      !readyGates.every(gate => manifest.gates?.[gate] === true) ||
      manifest.gates?.publicPosting !== false ||
      manifest.editorial?.qualityScore < config.editorial.minimumQualityScore ||
      manifest.voice?.provider !== config.editorial.voice.provider ||
      manifest.voice?.name !== config.editorial.voice.name ||
      manifest.voice?.configFingerprint !== voiceConfigFingerprint(config.editorial.voice)) return false;

  const dir = path.dirname(manifestFile);
  const required = [manifest.reel, manifest.cover, ...(manifest.slides || []), manifest.caption,
    manifest.narration, ...(manifest.photos || []).map(photo => photo.file),
    ...(manifest.renderInputs || [])].filter(Boolean);
  if (!manifest.artifacts || required.length === 0) return false;
  const actualFiles = fs.readdirSync(dir).filter(name => fs.statSync(path.join(dir, name)).isFile()).sort();
  const expectedFiles = ['manifest.json', ...Object.keys(manifest.artifacts)].sort();
  if (actualFiles.length !== expectedFiles.length || actualFiles.some((name, index) => name !== expectedFiles[index])) return false;
  for (const name of new Set(required)) {
    if (path.basename(name) !== name || !manifest.artifacts[name]) return false;
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) return false;
    const actual = fileDigest(file);
    if (actual.bytes <= 0 || actual.bytes !== manifest.artifacts[name].bytes ||
        actual.sha256 !== manifest.artifacts[name].sha256) return false;
  }

  const probe = JSON.parse(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate:format=duration',
    '-of', 'json', path.join(dir, manifest.reel),
  ], { encoding: 'utf8' }));
  const video = probe.streams?.find(stream => stream.codec_name === 'h264');
  const audio = probe.streams?.find(stream => stream.codec_name === 'aac');
  const duration = Number(probe.format?.duration || 0);
  const caption = fs.readFileSync(path.join(dir, manifest.caption), 'utf8');
  return video?.width === config.reel.width && video?.height === config.reel.height &&
    video?.r_frame_rate === `${config.reel.fps}/1` && Boolean(audio) && duration > 0 && duration <= 30 &&
    caption.includes('정보 확인일:') && caption.includes('정보 출처') && caption.includes('사진 출처');
}

function promotePackage(workDir, finalDir) {
  let supersededDir = null;
  if (fs.existsSync(finalDir)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    supersededDir = `${finalDir}.superseded-${stamp}`;
    fs.renameSync(finalDir, supersededDir);
  }
  try {
    fs.renameSync(workDir, finalDir);
  } catch (error) {
    if (supersededDir && !fs.existsSync(finalDir)) fs.renameSync(supersededDir, finalDir);
    throw error;
  }
  return supersededDir;
}

function chicagoDate(input) {
  if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function dayOfWeek(date) {
  return new Date(`${date}T12:00:00-05:00`).getDay();
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[c]);
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sourceHostAllowed(url, allowedHosts = []) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return allowedHosts.some(allowed => host === allowed || host.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

function validateEditorialTopic(topic, editorial, date) {
  const errors = [];
  const factDate = new Date(`${topic.factCheckedAt || ''}T12:00:00-05:00`);
  const packageDate = new Date(`${date}T12:00:00-05:00`);
  const factAgeDays = Number.isFinite(factDate.getTime())
    ? Math.floor((packageDate.getTime() - factDate.getTime()) / 86400000)
    : Infinity;
  const copy = [topic.hook, topic.dek, topic.captionLead, topic.cta,
    ...(topic.facts || []).flatMap(f => [f.eyebrow, f.title, f.body])].join(' ');
  const blockedPhrases = (editorial.blockedPhrases || []).filter(phrase => copy.includes(phrase));
  const sourceUrls = [...new Set((topic.facts || []).map(f => f.sourceUrl).filter(Boolean))];

  if ((topic.facts || []).length !== editorial.requiredFacts) {
    errors.push(`requires exactly ${editorial.requiredFacts} facts`);
  }
  if (factAgeDays < 0 || factAgeDays > editorial.maximumFactAgeDays) {
    errors.push(`fact review is ${factAgeDays} days old`);
  }
  if (!sourceUrls.length || !sourceUrls.every(url => sourceHostAllowed(url, editorial.allowedSourceHosts))) {
    errors.push('contains a non-approved factual source');
  }
  if ((topic.facts || []).some(f => !f.sourceLabel || !f.sourceUrl || !f.title || !f.body)) {
    errors.push('contains an incomplete fact or source citation');
  }
  if (blockedPhrases.length) errors.push(`blocked phrases: ${blockedPhrases.join(', ')}`);
  if (!/(DFW|Dallas|달라스|텍사스)/i.test(copy + ' ' + (topic.hashtags || []).join(' '))) {
    errors.push('DFW/Texas audience relevance is not explicit');
  }
  if (errors.length) throw new Error(`Editorial gate failed for ${topic.id}: ${errors.join('; ')}`);

  return { factAgeDays, sourceUrls, blockedPhrases, localRelevance: true };
}

function chooseTopic(config, history, date, forcedId) {
  const topics = new Map(config.topics.map(t => [t.id, t]));
  if (forcedId) {
    const forced = topics.get(forcedId);
    if (!forced) throw new Error(`Unknown topic: ${forcedId}`);
    return { topic: forced, note: 'forced topic' };
  }

  const existing = (history.generated || []).find(v => v.date === date);
  if (existing && topics.has(existing.topicId)) {
    return { topic: topics.get(existing.topicId), note: 'same-date regeneration' };
  }

  const rights = loadJson(RIGHTS_FILE, { businesses: {} });
  const hasApprovedBusiness = Object.values(rights.businesses || {}).some(v => v?.approved === true);
  const scheduled = config.schedule[String(dayOfWeek(date))] || [];
  const recent = new Set((history.generated || []).slice(-7).map(v => v.topicId));

  for (const id of scheduled) {
    if (id === 'business-spotlight' && !hasApprovedBusiness) continue;
    const topic = topics.get(id);
    if (topic && !recent.has(id)) return { topic, note: 'scheduled and not used in last 7 packages' };
  }
  for (const id of scheduled) {
    const topic = topics.get(id);
    if (topic) return { topic, note: 'scheduled fallback' };
  }
  const topic = config.topics.find(t => t.type === 'local_guide');
  if (!topic) throw new Error('No publishable local guide topic configured');
  return { topic, note: 'global fallback' };
}

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}: ${new URL(url).hostname}`);
      if (response.status >= 400 && response.status < 500 && response.status !== 429) break;
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, 500 * attempt));
  }
  throw new Error(`Request failed after ${attempts} attempts: ${lastError?.message || url}`);
}

async function fetchJson(url) {
  const response = await fetchWithRetry(url, { headers: { 'user-agent': USER_AGENT } });
  return response.json();
}

async function verifyFactualSources(topic, editorial) {
  const sources = [...new Map(topic.facts.map(f => [f.sourceUrl, f])).values()];
  const checks = [];
  for (const source of sources) {
    if (!sourceHostAllowed(source.sourceUrl, editorial.allowedSourceHosts)) {
      throw new Error(`Source host is not approved: ${source.sourceUrl}`);
    }
    const response = await fetchWithRetry(source.sourceUrl, {
      headers: { 'user-agent': USER_AGENT }, redirect: 'follow',
    });
    checks.push({
      label: source.sourceLabel,
      url: source.sourceUrl,
      finalUrl: response.url,
      status: response.status,
      reachable: true,
    });
    if (response.body) await response.body.cancel().catch(() => {});
  }
  return checks;
}

async function fetchCommonsPhotos(query, limit = 3) {
  const params = new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '6',
    gsrlimit: '20', prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size',
    iiurlwidth: '1600', format: 'json', origin: '*',
  });
  const apiUrl = new URL(`https://commons.wikimedia.org/w/api.php?${params}`);
  const data = await fetchJson(apiUrl);
  const pages = Object.values(data.query?.pages || {});
  const blockedTitle = /(illustration|drawing|map|logo|diagram|1912|historic)/i;
  const candidates = pages.map(page => {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata || {};
    return {
      title: page.title,
      url: info?.thumburl || info?.url,
      descriptionUrl: info?.descriptionurl,
      mime: info?.thumbmime || info?.mime,
      width: info?.thumbwidth || info?.width || 0,
      height: info?.thumbheight || info?.height || 0,
      license: stripHtml(meta.LicenseShortName?.value),
      artist: stripHtml(meta.Artist?.value) || 'Wikimedia Commons contributor',
    };
  }).map(photo => ({ ...photo, licenseUrl: licenseUrlFor(photo.license) })).filter(photo =>
    photo.url && /^image\/(jpeg|png|webp)$/i.test(photo.mime || '') &&
    ALLOWED_LICENSES.test(photo.license) && photo.licenseUrl && photo.width >= 1000 && photo.height >= 600 &&
    photo.width / photo.height < 3 && !blockedTitle.test(photo.title)
  );

  const distinct = [];
  const seen = new Set();
  for (const photo of candidates) {
    const key = photo.title;
    if (seen.has(key)) continue;
    seen.add(key);
    distinct.push(photo);
  }
  const unique = [];
  const seenArtists = new Set();
  for (const photo of distinct) {
    if (seenArtists.has(photo.artist)) continue;
    unique.push(photo);
    seenArtists.add(photo.artist);
    if (unique.length === limit) break;
  }
  for (const photo of distinct) {
    if (unique.length >= limit) break;
    if (unique.includes(photo)) continue;
    unique.push(photo);
  }
  if (unique.length < limit) {
    throw new Error(`Only ${unique.length}/${limit} rights-cleared photos found for “${query}”`);
  }
  return unique;
}

async function downloadPhoto(photo, file) {
  const response = await fetchWithRetry(photo.url, { headers: { 'user-agent': USER_AGENT } });
  fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
}

function slideHtml({ photoFile, photo, eyebrow, title, body, footer, index, total, cover = false }) {
  const photoUrl = `data:${photo.mime || 'image/jpeg'};base64,${fs.readFileSync(photoFile).toString('base64')}`;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#07111f;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}
    .photo{position:absolute;inset:0;background:url('${photoUrl}') center/cover no-repeat;transform:scale(1.03)}
    .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,10,20,.10) 0%,rgba(3,10,20,.18) 40%,rgba(3,10,20,.82) 76%,#07111f 100%)}
    .brand{position:absolute;top:92px;left:70px;font-size:25px;font-weight:800;letter-spacing:4px;text-shadow:0 2px 12px #000}
    .real{position:absolute;top:88px;right:62px;padding:12px 18px;border-radius:99px;background:rgba(0,0,0,.55);font-size:20px;font-weight:700;border:1px solid rgba(255,255,255,.25)}
    .content{position:absolute;left:70px;right:70px;bottom:${cover ? 290 : 300}px}
    .eyebrow{display:inline-block;color:#07111f;background:#5eead4;border-radius:99px;padding:12px 22px;font-size:23px;font-weight:900;letter-spacing:2px;margin-bottom:25px}
    h1{margin:0;white-space:pre-line;font-size:${cover ? 98 : 118}px;line-height:1.04;letter-spacing:-3px;text-shadow:0 4px 28px rgba(0,0,0,.8)}
    .body{margin-top:30px;white-space:pre-line;font-size:${cover ? 43 : 48}px;line-height:1.35;font-weight:700;color:#eef6ff;text-shadow:0 3px 18px rgba(0,0,0,.9)}
    .footer{position:absolute;left:70px;right:70px;bottom:126px;display:flex;align-items:flex-end;justify-content:space-between;gap:25px;color:rgba(255,255,255,.82);font-size:18px;line-height:1.3}
    .credit{max-width:760px}.count{font-size:23px;font-weight:900;color:#5eead4;white-space:nowrap}
  </style></head><body>
    <div class="photo"></div><div class="shade"></div>
    <div class="brand">DALKONNECT</div><div class="real">실사진 · 출처 확인</div>
    <main class="content"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><div class="body">${esc(body)}</div></main>
    <footer class="footer"><div class="credit">${esc(footer)} · 사진 ${esc(photo.artist)} / ${esc(photo.license)}</div><div class="count">${index}/${total}</div></footer>
  </body></html>`;
}

async function renderSlides(topic, photos, photoFiles, outDir, config) {
  const slides = [
    { eyebrow: 'DFW VERIFIED GUIDE', title: topic.hook, body: topic.dek, footer: `공식 출처 · 정보 확인 ${topic.factCheckedAt}`, cover: true },
    ...topic.facts.map(f => ({ eyebrow: f.eyebrow, title: f.title, body: f.body, footer: f.sourceLabel })),
    { eyebrow: 'SAVE & SHARE', title: topic.cta, body: '매일 DFW 한인 생활정보 · @dalkonnect', footer: 'dalkonnect.com', cover: true },
  ];
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'], protocolTimeout: 120000,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: config.reel.width, height: config.reel.height, deviceScaleFactor: 1 });
  const files = [];
  for (let i = 0; i < slides.length; i++) {
    const photoIndex = Math.min(i === slides.length - 1 ? photos.length - 1 : i % photos.length, photos.length - 1);
    const html = slideHtml({
      ...slides[i], photoFile: photoFiles[photoIndex], photo: photos[photoIndex], index: i + 1, total: slides.length,
    });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    const file = path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: file, type: 'png' });
    files.push(file);
  }
  await browser.close();
  return files;
}

function narrationText(topic) {
  return [topic.hook, topic.dek, ...topic.facts.flatMap(f => [f.title, f.body]), topic.cta]
    .join('. ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function googleTtsKey() {
  if (process.env.GOOGLE_TTS_KEY) return process.env.GOOGLE_TTS_KEY;
  const keyFile = '/Users/aaron/.claude/api-keys.env';
  if (!fs.existsSync(keyFile)) return null;
  return (fs.readFileSync(keyFile, 'utf8').match(/^GOOGLE_TTS_KEY=(.+)$/m) || [])[1]?.trim() || null;
}

function narrationSsml(text, voice) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<speak>${escaped
    .replace(/,\s*/g, `, <break time="${voice.commaBreakMs}ms"/> `)
    .replace(/\.\s+/g, `. <break time="${voice.sentenceBreakMs}ms"/> `)}</speak>`;
}

async function generateLedaNarration(topic, outDir, voice) {
  const key = googleTtsKey();
  if (!key) throw new Error('Editorial gate failed: GOOGLE_TTS_KEY is not configured');
  const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { ssml: narrationSsml(narrationText(topic), voice) },
      voice: { languageCode: voice.languageCode, name: voice.name },
      audioConfig: { audioEncoding: 'MP3', speakingRate: voice.speakingRate },
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.audioContent) {
    throw new Error(`Leda TTS failed: ${result.error?.message || `HTTP ${response.status}`}`);
  }
  const narration = path.join(outDir, 'narration.mp3');
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-f', 'mp3', '-i', 'pipe:0',
    '-filter:a', `atempo=${voice.postSpeed}`, '-c:a', 'libmp3lame', '-b:a', '192k', narration,
  ], { input: Buffer.from(result.audioContent, 'base64') });
  const duration = Number(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', narration,
  ], { encoding: 'utf8' }).trim());
  return { narration, duration };
}

async function renderReel(slides, outDir, config, topic) {
  const voice = config.editorial.voice;
  if (!voice || voice.provider !== 'google-cloud-tts' || voice.name !== 'ko-KR-Chirp3-HD-Leda') {
    throw new Error('Editorial gate failed: approved Leda voice configuration is required');
  }
  const generated = await generateLedaNarration(topic, outDir, voice);
  const baseDuration = slides.length * config.reel.secondsPerSlide;
  const duration = Math.min(Math.max(baseDuration, Math.ceil((generated.duration + 0.5) * 10) / 10), config.reel.maxSeconds);
  if (generated.duration > duration - 0.25) {
    throw new Error(`Editorial gate failed: Leda narration ${generated.duration.toFixed(1)}s does not fit ${duration.toFixed(1)}s Reel`);
  }
  const concatFile = path.join(outDir, 'reel-concat.txt');
  const lines = [];
  const secondsPerSlide = duration / slides.length;
  for (const slide of slides) {
    lines.push(`file '${slide.replace(/'/g, "'\\''")}'`);
    lines.push(`duration ${secondsPerSlide}`);
  }
  lines.push(`file '${slides[slides.length - 1].replace(/'/g, "'\\''")}'`);
  fs.writeFileSync(concatFile, lines.join('\n') + '\n');
  const output = path.join(outDir, 'reel-preview.mp4');
  const narration = generated.narration;
  const hasNarration = fs.existsSync(narration) && fs.statSync(narration).size > 1000;
  const inputs = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', concatFile,
    '-f', 'lavfi', '-i', `sine=frequency=220:sample_rate=44100:duration=${duration}`,
    '-f', 'lavfi', '-i', `sine=frequency=330:sample_rate=44100:duration=${duration}`,
  ];
  if (hasNarration) inputs.push('-i', narration);
  const audioFilter = hasNarration
    ? '[1:a]volume=0.012[a1];[2:a]volume=0.006[a2];[a1][a2]amix=inputs=2:duration=first[bed];[3:a]volume=1.35,highpass=f=90,lowpass=f=9000[voice];[bed][voice]amix=inputs=2:duration=first:dropout_transition=0[aout]'
    : '[1:a]volume=0.018[a1];[2:a]volume=0.009[a2];[a1][a2]amix=inputs=2:duration=first[aout]';
  execFileSync('ffmpeg', [
    ...inputs,
    '-filter_complex', audioFilter,
    '-map', '0:v:0', '-map', '[aout]', '-t', String(duration), '-r', String(config.reel.fps),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', output,
  ], { stdio: 'inherit' });
  return { output, hasNarration, narration: hasNarration ? narration : null,
    narrationDuration: generated.duration, provider: voice.provider, voiceName: voice.name };
}

function makeCaption(topic, photos) {
  const sources = [...new Map(topic.facts.map(f => [f.sourceUrl, f])).values()]
    .map(f => `• ${f.sourceLabel}: ${f.sourceUrl}`).join('\n');
  const credits = photos.map(p => `• ${p.artist} · ${p.license} (${p.licenseUrl}) · 원본 ${p.descriptionUrl} · 세로형 크롭 및 텍스트 오버레이 적용`).join('\n');
  return `${topic.captionLead}\n\n${topic.facts.map(f => `✅ ${f.title} — ${f.body.replace(/\n/g, ' ')}`).join('\n')}\n\n정보 확인일: ${topic.factCheckedAt}\n필요할 때 다시 보도록 저장하고, DFW 가족·지인에게 공유해주세요.\n\n정보 출처\n${sources}\n\n사진 출처\n${credits}\n\n${topic.hashtags.map(t => `#${t}`).join(' ')}`;
}

async function main() {
  const args = parseArgs(process.argv);
  const date = chicagoDate(args.date);
  const config = loadJson(CONFIG_FILE, null);
  if (!config) throw new Error(`Missing config: ${CONFIG_FILE}`);
  const packageRoot = path.join(BASE, 'memory', 'instagram-v2');
  const finalOutDir = path.join(packageRoot, date);
  const existingManifestFile = path.join(finalOutDir, 'manifest.json');
  if (args['skip-existing'] && fs.existsSync(existingManifestFile)) {
    const existing = loadJson(existingManifestFile, null);
    if (existingPackageIsValid(existingManifestFile, config)) {
      console.log(JSON.stringify({ skipped: true, reason: 'quality-gated package already exists', date, topicId: existing.topicId }, null, 2));
      return;
    }
  }
  const history = loadJson(HISTORY_FILE, { version: 1, generated: [] });
  const { topic, note } = chooseTopic(config, history, date, args.topic);
  if (topic.type !== 'local_guide') {
    throw new Error(`Topic ${topic.id} requires an approved business-photo adapter that is not enabled yet`);
  }
  const editorialReview = validateEditorialTopic(topic, config.editorial, date);
  const sourceChecks = await verifyFactualSources(topic, config.editorial);

  const outDir = path.join(packageRoot, `.${date}.work-${process.pid}-${Date.now()}`);
  fs.mkdirSync(outDir, { recursive: true });
  const photos = await fetchCommonsPhotos(topic.photoQuery, 3);
  const photoFiles = [];
  for (let i = 0; i < photos.length; i++) {
    const ext = /png/i.test(photos[i].mime) ? 'png' : 'jpg';
    const file = path.join(outDir, `photo-${i + 1}.${ext}`);
    await downloadPhoto(photos[i], file);
    photoFiles.push(file);
  }

  const slides = await renderSlides(topic, photos, photoFiles, outDir, config);
  const rendered = await renderReel(slides, outDir, config, topic);
  const reel = rendered.output;
  if (config.editorial.requireVoiceover && !rendered.hasNarration) {
    throw new Error('Editorial gate failed: Korean voiceover is required');
  }
  const caption = makeCaption(topic, photos);
  fs.writeFileSync(path.join(outDir, 'caption.txt'), caption + '\n');

  const duration = Number(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', reel,
  ], { encoding: 'utf8' }).trim());
  const distinctArtists = new Set(photos.map(p => p.artist)).size;
  const rightsCleared = photos.every(p => ALLOWED_LICENSES.test(p.license));
  const attributionComplete = photos.every(p => p.artist && p.licenseUrl && p.descriptionUrl);
  const narrationComplete = rendered.narrationDuration <= duration - 0.25;
  const technicalFormat = duration <= 30 && config.reel.width / config.reel.height === 9 / 16;
  const qualityBreakdown = {
    structure: 15,
    freshness: editorialReview.factAgeDays <= config.editorial.maximumFactAgeDays ? 10 : 0,
    approvedSources: editorialReview.sourceUrls.every(url => sourceHostAllowed(url, config.editorial.allowedSourceHosts)) ? 15 : 0,
    reachableSources: sourceChecks.every(source => source.reachable) ? 15 : 0,
    threePhotos: photos.length === 3 ? 15 : 0,
    artistDiversity: distinctArtists >= config.editorial.minimumDistinctPhotoArtists ? 5 : 0,
    rightsAndAttribution: rightsCleared && attributionComplete ? 10 : 0,
    voiceover: rendered.hasNarration && narrationComplete ? 5 : 0,
    technical: technicalFormat ? 5 : 0,
    toneAndLocalRelevance: editorialReview.blockedPhrases.length === 0 && editorialReview.localRelevance ? 5 : 0,
  };
  const qualityScore = Object.values(qualityBreakdown).reduce((sum, score) => sum + score, 0);
  if (qualityScore < config.editorial.minimumQualityScore) {
    throw new Error(`Editorial quality score ${qualityScore} is below ${config.editorial.minimumQualityScore}: ${JSON.stringify(qualityBreakdown)}`);
  }
  const manifest = {
    version: 2,
    status: 'preview_ready',
    publishApproved: false,
    generatedAt: new Date().toISOString(),
    date,
    timezone: config.timezone,
    topicId: topic.id,
    factCheckedAt: topic.factCheckedAt,
    selectionNote: note,
    editorial: {
      market: config.editorial.market,
      qualityScore,
      minimumQualityScore: config.editorial.minimumQualityScore,
      qualityBreakdown,
      sourceChecks,
      distinctPhotoArtists: distinctArtists,
    },
    format: 'reel',
    dimensions: `${config.reel.width}x${config.reel.height}`,
    fps: config.reel.fps,
    durationSec: Math.round(duration * 10) / 10,
    audio: rendered.hasNarration ? 'Google Cloud TTS Leda narration with original low-volume tone bed' : 'original low-volume tone bed',
    voiceover: rendered.hasNarration,
    voice: {
      provider: rendered.provider,
      name: rendered.voiceName,
      postSpeed: config.editorial.voice.postSpeed,
      configFingerprint: voiceConfigFingerprint(config.editorial.voice),
      narrationDurationSec: Math.round(rendered.narrationDuration * 10) / 10,
      complete: narrationComplete,
    },
    narration: rendered.hasNarration ? path.basename(rendered.narration) : null,
    reel: path.basename(reel),
    cover: path.basename(slides[0]),
    slides: slides.map(file => path.basename(file)),
    caption: 'caption.txt',
    renderInputs: ['reel-concat.txt'],
    facts: topic.facts.map(f => ({ label: f.sourceLabel, url: f.sourceUrl })),
    photos: photos.map((p, i) => ({
      file: path.basename(photoFiles[i]), title: p.title, artist: p.artist,
      license: p.license, licenseUrl: p.licenseUrl, sourceUrl: p.descriptionUrl,
      adaptations: ['9:16 crop', 'text overlay'],
    })),
    gates: {
      realPhotos: true,
      rightsCleared,
      attributionComplete,
      factualSources: editorialReview.sourceUrls.every(url => sourceHostAllowed(url, config.editorial.allowedSourceHosts)),
      sourceReachability: sourceChecks.every(source => source.reachable),
      photoArtistDiversity: distinctArtists >= config.editorial.minimumDistinctPhotoArtists,
      voiceover: rendered.hasNarration && narrationComplete,
      under30Seconds: duration <= 30,
      vertical9x16: config.reel.width / config.reel.height === 9 / 16,
      editorialQuality: qualityScore >= config.editorial.minimumQualityScore,
      publicPosting: false
    }
  };
  const artifactNames = [manifest.reel, manifest.cover, ...manifest.slides, manifest.caption,
    manifest.narration, ...manifest.photos.map(photo => photo.file), ...manifest.renderInputs].filter(Boolean);
  manifest.artifacts = Object.fromEntries([...new Set(artifactNames)].map(name => [name, fileDigest(path.join(outDir, name))]));
  saveJson(path.join(outDir, 'manifest.json'), manifest);

  const supersededDir = promotePackage(outDir, finalOutDir);

  const existingIndex = (history.generated || []).findIndex(v => v.date === date);
  const historyEntry = { date, topicId: topic.id, status: 'preview_ready', outputDir: path.relative(BASE, finalOutDir) };
  if (existingIndex >= 0) history.generated[existingIndex] = historyEntry;
  else history.generated.push(historyEntry);
  saveJson(HISTORY_FILE, history);

  console.log(JSON.stringify({ outDir: finalOutDir, reel: path.join(finalOutDir, manifest.reel),
    cover: path.join(finalOutDir, manifest.cover), supersededDir, topicId: topic.id,
    durationSec: manifest.durationSec, gates: manifest.gates }, null, 2));
}

main().catch(error => {
  console.error(`instagram-v2 failed: ${error.message}`);
  process.exit(1);
});
