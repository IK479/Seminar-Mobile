# Real-Time Analytics SDK & Enterprise Developer Portal 📊

ספריית קצה (Client-Side SDK) קלת משקל המיועדת להטמעה באפליקציות וברשת, המאפשרת מעקב, אגירה ושידור בזמן אמת של אירועים (Events), נתוני מערכת וקריסות (Crashes) אל שרת מאובטח, לצד פורטל ניהול (Developer Dashboard) מתקדם המציג מדדים ואגרגציות מורכבות בלייב[cite: 1, 6, 7].

---

## 🚀 רשימת פיצ'רים ויכולות (Features)

*   **Real-Time Bulk Ingestion (Batching):** אריזה ומשלוח מרוכז של חבילות אירועים כדי למנוע עומס רשת (DDoS עצמי) בצד השרת וחיסכון במשאבי מכשיר הקצה.
*   **Robust Offline Support (Local Caching):** מנגנון ניהול זיכרון מקומי מבוסס `localStorage` השומר אירועים באופן אוטומטי כשאין רשת, ומרוקן אותם (Flush) ישירות לשרת עם חזרת החיבור.
*   **User Session Management:** שיוך מזהה ייחודי דינמי למשתמש (`userId`) המאפשר ניתוח התנהגות פרסונלי ומעקב משפך המרה (Funnel)[cite: 1, 7].
*   **Automated Metadata Tracking:** איסוף נתוני קצה אוטומטיים כגון רזולוציית מסך, שפת מכשיר ו-User Agent ללא צורך בהתערבות המפתח.
*   **Reactive Live Stream Dashboard:** שימוש בטכנולוגיית WebSockets (`Socket.io`) לעדכון מיידי של לוח הבקרה וזרם האירועים ללא צורך בריענון עמוד (Polling)[cite: 6, 7].
*   **Clean Crash & Exception Catching:** תפיסת חריגות וקריסות בלתי צפויות באפליקציה ושמירתן במבנה JSON נקי וממוקד לניתוח מהיר.

---

## 🛠️ הטמעה (Implementation)

הוסף את קובץ ה-SDK למבנה הפרויקט שלך וייבא אותו בראש עמוד ה-HTML הראשי[cite: 3]:

