import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await setupDatabase();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Setup failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
