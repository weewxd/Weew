import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import nodemailer from "nodemailer";
import fs from "fs";

// Load firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));

// Initialize firebase on server
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Route: Send newsletter
  app.post("/api/send-newsletter", async (req: express.Request, res: express.Response) => {
    try {
      const { subject, title, content, targetLang, html } = req.body;

      if (!subject || !content) {
        return res.status(400).json({ success: false, error: "Subject and content are required" });
      }

      // Fetch active subscribers
      const subscribersCol = collection(db, "newsletter_subscribers");
      const q = query(subscribersCol, where("active", "==", true));
      const querySnapshot = await getDocs(q);
      const subscribers: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email) {
          subscribers.push(data.email);
        }
      });

      if (subscribers.length === 0) {
        return res.json({ 
          success: true, 
          message: targetLang === "TR" ? "Aktif bülten abonesi bulunamadı, gönderim yapılmadı." : "No active subscribers found, no emails sent.",
          sentCount: 0 
        });
      }

      // Prepare Nodemailer transport
      let transporter;
      let isTestAccount = false;
      let previewUrl = "";

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || `"Weew Portal" <newsletter@weew.portal>`;

      if (smtpHost && smtpUser && smtpPass) {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || "587"),
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
      } else {
        // Fallback: Create ethereal test SMTP
        isTestAccount = true;
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }

      // Compose email body with beautiful Twitch/Gaming streamer bento style
      const defaultHtmlBody = `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0c0d16; color: #ffffff; padding: 30px 20px; max-width: 600px; margin: 0 auto; border-radius: 20px; border: 1px solid #1f2235; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #1f2235; padding-bottom: 20px;">
            <span style="font-family: monospace; font-size: 11px; color: #a855f7; letter-spacing: 3px; font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 5px;">// PORTAL BÜLTENİ</span>
            <h1 style="color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">${title || subject}</h1>
          </div>
          
          <!-- Content -->
          <div style="background-color: #10111a; border-radius: 16px; border: 1px solid #1f2235; padding: 25px; margin-bottom: 30px; line-height: 1.6; color: #cbd5e1; font-size: 14px; white-space: pre-wrap;">
            ${content.replace(/\n/g, "<br/>")}
          </div>

          <!-- CTA / Link -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${process.env.APP_URL || 'https://weew.portal'}" style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: #ffffff; padding: 12px 30px; border-radius: 12px; font-weight: bold; text-decoration: none; font-size: 13px; display: inline-block; box-shadow: 0 4px 15px rgba(168,85,247,0.4);">
              ${targetLang === "TR" ? "Portalı Ziyaret Et" : "Visit Portal"}
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid #1f2235; padding-top: 20px; font-size: 11px; color: #64748b;">
            <p style="margin: 0 0 10px 0;">Bu bülteni Weew Portal abonesi olduğunuz için aldınız.</p>
            <p style="margin: 0;">© 2026 Weew Portal. Tüm Hakları Saklıdır.</p>
          </div>
        </div>
      `;

      const htmlBody = html || defaultHtmlBody;

      // Send to all subscribers
      const mailOptions = {
        from: smtpFrom,
        to: subscribers.join(", "),
        subject: subject,
        html: htmlBody,
        text: `${title || subject}\n\n${content}\n\nVisit: ${process.env.APP_URL || 'https://weew.portal'}`
      };

      const info = await transporter.sendMail(mailOptions);

      if (isTestAccount) {
        previewUrl = nodemailer.getTestMessageUrl(info) || "";
        console.log("Test mail sent successfully! Preview URL:", previewUrl);
      }

      res.json({
        success: true,
        sentCount: subscribers.length,
        isTestAccount,
        previewUrl,
        message: targetLang === "TR" 
          ? `Bülten ${subscribers.length} aboneye başarıyla gönderildi!` 
          : `Newsletter successfully sent to ${subscribers.length} subscribers!`
      });

    } catch (err: any) {
      console.error("Error sending newsletter:", err);
      res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
