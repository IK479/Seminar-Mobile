class AnalyticsSDK {
  constructor() {
    this.apiKey = null;
    this.projectId = null;
    this.userId = null;
    this.serverUrl = "http://localhost:5000/api/v1/events"; 
    this.cacheKey = "analytics_events_cache";

    // האזנה לחזרת האינטרנט לצורך שליחת אירועים מה-Cache
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.flushCache());
    }
  }

  // 1. אתחול הספרייה עם מזהי הפרויקט
  init(apiKey, projectId) {
    this.apiKey = apiKey;
    this.projectId = projectId;
    console.log(`[SDK] Initialized for project: ${projectId}`);
    
    // ניסיון לשלוח אירועים שנשמרו ב-Offline בסשן הקודם
    this.flushCache();
  }

  // 2. ניהול מזהי משתמשים
  setUserId(userId) {
    this.userId = userId;
    console.log(`[SDK] User ID set to: ${userId}`);
  }

  clearUserId() {
    this.userId = null;
    console.log("[SDK] User ID cleared");
  }

  // 3. פונקציית מעקב האירועים המרכזית
  async trackEvent(name, properties = {}) {
    if (!this.projectId || !this.apiKey) {
      console.error("[SDK] Error: SDK not initialized. Call init() first.");
      return;
    }

    // הגנה קלה למקרה של סביבות חסרות דפדפן מלא
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    const language = typeof navigator !== "undefined" ? navigator.language : "unknown";
    const screenRes = typeof window !== "undefined" ? `${window.screen.width}x${window.screen.height}` : "unknown";

    // בניית אובייקט האירוע המלא
    const eventData = {
      projectId: this.projectId,
      eventName: name,
      userId: this.userId || "anonymous",
      timestamp: new Date().toISOString(),
      properties: properties,
      metadata: {
        userAgent: userAgent,
        language: language,
        screenResolution: screenRes
      }
    };

    // בדיקה האם המשתמש אונליין
    if (typeof navigator !== "undefined" && navigator.onLine) {
      await this.sendToServer([eventData]);
    } else {
      this.saveToCache([eventData]); // שינוי: מקבל מערך תמיד
    }
  }

  // 4. שליחת הנתונים לשרת ה-Node.js
  async sendToServer(events) {
    try {
      const response = await fetch(this.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey
        },
        body: JSON.stringify({ events })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      console.log(`[SDK] Successfully sent ${events.length} event(s) to server.`);
      return true;
    } catch (error) {
      console.warn("[SDK] Failed to send events, saving back to cache.", error);
      // אם השליחה נכשלה (למשל שגיאת רשת זמנית), נחזיר את כל המערך במכה אחת ל-Cache
      this.saveToCache(events);
      return false;
    }
  }

  // 5. שמירת מערך אירועים ב-Local Cache (תומך גם בבודדים וגם ב-Batch מרוכז)
  saveToCache(newEvents) {
    try {
      if (typeof window === "undefined" || !window.localStorage) return;
      
      const existingCache = JSON.parse(localStorage.getItem(this.cacheKey)) || [];
      // איחוד המערכים במכה אחת
      const updatedCache = [...existingCache, ...newEvents];
      
      localStorage.setItem(this.cacheKey, JSON.stringify(updatedCache));
      console.log(`[SDK] Saved ${newEvents.length} event(s) to local cache (Offline Mode).`);
    } catch (e) {
      console.error("[SDK] Failed to save to localStorage:", e);
    }
  }

  // 6. ריקון ה-Cache ושליחה מרוכזת (Batching) כשיש רשת
  async flushCache() {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    try {
      if (typeof window === "undefined" || !window.localStorage) return;

      const cachedEvents = JSON.parse(localStorage.getItem(this.cacheKey)) || [];
      if (cachedEvents.length === 0) return;

      console.log(`[SDK] Online detected. Flushing ${cachedEvents.length} cached events...`);
      
      // מחיקת ה-Cache המקומי זמנית כדי למנוע כפילויות ריצה
      localStorage.removeItem(this.cacheKey);

      // שליחה מרוכזת של כל המערך (Batching)
      await this.sendToServer(cachedEvents);
      
    } catch (e) {
      console.error("[SDK] Error during cache flush:", e);
    }
  }
}

// שיוך גלובלי לצורך שימוש ישיר ב-index.html
if (typeof window !== "undefined") {
  window.analytics = new AnalyticsSDK();
}