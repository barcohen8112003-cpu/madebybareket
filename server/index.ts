import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { generateToken, authenticateJWT, checkAdminPassword, AuthenticatedRequest } from "./auth.js";
import { readDb, writeDb, getOrCreateTodayAnalytics, getTodayStr, Order } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // SEO endpoints
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain");
    res.send("User-agent: *\nAllow: /\nSitemap: https://madebybareket.com/sitemap.xml");
  });

  app.get("/sitemap.xml", (_req, res) => {
    res.type("application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://madebybareket.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  });

  // Admin Auth APIs
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (checkAdminPassword(password)) {
      const token = generateToken({ username, role: "admin" });
      return res.status(200).json({ success: true, token });
    }
    return res.status(401).json({ error: "שם משתמש או סיסמה שגויים" });
  });

  app.get("/api/auth/me", authenticateJWT, (req: AuthenticatedRequest, res) => {
    return res.status(200).json({ success: true, user: req.user });
  });

  // Order Submission API
  app.post("/api/orders", async (req, res) => {
    try {
      const { orderId, fullName, phoneNumber, pickupDay, pickupTimeSlot, birthdaySign, orderSummaryText, totalPrice, items } = req.body;

      const orderRef = orderId || `MB-${Math.floor(100000 + Math.random() * 900000)}`;

      // Save order in local db
      const db = readDb();
      const newOrder: Order = {
        id: orderRef,
        customerName: fullName || "אנונימי",
        phone: phoneNumber || "",
        pickupDay: pickupDay || "",
        pickupTimeSlot: pickupTimeSlot || "",
        birthdaySign: !!birthdaySign,
        items: items || [],
        totalPrice: totalPrice || 0,
        createdAt: new Date().toISOString()
      };
      db.orders.unshift(newOrder);

      // Track analytics
      const todayAnalytics = getOrCreateTodayAnalytics(db);
      todayAnalytics.funnel.purchase += 1;
      writeDb(db);

      // Send to Telegram if tokens exist
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (botToken && chatId) {
        const now = new Date();
        const formattedDateTime = now.toLocaleString("he-IL", {
          timeZone: "Asia/Jerusalem",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const birthdaySignText = birthdaySign ? "כן (+5 ₪)" : "לא";
        const message = `🚨 *הזמנה חדשה התקבלה מ-Made by Bareket!* 🍪\n\n*מספר הזמנה:* #${orderRef}\n*שם הלקוח:* ${fullName || 'לא צוין'}\n*טלפון:* ${phoneNumber || 'לא צוין'}\n*יום איסוף:* ${pickupDay || 'לא צוין'}\n*טווח שעות איסוף:* ${pickupTimeSlot || 'לא צוין'}\n*שלט מזל טוב:* ${birthdaySignText}\n\n*פירוט ההזמנה:*\n${orderSummaryText || 'אין פירוט'}\n\n*סכום לתשלום:* ${totalPrice} ₪\n*תאריך ושעה:* ${formattedDateTime}\n\n🔴 *מחכה לאימות תשלום ב-Bit!* ⚠️`;

        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
        }).catch(err => console.error("Telegram send error:", err));
      }

      return res.status(200).json({ success: true, orderId: orderRef });
    } catch (error) {
      console.error("Error handling order submission:", error);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // Admin Dashboard Data APIs
  app.get("/api/admin/orders", authenticateJWT, (_req, res) => {
    const db = readDb();
    return res.status(200).json(db.orders);
  });

  app.delete("/api/admin/orders/:id", authenticateJWT, (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.orders = db.orders.filter(o => o.id !== id);
    writeDb(db);
    return res.status(200).json({ success: true });
  });

  app.get("/api/admin/analytics", authenticateJWT, (_req, res) => {
    const db = readDb();
    return res.status(200).json(db.analytics);
  });

  app.get("/api/admin/products", (_req, res) => {
    const db = readDb();
    return res.status(200).json(db.products);
  });

  app.post("/api/admin/products", authenticateJWT, (req, res) => {
    const db = readDb();
    db.products = req.body;
    writeDb(db);
    return res.status(200).json({ success: true });
  });

  // Track visitor analytics
  app.post("/api/analytics/track", (req, res) => {
    try {
      const db = readDb();
      const todayAnalytics = getOrCreateTodayAnalytics(db);
      const { type, referrer } = req.body;

      if (type === 'pageview') {
        todayAnalytics.pageviews += 1;
      } else if (type === 'visitor') {
        todayAnalytics.visitors += 1;
        todayAnalytics.funnel.visitor += 1;
      } else if (type === 'add_to_cart') {
        todayAnalytics.funnel.add_to_cart += 1;
      } else if (type === 'initiate_checkout') {
        todayAnalytics.funnel.initiate_checkout += 1;
      }

      if (referrer) {
        const refDomain = referrer.replace(/https?:\/\//, '').split('/')[0] || 'ישיר / אחר';
        todayAnalytics.referrers[refDomain] = (todayAnalytics.referrers[refDomain] || 0) + 1;
      }

      writeDb(db);
      return res.status(200).json({ success: true });
    } catch {
      return res.status(200).json({ success: true });
    }
  });

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
