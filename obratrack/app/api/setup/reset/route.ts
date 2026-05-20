import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  const sql = getDb();
  try {
    await sql`DROP TABLE IF EXISTS avaliacoes CASCADE`;
    await sql`DROP TABLE IF EXISTS aditivos CASCADE`;
    await sql`DROP TABLE IF EXISTS contratacoes CASCADE`;
    await sql`DROP TABLE IF EXISTS fornecedores CASCADE`;
    await sql`DROP TABLE IF EXISTS obras CASCADE`;
    return NextResponse.json({ ok: true, message: 'Banco resetado com sucesso' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
