const { test } = require('node:test');
const assert = require('node:assert/strict');
const { finalizeReply, dedupeLines, isLeak, SAFETY_LINE } = require('./finalize-reply.js');

const HANDOFF = 'נעביר את זה לנציג. מה השם ומה הטלפון שנחזור אליו?';

test('a line repeated in one reply survives once', () => {
  assert.equal(dedupeLines(`${HANDOFF}\n${HANDOFF}`), HANDOFF);
  assert.equal(dedupeLines(`${HANDOFF}\n\n${HANDOFF}\n`), HANDOFF);
});

test('different lines and paragraph breaks are kept', () => {
  assert.equal(dedupeLines('א 349 ₪, במלאי.\n\nב 429 ₪, במלאי.'), 'א 349 ₪, במלאי.\n\nב 429 ₪, במלאי.');
});

test('safety complaint gets the disconnect line first, once', () => {
  const msg = 'הסוללה של המחשב הנייד התנפחה ומתחממת';
  assert.equal(finalizeReply(HANDOFF, msg), `${SAFETY_LINE}\n${HANDOFF}`);
  assert.equal(finalizeReply(`${SAFETY_LINE} ${HANDOFF}`, msg), `${SAFETY_LINE} ${HANDOFF}`);
});

test('ordinary messages are untouched', () => {
  assert.equal(finalizeReply('האוזניות TY-HP-200 עולות 349 ₪, במלאי.', 'כמה עולות האוזניות?'), 'האוזניות TY-HP-200 עולות 349 ₪, במלאי.');
  assert.equal(finalizeReply('', 'היי'), '');
});

test('leaked reasoning lines are dropped, the answer stays', () => {
  const q = 'מה השם ומה הטלפון שנחזור אליו?';
  assert.equal(finalizeReply(`המשתמש מבקש חזרה מנציג, אבל חסר שם וטלפון.\n${q}`, 'תתקשרו אליי'), q);
  assert.equal(finalizeReply(`Need ask for name and phone before handoff.\n${q}`, 'תתקשרו אליי'), q);
  assert.equal(finalizeReply(`To register handoff, we need name and phone written by the client.\n${q}`, 'תתקשרו אליי'), q);
});

test('latin lines are kept when they are the whole reply or short', () => {
  assert.equal(finalizeReply('Sorry, we answer in Hebrew only here.', 'hello'), 'Sorry, we answer in Hebrew only here.');
  assert.equal(finalizeReply('TY-HP-200 349 ₪\nבמלאי.', 'מק״ט'), 'TY-HP-200 349 ₪\nבמלאי.');
  assert.equal(isLeak('TY-Vision QHD 165Hz', true), false);
});
