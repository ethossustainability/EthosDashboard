/**
 * lib/resend.ts
 * Resend email client wrapper.
 */

const resendApiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM_ADDRESS || 'Ethos Dashboard <noreply@ethosdashboard.org>';

export async function sendEmail(to: string, subject: string, body: string) {
  if (!resendApiKey) throw new Error('Missing RESEND_API_KEY');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject,
      html: body,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Resend API error: ${data.message || res.statusText}`);
  return data;
}
