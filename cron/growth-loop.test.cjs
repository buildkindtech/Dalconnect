'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildStrategy, classifyPillar, mapInsightMetrics, percentChange } = require('./growth-loop.cjs');
const { chooseTopic } = require('./instagram-v2.cjs');

test('classifies approved local information pillars', () => {
  assert.equal(classifyPillar('달라스 311 요청 방법'), 'local_services');
  assert.equal(classifyPillar('DFW tornado watch 토네이도 경보'), 'severe_weather');
  assert.equal(classifyPillar('달라스 한인 맛집 업소'), 'local_business');
});

test('calculates bounded week-over-week changes', () => {
  assert.equal(percentChange(2, 10), -80);
  assert.equal(percentChange(0, 0), 0);
  assert.equal(percentChange(4, 0), 100);
});

test('maps the Meta Insights name and values response', () => {
  assert.deepEqual(mapInsightMetrics([
    { name: 'reach', values: [{ value: 150 }] },
    { name: 'saved', values: [{ value: 2 }] },
    { name: 'shares', values: [{ value: 4 }] },
  ]), { reach: 150, saved: 2, shares: 4 });
});

test('ranks topics from measured Instagram performance without adding topics', () => {
  const ga4 = {
    periods: {
      current: { 'Organic Search': { sessions: 2, engagedSessions: 1 } },
      previous: { 'Organic Search': { sessions: 10, engagedSessions: 7 } },
    },
    landingPages: [{ path: '/community', sessions: 3, engagedSessions: 2, views: 5 }],
  };
  const instagram = {
    account: { username: 'dalkonnect', followers: 289, mediaCount: 219 },
    posts: [
      { pillar: 'severe_weather', reach: 100, saves: 4, shares: 2, comments: 1 },
      { pillar: 'severe_weather', reach: 120, saves: 3, shares: 2, comments: 1 },
      { pillar: 'local_services', reach: 40, saves: 0, shares: 0, comments: 0 },
      { pillar: 'local_services', reach: 50, saves: 0, shares: 0, comments: 0 },
    ],
  };
  const config = { topics: [
    { id: 'service', pillar: 'local_services' },
    { id: 'weather', pillar: 'severe_weather' },
  ] };
  const strategy = buildStrategy({ ga4, instagram, config, generatedAt: '2026-07-17T00:00:00Z' });
  assert.deepEqual(strategy.contentStrategy.preferredTopicIds, ['weather', 'service']);
  assert.equal(strategy.contentStrategy.evidenceLevel, 'measured-instagram');
  assert.equal(strategy.primaryKpis.weeklyOrganicSearchSessions, 2);
  assert.equal(strategy.guardrails.doesNotPublish, true);
});

test('uses Search Console demand when Instagram pillar samples are insufficient', () => {
  const strategy = buildStrategy({
    ga4: { periods: { current: {}, previous: {} }, landingPages: [] },
    instagram: { account: { followers: 10 }, posts: [] },
    searchConsole: { status: 'ready', opportunities: [
      { query: '달라스 한인 맛집', impressions: 80, position: 8 },
      { query: '달라스 311', impressions: 20, position: 9 },
    ] },
    config: { topics: [
      { id: 'unknown' },
      { id: 'service', pillar: 'local_services' },
      { id: 'business', pillar: 'local_business' },
    ] },
  });
  assert.deepEqual(strategy.contentStrategy.preferredTopicIds, ['business', 'service', 'unknown']);
  assert.equal(strategy.contentStrategy.evidenceLevel, 'measured-search');
});

test('Instagram generator only reorders the approved daily schedule', () => {
  const config = {
    topics: [
      { id: 'tornado-watch-warning', type: 'local_guide' },
      { id: 'dallas-help-numbers', type: 'local_guide' },
      { id: 'not-scheduled', type: 'local_guide' },
    ],
    schedule: { '0': ['tornado-watch-warning', 'dallas-help-numbers'] },
  };
  const strategy = { status: 'ready', contentStrategy: {
    preferredTopicIds: ['not-scheduled', 'dallas-help-numbers', 'tornado-watch-warning'],
  } };
  const result = chooseTopic(config, { generated: [] }, '2026-07-19', null, strategy);
  assert.equal(result.topic.id, 'dallas-help-numbers');
  assert.match(result.note, /growth-ranked/);
});
