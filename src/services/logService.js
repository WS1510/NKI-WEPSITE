const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const zlib = require('zlib');

const LOG_FILE = path.join(__dirname, '../../logs/quote-logs.log');
const LOG_BACKUP_DIR = path.join(__dirname, '../../logs/backups');
const MAX_LOG_SIZE = Number(process.env.MAX_LOG_SIZE_BYTES || 10 * 1024 * 1024); // 10MB default

let lastId = 0;

const ensureLogBackupDir = async () => {
    try { 
        await fsp.mkdir(LOG_BACKUP_DIR, { recursive: true }); 
    } catch (e) { 
        /* ignore */ 
    }
};

const rotateLogsIfNeeded = async () => {
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
};

const appendLog = async (obj) => {
    try {
        await rotateLogsIfNeeded();
        const entry = Object.assign({ id: ++lastId }, obj);
        const line = JSON.stringify(entry) + '\n';
        
        // Ensure logs directory exists
        await fsp.mkdir(path.dirname(LOG_FILE), { recursive: true });
        await fsp.appendFile(LOG_FILE, line, 'utf8');
        
        return entry;
    } catch (e) {
        console.error('appendLog failed', e);
        throw e;
    }
};

const getLogs = async (limit = 50) => {
    try {
        const exists = await fsp.stat(LOG_FILE).catch(() => null);
        if (!exists) return [];
        
        const data = await fsp.readFile(LOG_FILE, 'utf8');
        const lines = data.trim().split('\n').filter(Boolean);
        const parsed = lines.map(l => { 
            try { 
                return JSON.parse(l); 
            } catch(e) { 
                return null; 
            } 
        }).filter(Boolean);
        
        return parsed.slice(-limit).reverse();
    } catch (e) {
        console.error('getLogs failed', e);
        return [];
    }
};

const updateLog = async (id, updates) => {
    try {
        const data = await fsp.readFile(LOG_FILE, 'utf8').catch(() => '');
        const lines = data.trim().split('\n').filter(Boolean);
        const parsed = lines.map(l => { 
            try { 
                return JSON.parse(l); 
            } catch(e) { 
                return null; 
            } 
        }).filter(Boolean);
        
        const idx = parsed.findIndex(l => Number(l.id) === id);
        if (idx === -1) return null;
        
        if (typeof updates.handled !== 'undefined') parsed[idx].handled = !!updates.handled;
        if (typeof updates.note !== 'undefined') parsed[idx].note = String(updates.note);
        
        // rewrite full file
        const out = parsed.map(p => JSON.stringify(p)).join('\n') + '\n';
        await fsp.writeFile(LOG_FILE, out, 'utf8');
        
        return parsed[idx];
    } catch (e) {
        console.error('updateLog failed', e);
        throw e;
    }
};

const deleteLog = async (id) => {
    try {
        const data = await fsp.readFile(LOG_FILE, 'utf8').catch(() => '');
        const lines = data.trim().split('\n').filter(Boolean);
        const parsed = lines.map(l => { 
            try { 
                return JSON.parse(l); 
            } catch(e) { 
                return null; 
            } 
        }).filter(Boolean);
        
        const idx = parsed.findIndex(l => Number(l.id) === id);
        if (idx === -1) return null;
        
        const removed = parsed.splice(idx, 1)[0];
        const out = parsed.map(p => JSON.stringify(p)).join('\n') + (parsed.length ? '\n' : '');
        await fsp.writeFile(LOG_FILE, out, 'utf8');
        
        return removed;
    } catch (e) {
        console.error('deleteLog failed', e);
        throw e;
    }
};

module.exports = {
    appendLog,
    getLogs,
    updateLog,
    deleteLog
};