// app/api/space/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireSession } from '@/lib/auth';
import type { ApiResponse, Space } from '@/lib/types';

const VALID_SCENES = ['autumn-bench', 'darkroom', 'starlit-camp', 'lighthouse-coast', 'bookstore'];
const VALID_WEATHERS = ['sunny', 'cloudy', 'light-rain', 'heavy-rain', 'fog', 'snow'];

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const { scene, weather } = await req.json();
    const db = getDb();

    if (scene && !VALID_SCENES.includes(scene)) {
      return NextResponse.json({ ok: false, error: `Invalid scene: ${scene}` }, { status: 400 });
    }
    if (weather && !VALID_WEATHERS.includes(weather)) {
      return NextResponse.json({ ok: false, error: `Invalid weather: ${weather}` }, { status: 400 });
    }

    if (scene) db.prepare('UPDATE spaces SET scene = ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(scene, session.userId);
    if (weather) db.prepare('UPDATE spaces SET weather = ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(weather, session.userId);

    const space = db.prepare(`
      SELECT spaces.*, users.name as owner_name
      FROM spaces JOIN users ON spaces.user_id = users.id
      WHERE spaces.user_id = ?
    `).get(session.userId) as Space;

    return NextResponse.json({ ok: true, data: space } satisfies ApiResponse<Space>);
  } catch (err: any) {
    if (err.message === 'Unauthorized') return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });
    return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 500 });
  }
}
