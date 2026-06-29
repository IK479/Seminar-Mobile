import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);

// הגדרת WebSockets עם הרשאות CORS פתוחות
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// חיבור לבסיס הנתונים MongoDB Atlas / Local
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/analytics_db";
mongoose.connect(MONGO_URI, { dbName: 'analytics_db' })
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// הגדרת ה-Schema של האירועים
const eventSchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  eventName: { type: String, required: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  properties: { type: mongoose.Schema.Types.Mixed },
  metadata: {
    userAgent: String,
    language: String,
    screenResolution: String
  }
});

eventSchema.index({ projectId: 1, timestamp: -1 });
const Event = mongoose.model('Event', eventSchema);

// Middleware לאימות ה-API Key מה-SDK
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.SDK_API_KEY || "my_secret_api_key_123";
  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing API Key" });
  }
  next();
};

// Endpoint לקליטת חבילות אירועים מה-SDK (Bulk Insert)
app.post('/api/v1/events', validateApiKey, async (req, res) => {
  try {
    const { events } = req.body;
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: "Invalid payload format." });
    }
    const savedEvents = await Event.insertMany(events);
    console.log(`Saved ${savedEvents.length} events to DB.`);
    
    // שידור בזמן אמת לפורטל הניהול
    savedEvents.forEach(event => {
      io.emit(`new-event:${event.projectId}`, event);
    });
    return res.status(201).json({ success: true, count: savedEvents.length });
  } catch (error) {
    console.error("Error saving events:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 1. היסטוריית אירועים מלאה (עבור ה-Log Table בפורטל)
app.get('/api/v1/projects/:projectId/events', async (req, res) => {
  try {
    const { projectId } = req.params;
    const events = await Event.find({ projectId }).sort({ timestamp: -1 }).limit(100);
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 2. סטטיסטיקות כלליות עבור גרף העוגה
app.get('/api/v1/projects/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;
    const stats = await Event.aggregate([
      { $match: { projectId } },
      { $group: { _id: "$eventName", count: { $sum: 1 } } }
    ]);
    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    return res.json({ success: true, stats: formattedStats });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 3. משימות פתוחות כרגע עבור ה-Persistence ברענון האתר
app.get('/api/v1/projects/:projectId/active-tasks', async (req, res) => {
  try {
    const { projectId } = req.params;
    const activeTasks = await Event.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: { taskName: "$properties.task_name" },
          createdCount: { $sum: { $cond: [{ $eq: ["$eventName", "task_created"] }, 1, 0] } },
          completedCount: { $sum: { $cond: [{ $eq: ["$eventName", "task_completed"] }, 1, 0] } },
          difficulty: { $first: "$properties.difficulty" },
          lastUpdated: { $max: "$timestamp" }
        }
      },
      { $match: { $expr: { $gt: ["$createdCount", "$completedCount"] } } },
      { $sort: { lastUpdated: -1 } }
    ]);
    const formattedTasks = activeTasks.map(task => ({
      name: task._id.taskName,
      difficulty: task.difficulty || 'קל',
      lastUpdated: task.lastUpdated
    }));
    return res.json({ success: true, tasks: formattedTasks });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 4. אגרגציה מתקדמת: חישוב משפך המרה (Funnel) וזמן ביצוע ממוצע למשימה (עם חסינות לרווחים ושפות)
app.get('/api/v1/projects/:projectId/advanced-analytics', async (req, res) => {
  try {
    const { projectId } = req.params;

    const data = await Event.aggregate([
      { $match: { projectId } },
      {
        $project: {
          eventName: 1,
          timestamp: 1,
          userId: 1,
          cleanedTaskName: { $trim: { input: { $ifNull: ["$properties.task_name", ""] } } }
        }
      },
      {
        $group: {
          _id: { taskName: "$cleanedTaskName", userId: "$userId" },
          createdTime: { $min: { $cond: [{ $eq: ["$eventName", "task_created"] }, "$timestamp", null] } },
          completedTime: { $max: { $cond: [{ $eq: ["$eventName", "task_completed"] }, "$timestamp", null] } }
        }
      }
    ]);

    let totalCreated = 0;
    let totalCompleted = 0;
    let totalDurationMs = 0;
    let completedWithDurationCount = 0;

    data.forEach(item => {
      if (!item._id.taskName) return;

      if (item.createdTime) totalCreated++;
      if (item.completedTime) totalCompleted++;
      
      if (item.createdTime && item.completedTime) {
        const diff = new Date(item.completedTime) - new Date(item.createdTime);
        if (diff > 0) {
          totalDurationMs += diff;
          completedWithDurationCount++;
        }
      }
    });

    let avgDurationText = "0 שניות";
    if (completedWithDurationCount > 0) {
      const avgMs = totalDurationMs / completedWithDurationCount;
      const totalSeconds = Math.round(avgMs / 1000);
      if (totalSeconds < 60) {
        avgDurationText = `${totalSeconds} שניות`;
      } else {
        avgDurationText = `${Math.round(totalSeconds / 60)} דקות`;
      }
    }

    const conversionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

    return res.json({
      success: true,
      funnel: { created: totalCreated, completed: totalCompleted, conversionRate },
      avgDurationText
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 5. התפלגות פעילות לפי שעות (Activity Heatmap)
app.get('/api/v1/projects/:projectId/hourly-distribution', async (req, res) => {
  try {
    const { projectId } = req.params;
    const hourlyData = await Event.aggregate([
      { $match: { projectId } },
      {
        $project: {
          hour: { $hour: { date: "$timestamp", timezone: "Asia/Jerusalem" } }
        }
      },
      { $group: { _id: "$hour", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const fullDay = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0 }));
    hourlyData.forEach(d => {
      if (d._id !== null && d._id >= 0 && d._id < 24) {
        fullDay[d._id].count = d.count;
      }
    });

    return res.json({ success: true, hourly: fullDay });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Analytics Backend listening on port ${PORT}`));