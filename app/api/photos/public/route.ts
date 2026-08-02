import { NextResponse } from 'next/server';
import { ensureTables, dbAll } from '@/lib/db';
import type { ApiResponse, Photo } from '@/lib/types';
import { apiCacheGet, apiCacheSet } from '@/lib/cache';

export async function GET() {
  const cached = apiCacheGet<ApiResponse<Photo[]>>('photos:public');
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-cache' } });
  }
  await ensureTables();
  const photos = await dbAll('SELECT photos.id, photos.user_id, photos.filename, photos.caption, photos.is_public, photos.created_at, users.name as author_name FROM photos JOIN users ON photos.user_id = users.id WHERE photos.is_public = 1 ORDER BY photos.created_at DESC LIMIT 200');
  const body = { ok: true, data: photos } satisfies ApiResponse<Photo[]>;
  apiCacheSet('photos:public', body, 10_000);
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-cache' } });
}
