var nodemailer = require('nodemailer')
const fs = require('fs')
const ejs = require('ejs')
const path = require('path');

const sendEmail = (to_email, subject,templateFile, data, attachments = []) => {
    const templatePath = path.join( 'email_templates', templateFile);
    console.log(to_email,subject,templateFile,data,templatePath)

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
 
    const renderedHTML = ejs.render(templateContent, data);

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'saravana19122000@gmail.com',
            pass: 'rspy eaum dvhi yhrm',
        },
    });
    var mailOptions = {
        from: 'saravana19122000@gmail.com',
        to: to_email,
        subject: subject,
        html: renderedHTML,
        attachments: attachments,
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log('error', error);
            return false;
        } else {
            console.log('info', info);
            return true;
        }
    });
};

module.exports = sendEmail;



