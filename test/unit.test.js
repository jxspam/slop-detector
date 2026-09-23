// unit.test.js — judge.js pure logic: request shape, response parsing, banding.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, parseAnswer, band, MODEL } from '../slop-detector/judge.js';

test('buildRequest sends state, model and a score question with 5 criteria', () => {
  const body = buildRequest('hello world');
  assert.equal(body.state, 'hello world');
  assert.equal(body.model, MODEL);
  const q = body.questions.slop;
  assert.equal(q.type, 'score');
  assert.ok(q.instructions.length > 0);
  assert.equal(q.criteria.length, 5);
});

test('parseAnswer normalizes score to 0-100', () => {
  // score 4.0 of max level 4 -> 100
  const body = {
    answers: {
      slop: {
        type: 'score',
        score: 4.0,
        confidence: 0.9,
        legend: { 0: 'a', 1: 'b', 2: 'c', 3: 'd', 4: 'e' },
        probabilities: {},
      },
    },
  };
  assert.equal(parseAnswer(body).score100, 100);
  assert.equal(parseAnswer(body).confidence, 0.9);
});

test('parseAnswer handles mid-scale fractional scores', () => {
  const body = {
    answers: {
      slop: { type: 'score', score: 1.43, confidence: 0.35, legend: { 0: 'a', 1: 'b', 2: 'c' } },
    },
  };
  // 1.43 / 2 * 100 = 71.5 -> 72
  assert.equal(parseAnswer(body).score100, 72);
});

test('parseAnswer rejects malformed responses', () => {
  assert.throws(() => parseAnswer({}));
  assert.throws(() => parseAnswer({ answers: { slop: { type: 'score' } } }));
});

test('band maps scores to the three bands', () => {
  assert.equal(band(80), 'high');
  assert.equal(band(93), 'high');
  assert.equal(band(40), 'medium');
  assert.equal(band(79), 'medium');
  assert.equal(band(39), 'low');
  assert.equal(band(0), 'low');
});

test('band respects custom thresholds', () => {
  assert.equal(band(60, { highThreshold: 55, mediumThreshold: 30 }), 'high');
});
