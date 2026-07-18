import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ApiResponse } from '@/types/api';

type OrgSettingsResponse = {
  settings: Array<{ key: string; value: string }>;
};

type OrgSettingListRow = {
  key: string;
  value: string;
};

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<OrgSettingsResponse>>> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }

  const { data: settings, error } = await supabaseAdmin
    .from('org_settings')
    .select('key, value')
    .order('key', { ascending: true })
    .returns<OrgSettingListRow[]>();

  if (error) return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: error.message } }, { status: 400 });

  return NextResponse.json({ data: { settings: settings ?? [] }, error: null });
}
