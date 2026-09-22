import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { generateToken, authenticateJWT, checkAdminPassword, AuthenticatedRequest } from "./auth.js";
import { readDb, writeDb, getOrCreateTodayAnalytics, Order, Product } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function escapeTelegramHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendTelegramOrderNotification(order: Order, orderSummaryText: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing");
    return false;
  }

  const formattedDateTime = new Date(order.createdAt).toLocaleString("he-IL", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const birthdaySignText = order.birthdaySign ? "כן (+5 ₪)" : "לא";
  const message = [
    "🚨 <b>הזמנה חדשה התקבלה מ-Made by Bareket!</b> 🍪",
    "",
    `<b>מספר הזמנה:</b> #${escapeTelegramHtml(order.id)}`,
    `<b>שם הלקוח:</b> ${escapeTelegramHtml(order.customerName || "לא צוין")}`,
    `<b>טלפון:</b> ${escapeTelegramHtml(order.phone || "לא צוין")}`,
    `<b>יום איסוף:</b> ${escapeTelegramHtml(order.pickupDay || "לא צוין")}`,
    `<b>טווח שעות איסוף:</b> ${escapeTelegramHtml(order.pickupTimeSlot || "לא צוין")}`,
    `<b>שלט מזל טוב:</b> ${birthdaySignText}`,
    "",
    "<b>פירוט ההזמנה:</b>",
    escapeTelegramHtml(orderSummaryText || "אין פירוט"),
    "",
    `<b>סכום לתשלום:</b> ${escapeTelegramHtml(order.totalPrice)} ₪`,
    `<b>תאריך ושעה:</b> ${escapeTelegramHtml(formattedDateTime)}`,
    "",
    "🔴 <b>מחכה לאימות תשלום ב-Bit!</b> ⚠️",
  ].join("\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      console.error("Telegram send failed:", response.status, result.description || "unknown Telegram error");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

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
    try {
      const { username, password } = req.body || {};
      if (checkAdminPassword(password)) {
        const token = generateToken({ username: username || "admin", role: "admin" });
        return res.status(200).json({ success: true, token });
      }
      return res.status(401).json({ error: "שם משתמש או סיסמה שגויים" });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "שגיאת שרת פנימית" });
    }
  });

  app.get("/api/auth/me", authenticateJWT, (req: AuthenticatedRequest, res) => {
    return res.status(200).json({ success: true, user: req.user });
  });

  // Order Submission API
  app.post("/api/orders", async (req, res) => {
    try {
      const { orderId, fullName, phoneNumber, pickupDay, pickupTimeSlot, birthdaySign, orderSummaryText, totalPrice, items } = req.body || {};

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
         items: Array.isArray(items) ? items : [],
        totalPrice: totalPrice || 0,
        createdAt: new Date().toISOString()
      };
      db.orders.unshift(newOrder);

      // Track analytics
      const todayAnalytics = getOrCreateTodayAnalytics(db);
      todayAnalytics.funnel.purchase += 1;
      writeDb(db);

       const telegramSent = await sendTelegramOrderNotification(newOrder, orderSummaryText || "");
       return res.status(200).json({ success: true, orderId: orderRef, telegramSent });
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
    return res.status(200).json({ dailyAnalytics: db.analytics, orders: db.orders });
  });

  app.get("/api/admin/products", authenticateJWT, (_req, res) => {
    const db = readDb();
    return res.status(200).json(db.products);
  });

  app.post("/api/admin/products", authenticateJWT, (req, res) => {
    const db = readDb();
    const { name, price, desc = "", image = "cookies/cornflakes.jpg", category = "sweet", hidden = false } = req.body || {};
    if (!name || !Number.isFinite(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: "שם ומחיר תקינים נדרשים" });
    }
    const product: Product = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: String(name).trim(),
      price: Number(price),
      desc: String(desc),
      image: String(image),
      category: String(category),
      hidden: Boolean(hidden),
    };
    db.products.push(product);
    writeDb(db);
    return res.status(201).json(product);
  });

  app.put("/api/admin/products/:id", authenticateJWT, (req, res) => {
    const db = readDb();
    const index = db.products.findIndex(product => product.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "המוצר לא נמצא" });
    }

    const current = db.products[index];
    const next = { ...current, ...req.body };
    if (!next.name || !Number.isFinite(Number(next.price)) || Number(next.price) <= 0) {
      return res.status(400).json({ error: "שם ומחיר תקינים נדרשים" });
    }
    db.products[index] = {
      ...next,
      id: current.id,
      name: String(next.name).trim(),
      price: Number(next.price),
      hidden: Boolean(next.hidden),
    };
    writeDb(db);
    return res.status(200).json(db.products[index]);
  });

  app.get("/api/admin/telegram-status", authenticateJWT, (_req, res) => {
    return res.status(200).json({
      configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    });
  });

  // Track visitor analytics
  app.post("/api/analytics/track", (req, res) => {
    try {
      const db = readDb();
      const todayAnalytics = getOrCreateTodayAnalytics(db);
      const { type, referrer } = req.body || {};

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

  // Static files or Vite integration
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  if (process.env.NODE_ENV !== "production" && fs.existsSync(path.resolve(__dirname, "..", "client"))) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "custom",
        root: path.resolve(__dirname, "..", "client"),
      });
      app.use(vite.middlewares);
      app.use("*", async (req, res, next) => {
        if (req.originalUrl.startsWith("/api")) return next();
        try {
          const template = fs.readFileSync(path.resolve(__dirname, "..", "client", "index.html"), "utf-8");
          const html = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (e) {
          next(e);
        }
      });
    } catch {
      app.use(express.static(staticPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(staticPath, "index.html"));
      });
    }
  } else {
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  }

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
