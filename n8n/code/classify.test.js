const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classify } = require('./classify.js');

const from = { id: 7, first_name: 'דנה', last_name: 'לוי', username: 'dana' };

test('callback query → callback route with data, messageId, queryId', () => {
  const r = classify({ callback_query: { id: 'q1', data: 'p:TY-HP-200', from, message: { message_id: 55, chat: { id: 7 } } } });
  assert.equal(r.route, 'callback');
  assert.deepEqual([r.chatId, r.messageId, r.queryId, r.data], ['7', 55, 'q1', 'p:TY-HP-200']);
  assert.equal(r.from.name, 'דנה לוי');
});

test('/start and /menu → start route with data home and no messageId', () => {
  for (const text of ['/start', '/menu', '/start abc']) {
    const r = classify({ message: { text, chat: { id: 7 }, from } });
    assert.equal(r.route, 'start');
    assert.equal(r.data, 'home');
    assert.equal(r.messageId, null);
  }
});

test('contact → contact route with phone', () => {
  const r = classify({ message: { contact: { phone_number: '+972501234567', first_name: 'דנה' }, chat: { id: 7 }, from } });
  assert.equal(r.route, 'contact');
  assert.equal(r.contact.phone_number, '+972501234567');
});

test('דלג → skip; other text → chat; name falls back to username', () => {
  assert.equal(classify({ message: { text: 'דלג', chat: { id: 7 }, from } }).route, 'skip');
  const r = classify({ message: { text: 'יש לכם מסכים?', chat: { id: 7 }, from: { id: 9, username: 'x' } } });
  assert.equal(r.route, 'chat');
  assert.equal(r.text, 'יש לכם מסכים?');
  assert.equal(r.from.name, 'x');
});
