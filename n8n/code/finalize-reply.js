// finalize-reply.js — גוף צומת Code ב-WF5-core (מוזרק דרך placeholder CODE_FINALIZE_REPLY). הצומת האחרון לפני שהתשובה יוצאת ללקוח.
// שני שערים דטרמיניסטיים על פלט המודל, כי הפרומפט לבדו לא החזיק (בדיקת קבלה 2026-09-03):
// 1. שורה שחוזרת פעמיים באותה תשובה (המודל הכפיל את משפט המסירה ב-55% מהמקרים) — נשארת פעם אחת.
// 2. תיאור סכנה פיזית בהודעת הלקוח (סוללה תפוחה, מכשיר מתחמם/מעשן) חייב לקבל הוראת ניתוק בראש התשובה.
// 3. שורת "מחשבה" שדלפה (המודל מדבר על "המשתמש", מזכיר כלי בשמו, או כותב שורה באנגלית בתוך תשובה עברית) — נמחקת.
const SAFETY_LINE = 'נתקו את המכשיר מהחשמל והפסיקו להשתמש בו עכשיו.';
const SAFETY_RE = /התנפח|תפוח|מתחמם|התחמם|חם מאוד|מעשן|עשן|ריח שריפה|ריח של שרוף|נשרף|ניצוצ|התפוצץ/;
const LEAK_RE = /handoff|check_stock|knowledge_base|products_catalog|המשתמש|הלקוח מבקש|ההנחיות/;
const HEBREW_RE = /[\u05D0-\u05EA]/;

// שורה באנגלית בלבד (בלי אות עברית, לפחות 4 מילים) בתוך תשובה שיש בה עברית = הרהור שדלף, לא תשובה.
function isLeak(line, replyHasHebrew) {
  if (LEAK_RE.test(line)) return true;
  return replyHasHebrew && !HEBREW_RE.test(line) && line.split(/\s+/).length >= 4;
}

function dedupeLines(text) {
  const seen = new Set();
  const out = [];
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) { if (out.length && out[out.length - 1] !== '') out.push(''); continue; }
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out.join('\n').trim();
}

function finalizeReply(output, userMessage) {
  const hasHebrew = HEBREW_RE.test(String(output || ''));
  let reply = dedupeLines(String(output || '').split('\n').filter((l) => !isLeak(l.trim(), hasHebrew)).join('\n'));
  if (SAFETY_RE.test(String(userMessage || '')) && !/נתקו|הפסיקו להשתמש/.test(reply)) {
    reply = reply ? `${SAFETY_LINE}\n${reply}` : SAFETY_LINE;
  }
  return reply;
}

if (typeof $input !== 'undefined') {
  const msg = $('When Executed by Another Workflow').first().json.message;
  return [{ json: { reply: finalizeReply($input.first().json.output, msg) } }];
}
module.exports = { finalizeReply, dedupeLines, isLeak, SAFETY_LINE };
