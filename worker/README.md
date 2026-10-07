# חיבור האתר ב-GitHub ל-Airtable

האתר ב-GitHub ציבורי, ולכן אסור שמפתח של Airtable יהיה בתוכו. במקום זה, שרת קטן ב-Cloudflare (Worker) מחזיק את המפתח ומעביר את הבקשות ל-Airtable. הדשבורד שולח אליו סיסמה, ובלי הסיסמה השרת לא עונה.

```text
הדשבורד ב-GitHub  →  Cloudflare Worker (מפתח + בדיקת סיסמה)  →  Airtable
```

הקוד של השרת נמצא ב-[airtable-proxy.mjs](airtable-proxy.mjs). זה חינם: המסלול החינמי של Cloudflare מספיק בהרבה.

## הגדרה (פעם אחת, כ-15 דקות)

### 1. מפתח חדש ב-Airtable
1. נכנסים ל-https://airtable.com/create/tokens ולוחצים **Create token**.
2. **Name:** `dashboard-github`
3. **Scopes:** מוסיפים `data.records:read` ו-`data.records:write`. רק את שני אלה.
4. **Access:** מוסיפים רק את הבסיס **ארומה - מאפים · דשבורד ייצור**.
5. לוחצים **Create token** ומעתיקים את המפתח. הוא מוצג פעם אחת בלבד.
6. באותו עמוד מבטלים (**Revoke**) את המפתח הישן שנשלח בצ'אט.

### 2. שרת ב-Cloudflare
1. נרשמים בחינם ב-https://dash.cloudflare.com/sign-up
2. **Workers & Pages** ← **Create** ← **Create Worker** (התבנית Hello World).
3. **Name:** `aroma-airtable` ← **Deploy**.
4. **Edit code** ← מוחקים את כל הקוד ← מדביקים את כל התוכן של `airtable-proxy.mjs` ← **Deploy**.

### 3. משתנים בשרת
בעמוד ה-Worker: **Settings** ← **Variables and Secrets** ← **Add**:

| שם | סוג | ערך |
|---|---|---|
| `AIRTABLE_TOKEN` | Secret | המפתח משלב 1 |
| `DASHBOARD_PASSWORD` | Secret | סיסמה שתבחר. ארוכה, ולא סיסמה שאתה משתמש בה במקום אחר |
| `ALLOWED_ORIGIN` | Text | `https://hamoudehh.github.io` |

שומרים ולוחצים **Deploy**.

### 4. הכתובת של השרת
מעתיקים את הכתובת של ה-Worker, למשל `https://aroma-airtable.<שם>.workers.dev`, ושולחים אותה ל-Claude. אפשר גם להכניס אותה בעצמך ל-`js/config.js` בשדה `airtableProxyUrl`.

### 5. כניסה ראשונה
פותחים את https://hamoudehh.github.io/factory-dashboard/, מקלידים את הסיסמה פעם אחת בכל מכשיר, ולוחצים **התחבר**.

## אבטחה
- **המפתח של Airtable נמצא רק ב-Cloudflare.** הוא לא בקוד, לא בריפו ולא בדפדפן.
- **הסיסמה היא המנעול.** מי שיש לו אותה יכול לקרוא ולשנות את הנתונים, כמו בדשבורד.
- **הסיסמה נשמרת בכל מכשיר אחרי הכניסה הראשונה.** "הגדרות ← Airtable ← התנתק מהמכשיר הזה" מוחק מהמכשיר את הסיסמה ואת הנתונים.
- **החלפת סיסמה:** משנים את `DASHBOARD_PASSWORD` ב-Cloudflare. כל המכשירים יתבקשו להיכנס מחדש.
- **מה השרת מאפשר:** רק את הבסיס של הדשבורד, ורק את הטבלאות שלו. טבלת הספקים פתוחה לקריאה בלבד.
- **בדיקת הכתובת:** השרת עונה רק לבקשות שמגיעות מהאתר ב-GitHub. הבדיקה הזאת עוצרת אתרים אחרים, אבל ההגנה האמיתית היא הסיסמה.

## בדיקות
`tests/proxy.test.mjs` מריץ את הקוד של השרת מול Airtable מדומה, עם המגבלות האמיתיות של Airtable: 10 רשומות לכל כתיבה ו-100 לכל עמוד. הבדיקות מכסות:
- סיסמה שגויה.
- אתר אחר.
- בסיס או טבלה זרים.
- כתיבה לטבלת הספקים.
- העלאה מלאה, טעינה, שינוי ומחיקה.
