/**
 * app/api/files/[file_id]/route.ts
 * DELETE /api/files/:file_id
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { extractClaims } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';
import type { FileCategory } from '@/types/files';

type DeleteFileResponse = {
  deleted: boolean;
};

type FileWithProjectOwner = {
  file_id: string;
  project_id: string | null;
  category: FileCategory;
  projects: {
    created_by: string;
  } | null;
};

export async function DELETE(
  req: NextRequest,
  { params }: { params: { file_id: string } }
): Promise<NextResponse<ApiResponse<DeleteFileResponse>>> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    const claims = extractClaims(token);

    if (authError || !user || !claims?.sub) {
      return NextResponse.json(
        { data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } },
        { status: 401 }
      );
    }

    const { data: file } = await supabaseAdmin
      .from('files')
      .select(`
        file_id,
        project_id,
        category,
        projects (
          created_by
        )
      `)
      .eq('file_id', params.file_id)
      .maybeSingle<FileWithProjectOwner>();

    if (!file) {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: 'File not found' } },
        { status: 404 }
      );
    }

    const isBoard = claims.org_role_id === 3;
    const isLeadOwnProjectFile =
      claims.org_role_id === 2 &&
      file.category === 'Project' &&
      file.projects?.created_by === claims.sub;

    if (!isBoard && !isLeadOwnProjectFile) {
      return NextResponse.json(
        { data: null, error: { code: 'FORBIDDEN', message: 'Cannot delete this file' } },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from('files')
      .delete()
      .eq('file_id', params.file_id);

    if (deleteError) {
      return NextResponse.json(
        { data: null, error: { code: 'VALIDATION_ERROR', message: deleteError.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: { deleted: true },
      error: null,
    });
  } catch {
    return NextResponse.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Internal Server Error' } },
      { status: 500 }
    );
  }
}
