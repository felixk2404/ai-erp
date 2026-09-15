// vat-rate.js — שיעור המע"מ לפי תאריך המסמך (מסמך הקורס §10: 18% מ-1.1.2025, 17% לפני).
// הביטוי עצמו יושב בצומת Compute של WF1 (Set node — אין import), והקובץ הזה הוא ההגדרה הנבדקת שלו.
// תאריך חסר או שבור מקבל את השיעור הנוכחי: חשבונית בלי Created היא חשבונית של היום, לא של 2024.
const VAT_CHANGE_DATE = '2025-01-01';

function vatRate(isoDate) {
  const d = String(isoDate || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && d < VAT_CHANGE_DATE ? 0.17 : 0.18;
}

module.exports = { vatRate, VAT_CHANGE_DATE };