```html
<!-- ייבוא קובץ ה-SDK לפרויקט -->
<script src="analytics-sdk.js"></script>
⚡ תחילת עבודה מהירה (Quick Start & How to Use)JavaScript// 1. אתחול ה-SDK עם מפתח הפרויקט הייחודי ומפתח ה-API
const projectId = "productivity_app_2026";
analytics.init("my_secret_api_key_123", projectId);

// 2. שיוך מזהה המשתמש הנוכחי במערכת
analytics.setUserId("user_ido_katz");

// 3. מעקב ושליחת אירוע מותאם אישית עם פרמטרים דינמיים
analytics.trackEvent("task_created", {
    task_name: "ללמוד למבחן בארכיטקטורה",
    difficulty: "קשה"
});

// 4. ניתוק מזהה משתמש בעת ביצוע התנתקות (Logout)
analytics.clearUserId();
📐 דיאגרמות ותרשימי זרימה1. ארכיטקטורת מערכת כוללת (System Architecture)┌────────────────────────┐      HTTP POST (Batch / JSON)      ┌────────────────────────┐
│     Developer App      ├───────────────────────────────────►│       Server API       │
│  (Client SDK + Cache)  │◄──────────────────────────────────┤    (Node.js/Express)   │
└────────────────────────┘             WebSockets             └───────────┬────────────┘
                                      (Socket.io)                         │
┌────────────────────────┐                 ▲                              │ Mongoose ORM
│    Developer Portal    │─────────────────┘                              ▼
│  (Dashboard UI & Live) │                                    ┌────────────────────────┐
└────────────────────────┘                                    │        Database        │
                                                              │    (MongoDB Atlas)     │
                                                              └────────────────────────┘
2. תרשים רצף: טיפול באירועים במצב מקוון ולא מקוון (Sequence Diagram)Developer App           Client SDK              LocalStorage              Server API
     │                       │                        │                       │
     │─── trackEvent() ─────►│                        │                       │
     │                       │─── check Network? ────►│                       │
     │                       │                        │                       │
     │                       │─── [If Online] ───────────────────────────────►│ (Save Event)
     │                       │                                                │◄─── 201 OK ──
     │                       │                                                │
     │                       │─── [If Offline] ──────►│                       │
     │                       │                        │─── saveToCache() ────►│
     │                       │                        │                       │
     │                       │─── window:online ─────►│                       │
     │                       │                        │─── Read cached logs ─►│
     │                       │─── flushCache() ──────────────────────────────►│ (Bulk Insert)
3. תרשים מצבים של רשת ה-SDK (State Diagram)        ┌───────────────┐      Network Drops       ┌───────────────┐
  ─────►│  ONLINE MODE  ├─────────────────────────►│ OFFLINE MODE  │
        │               │                          │               │
        │ Direct Send   │◄─────────────────────────┤ Cache Events  │
        └───────────────┘       Network Restored   └───────────────┘
🗄️ מסד הנתונים: מבנה טבלאות ויעילות אלגוריתמית ($O$ Notation)המערכת משתמשת בבסיס הנתונים MongoDB ומגדירה אינדקס מורכב (Compound Index) משולב לשיפור ביצועי השרת:  אינדקסים מוגדרים במערכת:JavaScripteventSchema.index({ projectId: 1, timestamp: -1 });
ניתוח יעילות השאילתות בצד השרת ($O$-Notation Efficiency):רכיב / Endpointפונקציית מסד נתוניםיעילות ללא אינדקסיעילות עם אינדקס ומדועקליטת אירועים POST /api/v1/events  insertMany(events)  $O(N)$$O(N)$ כתיבה ישירה של חבילת מסמכים חדשה למסד הנתונים.  טבלת לוגים GET /.../events  find({ projectId }).sort({ timestamp: -1 })  $O(M \cdot \log M)$ (ביצוע מיון מלא בזיכרון על כל הרשומות)$O(\log M) + O(K)$ שליפה בינארית מהירה לפי מזהה פרויקט וקריאה רציפה ללא מיון.  אגרגציה וסטטיסטיקות GET /.../stats  aggregate([ { $match }, { $group } ])  $O(M)$ (סריקה של כל ה-Collection מאפס - Table Scan)$O(\log M) + O(K)$ סינון ראשוני מבוסס אינדקס וצמצום קבוצת הנתונים רק לפרויקט המבוקש.  כאשר $N$ הוא גודל חבילת האירועים הנשלחת, $M$ הוא סך כל המסמכים ב-Collection, ו-$K$ הוא כמות האירועים המתאימים לפרויקט הספציפי.🔌 ממשקי השרת (Server Endpoints & API URLs)כל ה-Endpoints מוגשים תחת ה-Base URL: http://localhost:5000/api/v1[cite: 1, 7].🔐 אימות גישה (Authentication)בקשות POST מחויבות בהעברת כותרת אימות ייחודית:  x-api-key: המפתח הסודי של הפרויקט המאמת את חוקיות ה-SDK.  רשימת נתיבים (Endpoints):POST /events - קליטת מערך אירועים מרוכז (Bulk Infert) מה-SDK.  GET /projects/:projectId/events - שליפת 100 האירועים האחרונים של פרויקט עבור טבלת הניהול.  GET /projects/:projectId/stats - אגרגציית כמות הפעולות לפי סוג גרף עבור גרף העוגה.  GET /projects/:projectId/advanced-analytics - חישוב יחס המרה (Funnel) וזמן ביצוע ממוצע.  GET /projects/:projectId/hourly-distribution - פילוח פעילות משתמשים לפי 24 שעות היממה.  💻 פירוט פונקציות הקוד (Open / Private)פונקציות גלויות למפתח (Public SDK Methods)init(apiKey, projectId): מאתחלת את הספרייה, מגדירה מפתחות ומרוקנת אירועים שהיו ב-Cache.  setUserId(userId): משייכת מזהה לקוח קבוע לכל האירועים הבאים.  clearUserId(): מוחקת את מזהה המשתמש והופכת את השולח לאנונימי.  trackEvent(name, properties): יצירת אובייקט אירוע מלא ושליחתו או אגירתו לפי מצב הרשת.  פונקציות פנימיות ומוסתרות (Private Logic & Micro-services)sendToServer(events): מבצעת בקשת HTTP POST אסינכרונית בפועל אל שרת ה-API.  saveToCache(newEvents): דוחפת מערך אירועים אל ה-localStorage של הדפדפן במצב אופליין[cite: 1].flushCache(): קוראת, מרוקנת ומשדרת את כל הזיכרון המקומי ברגע שהתגלה חיבור אינטרנט תקין[cite: 1].🛡️ איסוף ותיעוד קריסות נקי (Clean Crash Ingestion)כדי לתפוס קריסות (Exceptions) בצורה יעילה ללא ניפוח השרת, ה-SDK מייצא אובייקט JSON מצומצם ונקי המכיל את ה-Stack Trace החיוני בלבד. השרת קולט ומאחסן אותו בשדה הדינמי properties:  מבנה ה-JSON הנשלח לשרת בעת קריסה:JSON{
  "projectId": "productivity_app_2026",
  "eventName": "app_crash",
  "userId": "user_ido_katz",
  "timestamp": "2026-07-17T13:31:00.000Z",
  "properties": {
    "error_message": "ReferenceError: activeTasks is not defined",
    "component": "loadActiveTasksFromDB",
    "line": 42
  }
}

https://github.com/user-attachments/assets/d8b0404d-1bf9-4544-96de-498151c1e504

בתוך הריפוזיטורי ישנו קישור לקובץ DOCX בשם Analytics - ReadMe.docx בו רשום סיכום הפרוייקט  
