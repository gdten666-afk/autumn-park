// app/api/space/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { ApiResponse, Space } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const db = getDb();
  const space = db.prepare(`
    SELECT spaces.*, users.name as owner_name
    FROM spaces JOIN users ON spaces.user_id = users.id
    WHERE spaces.user_id = ?
  `).get(userId) as Space | undefined;

  if (!space) {
    return NextResponse.json({ ok: false, error: 'Space not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: space } satisfies ApiResponse<Space>);
}
