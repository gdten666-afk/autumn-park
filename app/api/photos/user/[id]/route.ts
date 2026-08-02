import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbAll } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { ApiResponse, Photo } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureTables();
  const { id } = await params;
  const session = await getSession();
  const isOwner = session?.userId === id;
  const photos = await dbAll(
    `SELECT photos.id, photos.user_id, photos.filename, photos.caption, photos.is_public, photos.created_at, users.name as author_name FROM photos JOIN users ON photos.user_id = users.id WHERE photos.user_id = ? ${isOwner ? '' : 'AND photos.is_public = 1'} ORDER BY photos.created_at DESC LIMIT 200`,
    [id]
  );
  return NextResponse.json({ ok: true, data: photos } satisfies ApiResponse<Photo[]>);
}
