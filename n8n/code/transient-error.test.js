const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isTransient, errorMessage } = require('./transient-error.js');

// המחרוזת המדויקת שהגיעה לטלגרם עשרות פעמים ב-5–8 בספטמבר 2026.
const CLOSED =
  'The connection to the server was closed unexpectedly, perhaps it is offline. You can retry the request immediately or wait and retry later.';

test('כשל פולינג של טריגר בזמן שהמחשב נרדם — חולף', () => {
  assert.equal(isTransient({ trigger: { error: { message: CLOSED } } }), true);
  assert.equal(isTransient({ execution: { error: { message: 'socket hang up' } } }), true);
  assert.equal(isTransient({ execution: { error: { message: 'read ECONNRESET' } } }), true);
  assert.equal(isTransient({ execution: { error: { message: 'getaddrinfo EAI_AGAIN api.airtable.com' } } }), true);
});

test('ההודעה נקראת גם מ-description, כשאין message', () => {
  assert.equal(isTransient({ trigger: { error: { description: CLOSED } } }), true);
  assert.equal(errorMessage({ trigger: { error: { description: 'x' } } }), 'x');
});

test('תקלה אמיתית לא נבלעת — זו כל הנקודה של ההתראה', () => {
  assert.equal(isTransient({ execution: { error: { message: 'Airtable 422 on Invoices' } } }), false);
  assert.equal(isTransient({ execution: { error: { message: 'Unauthorized - perhaps check your credentials?' } } }), false);
  assert.equal(isTransient({ execution: { error: { message: 'Bad request - please check your parameters' } } }), false);
  assert.equal(isTransient({ execution: { error: { message: 'Gotenberg 500' } } }), false);
});

test('שגיאה בלי הודעה בכלל נחשבת אמיתית ומגיעה לטלגרם', () => {
  assert.equal(isTransient({}), false);
  assert.equal(isTransient({ execution: { error: {} } }), false);
  assert.equal(isTransient(null), false);
});
