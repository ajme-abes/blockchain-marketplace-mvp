// backend/scripts/checkEmailConfig.js
// Check if email environment variables are properly configured

console.log('📧 Email Configuration Check\n');
console.log('================================\n');

console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set (hidden)' : '❌ Not set');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail (default)');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set');

console.log('\n================================\n');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('❌ Email is NOT configured properly');
    console.log('\nTo fix this:');
    console.log('1. Go to Render Dashboard');
    console.log('2. Click on your backend service');
    console.log('3. Go to Environment tab');
    console.log('4. Add these variables:');
    console.log('   EMAIL_USER=demuxml@gmail.com');
    console.log('   EMAIL_PASSWORD=tjutswcnhtsgtrnb');
    console.log('   EMAIL_SERVICE=gmail');
    console.log('   EMAIL_FROM=EthioTrust Marketplace <demuxml@gmail.com>');
    console.log('5. Save and wait for redeploy');
} else {
    console.log('✅ Email configuration looks good!');
    console.log('\nTesting email transporter...');

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    transporter.verify()
        .then(() => {
            console.log('✅ Email transporter is ready!');
            console.log('📧 Emails can be sent successfully');
        })
        .catch((error) => {
            console.log('❌ Email transporter error:', error.message);
            console.log('\nPossible issues:');
            console.log('- Wrong email or password');
            console.log('- Gmail: Need to enable 2FA and use App Password');
            console.log('- Network/firewall blocking SMTP');
        });
}
