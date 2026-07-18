import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ApiResponse } from '@/types/api';
import type { Announcement } from '@/types/announcements';

type AnnouncementsResponse = {
  announcements: Announcement[];
  total: number;
  last_synced_at: string | null;
  page: number;
  per_page: number;
};

type LastSyncedRow = {
  synced_at: string;
};

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

async function requireUser(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  return !error && Boolean(user);
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<AnnouncementsResponse>>> {
  const isAuthenticated = await requireUser(req);
  if (!isAuthenticated) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } },
      { status: 401 }
    );
  }

  const page = parsePositiveInt(req.nextUrl.searchParams.get('page'), 1, 1000);
  const perPage = parsePositiveInt(req.nextUrl.searchParams.get('per_page'), 20, 100);
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data: announcements, error, count } = await supabaseAdmin
    .from('announcements')
    .select('*', { count: 'exact' })
    .order('posted_at', { ascending: false })
    .range(from, to)
    .returns<Announcement[]>();

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: error.message } },
      { status: 400 }
    );
  }

  const { data: lastSynced } = await supabaseAdmin
    .from('announcements')
    .select('synced_at')
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle<LastSyncedRow>();

  return NextResponse.json({
    data: {
      announcements: announcements ?? [],
      total: count ?? 0,
      last_synced_at: lastSynced?.synced_at ?? null,
      page,
      per_page: perPage,
    },
    error: null,
  });
}
