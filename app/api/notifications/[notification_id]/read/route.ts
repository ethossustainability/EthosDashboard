import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { extractClaims } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';
import type { Notification } from '@/types/notifications';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { notification_id: string } }
): Promise<NextResponse<ApiResponse<Notification>>> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  const claims = extractClaims(token);

  if (authError || !user || !claims?.sub) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }

  const { data: notification, error: updateError } = await supabaseAdmin
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('notification_id', params.notification_id)
    .eq('user_id', claims.sub)
    .select()
    .maybeSingle<Notification>();

  if (updateError) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: updateError.message } }, { status: 400 });
  }

  if (!notification) {
    return NextResponse.json({ data: null, error: { code: 'NOT_FOUND', message: 'Notification not found' } }, { status: 404 });
  }

  return NextResponse.json({ data: notification, error: null });
}
