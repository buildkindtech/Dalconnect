'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { diffUrls, extractLocs, isPublicSiteUrl, planRun } = require('./indexnow-sitemap.cjs');

test('extracts and decodes sitemap locations', () => {
  const xml = '<urlset><url><loc>https://dalkonnect.com/news/1?a=1&amp;b=2</loc></url></urlset>';
  assert.deepEqual(extractLocs(xml), ['https://dalkonnect.com/news/1?a=1&b=2']);
});

test('accepts only public canonical site URLs', () => {
  assert.equal(isPublicSiteUrl('https://dalkonnect.com/news/1'), true);
  assert.equal(isPublicSiteUrl('https://dalkonnect.com/api/news'), false);
  assert.equal(isPublicSiteUrl('https://example.com/news/1'), false);
});

test('returns only newly discovered URLs in sitemap order', () => {
  assert.deepEqual(diffUrls(
    ['https://dalkonnect.com/a', 'https://dalkonnect.com/b'],
    ['https://dalkonnect.com/a'],
  ), ['https://dalkonnect.com/b']);
});

test('does not treat existing URLs as new when sitemap order changes', () => {
  assert.deepEqual(diffUrls(
    ['https://dalkonnect.com/b', 'https://dalkonnect.com/a'],
    ['https://dalkonnect.com/a', 'https://dalkonnect.com/b'],
  ), []);
});

test('first run seeds all sitemap URLs and submits none', () => {
  const urls = ['https://dalkonnect.com/a', 'https://dalkonnect.com/b'];
  const plan = planRun(urls, null);
  assert.equal(plan.status, 'seeded');
  assert.deepEqual(plan.batch, []);
  assert.deepEqual(plan.nextKnownUrls, urls);
});

test('caps a batch at 200 and leaves overflow pending for the next run', () => {
  const existing = ['https://dalkonnect.com/existing'];
  const added = Array.from({ length: 450 }, (_, index) => `https://dalkonnect.com/news/${index}`);
  const plan = planRun([...existing, ...added], { urls: existing }, 200);
  assert.equal(plan.batch.length, 200);
  assert.equal(plan.pendingAfterRun, 250);
  assert.equal(plan.nextKnownUrls.length, 201);
  assert.equal(plan.nextKnownUrls.includes(added[300]), false);
});
