import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

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

  // Telegram order notification endpoint
  app.post("/api/orders", async (req, res) => {
    try {
      const { orderId, fullName, phoneNumber, pickupDay, pickupTimeSlot, birthdaySign, orderSummaryText, totalPrice } = req.body;

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        console.warn("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in environment variables.");
        // Still return success for order creation if telegram token is missing on render until configured
        return res.status(200).json({ success: true, warning: "Telegram environment variables missing" });
      }

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
      const orderRef = orderId || `MB-${Math.floor(100000 + Math.random() * 900000)}`;

      const message = `🚨 *הזמנה חדשה התקבלה מ-Made by Bareket!* 🍪\n\n*מספר הזמנה:* #${orderRef}\n*שם הלקוח:* ${fullName || 'לא צוין'}\n*טלפון:* ${phoneNumber || 'לא צוין'}\n*יום איסוף:* ${pickupDay || 'לא צוין'}\n*טווח שעות איסוף:* ${pickupTimeSlot || 'לא צוין'}\n*שלט מזל טוב:* ${birthdaySignText}\n\n*פירוט ההזמנה:*\n${orderSummaryText || 'אין פירוט'}\n\n*סכום לתשלום:* ${totalPrice} ₪\n*תאריך ושעה:* ${formattedDateTime}\n\n🔴 *מחכה לאימות תשלום ב-Bit!* ⚠️`;

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Failed to send Telegram notification:", errText);
        return res.status(500).json({ success: false, error: "Telegram dispatch failed" });
      }

      return res.status(200).json({ success: true, orderId: orderRef });
    } catch (error) {
      console.error("Error handling order submission:", error);
      return res.status(500).json({ success: false, error: "Internal server error" });
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

