# סכימת Airtable — AI-ERP

בסיס אחד, חמש טבלאות. שמות השדות באנגלית וזהים בדיוק לטבלה. כל `Status` הוא Single line text (לא Single select). כל `Created` הוא Created time. מפתחות זרים כטקסט.

| טבלה | שדה | סוג | הערות |
|---|---|---|---|
| Invoices | InvoiceNumber | Single line text | ראשי. `INV-0001` |
| Invoices | CustomerId | Single line text | `CUST-0001` |
| Invoices | Amount | Number (2) | לפני מע"מ |
| Invoices | VatAmount | Number (2) | מחושב ב-WF1 |
| Invoices | Total | Number (2) | מחושב ב-WF1 |
| Invoices | Status | Single line text | new / validated / generated / error |
| Invoices | PdfUrl | URL | מתמלא ב-WF8 |
| Items | Long text | JSON של שורות החשבונית: `[{sku,name,qty,price}]`. Amount = סכום השורות (מחושב באפליקציה). |
| Invoices | Created | Created time | טריגר WF1 |
| Leads | Name | Single line text | ראשי |
| Leads | Email | Email | |
| Leads | Company | Single line text | |
| Leads | Status | Single line text | New / Contacted / Qualified / Dead / Duplicate |
| Leads | Created | Created time | טריגר WF2 |
| Leads | Phone | Phone number | אופציונלי. לידים מטלגרם מקבלים אותו אחרי "שתף טלפון" |
| Leads | Source | Single line text | manual / telegram |
| Leads | Note | Long text | הקשר: `מתעניין ב{מוצר} ({SKU})` |
| Leads | TelegramChatId | Single line text | chat.id בטלגרם, לחיבור הטלפון לליד |
| Products | Name | Single line text | ראשי |
| Products | Category | Single line text | |
| Products | Price | Number (2) | |
| Products | Description | Long text | מוזן ל-RAG ב-WF7 |
| Products | InStock | Checkbox | |
| Tasks | Title | Single line text | ראשי |
| Tasks | Status | Single line text | open / done |
| Tasks | Source | Single line text | order / stock / lead / invoice / manual. מי יצר את המשימה |
| Tasks | RefId | Single line text | היעד: `ORD-0003` / מק"ט / `INV-0007` / record id של ליד |
| Tasks | Created | Created time | ידני ב-UI |
| Customers | CustomerId | Single line text | ראשי. `CUST-0001` |
| Customers | Name | Single line text | |
| Customers | Email | Email | |
| Customers | Phone | Phone number | |

## Orders (חנות)
| שדה | סוג | הערות |
|---|---|---|
| OrderNumber | text | ORD-0001, מספור רץ ב-WF10 |
| CustomerId | text | מפתח זר ל-Customers |
| Name, Email, Phone, Address, City | text/email/phone | פרטי הלקוח כפי שהוקלדו בקופה |
| Items | long text | JSON [{sku,name,qty,price}] — אותו פורמט כמו Invoices.Items |
| Subtotal, Shipping, Vat, Total | number | מחושבים ב-WF10; מחירים כוללים מע"מ |
| Status | text | new → confirmed → shipped → delivered / cancelled |
| InvoiceNumber | text | INV-000N שנוצרה עבור ההזמנה |
| Note | long text | הערת לקוח |
| Created | created time | ידני |

Products.Stock (number, integer) — רק פריטים פיזיים; שירותים ריק. Products.Highlights — 3 שורות מפרט.

יצירה: `airtable/create-tables.sh` (בטוח להרצה חוזרת). שדות `Created` (Created time) אינם נתמכים ב-Metadata API ומתווספים ידנית ב-UI ב-Invoices, ב-Leads, ב-Orders וב-Tasks. אימות: `airtable/verify-schema.sh`. רשומות ראשונות לבדיקה: `airtable/seed.sh`.
