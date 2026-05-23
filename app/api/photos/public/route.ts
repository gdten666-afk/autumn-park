// app/api/photos/public/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { ApiResponse, Photo } from '@/lib/types';

export async function GET() {
  const db = getDb();
  const photos = db.prepare(`
    SELECT photos.*, users.name as author_name
    FROM photos JOIN users ON photos.user_id = users.id
    WHERE photos.is_public = 1
    ORDER BY photos.created_at DESC
  `).all() as Photo[];

  return NextResponse.json({ ok: true, data: photos } satisfies ApiResponse<Photo[]>);
}
