// classify.js — גוף צומת Code ב-WF5 (מוזרק לצומת דרך placeholder CODE_CLASSIFY). מנרמל עדכון טלגרם לפריט אחד.
// route: callback | contact | start | skip | chat. מחוץ ל-n8n הקובץ מייצא את הפונקציה לבדיקות.
function classify(u) {
  const cq = u.callback_query;
  const msg = u.message || (cq && cq.message) || {};
  const from = (cq && cq.from) || (u.message && u.message.from) || {};
  const text = String((u.message && u.message.text) || '').trim();
  let route = 'chat';
  if (cq) route = 'callback';
  else if (u.message && u.message.contact) route = 'contact';
  else if (/^\/(start|menu)\b/.test(text)) route = 'start';
  else if (text === 'דלג') route = 'skip';
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'לקוח טלגרם';
  return {
    route,
    chatId: String((msg.chat && msg.chat.id) || from.id || ''),
    messageId: cq && cq.message ? cq.message.message_id : null,
    queryId: cq ? cq.id : null,
    data: cq ? String(cq.data || 'home') : 'home',
    text,
    contact: (u.message && u.message.contact) || null,
    from: { id: from.id, name, username: from.username || null },
  };
}
if (typeof $input !== 'undefined') return [{ json: classify($input.first().json) }];
module.exports = { classify };
