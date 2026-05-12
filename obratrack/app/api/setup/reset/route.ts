import { NextResponse } from 'next/server';
import sql, { setupDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await sql`DROP TABLE IF EXISTS avaliacoes CASCADE`;
    await sql`DROP TABLE IF EXISTS aditivos CASCADE`;
    await sql`DROP TABLE IF EXISTS contratacoes CASCADE`;
    await sql`DROP TABLE IF EXISTS fornecedores CASCADE`;
    await sql`DROP TABLE IF EXISTS obras CASCADE`;
    await setupDatabase();
    return NextResponse.json({ ok: true, message: 'Tabelas recriadas com sucesso' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
