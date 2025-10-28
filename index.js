require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// allow larger payloads for attachments encoded as data URLs
app.use(bodyParser.json({ limit: process.env.BODY_JSON_LIMIT || '12mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: process.env.BODY_JSON_LIMIT || '12mb' }));

// Simple CORS for local development (allow requests from other local ports like 5501)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Serve static site from current directory
app.use(express.static(path.join(__dirname, '.')));

// create transporter from env; if missing, create a test account (ethereal) for local testing
let transporter;
let usingTestAccount = false;
async function createTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const t = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT && Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        try {
            await t.verify();
            console.log('SMTP transporter verified with host', process.env.SMTP_HOST);
            return t;
        } catch (err) {
            console.error('SMTP verify failed, will fall back to Ethereal test account. Error:', err && err.message ? err.message : err);
        }
    }

    console.log('SMTP config not found. Creating ethereal test account for local testing...');
    const testAccount = await nodemailer.createTestAccount();
    usingTestAccount = true;
    console.log('Ethereal account created:', testAccount.user);
    return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
}

// initialize transporter (async)
createTransporter().then(t => { transporter = t; }).catch(err => { console.error('Failed to create transporter', err); });

// Setup Postgres and S3 clients (optional, used when configured)
let dbPool = null;
try {
    const { Pool } = require('pg');
    if (process.env.DATABASE_URL) dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
} catch (e) { /* ignore if not installed */ }

let s3client = null;
let S3Bucket = process.env.S3_BUCKET || null;
if (process.env.S3_BUCKET) {
    try {
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        s3client = new S3Client({
            region: process.env.S3_REGION || 'us-east-1',
            credentials: process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY ? {
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY
            } : undefined,
            endpoint: process.env.S3_ENDPOINT || undefined,
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
        });
        var PutObject = PutObjectCommand; // alias
    } catch (e) { console.warn('S3 client not initialized', e.message || e); }
}

app.post('/api/quote', async (req, res) => {
    const { name, company, email, phone, service, message, attachments } = req.body || {};

    if (!name || !email || !service) {
        return res.status(400).json({ error: '필수 필드 누락' });
    }

    const salesTo = process.env.SALES_EMAIL || 'gg6532@nki-1.co.kr';

    const mailOptions = {
        from: process.env.MAIL_FROM || `no-reply@${process.env.MAIL_DOMAIN || 'localhost'}`,
        replyTo: `${name} <${email}>`,
        to: salesTo,
        subject: `[견적문의] ${service} - ${company || name}`,
        text: `이름: ${name}\n회사: ${company}\n이메일: ${email}\n전화번호: ${phone}\n\n요청사항:\n${message}`,
        html: `
            <div style="font-family: Arial, Helvetica, sans-serif; color:#222;">
                <div style="background:#f6f9fc;padding:18px;border-radius:6px;">
                    <h2 style="margin:0 0 8px 0;color:#0b5394;">견적 문의가 도착했습니다</h2>
                    <p style="margin:0 0 12px 0;color:#333;">새로운 견적 요청이 접수되었습니다. 아래 내용을 확인해주세요.</p>

                    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
                        <tr><td style="padding:8px;border:1px solid #e6eef6;width:140px;font-weight:600;background:#fff;">이름</td><td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(name)}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e6eef6;font-weight:600;background:#fff;">회사</td><td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(company)}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e6eef6;font-weight:600;background:#fff;">이메일</td><td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(email)}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e6eef6;font-weight:600;background:#fff;">전화번호</td><td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(phone)}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e6eef6;font-weight:600;background:#fff;">서비스</td><td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(service)}</td></tr>
                    </table>

                    <div style="background:#ffffff;padding:12px;border:1px solid #e6eef6;border-radius:4px;margin-bottom:12px;">
                        <strong style="display:block;margin-bottom:6px;color:#0b5394;">요청사항</strong>
                        <div style="white-space:pre-wrap;color:#333;">${escapeHtml(message)}</div>
                    </div>

                    <p style="font-size:12px;color:#777;margin:0;">보낸 시각: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        `
    };

    // attachments handling: upload dataUrls to S3 when configured, attach small buffers
    const mailAttachments = [];
    if (Array.isArray(attachments) && attachments.length) {
        for (const att of attachments.slice(0, 5)) {
            try {
                if (att.dataUrl && s3client && S3Bucket) {
                    // upload to S3
                    const comma = att.dataUrl.indexOf(',');
                    const meta = att.dataUrl.substring(5, comma);
                    const isBase64 = meta.indexOf('base64') !== -1;
                    const mime = meta.split(';')[0] || att.type || 'application/octet-stream';
                    const base64 = att.dataUrl.substring(comma + 1);
                    const buf = Buffer.from(base64, 'base64');
                    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${att.name || 'file'}`;
                    await s3client.send(new PutObject({ Bucket: S3Bucket, Key: key, Body: buf, ContentType: mime }));
                    const url = process.env.S3_PUBLIC_URL_TEMPLATE ? process.env.S3_PUBLIC_URL_TEMPLATE.replace('{key}', encodeURIComponent(key)) : `https://${S3Bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
                    mailOptions.html += `<p><a href="${escapeHtml(url)}" target="_blank">첨부파일: ${escapeHtml(att.name || url)}</a></p>`;
                } else if (att.dataUrl) {
                    // attach directly (small file)
                    const comma = att.dataUrl.indexOf(',');
                    const meta = att.dataUrl.substring(5, comma);
                    const isBase64 = meta.indexOf('base64') !== -1;
                    const mime = meta.split(';')[0] || att.type || 'application/octet-stream';
                    const base64 = att.dataUrl.substring(comma + 1);
                    if (isBase64) {
                        const buf = Buffer.from(base64, 'base64');
                        mailAttachments.push({ filename: att.name || 'attachment', content: buf, contentType: mime });
                    }
                } else if (att.url) {
                    mailOptions.html += `<p><a href="${escapeHtml(att.url)}" target="_blank">첨부파일: ${escapeHtml(att.name || att.url)}</a></p>`;
                }
            } catch (e) {
                console.warn('attachment handling failed', e && e.message ? e.message : e);
            }
        }
    }
    if (mailAttachments.length) mailOptions.attachments = mailAttachments;

    try {
        if (!transporter) {
            transporter = await createTransporter();
        }

        const info = await transporter.sendMail(mailOptions);
        // write to Postgres if available
        try {
            if (dbPool) {
                const res = await dbPool.query(
                    `INSERT INTO quote_logs (name, company, email, phone, service, message, attachments, sent, info, created_at)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
                    [name || null, company || null, email || null, phone || null, service || null, message || null, JSON.stringify(attachments || []), true, JSON.stringify({ messageId: info && info.messageId ? info.messageId : null }), new Date()]
                );
                console.log('quote saved to DB id=', res && res.rows && res.rows[0] ? res.rows[0].id : '(unknown)');
            } else {
                const entry = await appendLog({
                    name, company, email, phone, service, message,
                    to: salesTo,
                    timestamp: new Date().toISOString(),
                    sent: true,
                    info: { messageId: info && info.messageId ? info.messageId : null }
                });
                console.log('quote appended to log id=', entry && entry.id ? entry.id : '(unknown)');
            }
        } catch (e) {
            console.error('DB/log write failed', e);
        }
        const result = { ok: true, messageId: info && info.messageId ? info.messageId : null };
        if (usingTestAccount) {
            const preview = nodemailer.getTestMessageUrl(info);
            console.log('Preview URL:', preview);
            result.preview = preview;
        }
        return res.json(result);
    } catch (err) {
        console.error('메일 전송 오류', err);
        try {
            if (dbPool) {
                const res = await dbPool.query(
                    `INSERT INTO quote_logs (name, company, email, phone, service, message, attachments, sent, info, created_at)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
                    [name || null, company || null, email || null, phone || null, service || null, message || null, JSON.stringify(attachments || []), false, JSON.stringify({ error: err && err.message ? err.message : String(err) }), new Date()]
                );
                console.error('quote saved to DB (send failed) id=', res && res.rows && res.rows[0] ? res.rows[0].id : '(unknown)');
            } else {
                const entry = await appendLog({
                    name, company, email, phone, service, message,
                    to: salesTo,
                    timestamp: new Date().toISOString(),
                    sent: false,
                    error: err && err.message ? err.message : String(err)
                });
                console.error('quote appended to log (send failed) id=', entry && entry.id ? entry.id : '(unknown)');
            }
        } catch (e) {
            console.error('DB/log write after mail error failed', e);
        }
        return res.status(500).json({ error: '메일 전송 실패', message: err && err.message ? err.message : String(err) });
    }
});

const fs = require('fs');
const fsp = fs.promises;
const zlib = require('zlib');
const LOG_FILE = path.join(__dirname, 'quote-logs.log');
const LOG_BACKUP_DIR = path.join(__dirname, 'logbackups');
const MAX_LOG_SIZE = Number(process.env.MAX_LOG_SIZE_BYTES || 10 * 1024 * 1024); // 10MB default

async function ensureLogBackupDir() {
    try { await fsp.mkdir(LOG_BACKUP_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

async function rotateLogsIfNeeded() {
    try {
        const stat = await fsp.stat(LOG_FILE).catch(() => null);
        if (!stat) return;
        if (stat.size >= MAX_LOG_SIZE) {
            await ensureLogBackupDir();
            const ts = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = `quote-logs-${ts}.log.gz`;
            const backupPath = path.join(LOG_BACKUP_DIR, backupName);
            // gzip and move
            await new Promise((resolve, reject) => {
                const inp = fs.createReadStream(LOG_FILE);
                const out = fs.createWriteStream(backupPath);
                const gzip = zlib.createGzip();
                inp.pipe(gzip).pipe(out).on('finish', resolve).on('error', reject);
            });
            // truncate original
            await fsp.truncate(LOG_FILE, 0);
        }
    } catch (e) {
        console.error('log rotation failed', e);
    }
}

let lastId = 0;
async function appendLog(obj) {
    try {
        await rotateLogsIfNeeded();
        const entry = Object.assign({ id: ++lastId }, obj);
        const line = JSON.stringify(entry) + '\n';
        await fsp.appendFile(LOG_FILE, line, 'utf8');
        return entry;
    } catch (e) {
        console.error('appendLog failed', e);
        throw e;
    }
}

app.get('/api/quote-logs', async (req, res) => {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    try {
        const exists = await fsp.stat(LOG_FILE).catch(() => null);
        if (!exists) return res.json({ ok: true, logs: [] });
        const data = await fsp.readFile(LOG_FILE, 'utf8');
        const lines = data.trim().split('\n').filter(Boolean);
        const parsed = lines.map(l => { try { return JSON.parse(l); } catch(e){ return null; } }).filter(Boolean);
        const out = parsed.slice(-limit).reverse();
        return res.json({ ok: true, logs: out });
    } catch (e) {
        console.error('GET logs failed', e);
        return res.json({ ok: true, logs: [] });
    }
});

app.patch('/api/quote-logs/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { handled, note } = req.body;
    try {
        const data = await fsp.readFile(LOG_FILE, 'utf8').catch(() => '');
        const lines = data.trim().split('\n').filter(Boolean);
        const parsed = lines.map(l => { try { return JSON.parse(l); } catch(e){ return null; } }).filter(Boolean);
        const idx = parsed.findIndex(l => Number(l.id) === id);
        if (idx === -1) return res.status(404).json({ error: 'not found' });
        if (typeof handled !== 'undefined') parsed[idx].handled = !!handled;
        if (typeof note !== 'undefined') parsed[idx].note = String(note);
        // rewrite full file
        const out = parsed.map(p => JSON.stringify(p)).join('\n') + '\n';
        await fsp.writeFile(LOG_FILE, out, 'utf8');
        return res.json({ ok: true, entry: parsed[idx] });
    } catch (e) {
        console.error('PATCH log failed', e);
        return res.status(500).json({ error: 'failed to update' });
    }
});

app.delete('/api/quote-logs/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const data = await fsp.readFile(LOG_FILE, 'utf8').catch(() => '');
        const lines = data.trim().split('\n').filter(Boolean);
        const parsed = lines.map(l => { try { return JSON.parse(l); } catch(e){ return null; } }).filter(Boolean);
        const idx = parsed.findIndex(l => Number(l.id) === id);
        if (idx === -1) return res.status(404).json({ error: 'not found' });
        const removed = parsed.splice(idx, 1)[0];
        const out = parsed.map(p => JSON.stringify(p)).join('\n') + (parsed.length ? '\n' : '');
        await fsp.writeFile(LOG_FILE, out, 'utf8');
        return res.json({ ok: true, removed });
    } catch (e) {
        console.error('DELETE log failed', e);
        return res.status(500).json({ error: 'failed to delete' });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}
