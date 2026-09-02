# חנות אונליין ללקוח (Storefront) — מסמך עיצוב

תאריך: 2026-09-02
סטטוס: מאושר בשיחה (כיוון A "חדר תצוגה" + ארכיטקטורה), ממתין לתוכנית עבודה
קשור ל: `2026-09-02-ai-erp-design.md` (מערכת הניהול, n8n, Airtable)

## 1. מטרה

אתר חנות ציבורי של "איי.איי אלקטרוניקה" שבו לקוח רואה את הקטלוג, מוסיף לעגלה, מסיים "קנייה" בלי סליקה, מקבל מייל אישור ומספר הזמנה, ומקבל שירות לקוחות מבוט AI בתוך האתר. שתי מטרות במקביל:

1. **פרויקט הגמר** — צד הלקוח של ה-ERP: ההזמנה זורמת ל-Airtable, יוצרת חשבונית עם שורות, מפחיתה מלאי, ומודיעה למנהל בטלגרם. כל האוטומציה ב-n8n.
2. **תיק עבודות** — האתר צריך להיראות ולהתנהג ברמה של Awwwards: עיצוב ייחודי, אנימציות משמעותיות, ביצועים טובים, RTL מושלם.

לא בתחום: סליקה אמיתית, חשבונות משתמשים, ניהול משלוחים, ריבוי שפות/מטבעות.

## 2. החלטות מרכזיות

| נושא | החלטה | סיבה |
|---|---|---|
| מיקום | אפליקציה נפרדת `store/` בריפו, פרויקט Vercel נפרד | כתובת נקייה לתיק עבודות, מערכת עיצוב עצמאית, בלי לסכן את אפליקציית הניהול |
| סטאק | Next.js 16 App Router, Tailwind 4, motion 13, React ViewTransition, zod 4, Vitest, Playwright | אותו סטאק כמו הניהול: ידע וסקריפטים משותפים |
| קוד משותף | **העתקה**, לא חבילה משותפת: `airtable.ts`, `format.ts`, `invoice-items.ts`, `n8n.ts` מועתקים ל-`store/src/lib` | שתי אפליקציות, שתי פריסות; workspace/monorepo זה עומס לפרויקט של אדם אחד |
| קריאה | Server Components → Airtable REST (PAT בשרת), cache 60 שניות לקטלוג | קטלוג משתנה לאט; מלאי נבדק שוב בזמן ההזמנה ב-n8n |
| כתיבה | רק דרך n8n WF13: `order`, `support`, `order_status` | כללי העסק (מלאי, מספור, מייל) במקום אחד |
| עגלה | `localStorage` בדפדפן, בלי שרת | אין חשבונות; העגלה שייכת למכשיר |
| זהות לקוח | קנייה כאורח. מעקב הזמנה לפי מספר הזמנה + אימייל | פחות חיכוך, פחות קוד, פחות סיכון |
| מלאי | שדה `Products.Stock` (מספר). קטגוריה "שירותים" = ללא מלאי, זמין תמיד. באתר מוצג רק במלאי/אזל, בלי מספרים | דרישת הסטודנט: כמויות רק לפריטים פיזיים; הכמות היא מידע פנימי של החנות |
| תשלום | מסך "אישור הזמנה" בלי כרטיס אשראי. כיתוב ברור: "הדגמה — לא מתבצע חיוב" | פרויקט דמה; לא מציגים טופס כרטיס מזויף |
| בוט | וידג'ט צף בכל עמוד, אותו סוכן RAG של הטלגרם (WF5-core) דרך WF13 `support`, עם כלי מלאי חדש | דרישה מפורשת; עקביות בין ערוצים |

## 3. ארכיטקטורה

```
לקוח (דפדפן)
   │ HTML/RSC                         │ Server Actions
   ▼                                  ▼
store/ (Next.js על Vercel) ──────► n8n WF13 /webhook/erp  ─┬─► WF10 הזמנה: מלאי → Orders → Customers → Invoices → מייל → טלגרם
   │ קריאה (server only)              │                      ├─► WF5-core שירות לקוחות (RAG + מלאי)
   ▼                                  │                      └─► order_status: Orders לפי מספר+אימייל
Airtable REST (Products, Orders)      │
                                      ▼
                          WF8 (קיים) מפיק PDF לחשבונית שנוצרה
```

מערכת הניהול (`app/`) מקבלת לשונית "הזמנות" ועמודת מלאי — שינויים קטנים, מפורטים בסעיף 9.

## 4. נתונים — Airtable

