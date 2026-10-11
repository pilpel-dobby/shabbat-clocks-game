# משחק שעוני שבת — מצב נוכחי

עודכן: 2026-05-24

## איפה עובדים
- תיקיית הפרויקט הראשית: `tasks/shabbat-clocks-game/`
- אפליקציית הווב: `tasks/shabbat-clocks-game/app/`
- מסמכי אפיון:
  - `tasks/shabbat-clocks-game/spec.md`
  - `tasks/shabbat-clocks-game/architecture.md`
- הערות שחרור/פיצ'רים: `tasks/shabbat-clocks-game/release_notes.md`
- ארטיפקטים/צילומי מסך: `tasks/shabbat-clocks-game/artifacts/`

## מה יש כרגע בפועל
זה כבר לא רק אפיון — יש MVP עובד בדפדפן.

### סטאק
- React 19
- TypeScript
- Vite
- Vitest

### קוד מרכזי
- מנוע סימולציה: `app/src/engine/index.ts`
- בדיקות מנוע: `app/src/engine/index.test.ts`
- הגדרות חידות: `app/src/puzzles/index.ts`
- UI ראשי: `app/src/App.tsx`

### יכולות שכבר קיימות
- סימולציה דטרמיניסטית של שרשרת שעוני שבת
- שעון מתקדם רק כשיש לו חשמל; בלי חשמל הוא קופא
- תמיכה בשרשור של כמה שעונים
- 4 חידות מובנות:
  1. שעון בודד
  2. טיימר דו-שלבי
  3. הסטה הדרגתית
  4. הפחתת מהירות משולשת
- ציר יעד מול ציר מצב בפועל
- UI אינטראקטיבי לעריכת שיניים
- שמירת מצב מקומית בדפדפן
- build סטטי מוכן תחת `app/dist/`

## אימות שבוצע עכשיו
דוֹבי הריץ בהצלחה:
- `npm test -- --run`
- `npm run build`

תוצאה:
- 9/9 בדיקות עברו
- build production נבנה בהצלחה

## מצב תוצר
- פלט build מוכן: `tasks/shabbat-clocks-game/app/dist/`
- גודל תיקיית dist בערך `256K`
- כלומר מבחינת hosting סטטי הפרויקט כמעט מוכן להעלאה

## חוסרים/חוב טכני קטן
- `app/README.md` עדיין README גנרי של Vite וצריך להחליף למסמך פרויקט אמיתי
- כדאי לעשות סבב human testing קצר לפי `app/HUMAN_TESTING.md`
- לפני העלאה לאוויר כדאי לבחור דומיין/סאב-דומיין ושירות hosting חינמי

## ההקשר להמשך
ה-next step הוא העלאה לאוויר.

### כיוון מומלץ לפריסה
להעדיף hosting סטטי חינמי, למשל אחד מאלה:
1. Cloudflare Pages
2. Netlify
3. Vercel
4. GitHub Pages

### מה צפוי בשלב הבא
- לפתוח חשבון חינמי לשירות פריסה אם צריך
- לחבר repo או להעלות build
- להגדיר פקודת build: `npm run build`
- להגדיר output directory: `dist`
- לבצע deploy ראשון ולבדוק שהמשחק נפתח תקין

## הערה תפעולית חשובה
אביחי ביקש ששלב ההעלאה יתבצע אוטונומית ככל האפשר, כולל פתיחת חשבונות חינמיים לפי הצורך. דוֹבי ינסה לבצע זאת עצמאית בשלב הבא, אבל ייתכן שחלק מהפלטפורמות ידרשו אימות מייל/אנושיות (captcha / verification), וזה עלול להיות blocker חיצוני נקודתי.

## נקודת כניסה מהירה לפעם הבאה
אם חוזרים לפרויקט הזה, להתחיל מכאן:
1. לקרוא `tasks/shabbat-clocks-game/CURRENT_STATUS.md`
2. לבדוק `tasks/shabbat-clocks-game/release_notes.md`
3. להיכנס ל-`tasks/shabbat-clocks-game/app/`
4. אם צריך אימות מהיר: להריץ test + build
5. לעבור לפריסה
