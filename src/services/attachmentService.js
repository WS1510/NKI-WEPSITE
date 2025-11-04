const { escapeHtml } = require('../utils/helpers');

// Setup S3 client (optional, used when configured)
let s3client = null;
let S3Bucket = process.env.S3_BUCKET || null;
let PutObject = null;

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
        PutObject = PutObjectCommand;
    } catch (e) { 
        console.warn('S3 client not initialized', e.message || e); 
    }
}

const processAttachments = async (attachments) => {
    const mailAttachments = [];
    let htmlAttachments = '';

    if (!Array.isArray(attachments) || !attachments.length) {
        return { mailAttachments, htmlAttachments };
    }

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
                
                await s3client.send(new PutObject({ 
                    Bucket: S3Bucket, 
                    Key: key, 
                    Body: buf, 
                    ContentType: mime 
                }));
                
                const url = process.env.S3_PUBLIC_URL_TEMPLATE 
                    ? process.env.S3_PUBLIC_URL_TEMPLATE.replace('{key}', encodeURIComponent(key))
                    : `https://${S3Bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
                
                htmlAttachments += `<p><a href="${escapeHtml(url)}" target="_blank">첨부파일: ${escapeHtml(att.name || url)}</a></p>`;
                
            } else if (att.dataUrl) {
                // attach directly (small file)
                const comma = att.dataUrl.indexOf(',');
                const meta = att.dataUrl.substring(5, comma);
                const isBase64 = meta.indexOf('base64') !== -1;
                const mime = meta.split(';')[0] || att.type || 'application/octet-stream';
                const base64 = att.dataUrl.substring(comma + 1);
                
                if (isBase64) {
                    const buf = Buffer.from(base64, 'base64');
                    mailAttachments.push({ 
                        filename: att.name || 'attachment', 
                        content: buf, 
                        contentType: mime 
                    });
                }
            } else if (att.url) {
                htmlAttachments += `<p><a href="${escapeHtml(att.url)}" target="_blank">첨부파일: ${escapeHtml(att.name || att.url)}</a></p>`;
            }
        } catch (e) {
            console.warn('attachment handling failed', e && e.message ? e.message : e);
        }
    }

    return { mailAttachments, htmlAttachments };
};

module.exports = {
    processAttachments
};