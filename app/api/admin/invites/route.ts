// app/api/admin/invites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db';
import { requireOperator } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await requireOperator();
    const { count = 1 } = await req.json();
    const db = getDb();

    const codes: string[] = [];
    for (let i = 0; i < Math.min(count, 100); i++) {
      const code = nanoid(10);
      db.prepare('INSERT INTO invite_codes (code) VALUES (?)').run(code);
      codes.push(code);
    }

    return NextResponse.json({ ok: true, data: { codes } });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: 'Failed to generate codes' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireOperator();
    const db = getDb();
    const codes = db.prepare("SELECT * FROM invite_codes ORDER BY created_at DESC LIMIT 50").all();
    return NextResponse.json({ ok: true, data: codes });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}
