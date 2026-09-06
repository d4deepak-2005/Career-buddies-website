import { Resend } from 'resend';

// Transactional email via Resend. Required env vars:
//   RESEND_API_KEY - from https://resend.com/api-keys
//   EMAIL_FROM      - a sender address on a domain verified in Resend,
//                     e.g. "CareerBuddies <hello@careerbuddies.in>"
//
// Until these are configured, emails are safely skipped (logged only) so the
// rest of the app keeps working.

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  const client = getResendClient();
  const from = process.env.EMAIL_FROM;

  if (!client || !from) {
    console.log(
      `[Email Notice] RESEND_API_KEY / EMAIL_FROM not configured. Skipped email "${params.subject}" to ${params.to}.`
    );
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html
    });
    if (error) {
      console.error('[Email Notice] Resend API error:', error);
      return false;
    }
    console.log(`[Email] Sent "${params.subject}" to ${params.to}`);
    return true;
  } catch (err) {
    console.error('[Email Notice] Failed to send email:', err);
    return false;
  }
}

// Generic placeholder templates. Swap the HTML bodies here once the real
// branded templates are designed — the call sites (login / payment success)
// don't need to change.

export async function sendLoginNotificationEmail(candidateEmail: string, candidateName: string) {
  return sendEmail({
    to: candidateEmail,
    subject: 'New login to your CareerBuddies portal',
    html: `
      <p>Hi ${candidateName || 'there'},</p>
      <p>We noticed a new login to your CareerBuddies candidate portal.</p>
      <p>If this was you, no action is needed. If you don't recognize this activity, please contact us immediately.</p>
      <p>— Team CareerBuddies</p>
    `
  });
}

export async function sendPaymentSuccessEmail(
  candidateEmail: string,
  candidateName: string,
  planName: string,
  amountINR: number
) {
  return sendEmail({
    to: candidateEmail,
    subject: `Congratulations! Your enrollment for ${planName} is confirmed`,
    html: `
      <p>Hi ${candidateName || 'there'},</p>
      <p><strong>Congratulations!</strong> Your payment of ₹${amountINR.toLocaleString('en-IN')} for the <strong>${planName}</strong> has been received and your enrollment is confirmed.</p>
      <p>Our team will reach out shortly with your onboarding details and next steps.</p>
      <p>Welcome aboard!</p>
      <p>— Team CareerBuddies</p>
    `
  });
}
