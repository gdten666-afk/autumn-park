// app/api/photos/user/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { ApiResponse, Photo } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  const isOwner = session?.userId === id;

  const db = getDb();
  const photos = db.prepare(`
    SELECT photos.*, users.name as author_name
    FROM photos JOIN users ON photos.user_id = users.id
    WHERE photos.user_id = ? ${isOwner ? '' : 'AND photos.is_public = 1'}
    ORDER BY photos.created_at DESC
  `).all(id) as Photo[];

  return NextResponse.json({ ok: true, data: photos } satisfies ApiResponse<Photo[]>);
}
