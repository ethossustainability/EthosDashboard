/**
 * lib/opensign.ts
 * OpenSign API client wrapper.
 */
import crypto from 'crypto';

const webhookSecret = process.env.OPENSIGN_WEBHOOK_SECRET;
const openSignApiKey = process.env.OPENSIGN_API_KEY;

export const WAIVER_TEMPLATE_ID = process.env.OPENSIGN_WAIVER_TEMPLATE_ID;
export const CONSENT_TEMPLATE_ID = process.env.OPENSIGN_CONSENT_TEMPLATE_ID;

export async function sendDocument(templateId: string, signerEmail: string, signerName: string) {
  if (!openSignApiKey) throw new Error('Missing OPENSIGN_API_KEY');
  if (!templateId) throw new Error('Missing OPENSIGN template ID');

  const res = await fetch('https://api.opensignlabs.com/v1/documents/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openSignApiKey}`,
    },
    body: JSON.stringify({
      template_id: templateId,
      signers: [
        {
          email: signerEmail,
          name: signerName,
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`OpenSign API error: ${data.message || res.statusText}`);
  return data;
}

/**
 * NOTE: The exact header name and HMAC scheme must be verified against
 * OpenSign's actual API documentation before going to production.
 */
export function verifyOpenSignWebhook(signature: string, rawBody: string): boolean {
  if (!webhookSecret) throw new Error('Missing OPENSIGN_WEBHOOK_SECRET');

  const hmac = crypto.createHmac('sha256', webhookSecret);
  const expectedSignature = hmac.update(rawBody, 'utf8').digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (e) {
    return false;
  }
}
