import nodemailer from "nodemailer";
import { getSiteUrl } from "@/lib/site-url";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

function emailWrapper(content: string): string {
  const siteUrl = getSiteUrl();
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 520px; margin: 0 auto; background: #ffffff;
                border-radius: 16px; border: 2px solid #e5e7eb; overflow: hidden;">
      <div style="background: #7c3aed; padding: 24px 32px;">
        <span style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Priorix</span>
      </div>
      <div style="padding: 32px;">
        ${content}
      </div>
      <div style="padding: 16px 32px; background: #f9fafb; border-top: 2px solid #e5e7eb;
                  font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.6;">
        You're receiving this because smart notifications are enabled on your account.
        <br />
        <a href="${siteUrl}/settings/learning"
           style="color: #7c3aed; text-decoration: none; font-weight: 600;">
          Manage notification preferences
        </a>
      </div>
    </div>
  `;
}

function ctaButton(label: string, url: string): string {
  return `
    <a href="${url}"
       style="display: inline-block; padding: 13px 30px; background: #7c3aed;
              color: #ffffff; text-decoration: none; border-radius: 100px;
              font-weight: 700; font-size: 15px; margin-top: 24px; letter-spacing: -0.2px;">
      ${label}
    </a>
  `;
}

function pill(text: string, color = "#7c3aed"): string {
  return `<span style="display: inline-block; padding: 3px 10px; background: ${color}20;
                color: ${color}; border-radius: 100px; font-size: 12px; font-weight: 700;
                letter-spacing: 0.5px; text-transform: uppercase;">${text}</span>`;
}

// ---------------------------------------------------------------------------
// Auth emails
// ---------------------------------------------------------------------------

export async function sendResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"Priorix" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 8px;">
          Reset Password
        </a>
        <p style="margin-top: 16px; color: #666; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Notification emails
// ---------------------------------------------------------------------------

/** Sent at the user's preferred study hour when they haven't hit their daily goal. */
export async function sendDailyReviewReminderEmail(
  to: string,
  name: string,
  reviewedCount: number,
  goalCount: number,
  dashboardUrl: string
) {
  const remaining = goalCount - reviewedCount;
  await transporter.sendMail({
    from: `"Priorix" <${process.env.SMTP_USER}>`,
    to,
    subject: `You're ${remaining} card${remaining === 1 ? "" : "s"} away from your daily goal`,
    html: emailWrapper(`
      <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">${pill("Daily Goal")}</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.3;">
        Keep the momentum going, ${name.split(" ")[0]}!
      </h2>
      <p style="margin: 0 0 8px; font-size: 15px; color: #374151; line-height: 1.6;">
        You've reviewed <strong>${reviewedCount}</strong> card${reviewedCount === 1 ? "" : "s"} today.
        Your daily goal is <strong>${goalCount}</strong> — just <strong>${remaining}</strong> more to go.
      </p>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
        A few minutes now can make a big difference in what you retain long-term.
      </p>
      ${ctaButton("Study Now", dashboardUrl)}
    `),
  });
}

/** Sent ~24 hours before a task's due date. */
export async function sendTaskDueSoonEmail(
  to: string,
  name: string,
  taskTitle: string,
  dueDate: Date,
  taskUrl: string
) {
  const formatted = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  await transporter.sendMail({
    from: `"Priorix" <${process.env.SMTP_USER}>`,
    to,
    subject: `Task due soon: ${taskTitle}`,
    html: emailWrapper(`
      <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">${pill("Due Tomorrow", "#d97706")}</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.3;">
        ${taskTitle}
      </h2>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
        Hey ${name.split(" ")[0]}, this task is due on <strong>${formatted}</strong>. Make sure you're on track.
      </p>
      ${ctaButton("View Task", taskUrl)}
    `),
  });
}

