import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Diagnostic function to help debug environment variable issues
export function getEmailDiagnostics() {
  const apiKey = process.env.RESEND_API_KEY;
  const relevantEnvVars = Object.keys(process.env)
    .filter(key => key.includes('RESEND') || key.includes('EMAIL'))
    .map(key => key); // Only show var names, not values for security

  return {
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 5) || 'none', // First 5 chars safe to show (re_xxx)
    availableEnvVars: relevantEnvVars,
    nodeEnv: process.env.NODE_ENV,
  };
}

interface CertificateEmailParams {
  to: string;
  userName: string;
  moduleTitle: string;
  certificateNumber: string;
  completedAt: Date;
}

export async function sendCertificateEmail({
  to,
  userName,
  moduleTitle,
  certificateNumber,
  completedAt,
}: CertificateEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping certificate email');
    return null;
  }

  const formattedDate = completedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@send.mentor.energy>',
      to: [to],
      subject: `🎓 Congratulations! You've completed ${moduleTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Course Completion Certificate</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                        🎓 Certificate of Completion
                      </h1>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Dear <strong>${userName}</strong>,
                      </p>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Congratulations on successfully completing the course! Your dedication and hard work have paid off.
                      </p>

                      <!-- Certificate Card -->
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 30px; text-align: center;">
                            <p style="color: #991b1b; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 10px 0;">
                              Course Completed
                            </p>
                            <h2 style="color: #dc2626; font-size: 24px; margin: 0 0 20px 0;">
                              ${moduleTitle}
                            </h2>
                            <p style="color: #374151; font-size: 14px; margin: 0 0 5px 0;">
                              <strong>Certificate Number:</strong> ${certificateNumber}
                            </p>
                            <p style="color: #374151; font-size: 14px; margin: 0;">
                              <strong>Completed On:</strong> ${formattedDate}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Your certificate has been added to your profile. You can view and download it anytime from your dashboard.
                      </p>

                      <!-- CTA Button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mentor.energy'}/dashboard/certifications"
                               style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              View My Certificates
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-align: center;">
                        Keep learning and building your future in Nigeria's energy sector!
                      </p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                        © ${new Date().getFullYear()} Mentor Energy. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending certificate email:', error);
      return null;
    }

    console.log(`Certificate email sent to ${to} for ${moduleTitle}`);
    return data;
  } catch (error) {
    console.error('Error sending certificate email:', error);
    return null;
  }
}
