import nodemailer from "nodemailer";

export const sendEmail = async (to, options) => {
  /*
    options = {
      type: 'approval' | 'revoked',
      userId?: string,
      password?: string
    }
  */
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let subject, html;

  const header = `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f4f4f4">
      <tr>
        <td align="center" valign="top">
          <table width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <tr>
              <td align="center" valign="top" bgcolor="#FF6B35" style="padding: 20px;">
                <img src="https://lucky-game.com/logo.png" alt="Lucky Game Logo" style="display: block; max-width: 150px;" />
              </td>
            </tr>
  `;

  const footer = `
            <tr>
              <td align="center" valign="top" bgcolor="#f4f4f4" style="padding: 20px; font-family: Arial, sans-serif; font-size: 12px; color: #666;">
                <p>© 2025 Lucky Game. All rights reserved.</p>
                <p>If you did not request this email, please ignore it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  if (options.type === "approval") {
    subject = "Your Lucky Game Account Has Been Approved!";
    html = `
      ${header}
            <tr>
              <td align="center" valign="top" style="padding: 30px; font-family: Arial, sans-serif;">
                <h2 style="color: #FF6B35; font-size: 24px; margin-bottom: 20px;">Welcome to Lucky Game!</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 20px;">
                  Your account has been <strong style="color: #28a745;">approved</strong>. Here are your login details:
                </p>
                <table style="width: 100%; max-width: 400px; margin: 20px auto; border-collapse: collapse; border: 1px solid #e0e0e0; border-radius: 4px;">
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; background: #f9f9f9; color: #333; font-weight: bold;">User ID</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #333;">${options.userId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; background: #f9f9f9; color: #333; font-weight: bold;">Password</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #333;">${options.password}</td>
                  </tr>
                </table>
                <p style="text-align: center; margin: 25px 0;">
                  <a href="http://lucky-game.com/login" style="display: inline-block; padding: 12px 24px; background: #FF6B35; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">Login Now</a>
                </p>
                <p style="font-size: 16px; color: #333; line-height: 1.5;">
                  Enjoy the game and good luck!
                </p>
              </td>
            </tr>
      ${footer}
    `;
  } else if (options.type === "revoked") {
    subject = "Your Lucky Game Account Approval Has Been Revoked";
    html = `
      ${header}
            <tr>
              <td align="center" valign="top" style="padding: 30px; font-family: Arial, sans-serif;">
                <h2 style="color: #FF6B35; font-size: 24px; margin-bottom: 20px;">Important Notification from Lucky Game</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 20px;">
                  We're sorry to inform you that your account approval has been <strong style="color: #dc3545;">revoked</strong>.
                </p>
                <p style="font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 20px;">
                  If you believe this is a mistake or want more information, please contact our support team at <a href="mailto:support@lucky-game.com" style="color: #FF6B35;">support@lucky-game.com</a>.
                </p>
                <p style="font-size: 16px; color: #333; line-height: 1.5;">
                  Thank you for your understanding.
                </p>
                <p style="font-size: 16px; color: #333; line-height: 1.5; margin-top: 30px;">
                  — Lucky Game Team
                </p>
              </td>
            </tr>
      ${footer}
    `;
  } else {
    // fallback plain email
    subject = "Lucky Game Notification";
    html = `
      ${header}
            <tr>
              <td align="center" valign="top" style="padding: 30px; font-family: Arial, sans-serif;">
                <h2 style="color: #FF6B35; font-size: 24px; margin-bottom: 20px;">Notification from Lucky Game</h2>
                <p style="font-size: 16px; color: #333; line-height: 1.5;">
                  This is a notification from Lucky Game.
                </p>
              </td>
            </tr>
      ${footer}
    `;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
