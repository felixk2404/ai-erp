// בלי env() בכוונה — בדיקת חיים חייבת לענות גם כשמשתני הסביבה חסרים.
export const GET = () => Response.json({ ok: true, ts: Date.now() });
