const nodemailer = require('nodemailer');

let transporter;
let usingTestAccount = false;

const createTransporter = async () => {
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
};

const initializeTransporter = async () => {
    try {
        transporter = await createTransporter();
    } catch (err) {
        console.error('Failed to create transporter', err);
        throw err;
    }
};

const sendMail = async (mailOptions) => {
    if (!transporter) {
        await initializeTransporter();
    }
    
    return await transporter.sendMail(mailOptions);
};

const isUsingTestAccount = () => {
    return usingTestAccount;
};

const getTestMessageUrl = (info) => {
    return nodemailer.getTestMessageUrl(info);
};

// Initialize transporter on module load
initializeTransporter().catch(err => {
    console.error('Failed to initialize email service', err);
});

module.exports = {
    sendMail,
    isUsingTestAccount,
    getTestMessageUrl
};