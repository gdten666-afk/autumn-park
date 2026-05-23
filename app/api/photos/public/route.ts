import { NextResponse } from 'next/server';
import { ensureTables, dbAll } from '@/lib/db';
import type { ApiResponse, Photo } from '@/lib/types';

export async function GET() {
  await ensureTables();
  const photos = await dbAll('SELECT photos.*, users.name as author_name FROM photos JOIN users ON photos.user_id = users.id WHERE photos.is_public = 1 ORDER BY photos.created_at DESC');
  return NextResponse.json({ ok: true, data: photos } satisfies ApiResponse<Photo[]>);
}
