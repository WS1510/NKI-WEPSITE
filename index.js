require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.post('/api/quote', async (req, res) => {
    const { name, company, email, phone, service, message } = req.body;

    if (!name || !email || !service) {
        return res.status(400).json({ error: '필수 필드 누락' });
    }

    const salesTo = process.env.SALES_EMAIL || 'gg6532@nki-1.co.kr';

    const mailOptions = {
        from: `${name} <${email}>`,
        to: salesTo,
        subject: `[견적문의] ${service} - ${company || name}`,
        text: `이름: ${name}\n회사: ${company}\n이메일: ${email}\n전화번호: ${phone}\n\n요청사항:\n${message}`,
        html: `
            <div style="font-family: Arial, Helvetica, sans-serif; color:#222;">
                <div style="background:#f6f9fc;padding:18px;border-radius:6px;">
                    <h2 style="margin:0 0 8px 0;color:#0b5394;">견적 문의가 도착했습니다</h2>
                    <p style="margin:0 0 12px 0;color:#333;">새로운 견적 요청이 접수되었습니다. 아래 내용을 확인해주세요.</p>

                    <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
                        <tr>
                            <td style="padding:8px;border:1px solid #e6eef6;width:140px;font-weight:600;background:#fff;">이름</td>
                            <td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(name)}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px;border:1px solid #e6eef6;font-weight:600;background:#fff;">회사</td>
                            <td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(company)}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px;border:1px solid #e6eef6;font-weight:600;background:#fff;">이메일</td>
                            <td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(email)}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px;border:1px solid #e6eef6;font-weight:600;background:#fff;">전화번호</td>
                            <td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(phone)}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px;border:1px solid #e6eef6;font-weight:600;background:#fff;">서비스</td>
                            <td style="padding:8px;border:1px solid #e6eef6;background:#fff;">${escapeHtml(service)}</td>
                        </tr>
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

    try {
        if (!transporter) {
            transporter = await createTransporter();
        }

        const info = await transporter.sendMail(mailOptions);
        try {
            await appendLog({
                name, company, email, phone, service, message,
                to: salesTo,
                timestamp: new Date().toISOString(),
                sent: true,
                info: { messageId: info && info.messageId ? info.messageId : null }
            });
        } catch (e) {
            console.error('로그 저장 실패', e);
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
            await appendLog({
                name, company, email, phone, service, message,
                to: salesTo,
                timestamp: new Date().toISOString(),
                sent: false,
                error: err && err.message ? err.message : String(err)
            });
        } catch (e) {
            console.error('실패 로그 저장 실패', e);
        }
        return res.status(500).json({ error: '메일 전송 실패', message: err && err.message ? err.message : String(err) });
    }
});

const fs = require('fs').promises;
const LOG_FILE = path.join(__dirname, 'quote-logs.json');

async function appendLog(obj) {
    let logs = [];
    try {
        const txt = await fs.readFile(LOG_FILE, 'utf8');
        logs = JSON.parse(txt || '[]');
    } catch (e) {
        logs = [];
    }
    const id = (logs.length > 0 ? (logs[logs.length-1].id || 0) : 0) + 1;
    const entry = Object.assign({ id }, obj);
    logs.push(entry);
    if (logs.length > 1000) logs = logs.slice(logs.length - 1000);
    await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
    return entry;
}

app.get('/api/quote-logs', async (req, res) => {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    try {
        const txt = await fs.readFile(LOG_FILE, 'utf8');
        const logs = JSON.parse(txt || '[]');
        const out = logs.slice(-limit).reverse();
        return res.json({ ok: true, logs: out });
    } catch (e) {
        return res.json({ ok: true, logs: [] });
    }
});

app.patch('/api/quote-logs/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { handled, note } = req.body;
    try {
        const txt = await fs.readFile(LOG_FILE, 'utf8');
        let logs = JSON.parse(txt || '[]');
        const idx = logs.findIndex(l => Number(l.id) === id);
        if (idx === -1) return res.status(404).json({ error: 'not found' });
        if (typeof handled !== 'undefined') logs[idx].handled = !!handled;
        if (typeof note !== 'undefined') logs[idx].note = String(note);
        await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
        return res.json({ ok: true, entry: logs[idx] });
    } catch (e) {
        console.error('PATCH log failed', e);
        return res.status(500).json({ error: 'failed to update' });
    }
});

app.delete('/api/quote-logs/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const txt = await fs.readFile(LOG_FILE, 'utf8');
        let logs = JSON.parse(txt || '[]');
        const idx = logs.findIndex(l => Number(l.id) === id);
        if (idx === -1) return res.status(404).json({ error: 'not found' });
        const removed = logs.splice(idx, 1)[0];
        await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
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
