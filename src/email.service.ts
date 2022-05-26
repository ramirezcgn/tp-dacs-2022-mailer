import nodemailer from 'nodemailer';

const emailService = () => {
  const sendEmail = async (from, to, subject, body, plain = true) => {
    try {
      const testAccount = await nodemailer.createTestAccount();

      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: plain ? body : '',
        html: !plain ? body : '',
      });

      console.log('Message sent: %s', info.messageId);

      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

      return info;
    } catch (err) {
      console.log('Error: ', err.message);
      return null;
    }
  };

  return {
    sendEmail,
  };
};

export default emailService;
