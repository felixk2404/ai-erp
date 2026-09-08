// transient-error.js — גוף צומת Code ב-WF-Error (מוזרק דרך placeholder CODE_TRANSIENT_ERROR).
// מסווג כל שגיאה שמגיעה ל-Error Trigger: רעש רשת חולף, או תקלה אמיתית שצריך לדעת עליה.
//
// למה זה קיים: n8n מקומי על מק חי מאחורי ngrok. כשהמחשב נרדם, מתעורר, או מחליף רשת,
// הסוקט אל api.airtable.com נסגר באמצע וכל טריגר פולינג נכשל. ב-24 שעות נמדדו 12 כשלים
// כאלה מתוך ~2,880 קריאות — 0.4%. כל אחד מהם ירה התראה לטלגרם, וכולן היו רעש.
// שכבת הרשת בלבד: 4xx/5xx מהשרת, credentials פגים ושגיאות עסקיות *לא* נחשבים חולפים,
// כי הם לא מתקנים את עצמם והם בדיוק מה שההתראה נועדה לתפוס.
//
// ההרצה הכושלת נשמרת ב-Executions של n8n בכל מקרה, ולכן שום מידע לא הולך לאיבוד — רק ההודעה.
const TRANSIENT_RE = new RegExp(
  [
    'socket hang up',
    'closed unexpectedly',
    'network socket disconnected',
    'fetch failed',
    'getaddrinfo',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ESOCKETTIMEDOUT',
    'EAI_AGAIN',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'EPIPE',
  ].join('|'),
  'i',
);

/** ההודעה שמוצגת למשתמש נבנית משלושה מקומות שונים לפי סוג הכשל — אותו סדר כמו בצומת הטלגרם. */
function errorMessage(json) {
  const j = json || {};
  return String(
    (j.execution && j.execution.error && j.execution.error.message) ||
      (j.trigger && j.trigger.error && j.trigger.error.message) ||
      (j.trigger && j.trigger.error && j.trigger.error.description) ||
      '',
  );
}

function isTransient(json) {
  return TRANSIENT_RE.test(errorMessage(json));
}

if (typeof $input !== 'undefined') {
  const json = $input.first().json;
  return [{ json: { ...json, transient: isTransient(json) } }];
}
module.exports = { isTransient, errorMessage, TRANSIENT_RE };
