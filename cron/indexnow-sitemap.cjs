#!/usr/bin/env node
'use strict';

/**
 * Submit newly discovered public DalKonnect sitemap URLs to IndexNow.
 *
 * The verification key is public by design. This job reads only public
 * sitemaps, stores a local URL fingerprint, and never touches the database or
 * sends messages. The first run seeds state without submitting the full site.
 */

const fs = require('fs');
const path = require('path');

const BASE = process.env.DALCONNECT_DIR || path.resolve(__dirname, '..');
const SITE = 'https://dalkonnect.com';
const HOST = 'dalkonnect.com';
const KEY = 'c1f644d41ada90fc4829047ff3f562f5';
const STATE_FILE = process.env.DALCONNECT_INDEXNOW_STATE_FILE ||
  path.join(BASE, 'memory', 'growth-loop', 'indexnow-state.json');
const MAX_URLS = 200;

function parseArgs(argv) {
  return Object.fromEntries(argv.slice(2).filter(v => v.startsWith('--')).map(v => {
    const [key, ...rest] = v.slice(2).split('=');
    return [key, rest.length ? rest.join('=') : true];
  }));
}

function extractLocs(xml = '') {
  return [...String(xml).matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(match =>
    match[1].replace(/&amp;/g, '&').trim()
  );
}

function isPublicSiteUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === HOST &&
      !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/admin');
  } catch {
    return false;
  }
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'DalKonnectIndexingBot/1.0' } });
  if (!response.ok) throw new Error(`Sitemap fetch failed (${response.status} ${new URL(url).pathname})`);
  return response.text();
}

async function collectSitemapUrls(indexUrl = `${SITE}/sitemap.xml`) {
  const indexXml = await fetchText(indexUrl);
  const locs = extractLocs(indexXml);
  const nested = locs.filter(url => /sitemap\.xml/i.test(url));
  if (!nested.length) return [...new Set(locs.filter(isPublicSiteUrl))].sort();

  const sitemapBodies = await Promise.all(nested.slice(0, 20).map(fetchText));
  return [...new Set(sitemapBodies.flatMap(extractLocs).filter(isPublicSiteUrl))].sort();
}

function loadState(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function saveState(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(temp, file);
}

function diffUrls(current, previous = []) {
  const seen = new Set(previous);
  return current.filter(url => !seen.has(url));
}

function planRun(urls, previous, maxUrls = MAX_URLS) {
  if (!previous) {
    return { status: 'seeded', batch: [], pendingAfterRun: 0, nextKnownUrls: [...urls] };
  }
  const pending = diffUrls(urls, previous.urls || []);
  const batch = pending.slice(0, maxUrls);
  return {
    status: batch.length ? 'new-urls-found' : 'no-change',
    batch,
    pendingAfterRun: Math.max(0, pending.length - batch.length),
    nextKnownUrls: [...new Set([...(previous.urls || []), ...batch])].sort(),
  };
}

async function submit(urlList) {
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList,
    }),
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejected submission (${response.status})`);
  }
  return response.status;
}

async function main() {
  const args = parseArgs(process.argv);
  const stateFile = args.state ? path.resolve(args.state) : STATE_FILE;
  const urls = await collectSitemapUrls(args.sitemap || `${SITE}/sitemap.xml`);
  if (!urls.length) throw new Error('No public sitemap URLs found');

  const previous = loadState(stateFile);
  const plan = planRun(urls, previous);
  if (plan.status === 'seeded') {
    if (!args['dry-run']) saveState(stateFile, {
      seededAt: new Date().toISOString(), urls: plan.nextKnownUrls,
    });
    console.log(JSON.stringify({ status: 'seeded', discovered: urls.length, submitted: 0,
      dryRun: Boolean(args['dry-run']) }, null, 2));
    return;
  }

  const added = plan.batch;
  let responseStatus = null;
  if (added.length && !args['dry-run']) responseStatus = await submit(added);
  if (!args['dry-run']) {
    saveState(stateFile, {
      seededAt: previous.seededAt || new Date().toISOString(),
      checkedAt: new Date().toISOString(),
      lastSubmittedAt: added.length ? new Date().toISOString() : previous.lastSubmittedAt || null,
      lastResponseStatus: responseStatus,
      // Keep unsubmitted overflow out of the known set so the next run retries
      // it instead of silently dropping URLs beyond the daily batch limit.
      urls: plan.nextKnownUrls,
    });
  }
  console.log(JSON.stringify({ status: plan.status,
    discovered: urls.length, submitted: args['dry-run'] ? 0 : added.length,
    wouldSubmit: args['dry-run'] ? added.length : undefined,
    pendingAfterRun: args['dry-run'] ? plan.pendingAfterRun + added.length : plan.pendingAfterRun,
    responseStatus,
    dryRun: Boolean(args['dry-run']) }, null, 2));
}

if (require.main === module) {
  main().catch(error => {
    console.error(`indexnow-sitemap failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { collectSitemapUrls, diffUrls, extractLocs, isPublicSiteUrl, planRun };
