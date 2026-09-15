const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.join(__dirname, '../workflows');
const load = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
const validate = load('10-order.json').nodes.find(n => n.name === 'Validate').parameters.jsCode;
const customer = { name: 'לקוח בדיקה', email: 'test@example.com', phone: '0501234567' };
const run = items => new Function('$input', validate)({ first: () => ({ json: { order: { customer, items } } }) })[0].json;

test('שורה ריקה אינה מפילה את WF10 אלא מחזירה שגיאת קלט', () => {
  assert.equal(run([null]).ok, false);
});
test('WF10 אינו מעגל כמות חלקית להזמנה אחרת', () => {
  assert.equal(run([{ sku: 'TY-PB-20', qty: 1.9 }]).ok, false);
});
test('כמות שלמה תקינה ממשיכה למסלול ההזמנה', () => {
  assert.equal(run([{ sku: 'TY-PB-20', qty: 2 }]).ok, true);
});
test('אין retry על יצירה, שליחת הודעה או סוכן עם כלי כתיבה', () => {
  const unsafe=[];
  for (const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))) {
    for(const n of load(file).nodes) {
      const op=n.parameters?.operation;
      const writes = (n.type==='n8n-nodes-base.airtable' && op==='create') ||
        (n.type==='n8n-nodes-base.telegram' && (!op || op==='sendMessage')) ||
        (n.type==='n8n-nodes-base.gmail' && (!op || op==='send')) ||
        (n.name==='Support Agent');
      if(writes && n.retryOnFail) unsafe.push(`${file}: ${n.name}`);
    }
  }
  assert.deepEqual(unsafe, []);
});