### 4.1 שינויים ב-Products
| שדה | סוג | הערות |
|---|---|---|
| Stock | Number (integer) | ריק/לא רלוונטי לקטגוריה "שירותים". ערכי התחלה: 0–40 אקראי דטרמיניסטי לפי מק"ט (סקריפט seed). 2–3 מוצרים מקבלים 0 כדי להדגים "נגמר במלאי". |
| Highlights | Long text | 3 שורות מפרט קצרות, שורה לכל נקודה, מוצגות ליד כפתור הקנייה. נוצר פעם אחת מהתיאור בסקריפט (חלוקה ב-";" של חלק "מפרט:"), אפשר לערוך ידנית. |

### 4.2 טבלה חדשה — Orders
| שדה | סוג | ערכים |
|---|---|---|
| OrderNumber | Single line text | `ORD-0001`, מספור רץ ב-WF10 (אותה שיטה כמו חשבוניות) |
| CustomerId | Single line text | מפתח זר טקסט ל-Customers (`CUST-0001`) |
| Name, Email, Phone | Single line text | כפי שהלקוח הקליד |
| Address, City | Single line text | למשלוח. חובה רק אם יש פריט פיזי בהזמנה |
| Items | Long text | JSON `[{sku,name,qty,price}]`, אותו פורמט כמו Invoices.Items |
| Subtotal, Shipping, Vat, Total | Number | מחושבים ב-WF10, לא נלקחים מהדפדפן |
| Status | Single line text | `new` → `confirmed` → `shipped` → `delivered`; `cancelled` |
| InvoiceNumber | Single line text | החשבונית שנוצרה (`INV-000N`) |
| Note | Long text | הערת לקוח (אופציונלי) |
| Created | Created time | ידני (מגבלת Metadata API), הסקריפט משנה שם ל-`Created` |

