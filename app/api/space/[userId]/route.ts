import { NextRequest, NextResponse } from 'next/server';
import { ensureTables, dbGet } from '@/lib/db';
import type { ApiResponse, Space } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  await ensureTables();
  const { userId } = await params;
  const space = await dbGet('SELECT spaces.*, users.name as owner_name, users.display_name, users.bio FROM spaces JOIN users ON spaces.user_id = users.id WHERE spaces.user_id = ?', [userId]);
  if (!space) return NextResponse.json({ ok: false, error: 'Space not found' }, { status: 404 });
  return NextResponse.json({ ok: true, data: space } satisfies ApiResponse<Space>);
}
