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
| Leads | Status | Single line text | new / contacted / replied / duplicate |
| Leads | Created | Created time | טריגר WF2 |
| Products | Name | Single line text | ראשי |
| Products | Category | Single line text | |
| Products | Price | Number (2) | |
| Products | Description | Long text | מוזן ל-RAG ב-WF7 |
| Products | InStock | Checkbox | |
| Tasks | Title | Single line text | ראשי |
| Tasks | Status | Single line text | open / done |
| Customers | CustomerId | Single line text | ראשי. `CUST-0001` |
| Customers | Name | Single line text | |
| Customers | Email | Email | |
| Customers | Phone | Phone number | |

יצירה: `airtable/create-tables.sh` (בטוח להרצה חוזרת). שדות `Created` (Created time) אינם נתמכים ב-Metadata API ומתווספים ידנית ב-UI ב-Invoices וב-Leads. אימות: `airtable/verify-schema.sh`. רשומות ראשונות לבדיקה: `airtable/seed.sh`.
