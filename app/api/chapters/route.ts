/**
 * app/api/chapters/route.ts
 * GET /api/chapters
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ApiResponse } from '@/types/api';

type ChapterListItem = {
  chapter_id: string;
  name: string;
  is_hq: boolean;
  location: string | null;
};

type ChaptersResponse = {
  chapters: ChapterListItem[];
};

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<ChaptersResponse>>> {
  try {
    // 1. Verify Supabase JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } },
        { status: 401 }
      );
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } },
        { status: 401 }
      );
    }

    // 2. Fetch all chapters
    const { data, error } = await supabaseAdmin
      .from('chapters')
      .select('chapter_id, name, is_hq, location')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: { chapters: data as ChapterListItem[] },
      error: null
    });
    
  } catch (error) {
    return NextResponse.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}
