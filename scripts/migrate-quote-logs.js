/*
Migration script: reads quote-logs.log (NDJSON) or quote-logs.json (array) and inserts into Postgres.
Uploads dataUrl attachments to S3 and replaces with URL in attachments JSON.

Usage:
  - configure environment variables (see .env.example)
  - node scripts/migrate-quote-logs.js
*/

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');

const LOG_FILE = path.join(__dirname, '..', 'quote-logs.log');
const LEGACY_JSON = path.join(__dirname, '..', 'quote-logs.json');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const s3client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY ? {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  } : undefined,
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
});

async function uploadDataUrlToS3(dataUrl, key) {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) throw new Error('invalid dataUrl');
  const meta = dataUrl.substring(5, comma);
  const isBase64 = meta.indexOf('base64') !== -1;
  const mime = meta.split(';')[0] || 'application/octet-stream';
  const base64 = dataUrl.substring(comma + 1);
  if (!isBase64) throw new Error('only base64 dataUrls supported');
  const buf = Buffer.from(base64, 'base64');
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error('S3_BUCKET not configured');
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: mime });
  await s3client.send(cmd);
  const publicUrl = process.env.S3_PUBLIC_URL_TEMPLATE ? process.env.S3_PUBLIC_URL_TEMPLATE.replace('{key}', encodeURIComponent(key)) : `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
  return publicUrl;
}

function parseNdjsonOrJson(raw) {
  raw = raw.trim();
  if (!raw) return [];
  if (raw.charAt(0) === '[') {
    return JSON.parse(raw);
  }
  // NDJSON
  return raw.split('\n').filter(Boolean).map(l => JSON.parse(l));
}

async function migrate() {
  const existsLog = await fs.stat(LOG_FILE).catch(() => null);
  const existsJson = await fs.stat(LEGACY_JSON).catch(() => null);
  if (!existsLog && !existsJson) {
    console.log('No log file found at', LOG_FILE, 'or', LEGACY_JSON);
    process.exit(0);
  }

  let raw = '';
  if (existsLog) raw = await fs.readFile(LOG_FILE, 'utf8');
  else raw = await fs.readFile(LEGACY_JSON, 'utf8');

  const items = parseNdjsonOrJson(raw);
  console.log('Loaded', items.length, 'items');

  // create table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quote_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      legacy_id BIGINT,
      name TEXT,
      company TEXT,
      email TEXT,
      phone TEXT,
      service TEXT,
      message TEXT,
      attachments JSONB DEFAULT '[]',
      sent BOOLEAN,
      info JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  let counter = 0;
  for (const it of items) {
    // dedupe check: if legacy_id exists
    const legacyId = it.id || null;
    const res = await pool.query('SELECT 1 FROM quote_logs WHERE legacy_id = $1 LIMIT 1', [legacyId]);
    if (res.rows.length) {
      continue; // already migrated
    }

    const attachments = [];
    if (Array.isArray(it.attachments)) {
      for (const att of it.attachments) {
        if (att.dataUrl) {
          const key = `migrated/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${att.name || 'file'}`;
          try {
            const url = await uploadDataUrlToS3(att.dataUrl, key);
            attachments.push({ filename: att.name || null, size: att.size || null, mimetype: att.type || null, url });
          } catch (e) {
            console.warn('upload failed for attachment', att.name, e.message);
          }
        } else if (att.url) {
          attachments.push({ filename: att.name || null, size: att.size || null, mimetype: att.type || null, url: att.url });
        }
      }
    }

    await pool.query(
      `INSERT INTO quote_logs (legacy_id, name, company, email, phone, service, message, attachments, sent, info, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [legacyId, it.name || null, it.company || null, it.email || null, it.phone || null, it.service || null, it.message || null, JSON.stringify(attachments), it.sent ? true : false, JSON.stringify(it.info || {}), it.timestamp ? new Date(it.timestamp) : new Date()]
    );

    counter++;
    if (counter % 50 === 0) console.log('migrated', counter);
  }

  console.log('migration complete. total migrated:', counter);
  await pool.end();
}

migrate().catch(err => { console.error(err); process.exit(1); });
