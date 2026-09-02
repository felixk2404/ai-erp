// render-menu.js — גוף צומת Code ב-WF5 (מוזרק לצומת דרך placeholder CODE_RENDER_MENU). קלט: callback_data + כל המוצרים.
// פלט: { action: 'menu' | 'lead', text (HTML), keyboard (צורת inlineKeyboard של צומת הטלגרם), product? }.

// טבלת המחרוזות: כל מה שהמשתמש רואה, במקום אחד. צומת Code ב-n8n לא יכול לעשות require, ולכן היא יושבת כאן.
// הכללים שמאחוריה (רבים, יציאה אחידה בשורה האחרונה, בלי שאלת נימוס): docs/superpowers/bot-conversation-map.md
const S = {
  welcome: 'היי, כאן איי.איי אלקטרוניקה. אפשר לעיין בקטלוג או לשאול כל שאלה.',
  home: 'במה נעזור?',
  ask: 'כתבו כאן מה מחפשים ונענה.',
  lead: (name) => `רשמנו. נחזור אליכם עם פרטים על ${name}.`,
  catGone: 'הקטגוריה כבר לא זמינה.',
  productGone: 'המוצר כבר לא זמין.',
  broken: 'משהו השתבש אצלנו. אפשר לנסות שוב.',
  inStock: 'במלאי',
  soldOut: 'אזל מהמלאי',
  soldOutTag: ' (אזל)',
  serviceStock: 'שירות — זמין תמיד',
  askBtn: 'שאלה חופשית',
  leadBtn: 'מעוניין',
  backBtn: 'חזרה לקטגוריה',
  homeBtn: 'תפריט ראשי',
};

const SERVICE = 'שירותים';
const MAX_CAT = 30; // callback_data ≤ 64 בתים; עברית = 2 בתים לתו, 'cat:' = 4
const MAX_LIST = 10;
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const price = (n) => Number(n || 0).toLocaleString('he-IL') + ' ₪';
const btn = (text, data) => ({ text, additionalFields: { callback_data: data } });
const keyboard = (...lines) => ({ rows: lines.map((buttons) => ({ row: { buttons } })) });

// returning: המשתמש כבר בתוך השיחה (כפתור, שיתוף טלפון, דילוג) ולא צריך את שורת ההיכרות שוב.
// רק route === 'start' (/start או /menu) הוא כניסה שעשויה להיות ראשונה. הבחנה אמיתית בין ראשונה לחוזרת דורשת זיכרון מצב, ואין כזה.
function renderMenu(data, products, returning) {
  const items = products
    .filter((p) => p && p.Sku)
    .map((p) => ({
      name: p.Name, sku: p.Sku, category: p.Category || 'אחר', price: p.Price,
      stock: Number(p.Stock) || 0, service: p.Category === SERVICE,
      highlights: String(p.Highlights || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 3),
    }));
  if (!items.length) return { action: 'menu', text: S.broken, keyboard: keyboard([btn(S.homeBtn, 'home')]) };
  const cats = [...new Set(items.map((i) => i.category))].sort((a, b) => a.localeCompare(b, 'he'));
  // ponytail: 30-char truncation collides on shared prefixes; disambiguate with a #index suffix, kept unique per render.
  const catKeys = new Map();
  const usedKeys = new Set();
  cats.forEach((c, index) => {
    let key = 'cat:' + String(c).slice(0, MAX_CAT);
    if (usedKeys.has(key)) key = 'cat:' + String(c).slice(0, MAX_CAT - 3) + '#' + index;
    usedKeys.add(key);
    catKeys.set(c, key);
  });
  const home = (note) => ({ action: 'menu', text: note || (returning ? S.home : S.welcome), keyboard: keyboard(...cats.map((c) => [btn(c, catKeys.get(c))]), [btn(S.askBtn, 'ask')]) });
  const d = String(data || 'home');
  if (d === 'home') return home();
  if (d === 'ask') return { action: 'menu', text: S.ask, keyboard: keyboard([btn(S.homeBtn, 'home')]) };
  if (d.startsWith('cat:')) {
    const cat = cats.find((c) => catKeys.get(c) === d);
    if (!cat) return home(S.catGone);
    const list = items.filter((i) => i.category === cat).slice(0, MAX_LIST);
    const label = (i) => `${i.name} · ${price(i.price)}${!i.service && i.stock <= 0 ? S.soldOutTag : ''}`;
    return { action: 'menu', text: `<b>${esc(cat)}</b>`, keyboard: keyboard(...list.map((i) => [btn(label(i), 'p:' + i.sku)]), [btn(S.homeBtn, 'home')]) };
  }
  const sku = d.startsWith('p:') ? d.slice(2) : d.startsWith('lead:') ? d.slice(5) : null;
  const item = sku ? items.find((i) => i.sku === sku) : null;
  if (!item) return home(S.productGone);
  const product = { name: item.name, sku: item.sku };
  if (d.startsWith('lead:')) return { action: 'lead', text: S.lead(esc(item.name)), keyboard: keyboard([btn(S.homeBtn, 'home')]), product };
  const stock = item.service ? S.serviceStock : item.stock > 0 ? S.inStock : S.soldOut;
  const text = [`<b>${esc(item.name)}</b>`, `${esc(item.sku)} · ${price(item.price)}`, ...item.highlights.map((h) => `• ${esc(h)}`), stock].join('\n');
  return { action: 'menu', text, keyboard: keyboard([btn(S.leadBtn, 'lead:' + item.sku)], [btn(S.backBtn, catKeys.get(item.category)), btn(S.homeBtn, 'home')]), product };
}
if (typeof $input !== 'undefined') { const c = $('Classify').first().json; return [{ json: renderMenu(c.data, $input.all().map((i) => (i.json && i.json.fields) || i.json), c.route !== 'start') }]; }
module.exports = { renderMenu, S };