/** Sent the morning after a task's due date if still incomplete. */
export async function sendTaskOverdueEmail(
  to: string,
  name: string,
  taskTitle: string,
  dueDate: Date,
  taskUrl: string
) {
  const formatted = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  await transporter.sendMail({
    from: `"Priorix" <${process.env.SMTP_USER}>`,
    to,
    subject: `Overdue: ${taskTitle}`,
    html: emailWrapper(`
      <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">${pill("Overdue", "#ef4444")}</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.3;">
        ${taskTitle}
      </h2>
      <div style="border-left: 4px solid #ef4444; padding: 12px 16px; background: #fef2f2;
                  border-radius: 0 8px 8px 0; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 14px; color: #b91c1c; font-weight: 600;">
          This task was due on ${formatted} and is still incomplete.
        </p>
      </div>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
        Hey ${name.split(" ")[0]}, don't let it fall further behind — complete or reschedule it now.
      </p>
      ${ctaButton("Go to Tasks", taskUrl)}
    `),
  });
}

/** Sent 3 days and 1 day before a deck's study period ends. */
export async function sendDeckStudyPeriodEndingEmail(
  to: string,
  name: string,
  deckTitle: string,
  studyPeriodEnd: Date,
  daysLeft: number,
  deckUrl: string
) {
  const formatted = studyPeriodEnd.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const urgencyColor = daysLeft === 1 ? "#ef4444" : "#d97706";
  await transporter.sendMail({
    from: `"Priorix" <${process.env.SMTP_USER}>`,
    to,
    subject: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to study: ${deckTitle}`,
    html: emailWrapper(`
      <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">
        ${pill(`${daysLeft} day${daysLeft === 1 ? "" : "s"} left`, urgencyColor)}
      </p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.3;">
        ${deckTitle}
      </h2>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
        Hey ${name.split(" ")[0]}, your study period for this deck ends on <strong>${formatted}</strong>.
        Make the most of the time you have left.
      </p>
      ${ctaButton("Study Deck", deckUrl)}
    `),
  });
}

/** Sent each morning with a summary of all cards due across the user's decks. */
export async function sendDailyCardsDueSummaryEmail(
  to: string,
  name: string,
  decks: { title: string; dueCount: number; deckId: string }[],
  totalDue: number,
  dashboardUrl: string
) {
  const siteUrl = getSiteUrl();
  const deckRows = decks
    .map(
      (d) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
          <a href="${siteUrl}/decks/${d.deckId}"
             style="color: #7c3aed; text-decoration: none; font-weight: 600; font-size: 14px;">
            ${d.title}
          </a>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;
                   text-align: right; font-size: 14px; color: #374151; font-weight: 700;">
          ${d.dueCount} card${d.dueCount === 1 ? "" : "s"}
        </td>
      </tr>
    `
    )
    .join("");

  await transporter.sendMail({
    from: `"Priorix" <${process.env.SMTP_USER}>`,
    to,
    subject: `You have ${totalDue} card${totalDue === 1 ? "" : "s"} due today`,
    html: emailWrapper(`
      <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">${pill("Daily Review", "#7c3aed")}</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.3;">
        Good morning, ${name.split(" ")[0]}!
      </h2>
      <p style="margin: 0 0 20px; font-size: 15px; color: #374151; line-height: 1.6;">
        You have <strong>${totalDue} card${totalDue === 1 ? "" : "s"}</strong> ready to review across your decks today.
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        ${deckRows}
      </table>
      ${ctaButton("Go to Dashboard", dashboardUrl)}
    `),
  });
}

/** Sent in the evening when the user has a streak ≥ 3 and hasn't studied today. */
export async function sendStreakAtRiskEmail(
  to: string,
  name: string,
  currentStreak: number,
  dashboardUrl: string
) {
  await transporter.sendMail({
    from: `"Priorix" <${process.env.SMTP_USER}>`,
    to,
    subject: `Don't break your ${currentStreak}-day streak!`,
    html: emailWrapper(`
      <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">${pill("Streak at Risk", "#f59e0b")}</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.3;">
        🔥 ${currentStreak}-day streak on the line
      </h2>
      <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.6;">
        Hey ${name.split(" ")[0]}, you haven't studied yet today. Review at least one card tonight
        to keep your <strong>${currentStreak}-day streak</strong> alive — it only takes a minute.
      </p>
      ${ctaButton("Study Now", dashboardUrl)}
    `),
  });
}
