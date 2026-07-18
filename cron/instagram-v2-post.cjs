#!/usr/bin/env node
'use strict';

/**
 * Publish one quality-gated DalKonnect Instagram V2 Reel.
 *
 * Default: local/offline validation only.
 * Public posting requires both config publishing.enabled=true and --publish.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const admin = require('firebase-admin');

const BASE = process.env.DALCONNECT_DIR || path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(BASE, 'config', 'instagram-v2-topics.json');
const REGISTRY_FILE = path.join(BASE, 'memory', 'instagram-v2-posted.json');
const LOCK_FILE = '/tmp/dalkonnect-instagram-v2-post.lock';
const ENV_FILES = [path.join(BASE, '.env.local'), '/Users/aaron/.claude/api-keys.env'];

function parseArgs(argv) {
  return Object.fromEntries(argv.slice(2).filter(v => v.startsWith('--')).map(v => {
    const [key, ...rest] = v.slice(2).split('=');
    return [key, rest.length ? rest.join('=') : true];
  }));
}

function chicagoDate(input) {
  if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const value = input ? new Date(input) : new Date();
  if (Number.isNaN(value.getTime())) throw new Error(`Invalid date: ${input}`);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value);
}

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    const value = execFileSync('/usr/bin/security', [
      'find-generic-password', '-a', 'dalkonnect', '-s', name, '-w',
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (value) return value;
  } catch {}
  for (const file of ENV_FILES) {
    if (!fs.existsSync(file)) continue;
    const match = fs.readFileSync(file, 'utf8').match(new RegExp(`^(?:export\\s+)?${name}=(.*)$`, 'm'));
    if (match) return match[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return null;
}

function loadJson(file, fallback = null) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function saveJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function digest(file) {
  const data = fs.readFileSync(file);
  return { bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') };
}

function stableFingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function acquireRunLock() {
  try {
    const fd = fs.openSync(LOCK_FILE, 'wx');
    fs.writeFileSync(fd, String(process.pid));
    return () => {
      try { fs.closeSync(fd); } catch {}
      try { fs.unlinkSync(LOCK_FILE); } catch {}
    };
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const pid = Number(fs.readFileSync(LOCK_FILE, 'utf8').trim());
    try {
      if (pid > 0) process.kill(pid, 0);
      throw new Error(`Another Instagram publisher is already running (PID ${pid})`);
    } catch (pidError) {
      if (pidError.code !== 'ESRCH') throw pidError;
      fs.unlinkSync(LOCK_FILE);
      return acquireRunLock();
    }
  }
}

function validatePackage(date, config) {
  const dir = path.join(BASE, 'memory', 'instagram-v2', date);
  const manifestFile = path.join(dir, 'manifest.json');
  const manifest = loadJson(manifestFile);
  if (!manifest || manifest.status !== 'preview_ready' || manifest.publishApproved !== false) {
    throw new Error(`No immutable preview-ready package for ${date}`);
  }
  const requiredGates = ['realPhotos', 'rightsCleared', 'attributionComplete', 'factualSources',
    'sourceReachability', 'photoArtistDiversity', 'voiceover', 'under30Seconds',
    'vertical9x16', 'editorialQuality'];
  if (!requiredGates.every(gate => manifest.gates?.[gate] === true)) {
    throw new Error('Package quality gates are incomplete');
  }
  if (manifest.editorial?.qualityScore < config.publishing.requireQualityScore ||
      manifest.voice?.name !== config.editorial.voice.name || manifest.voice?.complete !== true ||
      manifest.voice?.configFingerprint !== stableFingerprint(config.editorial.voice)) {
    throw new Error('Editorial or Leda voice gate failed');
  }
  const actualFiles = fs.readdirSync(dir).filter(name => fs.statSync(path.join(dir, name)).isFile()).sort();
  const expectedFiles = ['manifest.json', ...Object.keys(manifest.artifacts || {})].sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) throw new Error('Package file set mismatch');
  for (const [name, expected] of Object.entries(manifest.artifacts || {})) {
    if (path.basename(name) !== name) throw new Error(`Unsafe artifact name: ${name}`);
    const actual = digest(path.join(dir, name));
    if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
      throw new Error(`Artifact integrity failed: ${name}`);
    }
  }
  const probe = JSON.parse(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate:format=duration',
    '-of', 'json', path.join(dir, manifest.reel),
  ], { encoding: 'utf8' }));
  const video = probe.streams?.find(stream => stream.codec_name === 'h264');
  const audio = probe.streams?.find(stream => stream.codec_name === 'aac');
  const duration = Number(probe.format?.duration || 0);
  if (video?.width !== config.reel.width || video?.height !== config.reel.height ||
      video?.r_frame_rate !== `${config.reel.fps}/1` || !audio || duration <= 0 || duration > config.reel.maxSeconds) {
    throw new Error('Reel media validation failed');
  }
  const caption = fs.readFileSync(path.join(dir, manifest.caption), 'utf8').trim();
  if (!caption.includes('정보 확인일:') || !caption.includes('정보 출처') || !caption.includes('사진 출처')) {
    throw new Error('Caption attribution sections are incomplete');
  }
  return { dir, manifest, caption, artifactHash: manifest.artifacts[manifest.reel].sha256 };
}

async function checkInstagramCredential(version, token, igId) {
  const response = await fetch(`https://graph.facebook.com/${version}/${igId}?fields=id,username&access_token=${encodeURIComponent(token)}`);
  const data = await response.json();
  if (!response.ok || !data.id) throw new Error(`Instagram credential invalid (HTTP ${response.status}, code ${data.error?.code || 'unknown'})`);
  return data.username;
}

async function uploadAssets(date, pkg) {
  const serviceAccountFile = path.join(BASE, 'konnect-firebase-key.json');
  if (!fs.existsSync(serviceAccountFile)) throw new Error('Firebase service account is missing');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountFile)),
      storageBucket: 'konnect-ceedb.firebasestorage.app',
    });
  }
  const bucket = admin.storage().bucket();
  const prefix = `instagram-v2/${date}/${pkg.artifactHash.slice(0, 16)}`;
  const videoDest = `${prefix}/reel-preview.mp4`;
  const coverJpg = path.join('/tmp', `dalkonnect-instagram-cover-${date}.jpg`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(pkg.dir, pkg.manifest.cover), '-q:v', '2', coverJpg]);
  const coverDest = `${prefix}/cover.jpg`;
  await bucket.upload(path.join(pkg.dir, pkg.manifest.reel), { destination: videoDest, metadata: { contentType: 'video/mp4' } });
  await bucket.upload(coverJpg, { destination: coverDest, metadata: { contentType: 'image/jpeg' } });
  const expires = Date.now() + 2 * 60 * 60 * 1000;
  const [[videoUrl], [coverUrl]] = await Promise.all([
    bucket.file(videoDest).getSignedUrl({ action: 'read', expires }),
    bucket.file(coverDest).getSignedUrl({ action: 'read', expires }),
  ]);
  return { videoUrl, coverUrl };
}

async function publishReel(config, token, igId, pkg, urls) {
  const version = config.publishing.graphVersion;
  const containerResponse = await fetch(`https://graph.facebook.com/${version}/${igId}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'REELS', video_url: urls.videoUrl, cover_url: urls.coverUrl,
      caption: pkg.caption, share_to_feed: true, access_token: token }),
  });
  const container = await containerResponse.json();
  if (!containerResponse.ok || !container.id) throw new Error(`Container creation failed: ${container.error?.message || containerResponse.status}`);
  let finished = false;
  for (let attempt = 1; attempt <= 40; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 7500));
    const response = await fetch(`https://graph.facebook.com/${version}/${container.id}?fields=status_code,status&access_token=${encodeURIComponent(token)}`);
    const status = await response.json();
    if (status.status_code === 'FINISHED') { finished = true; break; }
    if (!response.ok || status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
      throw new Error(`Container processing failed: ${status.status || status.error?.message || status.status_code}`);
    }
  }
  if (!finished) throw new Error('Container processing timed out');
  const publishResponse = await fetch(`https://graph.facebook.com/${version}/${igId}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });
  const published = await publishResponse.json();
  if (!publishResponse.ok || !published.id) throw new Error(`Publish failed: ${published.error?.message || publishResponse.status}`);
  return published.id;
}

async function main() {
  const args = parseArgs(process.argv);
  const date = chicagoDate(args.date);
  const config = loadJson(CONFIG_FILE);
  if (!config?.publishing?.enabled || config.publishing.platform !== 'instagram') throw new Error('Automatic Instagram publishing is disabled');
  const pkg = validatePackage(date, config);
  const registry = loadJson(REGISTRY_FILE, { version: 1, posts: [] });
  const publishDate = chicagoDate();
  const dailyPosts = registry.posts.filter(post =>
    (post.publishDate || (post.publishedAt && chicagoDate(post.publishedAt))) === publishDate
  ).length;
  if (dailyPosts >= config.publishing.maxPostsPerDay) {
    console.log(JSON.stringify({ skipped: true, reason: 'daily post limit reached', date }, null, 2));
    return;
  }
  const existing = registry.posts.find(post => post.date === date || post.artifactHash === pkg.artifactHash);
  if (existing) {
    console.log(JSON.stringify({ skipped: true, reason: 'already published', date, igMediaId: existing.igMediaId }, null, 2));
    return;
  }
  console.log(JSON.stringify({ localValidation: 'passed', date, topicId: pkg.manifest.topicId,
    qualityScore: pkg.manifest.editorial.qualityScore, durationSec: pkg.manifest.durationSec,
    voice: pkg.manifest.voice.name, publicMutation: Boolean(args.publish) }, null, 2));
  if (!args.publish) return;

  const token = readEnv('DALKONNECT_FB_PAGE_TOKEN') || readEnv('FACEBOOK_PAGE_ACCESS_TOKEN');
  const igId = readEnv('INSTAGRAM_BUSINESS_ACCOUNT_ID') || readEnv('IG_BUSINESS_ACCOUNT_ID');
  if (!token || !igId) throw new Error('Instagram credentials are not configured');
  const username = await checkInstagramCredential(config.publishing.graphVersion, token, igId);
  const urls = await uploadAssets(date, pkg);
  const igMediaId = await publishReel(config, token, igId, pkg, urls);
  registry.posts.push({ date, publishDate, topicId: pkg.manifest.topicId, artifactHash: pkg.artifactHash,
    igMediaId, username, publishedAt: new Date().toISOString() });
  saveJson(REGISTRY_FILE, registry);
  console.log(JSON.stringify({ published: true, date, igMediaId, username }, null, 2));
}

const releaseLock = acquireRunLock();
main()
  .catch(error => {
    console.error(`instagram-v2-post failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(releaseLock);
