/**
 * lib/slack.ts
 * Slack API client wrapper.
 */
import crypto from 'crypto';
import { supabaseAdmin } from './supabase-admin';

const slackBotToken = process.env.SLACK_BOT_TOKEN;
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;

export async function sendDirectMessage(slackUserId: string, message: string) {
  if (!slackBotToken) throw new Error('Missing SLACK_BOT_TOKEN');

  // 1. Open a DM conversation
  const openRes = await fetch('https://slack.com/api/conversations.open', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${slackBotToken}`,
    },
    body: JSON.stringify({
      users: slackUserId,
    }),
  });

  const openData = await openRes.json();
  if (!openData.ok) throw new Error(`Slack API error (conversations.open): ${openData.error}`);
  
  const channelId = openData.channel.id;

  // 2. Post to the returned channel ID
  const postRes = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${slackBotToken}`,
    },
    body: JSON.stringify({
      channel: channelId,
      text: message,
    }),
  });

  const postData = await postRes.json();
  if (!postData.ok) throw new Error(`Slack API error (chat.postMessage): ${postData.error}`);
  return postData;
}

export async function createChannel(channelName: string) {
  if (!slackBotToken) throw new Error('Missing SLACK_BOT_TOKEN');

  const res = await fetch('https://slack.com/api/conversations.create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${slackBotToken}`,
    },
    body: JSON.stringify({
      name: channelName.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
      is_private: false,
    }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data.channel.id;
}

export async function getWorkspaceInviteLink() {
  const { data, error } = await supabaseAdmin
    .from('org_settings')
    .select('value')
    .eq('key', 'slack_invite_link')
    .single();
    
  if (error || !data) {
    throw new Error('Slack invite link not configured in org_settings');
  }
  
  return data.value;
}

export function verifySlackSignature(signature: string, timestamp: string, rawBody: string): boolean {
  if (!slackSigningSecret) throw new Error('Missing SLACK_SIGNING_SECRET');

  // Reject if the timestamp is older than 5 minutes
  const timeInt = parseInt(timestamp, 10);
  if (Math.abs(Date.now() / 1000 - timeInt) > 60 * 5) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const hmac = crypto.createHmac('sha256', slackSigningSecret);
  const mySignature = 'v0=' + hmac.update(sigBasestring, 'utf8').digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(mySignature, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch (e) {
    return false;
  }
}
