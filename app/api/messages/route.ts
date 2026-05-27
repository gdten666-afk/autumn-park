import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { ensureTables, dbAll, dbRun } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

const MESSAGE_COLORS = ['amber', 'rose', 'sky', 'violet', 'emerald', 'slate'];

export async function GET() {
  await ensureTables();
  const messages = await dbAll('SELECT * FROM messages ORDER BY created_at DESC LIMIT 100');
  return NextResponse.json({ ok: true, data: messages });
}

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Login required to post messages' }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ ok: false, error: 'Content is required' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ ok: false, error: 'Message too long (max 500 chars)' }, { status: 400 });
    }

    const id = nanoid();
    const color = MESSAGE_COLORS[Math.floor(Math.random() * MESSAGE_COLORS.length)];
    await dbRun('INSERT INTO messages (id, content, color) VALUES (?, ?, ?)', [id, content.trim(), color]);

    const msg = { id, content: content.trim(), color, created_at: new Date().toISOString() };
    return NextResponse.json({ ok: true, data: msg } satisfies ApiResponse<typeof msg>);
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to post message' }, { status: 500 });
  }
}
