/**
 * app/api/webhooks/slack/announcements/route.ts
 * POST /api/webhooks/slack/announcements
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifySlackSignature } from '@/lib/slack';

type SlackAnnouncementsResponse =
  | { received: true }
  | { challenge: string };

type SlackUrlVerificationPayload = {
  type: 'url_verification';
  challenge: string;
};

type SlackMessageEvent = {
  type: string;
  channel: string;
  ts: string;
  text?: string;
  user?: string;
  username?: string;
  bot_id?: string;
  bot_profile?: {
    name?: string;
  };
};

type SlackEventCallbackPayload = {
  type: 'event_callback';
  event: SlackMessageEvent;
};

type OrgSettingValue = {
  value: string;
};

type ExistingAnnouncement = {
  announcement_id: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function isSlackUrlVerificationPayload(value: unknown): value is SlackUrlVerificationPayload {
  const record = asRecord(value);
  return record?.type === 'url_verification' && typeof record.challenge === 'string';
}

function isSlackMessageEvent(value: unknown): value is SlackMessageEvent {
  const record = asRecord(value);
  return (
    typeof record?.type === 'string' &&
    typeof record.channel === 'string' &&
    typeof record.ts === 'string'
  );
}

function isSlackEventCallbackPayload(value: unknown): value is SlackEventCallbackPayload {
  const record = asRecord(value);
  return record?.type === 'event_callback' && isSlackMessageEvent(record.event);
}

function parseSlackTimestamp(ts: string): string | null {
  const seconds = Number(ts);
  if (!Number.isFinite(seconds)) return null;

  return new Date(seconds * 1000).toISOString();
}

function getSlackMessageId(event: SlackMessageEvent): string {
  return `${event.channel}:${event.ts}`;
}

function getPostedBySlackUser(event: SlackMessageEvent): string {
  if (event.user) return event.user;
  if (event.username) return event.username;
  if (event.bot_profile?.name) return event.bot_profile.name;
  if (event.bot_id) return event.bot_id;

  return 'unknown';
}

export async function POST(req: NextRequest): Promise<NextResponse<SlackAnnouncementsResponse>> {
  const rawBody = await req.text();
  const signature = req.headers.get('x-slack-signature');
  const timestamp = req.headers.get('x-slack-request-timestamp');

  if (!signature || !timestamp) {
    return new NextResponse(null, { status: 400 }) as NextResponse<SlackAnnouncementsResponse>;
  }

  try {
    const isValidSignature = verifySlackSignature(signature, timestamp, rawBody);
    if (!isValidSignature) {
      return new NextResponse(null, { status: 400 }) as NextResponse<SlackAnnouncementsResponse>;
    }
  } catch {
    return new NextResponse(null, { status: 400 }) as NextResponse<SlackAnnouncementsResponse>;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true });
  }

  if (isSlackUrlVerificationPayload(payload)) {
    return NextResponse.json({ challenge: payload.challenge });
  }

  if (!isSlackEventCallbackPayload(payload)) {
    return NextResponse.json({ received: true });
  }

  const event = payload.event;

  if (event.type !== 'message') {
    return NextResponse.json({ received: true });
  }

  const { data: setting } = await supabaseAdmin
    .from('org_settings')
    .select('value')
    .eq('key', 'slack_announcements_channel_id')
    .maybeSingle<OrgSettingValue>();

  if (!setting || event.channel !== setting.value) {
    return NextResponse.json({ received: true });
  }

  const content = event.text?.trim();
  const postedAt = parseSlackTimestamp(event.ts);

  if (!content || !postedAt) {
    return NextResponse.json({ received: true });
  }

  const slackMessageId = getSlackMessageId(event);

  const { data: existingAnnouncement } = await supabaseAdmin
    .from('announcements')
    .select('announcement_id')
    .eq('slack_message_id', slackMessageId)
    .maybeSingle<ExistingAnnouncement>();

  if (existingAnnouncement) {
    return NextResponse.json({ received: true });
  }

  await supabaseAdmin
    .from('announcements')
    .insert({
      slack_message_id: slackMessageId,
      slack_channel_id: event.channel,
      posted_by_slack_user: getPostedBySlackUser(event),
      content,
      posted_at: postedAt,
    });

  return NextResponse.json({ received: true });
}
