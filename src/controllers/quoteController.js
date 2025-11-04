const emailService = require('../services/emailService');
const logService = require('../services/logService');
const attachmentService = require('../services/attachmentService');
const { escapeHtml } = require('../utils/helpers');

const submitQuote = async (req, res) => {
    const { name, company, email, phone, service, message, attachments } = req.body || {};

    // Validation
    if (!name || !email || !service) {
        return res.status(400).json({ error: '필수 필드 누락' });
    }

    const salesTo = process.env.SALES_EMAIL || 'gg6532@nki-1.co.kr';

    try {
        // Prepare email content
        const mailOptions = {
            from: process.env.MAIL_FROM || `no-reply@${process.env.MAIL_DOMAIN || 'localhost'}`,
            replyTo: `${name} <${email}>`,
            to: salesTo,
            subject: `[견적문의] ${service} - ${company || name}`,
            text: `이름: ${name}\n회사: ${company}\n이메일: ${email}\n전화번호: ${phone}\n\n요청사항:\n${message}`,
            html: generateEmailHtml({ name, company, email, phone, service, message })
        };

        // Handle attachments
        const { mailAttachments, htmlAttachments } = await attachmentService.processAttachments(attachments);
        if (mailAttachments.length) mailOptions.attachments = mailAttachments;
        if (htmlAttachments) mailOptions.html += htmlAttachments;

        // Send email
        const info = await emailService.sendMail(mailOptions);

        // Log the quote
        try {
            const logEntry = {
                name, company, email, phone, service, message,
                to: salesTo,
                timestamp: new Date().toISOString(),
                sent: true,
                info: { messageId: info && info.messageId ? info.messageId : null }
            };
            
            const entry = await logService.appendLog(logEntry);
            console.log('Quote saved to log id=', entry && entry.id ? entry.id : '(unknown)');
        } catch (logError) {
            console.error('Log write failed', logError);
        }

        const result = { ok: true, messageId: info && info.messageId ? info.messageId : null };
        
        // Add preview URL for test accounts
        if (emailService.isUsingTestAccount()) {
            const preview = emailService.getTestMessageUrl(info);
            console.log('Preview URL:', preview);
            result.preview = preview;
        }

        return res.json(result);

    } catch (err) {
        console.error('메일 전송 오류', err);
        
        // Log failed attempt
        try {
            const logEntry = {
                name, company, email, phone, service, message,
                to: salesTo,
                timestamp: new Date().toISOString(),
                sent: false,
                error: err && err.message ? err.message : String(err)
            };
            
            const entry = await logService.appendLog(logEntry);
            console.error('Quote saved to log (send failed) id=', entry && entry.id ? entry.id : '(unknown)');
        } catch (logError) {
            console.error('Log write after mail error failed', logError);
        }

        return res.status(500).json({ 
            error: '메일 전송 실패', 
            message: err && err.message ? err.message : String(err) 
        });
    }
};

const getQuoteLogs = async (req, res) => {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    
    try {
        const logs = await logService.getLogs(limit);
        return res.json({ ok: true, logs });
    } catch (e) {
        console.error('GET logs failed', e);
        return res.json({ ok: true, logs: [] });
    }
};

const updateQuoteLog = async (req, res) => {
    const id = Number(req.params.id);
    const { handled, note } = req.body;
    
    try {
        const entry = await logService.updateLog(id, { handled, note });
        if (!entry) {
            return res.status(404).json({ error: 'not found' });
        }
        return res.json({ ok: true, entry });
    } catch (e) {
        console.error('PATCH log failed', e);
        return res.status(500).json({ error: 'failed to update' });
    }
};

const deleteQuoteLog = async (req, res) => {
    const id = Number(req.params.id);
    
    try {
        const removed = await logService.deleteLog(id);
        if (!removed) {
            return res.status(404).json({ error: 'not found' });
        }
        return res.json({ ok: true, removed });
    } catch (e) {
        console.error('DELETE log failed', e);
        return res.status(500).json({ error: 'failed to delete' });
    }
};

const generateEmailHtml = ({ name, company, email, phone, service, message }) => {
    return `
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
    `;
};

module.exports = {
    submitQuote,
    getQuoteLogs,
    updateQuoteLog,
    deleteQuoteLog
};