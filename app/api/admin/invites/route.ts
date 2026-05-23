import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { requireOperator } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    await requireOperator();
    const { count = 1 } = await req.json();
    const codes: string[] = [];
    for (let i = 0; i < Math.min(count, 100); i++) {
      const code = nanoid(10);
      await dbRun('INSERT INTO invite_codes (code) VALUES (?)', [code]);
      codes.push(code);
    }
    return NextResponse.json({ ok: true, data: { codes } });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    return NextResponse.json({ ok: false, error: 'Failed to generate codes' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await ensureTables();
    await requireOperator();
    const codes = await dbAll('SELECT * FROM invite_codes ORDER BY created_at DESC LIMIT 50');
    return NextResponse.json({ ok: true, data: codes });
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') return NextResponse.json({ ok: false, error: 'Operator only' }, { status: 403 });
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 });
  }
}
