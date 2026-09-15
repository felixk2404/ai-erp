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

test('שלוש הודעות שהגיעו לטלגרם ב-14–15.9.2026 ולא היו צריכות — רשת ו-task runner, לא תקלה', () => {
  assert.equal(isTransient({ trigger: { error: { message: 'The connection cannot be established, this usually occurs due to an incorrect host (domain) value' } } }), true);
  assert.equal(isTransient({ trigger: { error: { message: 'The DNS server returned an error, perhaps the server is offline' } } }), true);
  assert.equal(isTransient({ trigger: { error: { message: 'No bridge acquired for this context. Call acquire() first.' } } }), true);
});

test('כשל אימות אינו חולף — הוא לא מתקן את עצמו ומחייב Reconnect ידני', () => {
  assert.equal(isTransient({ trigger: { error: { message: 'Access could not be refreshed because the connected account has revoked access, the refresh token expired, or the account password or permissions changed.' } } }), false);
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
