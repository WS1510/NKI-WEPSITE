const path = require('path');

module.exports = {
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
        bodyJsonLimit: process.env.BODY_JSON_LIMIT || '12mb'
    },
    
    database: {
        url: process.env.DATABASE_URL
    },
    
    email: {
        smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT && Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        },
        from: process.env.MAIL_FROM || `no-reply@${process.env.MAIL_DOMAIN || 'localhost'}`,
        salesTo: process.env.SALES_EMAIL || 'gg6532@nki-1.co.kr'
    },
    
    s3: {
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION || 'us-east-1',
        credentials: process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY ? {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY
        } : undefined,
        endpoint: process.env.S3_ENDPOINT,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        publicUrlTemplate: process.env.S3_PUBLIC_URL_TEMPLATE
    },
    
    logging: {
        maxLogSizeBytes: Number(process.env.MAX_LOG_SIZE_BYTES || 10 * 1024 * 1024),
        logFile: path.join(__dirname, '../logs/quote-logs.log'),
        backupDir: path.join(__dirname, '../logs/backups')
    }
};