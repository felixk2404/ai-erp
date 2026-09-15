#!/usr/bin/env python3
"""מוסיף (או מעדכן) פתק דביק בראש כל workflow — מסמך הקורס §7 דורש שכל תהליך ייפתח בפתק שמסביר מה הוא עושה ומה הוא צריך.
בטוח להרצה חוזרת: פתק קיים בשם "מה זה" מוחלף, לא מוכפל. מריצים, ואז מייבאים: for f in workflows/*.json; do scripts/import-workflow.sh "$f"; done"""
import glob
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'workflows')
NAME = 'מה זה'
NOTES = {
    '00-error': ('WF-Error — התראות שגיאה', 'כל כשל בכל workflow מגיע לכאן (settings.errorWorkflow). רעש רשת חולף (socket hang up כשהמק נרדם) מסונן; תקלה אמיתית → טלגרם לבעלים; אם גם הטלגרם נכשל → משימה ב-Airtable.', 'Telegram Manager, Airtable ERP'),
    '01-invoices-validate': ('WF1 — אימות חשבוניות', 'טריגר Airtable (Created, כל דקה). בודק סכום ולקוח, מקצה INV-000N, מחשב מע"מ לפי תאריך המסמך (17%/18%) וסה"כ, מסמן validated או error + משימת תיקון.', 'Airtable ERP'),
    '02-leads-dedupe': ('WF2 — קליטת לידים וכפילויות', 'טריגר Airtable (Created, כל דקה). ליד עם אותו מייל, או אותו טלפון (ספרות בלבד), מסומן Duplicate; אחרת New.', 'Airtable ERP'),
    '03-sales-cold-email': ('WF3 — סוכן מכירות (מיילים קרים)', 'כל 3 שעות, או POST /run-sales. בוחר ליד New אחד, סוכן LLM כותב מייל קר בעברית (prompts/sales.md), שולח ב-Gmail ורק אז מסמן Contacted.', 'Airtable ERP, OpenAI ERP, Gmail ERP, ERP Webhook Secret'),
    '04-sales-replies': ('WF4 — סוכן מכירות (תשובות)', 'Gmail כל 30 דקות. תשובה מליד Contacted מסווגת: מעוניין → Qualified + משימת שיחה; לא מעוניין או "הסר" → Dead; תשובה אוטומטית → מתעלמים.', 'Gmail ERP, Airtable ERP, OpenAI ERP'),
    '05-customer-service': ('WF5 — סוכן שירות לקוחות (טלגרם)', 'בוט הלקוחות. תפריט קטלוג בכפתורים, לכידת ליד ("מעוניין"), שיתוף טלפון, וכל טקסט חופשי → WF5-core.', 'Telegram Customer, Airtable ERP'),
    '05b-support-core': ('WF5-core — סוכן שירות לקוחות', 'הליבה המשותפת לטלגרם, לאתר ולחנות. RAG משני כלים (מדיניות, מוצרים) ב-pgvector, check_stock חי מ-Airtable, ו-handoff לנציג. הפלט עובר שער דטרמיניסטי (code/finalize-reply.js).', 'OpenAI ERP, Supabase ERP, Airtable ERP'),
    '05c-handoff': ('WF5-handoff — מסירה לנציג', 'כלי של הסוכן. מאמת שם וטלפון בצד השרת, יוצר Lead + Task ומודיע לבעלים.', 'Airtable ERP, Telegram Manager'),
    '06-policies-embed': ('WF6 — מדיניות → מאגר וקטורי', 'POST /reindex-policies. קורא את docs/course/policies/*.md, מוחק את הגרסה הקודמת ומטמיע מחדש (text-embedding-3-small). להריץ אחרי כל שינוי מדיניות.', 'OpenAI ERP, Supabase ERP, ERP Webhook Secret'),
    '07-products-embed': ('WF7 — מוצרים → מאגר וקטורי', 'POST /reindex-products. קורא את Products מ-Airtable ומטמיע מחדש. להריץ אחרי שינוי בקטלוג.', 'Airtable ERP, OpenAI ERP, Supabase ERP, ERP Webhook Secret'),
    '08-invoice-pdf': ('WF8 — הפקת PDF חשבונית', 'כל דקה. תופס חשבונית validated אחת (lease של 15 דקות ב-PdfLockedAt), בונה HTML עברי RTL, ממיר ל-PDF ב-Gotenberg, מעלה לדרייב, משתף בקישור, מסמן generated + PdfUrl.', 'Airtable ERP, Google Drive ERP, Gotenberg (docker)'),
    '09-manager-telegram': ('WF9 — סוכן המנהל (טלגרם)', 'בוט הבעלים. תנאי Is Owner על Chat ID (מסמך הקורס, נספח) — כל אחד אחר מקבל סירוב. שאלות → WF9-core.', 'Telegram Manager'),
    '09b-manager-core': ('WF9-core — סוכן המנהל', 'הליבה המשותפת לטלגרם ולאפליקציה. Invoices/Leads/Tasks/Orders מסוכמים בצמתי Summarize + Aggregate, והסוכן (בלי כלים) רק מנסח בעברית.', 'Airtable ERP, OpenAI ERP'),
    '10-order': ('WF10 — הזמנה', 'תת-workflow של WF13, מהחנות או מטופס "הזמנה חדשה" בניהול. מאמת, מתמחר מהקטלוג (לא מהדפדפן), מספר ORD/INV, יוצר לקוח/הזמנה/חשבונית, מוריד מלאי, שולח מייל אישור ומודיע לבעלים.', 'Airtable ERP, Gmail ERP, Telegram Manager'),
    '13-api': ('WF13 — API לאפליקציה ולחנות', 'POST /erp עם x-erp-secret. מנתב create/update (טבלאות ושדות ברשימת היתר), chat (מנהל), support (שירות), order (→ WF10), order_status. הגבול היחיד שחשוף החוצה.', 'ERP Webhook Secret, Airtable ERP'),
}

for path in sorted(glob.glob(os.path.join(ROOT, '*.json'))):
    key = os.path.basename(path)[:-5]
    if key not in NOTES:
        print('skip (no note defined):', key)
        continue
    title, what, needs = NOTES[key]
    with open(path, encoding='utf-8') as fh:
        d = json.load(fh)
    d['nodes'] = [n for n in d['nodes'] if not (n.get('type') == 'n8n-nodes-base.stickyNote' and n.get('name') == NAME)]
    d['nodes'].insert(0, {
        'type': 'n8n-nodes-base.stickyNote', 'typeVersion': 1, 'name': NAME, 'position': [-620, -340],
        'parameters': {'content': f'## {title}\n{what}\n\n**צריך:** {needs}', 'height': 240, 'width': 460, 'color': 4},
    })
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(d, fh, ensure_ascii=False, indent=2)
        fh.write('\n')
    print('noted', key)
