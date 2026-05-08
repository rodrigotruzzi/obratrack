import { NextResponse } from 'next/server';
import { setupDatabase } from '@/lib/db';
export async function GET() {
  try { await setupDatabase(); return NextResponse.json({ ok: true }); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
