// Simple Vercel serverless function to receive quote form posts,
// save to Supabase and send notification email.
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Use service role key for server-side operations (must be set in Vercel env)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

function decodeDataUrl(dataUrl) {
  // data:[<mediatype>][;base64],<data>
  const m = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!m) return null;
  const mime = m[1];
  const buf = Buffer.from(m[2], 'base64');
  return { mime, buf };
}

async function sendMail({ from, to, subject, html, attachments }) {
  const transporterOpts = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE === 'true'),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  };
  const transporter = nodemailer.createTransport(transporterOpts);
  const info = await transporter.sendMail({ from, to, subject, html, attachments });
  return info;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

    const body = req.body || {};
    const {
      name, company, email, phone, service, message, attachments = []
    } = body;

    // Upload attachments to Supabase Storage (if configured)
    let uploaded = [];
    if (supabase && attachments.length) {
      for (const att of attachments) {
        const parsed = decodeDataUrl(att.dataUrl || att.data);
        if (!parsed) continue;
        const key = `attachments/${Date.now()}-${att.filename || 'file'}`;
        const { data, error: upErr } = await supabase.storage.from('attachments').upload(key, parsed.buf, {
          contentType: parsed.mime,
          upsert: false,
        });
        if (upErr) {
          console.error('supabase upload error', upErr);
        } else {
          // public URL may require bucket to be public or use signed URL
          const publicUrl = `${SUPABASE_URL.replace(/^https?:\/\//, 'https://')}/storage/v1/object/public/attachments/${encodeURIComponent(key)}`;
          uploaded.push({ filename: att.filename, key, url: publicUrl });
        }
      }
    }

    // Insert into DB (quote_logs)
    let inserted = null;
    if (supabase) {
      const payload = { name, company, email, phone, service, message, attachments: uploaded };
      const { data, error } = await supabase.from('quote_logs').insert(payload).select();
      if (error) console.error('Supabase insert error', error);
      inserted = data && data[0];
    }

    // Send notification email
    try {
      const mailFrom = process.env.MAIL_FROM || 'no-reply@example.com';
      const sales = process.env.SALES_EMAIL || 'sales@example.com';
      const html = `
        <p>New quote request from <strong>${name}</strong></p>
        <p><strong>Company:</strong> ${company || '-'}<br>
        <strong>Email:</strong> ${email || '-'}<br>
        <strong>Phone:</strong> ${phone || '-'}<br>
        <strong>Service:</strong> ${service || '-'}<br>
        <strong>Message:</strong><br>${(message || '-')}
        </p>
      `;
      const mailAttachments = (uploaded || []).map(u => ({ filename: u.filename, path: u.url }));
      await sendMail({ from: mailFrom, to: sales, subject: `[견적문의] ${name}`, html, attachments: mailAttachments });
    } catch (e) {
      console.error('mail send error', e);
    }

    return res.status(200).json({ ok: true, id: inserted ? inserted.id : null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