### 4.3 חוקים
- מע"מ קבוע 18%. מחירי הקטלוג **כוללים מע"מ** (כמו בכל חנות ישראלית). ב-Order: `Total = Subtotal + Shipping`, `Vat = Total − Total/1.18`. בחשבונית שנוצרת: `Amount = Total/1.18` (לפני מע"מ), WF1 מחשב מע"מ וסה"כ כרגיל — כך הסה"כ בחשבונית שווה בדיוק ל-Total בהזמנה (עיגול לאגורה).
- משלוח: 29 ₪; חינם מעל 300 ₪; 0 ₪ אם כל הפריטים שירותים. קבועים בקוד ובפרומפט של הסוכן.
- מלאי: WF10 בודק `qty ≤ Stock` לכל פריט פיזי; אם נכשל מחזיר `{ok:false, error, outOfStock:[sku...]}` והחנות מציגה מה חסר. אם עבר, מפחית `Stock -= qty`. מגבלה ידועה: race בין שתי הזמנות באותה שנייה. מקובל.
- לקוח: WF10 מחפש Customer לפי Email (case-insensitive); אם אין, יוצר `CUST-000N` חדש. הזמנה תמיד מקושרת ל-CustomerId, ולכן החשבונית עוברת אימות ב-WF1.

## 5. n8n

### 5.1 WF13 — פעולות חדשות
| action | payload | תגובה |
|---|---|---|
| `order` | `{customer:{name,email,phone,address,city}, items:[{sku,qty}], note?}` | `{ok:true, orderNumber, total, invoiceNumber}` או `{ok:false, error, outOfStock?}` — WF13 קורא ל-WF10 כ-sub-workflow ומחזיר את התוצאה |
| `order_status` | `{orderNumber, email}` | `{ok:true, order:{orderNumber,status,items,total,created,invoiceNumber,pdfUrl?}}` או `{ok:false, error:"לא נמצא"}` — HTTP Request ל-Airtable, השוואת אימייל בשרת |
| `support` (קיים) | `{message, history?}` | ללא שינוי בחוזה; הסוכן מקבל כלי חדש |

### 5.2 WF10 — הזמנה חדשה (sub-workflow)
1. Validate: zod-like בדיקה ב-Code node (שדות חובה, qty 1–99 גם אחרי מיזוג כפילויות, עד 10 שורות שונות — מגבלת batch של Airtable ב-PATCH).
2. Products: HTTP Request ל-Airtable `OR({Sku}='..',...)` → מחירים אמיתיים, Stock, Category. מחיר תמיד מהקטלוג, לא מהדפדפן.
3. Stock check: Code node → אם חסר, Respond `{ok:false, outOfStock}`.
4. Customer: חיפוש לפי Email → צור אם אין (מספור `CUST-000N` מ-Aggregate).
5. Numbering: Orders עם OrderNumber → `ORD-000N`.
6. Create Order (Status `new`).
7. Create Invoice (`CustomerId, Amount, Items, Status:'new'`) → WF1 ו-WF8 ממשיכים לבד. Order.InvoiceNumber מתעדכן ב-WF1? לא — WF10 כותב `InvoiceNumber` אחרי שהחשבונית קיבלה מספר? WF1 רץ אסינכרוני (דקה). **החלטה:** WF10 לא ממתין. `order_status` מחפש את החשבונית לפי `Items` ו-`CustomerId` באותו יום? זה שביר. **החלטה סופית:** WF10 מחשב את המספר הרץ של החשבונית בעצמו (אותה שיטה כמו WF1) וכותב `InvoiceNumber` גם ב-Invoice וגם ב-Order; WF1 מכבד מספר קיים (כבר עושה זאת: `fields.InvoiceNumber || ...`).
8. Decrement stock: Airtable update לכל פריט פיזי.
9. Gmail ללקוח: אישור הזמנה HTML RTL עם שורות, סה"כ, מספר הזמנה, קישור למעקב.
10. Telegram למנהל: "הזמנה חדשה ORD-0007 · דוד לוי · 893 ₪ · 2 פריטים".
11. Update Order Status `confirmed`. Return.
שגיאה בכל שלב → Error Workflow (טלגרם) והחנות מציגה "לא הצלחנו לשמור את ההזמנה, נסו שוב".

### 5.3 WF5-core — כלי מלאי
כלי Airtable "check_stock(sku או שם)" מחזיר `Name, Price, Stock, Category`. הפרומפט מתעדכן: מחירים כוללים מע"מ, משלוח 29/חינם מעל 300, אם Stock=0 להציע חלופה מאותה קטגוריה, שירותים תמיד זמינים. WF7 (embedding מוצרים) מוסיף `Stock` לטקסט? לא — מלאי משתנה; נשאר בכלי חי.

### 5.4 WF9-core — סוכן המנהל
Summarize על Orders (ספירה, סה"כ, לפי סטטוס) מתווסף להקשר. "כמה הזמנות היו היום?" עובד.

## 6. החנות — מסכים

| נתיב | תוכן |
|---|---|
| `/` | Hero "חדר תצוגה": מוצר הדגל בזרקור, כותרת ענקית, CTA. אחריו: "המומלצים" (6 כרטיסים), קטגוריות כרשת מפרט, פס שירותים, פס אמון (משלוח/אחריות/שירות 24/7 עם קישור לבוט). |
| `/products` | קטלוג מלא: סינון לפי קטגוריה (pills), חיפוש חי (client, על 34 פריטים), מיון (מחיר/שם), מצב "רשת" ו"מפרט" (טבלה מונוספייס). כרטיס: תמונה, שם, 1 שורת מפרט, מחיר בתוך כפתור "הוסף לסל — 349 ₪", תג מלאי בינארי בלבד: "במלאי" / "אזל → הודיעו לי". **הלקוח לא רואה כמויות** (החלטת הסטודנט 2026-09-02); כמויות רק בניהול ובתשובת הסוכן אם שואלים במפורש. |
| `/products/[sku]` | עמוד מוצר: תמונה גדולה (shared element מהכרטיס), שם, מחיר, 3 נקודות מפרט, כפתור ראשי, "הזמן התקנה" משני לקטגוריות רלוונטיות (מסכים/רשת), מצב מלאי, תיאור מלא, רשת מפרט, "משלימים" (3 מוצרים מאותה/משלימה קטגוריה), FAQ מהמדיניות (משלוח, החזרות, אחריות — טקסט קבוע). |
| עגלה | מגירה (Sheet) מצד שמאל, לא עמוד. שורות עם כמות ±, סרגל "עוד X ₪ למשלוח חינם", סיכום, "לקופה". תג מונה על אייקון העגלה. |
| `/checkout` | עמוד יחיד, שני חלקים: טופס (שם, אימייל, טלפון, כתובת+עיר אם יש פריט פיזי, הערה) וסיכום קבוע בצד. כפתור "אישור הזמנה". מודגש: "הדגמה — לא מתבצע חיוב". שגיאות שדה מתחת לשדה; שגיאת מלאי מסמנת את השורות. |
| `/orders/[orderNumber]` | תודה + מעקב: כניסה עם אימייל (טופס קטן) → ציר זמן (התקבלה/אושרה/נשלחה/נמסרה), שורות, סה"כ, קישור לחשבונית PDF כשקיים. אחרי קופה מגיעים לכאן עם האימייל ב-sessionStorage כדי לא להקליד שוב. |
| `/track` | טופס מספר הזמנה + אימייל → מפנה ל-`/orders/[n]`. |
| בוט | כפתור צף (ימין-תחתון ב-RTL: start-bottom), פותח פאנל צ'אט. הודעת פתיחה מותאמת לעמוד ("שאלות על TY-HP-200?" בעמוד מוצר). כרטיסי מוצר בתשובות עם "הוסף לסל" ישירות מהצ'אט. Rate limit 20/דקה ל-IP (מועתק מהניהול). |
| `/about`, `/policies` | דף קצר על החנות; המדיניות מ-`docs/course/policies` (משלוח, החזרות, אחריות) כטקסט סטטי. |

## 7. עיצוב — "חדר תצוגה"

**מי:** קונה ישראלי בערב על הטלפון או המחשב, השוואת מחירים פתוחה בטאב ליד. **מה:** להבין תוך 3 שניות מה זה, כמה זה עולה, אם זה במלאי, ולקנות בלי חיכוך. **תחושה:** חדר תצוגה חשוך שבו כל מוצר מואר; דיוק של מכשיר מדידה, לא ניאון של גיימינג.

- **צבעים:** רקע `--void` #07090c, משטחים `--panel` +4% / +7% / +10%, טקסט `--glow` #eef2f6 ו-3 רמות מוחלשות, אקסנט יחיד `--beam` #5cc8ff (תכלת חשמלי) ≤10% מהמסך: תגי מלאי, פס התקדמות, הילת הזרקור, כפתור ראשי. סטטוס: ירוק (במלאי), ענבר (נותרו מעט), אדום עמום (נגמר). אין גרדיאנטים סגולים.
- **טיפוגרפיה:** כותרות — Heebo 800 (עברית) בגדלים 44–96px עם tracking שלילי; גוף — Heebo 400/500 16px; מפרט, מחירים, מק"ט — JetBrains Mono (או IBM Plex Mono) `tabular-nums`. סקאלה 1.25.
- **עומק:** borders-only (`rgba(255,255,255,.08)`) + הילה רדיאלית מאחורי מוצרים. בלי צללים כבדים.
- **רשת:** 8px. קונטיינר 1280. כרטיסים 4 בשורה → 2 → 1.
- **חתימה:** "רשת המפרט" — כל מוצר, גם שירות, הוא שורה באותה רשת מונוספייס עם מק"ט, שם, מפרט, מלאי, מחיר. זה מה שאין לאף חנות ישראלית.

**אנימציות (כל אחת עם סיבה; `prefers-reduced-motion` מכבד):**
1. Hero: זרקור עוקב עכבר (CSS var + spring), מוצר הדגל צף (float 6s), כותרת נכנסת מילה-מילה.
2. קטלוג: כרטיסים נחשפים בגלילה (grayscale→color + y 16→0, stagger 40ms). הובר: tilt 3D עדין (±6°) + הילה עוקבת.
3. הוספה לעגלה: תמונת המוצר עפה בקשת לאייקון העגלה (motion `useAnimate`), המונה קופץ, המגירה נפתחת אחרי 400ms.
4. כרטיס → עמוד מוצר: shared element על התמונה (View Transitions, `nav-forward`/`nav-back`).
5. עגלה: שורות `AnimatePresence popLayout`, סרגל משלוח חינם ממולא בספרינג, סכומים רצים (CountUp).
6. קופה → תודה: ציר הזמן מצייר את עצמו, מספר ההזמנה נחשף בספירה.
7. בוט: כפתור צף עם pulse עדין פעם ב-8 שניות (לא ליצור עייפות), פאנל נכנס מלמטה בספרינג, הודעות streaming-look (טקסט מופיע במקטעים).
8. מפרט: מספרים ב-`tabular-nums` עם "טיקטוק" קצר בהחלפת סינון.

בלי: פרלקסה כבדה, אנימציות שמעכבות קריאה מעל 300ms, אוטו-פליי וידאו, קרוסלות אוטומטיות.

## 8. קוד — מבנה

```
store/
  src/app/
    layout.tsx            fonts, MotionConfig, CartProvider, SupportWidget, header/footer
    page.tsx              hero + featured + categories + services + trust
    products/page.tsx     catalog (server) + <Catalog/> client filter
    products/[sku]/page.tsx
    checkout/page.tsx + actions.ts (placeOrder)
    orders/[orderNumber]/page.tsx + actions.ts (lookupOrder)
    track/page.tsx
    about/page.tsx  policies/page.tsx
    api/health/route.ts
  src/lib/
    airtable.ts format.ts invoice-items.ts n8n.ts rate-limit.ts (מועתקים מ-app/)
    catalog.ts            getProducts (cache 60s), getProduct(sku), related(), isService()
    cart.ts               טיפוסי עגלה, reducers, סכומים, shipping rule — טהור, נבדק
    order.ts              zod schema לטופס, מיפוי ל-payload של WF13
  src/components/
    shell/ (header עם עגלה, footer, nav)
    catalog/ (product-card, spec-grid, filters, stock-badge, price-button)
    product/ (gallery, highlights, add-to-cart, related, faq)
    cart/ (cart-provider (context+localStorage), cart-sheet, line, free-shipping-bar, fly-to-cart)
    checkout/ (form, summary)
    orders/ (timeline, lookup-form)
    support/ (widget, panel, product-chip)
    motion/ (spotlight, reveal, count-up, tilt, page-transition)
    ui/ (shadcn: button, input, sheet, dialog, label, badge, skeleton)
  e2e/ smoke.spec.ts (7–9 בדיקות: דף בית, סינון, עמוד מוצר, עגלה, קופה מוצלחת, מלאי חסר, מעקב, בוט)
  .interface-design/system.md
```

**בדיקות יחידה (Vitest):** `cart.ts` (add/remove/qty/limits/shipping rule/totals), `order.ts` (validation, כתובת חובה רק אם פיזי), `catalog.ts` (isService, related), `format`.

**אבטחה:** PAT רק בשרת. WF13 secret ב-env. Rate limit על `placeOrder` (5/דקה ל-IP) ו-`support` (20/דקה). קלט מנוקה ב-zod. אין `dangerouslySetInnerHTML` מטקסט לקוח. ה-Gmail HTML ב-WF10 מבצע escape לשם/כתובת.

**Env:** `AIRTABLE_PAT, AIRTABLE_BASE_ID, N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL`. תבנית `store/env.example`; סנכרון ל-Vercel עם `scripts/vercel-env.sh` מועתק.

## 9. שינויים באפליקציית הניהול (`app/`) — מינימליים

- לשונית "הזמנות" `/orders`: טבלה (מספר, לקוח, פריטים, סה"כ, סטטוס, נוצר), עמוד `/orders/[id]` עם שורות, שינוי סטטוס (`confirmed→shipped→delivered`) דרך WF13 `update`. שינוי סטטוס ל-`shipped` שולח מייל ללקוח (WF11 קטן: Airtable Trigger על Orders? לא — WF13 `update` על Orders עם Status shipped → Gmail. פשוט: צומת IF אחרי ה-update).
- מוצרים: עמודת "מלאי" + עריכה מהירה (±) בטבלה; מוצר עם Stock 0 מסומן.
- דשבורד: כרטיס "הזמנות היום" ב-LedgerStrip.
- **תיאום:** בזמן כתיבת מסמך זה יש ב-`app/` שינויים לא מקומטים של עבודה אחרת (מערכת צבעים חדשה signal/readout/chassis, לוגו). השינויים בניהול יבוצעו **רק אחרי** שהעבודה ההיא תקומט, כדי לא להתנגש.

## 10. סדר ביצוע (תוכניות)

1. **תוכנית 5 — נתונים ו-n8n:** Stock/Highlights/Orders ב-Airtable + seed, WF10, WF13 `order`/`order_status`, כלי מלאי ל-WF5-core, Orders לסוכן המנהל, בדיקות עם `api-test.sh`.
2. **תוכנית 6 — החנות:** scaffold, מערכת עיצוב, קטלוג, מוצר, עגלה, קופה, מעקב, בוט, אנימציות, e2e, Vercel.
3. **תוכנית 7 — ניהול:** הזמנות + מלאי (אחרי קומיט של העבודה המקבילה).

## 11. הצלחה

- לקוח מסיים הזמנה ב-≤ 3 מסכים; תוך דקה יש ORD, INV עם PDF, מייל, טלגרם, ומלאי מופחת — נבדק מקצה לקצה.
- הבוט עונה על "יש במלאי TY-HP-200?" עם המספר האמיתי ומחיר, ומציע חלופה כשאין.
- Lighthouse ≥ 90 ביצועים בנייד על `/` ו-`/products`; CLS < 0.1 למרות האנימציות.
- 0 שברי RTL (rtl-qa); reduced-motion מכבה tilt/fly/parallax ומשאיר opacity.
- כל ה-e2e ירוקים מול פרודקשן.
