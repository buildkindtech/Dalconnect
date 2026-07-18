#!/usr/bin/env node
'use strict';

/**
 * DalKonnect growth feedback loop.
 *
 * Read-only inputs:
 *   - GA4 traffic and landing-page performance
 *   - Instagram account/media insights via macOS Keychain
 *
 * Local output:
 *   memory/growth-loop/latest.json
 *
 * This job never publishes, sends messages, changes production data, or prints
 * credentials. The Instagram generator may use its ranked topic IDs, while all
 * existing editorial, rights, recency, and one-post-per-day gates remain active.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const BASE = process.env.DALCONNECT_DIR || path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(BASE, 'config', 'instagram-v2-topics.json');
const OUTPUT_FILE = process.env.DALCONNECT_GROWTH_STRATEGY_FILE ||
  path.join(BASE, 'memory', 'growth-loop', 'latest.json');
const GA4_PROPERTY_ID = process.env.DALCONNECT_GA4_PROPERTY_ID || '528528065';
const GOOGLE_KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(BASE, 'konnect-firebase-key.json');
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v24.0';
const SEARCH_CONSOLE_SITE = 'https://dalkonnect.com/';

const PILLAR_KEYWORDS = {
  severe_weather: ['tornado', '토네이도', '폭염', 'heat', '날씨', 'weather', '차량열사병'],
  local_services: ['311', '211', '911', '도움', '번호', 'help', '응급'],
  local_business: ['업소', '맛집', 'restaurant', 'business', '마켓', '병원', '교회'],
  community_life: ['커뮤니티', '육아', '가족', '이민', '비자', '생활', 'roommate'],
};

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
  const temp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(temp, file);
}

function readKeychain(service) {
  return execFileSync('security', [
    'find-generic-password', '-a', 'dalkonnect', '-s', service, '-w',
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function classifyPillar(text = '') {
  const normalized = String(text).toLowerCase();
  const matches = Object.entries(PILLAR_KEYWORDS).map(([pillar, words]) => ({
    pillar,
    hits: words.filter(word => normalized.includes(word.toLowerCase())).length,
  })).sort((a, b) => b.hits - a.hits);
  return matches[0]?.hits > 0 ? matches[0].pillar : 'other';
}

function value(row, index) {
  return Number(row.metricValues?.[index]?.value || 0);
}

async function collectGa4() {
  if (!fs.existsSync(GOOGLE_KEY_FILE)) throw new Error('GA4 credential file is unavailable');
  const client = new BetaAnalyticsDataClient({ keyFilename: GOOGLE_KEY_FILE });

  const [channels, landings] = await Promise.all([
    client.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [
        { startDate: '7daysAgo', endDate: 'yesterday', name: 'current' },
        { startDate: '14daysAgo', endDate: '8daysAgo', name: 'previous' },
      ],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'sessions' }, { name: 'activeUsers' },
        { name: 'screenPageViews' }, { name: 'engagedSessions' },
      ],
    }),
    client.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '28daysAgo', endDate: 'yesterday' }],
      dimensions: [{ name: 'landingPagePlusQueryString' }],
      metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }, { name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 25,
    }),
  ]);

  const periods = { current: {}, previous: {} };
  for (const row of channels[0].rows || []) {
    const channel = row.dimensionValues?.[0]?.value || 'Unknown';
    const period = row.dimensionValues?.[1]?.value || 'current';
    if (!periods[period]) periods[period] = {};
    periods[period][channel] = {
      sessions: value(row, 0), users: value(row, 1), views: value(row, 2), engagedSessions: value(row, 3),
    };
  }

  const landingPages = (landings[0].rows || []).map(row => ({
    path: row.dimensionValues?.[0]?.value || '(not set)',
    sessions: value(row, 0), engagedSessions: value(row, 1), views: value(row, 2),
  })).filter(row => row.path !== '(not set)' && !/[?&](?:fbclid|gclid)=/i.test(row.path));

  return { periods, landingPages };
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

async function googleAccessToken(scope) {
  const credentials = JSON.parse(fs.readFileSync(GOOGLE_KEY_FILE, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signature = crypto.createSign('RSA-SHA256')
    .update(`${header}.${payload}`).sign(credentials.private_key).toString('base64url');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${payload}.${signature}`,
    }),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error(`Google OAuth failed (${response.status})`);
  return body.access_token;
}

function isoDate(daysAgo) {
  const date = new Date(Date.now() - daysAgo * 86400000);
  return date.toISOString().slice(0, 10);
}

async function collectSearchConsole() {
  const token = await googleAccessToken('https://www.googleapis.com/auth/webmasters.readonly');
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SEARCH_CONSOLE_SITE)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      startDate: isoDate(31),
      endDate: isoDate(3),
      dimensions: ['query', 'page'],
      rowLimit: 250,
      dataState: 'final',
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Search Console API unavailable (${response.status})`);
  const rows = (body.rows || []).map(row => ({
    query: row.keys?.[0] || '',
    page: row.keys?.[1] || '',
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number((Number(row.ctr || 0) * 100).toFixed(2)),
    position: Number(Number(row.position || 0).toFixed(1)),
  }));
  const opportunities = rows.filter(row => row.impressions >= 5 && row.position >= 4 && row.position <= 20)
    .sort((a, b) => b.impressions - a.impressions || a.position - b.position)
    .slice(0, 25);
  return { status: 'ready', rows: rows.length, opportunities };
}

async function graphGet(id, fields, token, params = {}) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${id}`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('access_token', token);
  for (const [key, val] of Object.entries(params)) url.searchParams.set(key, String(val));
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(`Meta Graph request failed (${response.status}/${body.error?.code || 'unknown'})`);
  return body;
}

function mapInsightMetrics(data = []) {
  return Object.fromEntries(data.map(metric => [
    metric.name,
    Number(metric.values?.[0]?.value ?? metric.value ?? 0),
  ]).filter(([name]) => Boolean(name)));
}

async function collectInstagram() {
  const token = readKeychain('DALKONNECT_FB_PAGE_TOKEN');
  const igId = readKeychain('INSTAGRAM_BUSINESS_ACCOUNT_ID');
  const [account, mediaResult] = await Promise.all([
    graphGet(igId, 'username,followers_count,media_count', token),
    graphGet(`${igId}/media`, 'id,media_type,caption,timestamp,like_count,comments_count', token, { limit: 25 }),
  ]);

  const eligible = (mediaResult.data || []).filter(post => {
    const age = Date.now() - new Date(post.timestamp).getTime();
    return age >= 6 * 60 * 60 * 1000 && age <= 30 * 24 * 60 * 60 * 1000;
  }).slice(0, 12);

  const posts = [];
  for (const post of eligible) {
    try {
      const insights = await graphGet(`${post.id}/insights`, 'name,values', token, {
        metric: 'reach,saved,shares',
      });
      const metrics = mapInsightMetrics(insights.data || []);
      posts.push({
        id: post.id,
        pillar: classifyPillar(post.caption),
        postedAt: post.timestamp,
        mediaType: post.media_type,
        reach: metrics.reach || 0,
        saves: metrics.saved || 0,
        shares: metrics.shares || 0,
        comments: Number(post.comments_count || 0),
        likes: Number(post.like_count || 0),
      });
    } catch (error) {
      posts.push({ id: post.id, pillar: classifyPillar(post.caption), postedAt: post.timestamp,
        mediaType: post.media_type, metricsUnavailable: true });
    }
  }

  return {
    account: { username: account.username, followers: account.followers_count, mediaCount: account.media_count },
    posts,
  };
}

function aggregatePillars(posts) {
  const groups = {};
  for (const post of posts.filter(p => !p.metricsUnavailable && p.reach > 0)) {
    if (!groups[post.pillar]) groups[post.pillar] = [];
    groups[post.pillar].push(post);
  }
  return Object.fromEntries(Object.entries(groups).map(([pillar, items]) => {
    const totalReach = items.reduce((sum, p) => sum + p.reach, 0);
    const totalQuality = items.reduce((sum, p) => sum + p.saves + p.shares + p.comments, 0);
    return [pillar, {
      sampleCount: items.length,
      averageReach: Math.round(totalReach / items.length),
      qualityRate: totalReach ? Number((100 * totalQuality / totalReach).toFixed(2)) : 0,
      score: Math.round((totalReach / items.length) * (1 + Math.min(0.5, totalQuality / Math.max(1, totalReach) * 5))),
    }];
  }));
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function buildStrategy({ ga4, instagram, searchConsole = { status: 'unavailable', opportunities: [] },
  config, generatedAt = new Date().toISOString() }) {
  const pillarStats = aggregatePillars(instagram.posts || []);
  const rankedPillars = Object.entries(pillarStats)
    .filter(([pillar, stats]) => pillar !== 'other' && stats.sampleCount >= 2)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([pillar]) => pillar);
  const searchPillarDemand = {};
  for (const row of searchConsole.opportunities || []) {
    const pillar = classifyPillar(row.query);
    if (pillar !== 'other') searchPillarDemand[pillar] = (searchPillarDemand[pillar] || 0) + row.impressions;
  }
  const rankedSearchPillars = Object.entries(searchPillarDemand)
    .sort((a, b) => b[1] - a[1]).map(([pillar]) => pillar);
  const fallbackPillars = ['local_services', 'severe_weather', 'community_life', 'local_business'];
  const preferredPillars = [...new Set([...rankedPillars, ...rankedSearchPillars, ...fallbackPillars])];
  const topicPillar = topic => topic.pillar || classifyPillar([
    topic.id, topic.hook, topic.captionLead, ...(topic.hashtags || []),
  ].join(' '));
  const pillarRank = topic => {
    const index = preferredPillars.indexOf(topicPillar(topic));
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  const preferredTopicIds = [...(config.topics || [])]
    .sort((a, b) => pillarRank(a) - pillarRank(b))
    .map(topic => topic.id);

  const current = ga4.periods.current || {};
  const previous = ga4.periods.previous || {};
  const channel = name => ({ current: current[name]?.sessions || 0, previous: previous[name]?.sessions || 0 });
  const organic = channel('Organic Search');
  const social = channel('Organic Social');
  const totalEngaged = Object.values(current).reduce((sum, row) => sum + (row.engagedSessions || 0), 0);
  const topLanding = ga4.landingPages.find(page => page.path !== '/') || ga4.landingPages[0] || null;

  return {
    schemaVersion: 1,
    generatedAt,
    status: 'ready',
    primaryKpis: {
      weeklyEngagedSessions: totalEngaged,
      weeklyOrganicSearchSessions: organic.current,
      weeklyOrganicSocialSessions: social.current,
      instagramFollowers: instagram.account.followers,
    },
    trends: {
      organicSearchSessionsPct: percentChange(organic.current, organic.previous),
      organicSocialSessionsPct: percentChange(social.current, social.previous),
    },
    instagram: { account: instagram.account, pillarStats, measuredPosts: instagram.posts.length },
    searchConsole: {
      status: searchConsole.status || 'unavailable',
      opportunityCount: searchConsole.opportunities?.length || 0,
      opportunities: (searchConsole.opportunities || []).slice(0, 10),
      pillarDemand: searchPillarDemand,
    },
    site: {
      topLandingPages: ga4.landingPages.slice(0, 10),
      suggestedCtaPath: topLanding?.path || '/',
      trackedInstagramProfileUrl: 'https://dalkonnect.com/ig',
    },
    contentStrategy: {
      preferredPillars,
      preferredTopicIds,
      evidenceLevel: rankedPillars.length && rankedSearchPillars.length ? 'measured-cross-channel'
        : rankedPillars.length ? 'measured-instagram'
          : rankedSearchPillars.length ? 'measured-search'
            : 'insufficient-pillar-sample',
      rule: 'Rank only within the editorially approved daily schedule; preserve recency and quality gates.',
    },
    guardrails: {
      doesNotPublish: true,
      doesNotSendMessages: true,
      doesNotMutateProductionData: true,
      minimumPillarSample: 2,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const config = loadJson(CONFIG_FILE, null);
  if (!config) throw new Error(`Missing config: ${CONFIG_FILE}`);

  const fixture = args.fixture ? loadJson(path.resolve(args.fixture), null) : null;
  const [ga4Result, instagramResult, searchConsoleResult] = fixture
    ? [
      { status: 'fulfilled', value: fixture.ga4 },
      { status: 'fulfilled', value: fixture.instagram },
      { status: 'fulfilled', value: fixture.searchConsole || { status: 'unavailable', opportunities: [] } },
    ]
    : await Promise.allSettled([collectGa4(), collectInstagram(), collectSearchConsole()]);

  if (ga4Result.status !== 'fulfilled' || instagramResult.status !== 'fulfilled') {
    const failures = [ga4Result, instagramResult]
      .filter(result => result.status === 'rejected')
      .map(result => result.reason?.message || 'unknown source failure');
    throw new Error(`Growth inputs unavailable: ${failures.join('; ')}`);
  }

  const searchConsole = searchConsoleResult.status === 'fulfilled'
    ? searchConsoleResult.value
    : { status: 'permission-required', opportunities: [] };
  const strategy = buildStrategy({
    ga4: ga4Result.value, instagram: instagramResult.value, searchConsole, config,
  });
  if (!args['no-write']) saveJson(args.output ? path.resolve(args.output) : OUTPUT_FILE, strategy);
  console.log(JSON.stringify({
    status: strategy.status,
    output: args['no-write'] ? null : (args.output ? path.resolve(args.output) : OUTPUT_FILE),
    kpis: strategy.primaryKpis,
    trends: strategy.trends,
    searchConsoleStatus: strategy.searchConsole.status,
    evidenceLevel: strategy.contentStrategy.evidenceLevel,
    preferredTopicIds: strategy.contentStrategy.preferredTopicIds,
  }, null, 2));
}

if (require.main === module) {
  main().catch(error => {
    console.error(`growth-loop failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { aggregatePillars, buildStrategy, classifyPillar, mapInsightMetrics, percentChange };
