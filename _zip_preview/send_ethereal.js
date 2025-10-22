const nodemailer = require('nodemailer');

(async function(){
  try {
    console.log('Creating ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    console.log('Created:', testAccount.user);

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    const info = await transporter.sendMail({
      from: 'NKI 테스트 <no-reply@example.com>',
      to: 'gg6532@nki-1.co.kr',
      subject: 'Ethereal preview 테스트',
      text: '이 메일은 Ethereal 미리보기 테스트용입니다.'
    });

    const preview = nodemailer.getTestMessageUrl(info);
    console.log('Message sent. Preview URL:');
    console.log(preview);
    console.log('MessageId:', info.messageId);
  } catch (err) {
    console.error('Error sending ethereal test mail:', err);
    process.exit(1);
  }
})();
