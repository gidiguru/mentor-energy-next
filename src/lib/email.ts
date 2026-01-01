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
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
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
                            <a href="https://mentor.energy/dashboard/certifications"
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
      // Return error details for debugging
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Certificate email sent to ${to} for ${moduleTitle}`);
    return data;
  } catch (error) {
    console.error('Error sending certificate email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// WELCOME EMAIL
// ============================================================================

interface WelcomeEmailParams {
  to: string;
  userName: string;
}

export async function sendWelcomeEmail({ to, userName }: WelcomeEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping welcome email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Welcome to mentor.energy, ${userName}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to mentor.energy!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Welcome to mentor.energy! We're thrilled to have you join our community of learners building their future in Nigeria's energy sector.
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Here's what you can do to get started:
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 15px; background-color: #fef2f2; border-radius: 8px; margin-bottom: 10px;">
                            <strong style="color: #dc2626;">📚 Browse Courses</strong>
                            <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px;">Explore our curated learning modules on petroleum engineering, geology, and more.</p>
                          </td>
                        </tr>
                        <tr><td style="height: 10px;"></td></tr>
                        <tr>
                          <td style="padding: 15px; background-color: #fef2f2; border-radius: 8px;">
                            <strong style="color: #dc2626;">👥 Find a Mentor</strong>
                            <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px;">Connect with industry professionals who can guide your career.</p>
                          </td>
                        </tr>
                        <tr><td style="height: 10px;"></td></tr>
                        <tr>
                          <td style="padding: 15px; background-color: #fef2f2; border-radius: 8px;">
                            <strong style="color: #dc2626;">🤖 Ask Our AI</strong>
                            <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px;">Get instant answers to your energy sector questions.</p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/learn" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Start Learning
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Questions? Reply to this email or visit our resources section.
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
      console.error('Error sending welcome email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Welcome email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// COURSE ENROLLMENT EMAIL
// ============================================================================

interface EnrollmentEmailParams {
  to: string;
  userName: string;
  courseTitle: string;
  courseDescription?: string;
  moduleId: string;
}

export async function sendEnrollmentEmail({
  to,
  userName,
  courseTitle,
  courseDescription,
  moduleId,
}: EnrollmentEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping enrollment email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `You're enrolled in ${courseTitle}! 📖`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📖 Course Enrollment Confirmed</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Great choice! You've successfully enrolled in a new course.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <h2 style="color: #dc2626; font-size: 20px; margin: 0 0 10px 0;">${courseTitle}</h2>
                            ${courseDescription ? `<p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">${courseDescription}</p>` : ''}
                          </td>
                        </tr>
                      </table>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Start your learning journey today. Remember, consistency is key - try to complete at least one lesson per day to build your streak!
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/learn/${moduleId}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Start Course
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        You'll earn a certificate when you complete this course!
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
      console.error('Error sending enrollment email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Enrollment email sent to ${to} for ${courseTitle}`);
    return data;
  } catch (error) {
    console.error('Error sending enrollment email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// ACHIEVEMENT UNLOCKED EMAIL
// ============================================================================

interface AchievementEmailParams {
  to: string;
  userName: string;
  achievementName: string;
  achievementDescription?: string;
  achievementIcon?: string;
  points: number;
}

export async function sendAchievementEmail({
  to,
  userName,
  achievementName,
  achievementDescription,
  achievementIcon,
  points,
}: AchievementEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping achievement email');
    return null;
  }

  const icon = achievementIcon || '🏆';

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Achievement Unlocked: ${achievementName}! ${icon}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 64px; margin-bottom: 10px;">${icon}</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Achievement Unlocked!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px; text-align: center;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Congratulations, <strong>${userName}</strong>!
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 12px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 30px; text-align: center;">
                            <h2 style="color: #d97706; font-size: 24px; margin: 0 0 10px 0;">${achievementName}</h2>
                            ${achievementDescription ? `<p style="color: #374151; font-size: 14px; margin: 0 0 15px 0;">${achievementDescription}</p>` : ''}
                            <p style="color: #f59e0b; font-size: 18px; font-weight: bold; margin: 0;">+${points} points</p>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Keep up the great work! Your dedication is paying off.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/dashboard" style="display: inline-block; background-color: #f59e0b; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              View All Achievements
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Share your achievement with your network!
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
      console.error('Error sending achievement email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Achievement email sent to ${to} for ${achievementName}`);
    return data;
  } catch (error) {
    console.error('Error sending achievement email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// STREAK MILESTONE EMAIL
// ============================================================================

interface StreakEmailParams {
  to: string;
  userName: string;
  streakDays: number;
}

export async function sendStreakMilestoneEmail({
  to,
  userName,
  streakDays,
}: StreakEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping streak email');
    return null;
  }

  const milestoneMessages: Record<number, string> = {
    7: "A full week of learning! You're building great habits.",
    14: "Two weeks strong! Your consistency is impressive.",
    30: "A whole month! You're in the top tier of dedicated learners.",
    60: "60 days! Your commitment to learning is extraordinary.",
    100: "100 days! You're a learning legend!",
  };

  const message = milestoneMessages[streakDays] || `${streakDays} days of continuous learning!`;

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `🔥 ${streakDays}-Day Streak! Keep it up!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 64px; margin-bottom: 10px;">🔥</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${streakDays}-Day Streak!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px; text-align: center;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Amazing work, <strong>${userName}</strong>!
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        ${message}
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff7ed; border-radius: 12px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 30px; text-align: center;">
                            <p style="color: #ea580c; font-size: 48px; font-weight: bold; margin: 0;">${streakDays}</p>
                            <p style="color: #c2410c; font-size: 16px; margin: 5px 0 0 0;">consecutive days</p>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Don't break the chain! Log in today to keep your streak alive.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/learn" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Continue Learning
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Next milestone: ${streakDays < 7 ? 7 : streakDays < 14 ? 14 : streakDays < 30 ? 30 : streakDays < 60 ? 60 : 100} days
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
      console.error('Error sending streak email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Streak milestone email sent to ${to} for ${streakDays} days`);
    return data;
  } catch (error) {
    console.error('Error sending streak email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// MENTORSHIP SESSION REMINDER EMAIL
// ============================================================================

interface SessionReminderEmailParams {
  to: string;
  userName: string;
  mentorName: string;
  sessionDate: Date;
  sessionTopic?: string;
  meetingUrl?: string;
  reminderType: '24h' | '1h';
}

export async function sendSessionReminderEmail({
  to,
  userName,
  mentorName,
  sessionDate,
  sessionTopic,
  meetingUrl,
  reminderType,
}: SessionReminderEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping session reminder email');
    return null;
  }

  const timeLabel = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';
  const formattedDate = sessionDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `⏰ Reminder: Mentorship session ${timeLabel} with ${mentorName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Session Reminder</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Just a friendly reminder that your mentorship session is ${timeLabel}!
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #5b21b6; font-size: 14px; text-transform: uppercase; margin: 0 0 10px 0;">Session Details</p>
                            <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;"><strong>Mentor:</strong> ${mentorName}</p>
                            <p style="color: #374151; font-size: 16px; margin: 0 0 8px 0;"><strong>When:</strong> ${formattedDate}</p>
                            ${sessionTopic ? `<p style="color: #374151; font-size: 16px; margin: 0;"><strong>Topic:</strong> ${sessionTopic}</p>` : ''}
                          </td>
                        </tr>
                      </table>
                      ${meetingUrl ? `
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="${meetingUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Join Meeting
                            </a>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Need to reschedule? Please contact your mentor as soon as possible.
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
      console.error('Error sending session reminder email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Session reminder email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending session reminder email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// SESSION FOLLOW-UP EMAIL
// ============================================================================

interface SessionFollowUpEmailParams {
  to: string;
  userName: string;
  mentorName: string;
  sessionTopic?: string;
}

export async function sendSessionFollowUpEmail({
  to,
  userName,
  mentorName,
  sessionTopic,
}: SessionFollowUpEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping session follow-up email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `How was your session with ${mentorName}? 💬`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Session Complete! 🎉</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        We hope your mentorship session with <strong>${mentorName}</strong>${sessionTopic ? ` on "${sessionTopic}"` : ''} was valuable!
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Your feedback helps us improve and helps other learners find great mentors. Would you take a moment to rate your session?
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/dashboard" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Rate Your Session
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                        Here are some tips to make the most of your session:
                      </p>
                      <ul style="color: #374151; font-size: 14px; line-height: 1.8;">
                        <li>Review and organize your notes</li>
                        <li>Set action items based on the discussion</li>
                        <li>Connect with your mentor on LinkedIn</li>
                        <li>Schedule a follow-up session if needed</li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Want another session? Book directly from the mentors page.
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
      console.error('Error sending session follow-up email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Session follow-up email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending session follow-up email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// WEEKLY PROGRESS DIGEST EMAIL
// ============================================================================

interface WeeklyDigestEmailParams {
  to: string;
  userName: string;
  lessonsCompleted: number;
  currentStreak: number;
  certificatesEarned: number;
  totalProgress: number; // percentage
  topCourse?: string;
}

export async function sendWeeklyDigestEmail({
  to,
  userName,
  lessonsCompleted,
  currentStreak,
  certificatesEarned,
  totalProgress,
  topCourse,
}: WeeklyDigestEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping weekly digest email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `📊 Your Weekly Learning Summary`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📊 Weekly Progress Report</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 30px 0;">
                        Hi <strong>${userName}</strong>, here's your learning summary for this week:
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                        <tr>
                          <td style="width: 50%; padding: 15px; background-color: #fef2f2; border-radius: 8px; text-align: center;">
                            <p style="color: #dc2626; font-size: 32px; font-weight: bold; margin: 0;">${lessonsCompleted}</p>
                            <p style="color: #374151; font-size: 14px; margin: 5px 0 0 0;">Lessons Completed</p>
                          </td>
                          <td style="width: 10px;"></td>
                          <td style="width: 50%; padding: 15px; background-color: #fff7ed; border-radius: 8px; text-align: center;">
                            <p style="color: #ea580c; font-size: 32px; font-weight: bold; margin: 0;">${currentStreak}🔥</p>
                            <p style="color: #374151; font-size: 14px; margin: 5px 0 0 0;">Day Streak</p>
                          </td>
                        </tr>
                        <tr><td colspan="3" style="height: 10px;"></td></tr>
                        <tr>
                          <td style="width: 50%; padding: 15px; background-color: #f0fdf4; border-radius: 8px; text-align: center;">
                            <p style="color: #059669; font-size: 32px; font-weight: bold; margin: 0;">${certificatesEarned}</p>
                            <p style="color: #374151; font-size: 14px; margin: 5px 0 0 0;">Certificates</p>
                          </td>
                          <td style="width: 10px;"></td>
                          <td style="width: 50%; padding: 15px; background-color: #f5f3ff; border-radius: 8px; text-align: center;">
                            <p style="color: #7c3aed; font-size: 32px; font-weight: bold; margin: 0;">${totalProgress}%</p>
                            <p style="color: #374151; font-size: 14px; margin: 5px 0 0 0;">Overall Progress</p>
                          </td>
                        </tr>
                      </table>
                      ${topCourse ? `
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Keep going with <strong>${topCourse}</strong> - you're making great progress!
                      </p>
                      ` : ''}
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/learn" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Continue Learning
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Set a goal for next week and crush it! 💪
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
      console.error('Error sending weekly digest email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Weekly digest email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending weekly digest email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// INACTIVITY REMINDER EMAIL
// ============================================================================

interface InactivityEmailParams {
  to: string;
  userName: string;
  daysSinceActive: number;
  lastCourse?: string;
}

export async function sendInactivityEmail({
  to,
  userName,
  daysSinceActive,
  lastCourse,
}: InactivityEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping inactivity email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `We miss you, ${userName}! 👋`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 10px;">👋</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">We Miss You!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        It's been ${daysSinceActive} days since your last visit to mentor.energy. Your learning journey is waiting for you!
                      </p>
                      ${lastCourse ? `
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        You were making great progress on <strong>${lastCourse}</strong>. Why not pick up where you left off?
                      </p>
                      ` : ''}
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #eff6ff; border-radius: 8px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <p style="color: #1d4ed8; font-size: 16px; margin: 0;">
                              💡 Just 15 minutes a day can make a huge difference in your career!
                            </p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/learn" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Resume Learning
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Your progress is saved and waiting for you!
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
      console.error('Error sending inactivity email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Inactivity email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending inactivity email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// NEW COURSE AVAILABLE EMAIL
// ============================================================================

interface NewCourseEmailParams {
  to: string;
  userName: string;
  courseTitle: string;
  courseDescription?: string;
  moduleId: string;
}

export async function sendNewCourseEmail({
  to,
  userName,
  courseTitle,
  courseDescription,
  moduleId,
}: NewCourseEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping new course email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `🆕 New Course Available: ${courseTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 10px;">🆕</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">New Course Available!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        We've just published a new course that we think you'll love!
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 30px; text-align: center;">
                            <h2 style="color: #dc2626; font-size: 24px; margin: 0 0 15px 0;">${courseTitle}</h2>
                            ${courseDescription ? `<p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">${courseDescription}</p>` : ''}
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/learn/${moduleId}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Enroll Now
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Be one of the first to complete this course and earn your certificate!
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
      console.error('Error sending new course email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`New course email sent to ${to} for ${courseTitle}`);
    return data;
  } catch (error) {
    console.error('Error sending new course email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// COMMENT REPLY NOTIFICATION EMAIL
// ============================================================================

interface CommentReplyEmailParams {
  to: string;
  userName: string;
  replierName: string;
  lessonTitle: string;
  originalComment: string;
  replyContent: string;
  lessonUrl: string;
}

export async function sendCommentReplyEmail({
  to,
  userName,
  replierName,
  lessonTitle,
  originalComment,
  replyContent,
  lessonUrl,
}: CommentReplyEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping comment reply email');
    return null;
  }

  // Truncate long comments
  const truncate = (text: string, maxLength: number) =>
    text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `💬 ${replierName} replied to your comment`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">💬 New Reply</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        <strong>${replierName}</strong> replied to your comment on <strong>${lessonTitle}</strong>:
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px 0;">
                        <tr>
                          <td style="padding: 15px; background-color: #f3f4f6; border-radius: 8px; border-left: 3px solid #9ca3af;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0;">Your comment:</p>
                            <p style="color: #374151; font-size: 14px; margin: 0; font-style: italic;">"${truncate(originalComment, 150)}"</p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 15px; background-color: #fef2f2; border-radius: 8px; border-left: 3px solid #dc2626;">
                            <p style="color: #dc2626; font-size: 12px; margin: 0 0 5px 0;">${replierName}'s reply:</p>
                            <p style="color: #374151; font-size: 14px; margin: 0;">"${truncate(replyContent, 200)}"</p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="${lessonUrl}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              View Conversation
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Join the discussion and share your thoughts!
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
      console.error('Error sending comment reply email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Comment reply email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending comment reply email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// MENTOR APPLICATION SUBMITTED EMAIL
// ============================================================================

interface MentorApplicationSubmittedEmailParams {
  to: string;
  userName: string;
  expertise: string[];
}

export async function sendMentorApplicationSubmittedEmail({
  to,
  userName,
  expertise,
}: MentorApplicationSubmittedEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping mentor application email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Your Mentor Application Has Been Received`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Application Received!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for applying to become a mentor on mentor.energy! We've received your application and our team will review it shortly.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #5b21b6; font-size: 14px; text-transform: uppercase; margin: 0 0 10px 0;">Your Expertise Areas</p>
                            <p style="color: #374151; font-size: 16px; margin: 0;">${expertise.join(', ')}</p>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        <strong>What happens next?</strong>
                      </p>
                      <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0 0 30px 0;">
                        <li>Our team will review your application within 2-3 business days</li>
                        <li>We may reach out if we need additional information</li>
                        <li>You'll receive an email once a decision has been made</li>
                      </ul>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                        Thank you for your interest in giving back to the energy sector community!
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Questions? Reply to this email and we'll be happy to help.
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
      console.error('Error sending mentor application email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Mentor application email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending mentor application email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// ADMIN NOTIFICATION - NEW MENTOR APPLICATION
// ============================================================================

interface AdminNewMentorApplicationEmailParams {
  applicantName: string;
  applicantEmail: string;
  expertise: string[];
  yearsExperience: number;
  currentRole: string;
}

export async function sendAdminNewMentorApplicationEmail({
  applicantName,
  applicantEmail,
  expertise,
  yearsExperience,
  currentRole,
}: AdminNewMentorApplicationEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping admin notification email');
    return null;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured - skipping admin notification');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [adminEmail],
      subject: `New Mentor Application: ${applicantName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">New Mentor Application</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        A new mentor application has been submitted and requires your review.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0;"><strong>Applicant:</strong> ${applicantName}</p>
                            <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0;"><strong>Email:</strong> ${applicantEmail}</p>
                            <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0;"><strong>Current Role:</strong> ${currentRole}</p>
                            <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0;"><strong>Experience:</strong> ${yearsExperience} years</p>
                            <p style="color: #92400e; font-size: 14px; margin: 0;"><strong>Expertise:</strong> ${expertise.join(', ')}</p>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mentor.energy'}/admin/mentor-applications" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">
                              Review Application
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        This is an automated notification from mentor.energy
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
      console.error('Error sending admin notification email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Admin notification sent for new mentor application: ${applicantName}`);
    return data;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// MENTOR APPLICATION APPROVED EMAIL
// ============================================================================

interface MentorApplicationApprovedEmailParams {
  to: string;
  userName: string;
}

export async function sendMentorApplicationApprovedEmail({
  to,
  userName,
}: MentorApplicationApprovedEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping mentor approval email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Congratulations! You're Now a Mentor`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to the Mentor Team!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Great news! Your mentor application has been <strong style="color: #059669;">approved</strong>. You're now officially a mentor on mentor.energy!
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border-radius: 8px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #059669; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">Getting Started as a Mentor:</p>
                            <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                              <li>Your profile is now visible to students</li>
                              <li>Set your availability in your mentoring dashboard</li>
                              <li>Respond to connection requests promptly</li>
                              <li>Schedule sessions with connected students</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/dashboard/mentoring" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Go to Mentor Dashboard
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Thank you for helping shape the future of Nigeria's energy sector!
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
      console.error('Error sending mentor approval email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Mentor approval email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending mentor approval email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// MENTOR APPLICATION REJECTED EMAIL
// ============================================================================

interface MentorApplicationRejectedEmailParams {
  to: string;
  userName: string;
  reason?: string;
}

export async function sendMentorApplicationRejectedEmail({
  to,
  userName,
  reason,
}: MentorApplicationRejectedEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping mentor rejection email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Update on Your Mentor Application`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Application Update</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Thank you for your interest in becoming a mentor on mentor.energy. After careful review, we're unable to approve your application at this time.
                      </p>
                      ${reason ? `
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; border-left: 4px solid #6b7280; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #4b5563; font-size: 14px; margin: 0 0 5px 0;">Feedback:</p>
                            <p style="color: #374151; font-size: 14px; margin: 0;">${reason}</p>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        This doesn't mean the door is closed! We encourage you to:
                      </p>
                      <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0 0 30px 0;">
                        <li>Continue building your expertise in the energy sector</li>
                        <li>Engage with the community through our learning platform</li>
                        <li>Reapply in the future when you have additional experience</li>
                      </ul>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/learn" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Continue Learning
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Questions? Reply to this email and we'll be happy to discuss.
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
      console.error('Error sending mentor rejection email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Mentor rejection email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending mentor rejection email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// CONNECTION REQUEST RECEIVED EMAIL (to mentor)
// ============================================================================

interface ConnectionRequestEmailParams {
  to: string;
  mentorName: string;
  studentName: string;
  studentMessage?: string;
}

export async function sendConnectionRequestEmail({
  to,
  mentorName,
  studentName,
  studentMessage,
}: ConnectionRequestEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping connection request email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `New Mentorship Request from ${studentName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 10px;">👋</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">New Connection Request</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${mentorName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        <strong>${studentName}</strong> wants to connect with you for mentorship!
                      </p>
                      ${studentMessage ? `
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #1d4ed8; font-size: 14px; margin: 0 0 10px 0;">Their message:</p>
                            <p style="color: #374151; font-size: 14px; margin: 0; font-style: italic;">"${studentMessage}"</p>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Please review this request and respond at your earliest convenience. Your guidance can make a real difference in someone's career!
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/dashboard/mentoring" style="display: inline-block; background-color: #3b82f6; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              View Request
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Responding promptly helps maintain a positive mentoring experience.
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
      console.error('Error sending connection request email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Connection request email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending connection request email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// CONNECTION ACCEPTED EMAIL (to student)
// ============================================================================

interface ConnectionAcceptedEmailParams {
  to: string;
  studentName: string;
  mentorName: string;
  mentorResponse?: string;
}

export async function sendConnectionAcceptedEmail({
  to,
  studentName,
  mentorName,
  mentorResponse,
}: ConnectionAcceptedEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping connection accepted email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `${mentorName} Accepted Your Connection Request!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Connection Accepted!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${studentName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Great news! <strong>${mentorName}</strong> has accepted your connection request. You're now connected and can schedule mentoring sessions!
                      </p>
                      ${mentorResponse ? `
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border-left: 4px solid #059669; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #047857; font-size: 14px; margin: 0 0 10px 0;">Message from ${mentorName}:</p>
                            <p style="color: #374151; font-size: 14px; margin: 0; font-style: italic;">"${mentorResponse}"</p>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border-radius: 8px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #059669; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">Next Steps:</p>
                            <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                              <li>Visit your mentoring dashboard</li>
                              <li>Schedule your first session with ${mentorName}</li>
                              <li>Prepare topics or questions to discuss</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/dashboard/mentoring" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Schedule a Session
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Make the most of this opportunity - your mentor is here to help you succeed!
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
      console.error('Error sending connection accepted email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Connection accepted email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending connection accepted email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// CONNECTION DECLINED EMAIL (to student)
// ============================================================================

interface ConnectionDeclinedEmailParams {
  to: string;
  studentName: string;
  mentorName: string;
}

export async function sendConnectionDeclinedEmail({
  to,
  studentName,
  mentorName,
}: ConnectionDeclinedEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping connection declined email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Update on Your Connection Request`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Connection Request Update</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${studentName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Unfortunately, <strong>${mentorName}</strong> is unable to accept your connection request at this time. This could be due to their current availability or mentee capacity.
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Don't be discouraged! There are many other experienced mentors on our platform who would love to help you grow.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/mentors" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Find Other Mentors
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Keep learning and building your skills - the right mentor match is out there!
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
      console.error('Error sending connection declined email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Connection declined email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending connection declined email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// SESSION BOOKED EMAIL
// ============================================================================

interface SessionBookedEmailParams {
  to: string;
  recipientName: string;
  otherPartyName: string;
  isForMentor: boolean;
  sessionDate: Date;
  sessionTopic?: string;
  meetingUrl?: string;
}

export async function sendSessionBookedEmail({
  to,
  recipientName,
  otherPartyName,
  isForMentor,
  sessionDate,
  sessionTopic,
  meetingUrl,
}: SessionBookedEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping session booked email');
    return null;
  }

  const formattedDate = sessionDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const roleLabel = isForMentor ? 'mentee' : 'mentor';

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Mentorship Session Scheduled with ${otherPartyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 40px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Session Scheduled!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${recipientName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        A mentorship session has been scheduled with your ${roleLabel}, <strong>${otherPartyName}</strong>.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f3ff; border: 2px solid #7c3aed; border-radius: 8px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 30px;">
                            <p style="color: #5b21b6; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 15px 0;">Session Details</p>
                            <p style="color: #374151; font-size: 16px; margin: 0 0 10px 0;"><strong>When:</strong> ${formattedDate}</p>
                            <p style="color: #374151; font-size: 16px; margin: 0 0 10px 0;"><strong>${isForMentor ? 'Mentee' : 'Mentor'}:</strong> ${otherPartyName}</p>
                            ${sessionTopic ? `<p style="color: #374151; font-size: 16px; margin: 0;"><strong>Topic:</strong> ${sessionTopic}</p>` : ''}
                          </td>
                        </tr>
                      </table>
                      ${meetingUrl ? `
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="${meetingUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Join Meeting
                            </a>
                          </td>
                        </tr>
                      </table>
                      ` : `
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/dashboard/mentoring" style="display: inline-block; background-color: #7c3aed; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              View Session Details
                            </a>
                          </td>
                        </tr>
                      </table>
                      `}
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Add this to your calendar and come prepared!
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
      console.error('Error sending session booked email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Session booked email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending session booked email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// SESSION CANCELLED EMAIL
// ============================================================================

interface SessionCancelledEmailParams {
  to: string;
  recipientName: string;
  otherPartyName: string;
  sessionDate: Date;
  cancelledBy: string;
  reason?: string;
}

export async function sendSessionCancelledEmail({
  to,
  recipientName,
  otherPartyName,
  sessionDate,
  cancelledBy,
  reason,
}: SessionCancelledEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping session cancelled email');
    return null;
  }

  const formattedDate = sessionDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Mentorship Session Cancelled`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Session Cancelled</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${recipientName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Your mentorship session with <strong>${otherPartyName}</strong> has been cancelled by ${cancelledBy}.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #dc2626; font-size: 14px; margin: 0 0 10px 0;">Cancelled Session:</p>
                            <p style="color: #374151; font-size: 14px; margin: 0;">${formattedDate}</p>
                            ${reason ? `<p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
                          </td>
                        </tr>
                      </table>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        You can reschedule a new session from your mentoring dashboard.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="https://mentor.energy/dashboard/mentoring" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Reschedule Session
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        We apologize for any inconvenience caused.
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
      console.error('Error sending session cancelled email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Session cancelled email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending session cancelled email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// MENTOR STATUS REVOKED EMAIL
// ============================================================================

interface MentorStatusRevokedEmailParams {
  to: string;
  userName: string;
  reason?: string;
}

export async function sendMentorStatusRevokedEmail({
  to,
  userName,
  reason,
}: MentorStatusRevokedEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping mentor revoked email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Update on Your Mentor Status`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Mentor Status Update</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        We're writing to inform you that your mentor status on mentor.energy has been revoked.
                      </p>
                      ${reason ? `
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; border-left: 4px solid #6b7280; border-radius: 0 8px 8px 0; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #374151; font-size: 14px; margin: 0;"><strong>Reason:</strong> ${reason}</p>
                          </td>
                        </tr>
                      </table>
                      ` : ''}
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Your profile will no longer be visible to students, and you will not be able to accept new mentoring requests.
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        If you believe this was a mistake or would like to discuss this decision, please contact our support team.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="mailto:support@mentor.energy" style="display: inline-block; background-color: #6b7280; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Contact Support
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Thank you for your contributions to mentor.energy.
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
      console.error('Error sending mentor revoked email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Mentor revoked email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending mentor revoked email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// ============================================================================
// MENTOR STATUS REINSTATED EMAIL
// ============================================================================

interface MentorStatusReinstatedEmailParams {
  to: string;
  userName: string;
}

export async function sendMentorStatusReinstatedEmail({
  to,
  userName,
}: MentorStatusReinstatedEmailParams) {
  const client = getResendClient();
  if (!client) {
    console.warn('RESEND_API_KEY not configured - skipping mentor reinstated email');
    return null;
  }

  try {
    const { data, error } = await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Mentor Energy <hello@mentor.energy>',
      to: [to],
      subject: `Welcome Back! Your Mentor Status Has Been Reinstated`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome Back!</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #374151; font-size: 18px; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Great news! Your mentor status on mentor.energy has been <strong style="color: #059669;">reinstated</strong>.
                      </p>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border-radius: 8px; margin: 0 0 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #059669; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">What's Next:</p>
                            <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                              <li>Your profile is now visible to students again</li>
                              <li>Review and update your availability</li>
                              <li>Check for any pending connection requests</li>
                              <li>Continue making an impact!</li>
                            </ul>
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://mentor.energy'}/dashboard/mentoring" style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                              Go to Mentor Dashboard
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                        Thank you for being part of mentor.energy!
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
      console.error('Error sending mentor reinstated email:', error);
      return { error: error.message || JSON.stringify(error) };
    }

    console.log(`Mentor reinstated email sent to ${to}`);
    return data;
  } catch (error) {
    console.error('Error sending mentor reinstated email:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
