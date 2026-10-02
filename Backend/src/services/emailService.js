const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } catch (err) {
    console.warn('[EmailService] SMTP transporter initialization failed, logging fallback will be used:', err.message);
  }
}

/**
 * Dispatches an email notification and stores in-app Notification record.
 */
async function sendNotification({ recipientId, recipientEmail, projectId, type, title, message }) {
  let notifDoc = null;
  try {
    if (recipientId) {
      notifDoc = await Notification.create({
        recipientId,
        projectId: projectId || null,
        type,
        title,
        message,
        status: 'UNREAD'
      });
    }
  } catch (err) {
    console.error('[EmailService] Failed to create in-app notification:', err.message);
  }

  // Email dispatch
  if (recipientEmail && transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'KLU Academic Repository <notifications@klu.ac.in>',
        to: recipientEmail,
        subject: `[KLU Project System] ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #0056b3;">KLU Academic Project Management</h2>
            <h3>${title}</h3>
            <p>${message}</p>
            <hr style="border: 0; border-top: 1px solid #ccc;" />
            <p style="font-size: 12px; color: #777;">This is an automated notification from KLU Project System.</p>
          </div>
        `
      });
    } catch (eErr) {
      console.warn(`[EmailService] SMTP email to ${recipientEmail} failed:`, eErr.message);
      if (notifDoc) {
        notifDoc.status = 'FAILED';
        await notifDoc.save();
      }
    }
  } else {
    console.log(`[EmailService Log Fallback] Notification dispatched to recipientId ${recipientId}: "${title}" - ${message}`);
  }

  return notifDoc;
}

module.exports = {
  sendNotification
};
