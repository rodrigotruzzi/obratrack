import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET() {
  try { return NextResponse.json(await sql`SELECT * FROM obras ORDER BY created_at DESC`); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const r = await sql`INSERT INTO obras (codigo,nome,cliente,local_obra,cidade,estado,status,avanco,inicio,prazo,contrato,extra_cliente) VALUES (${b.codigo||null},${b.nome},${b.cliente||null},${b.local_obra||null},${b.cidade||null},${b.estado||null},${b.status||'Em andamento'},${b.avanco||0},${b.inicio||null},${b.prazo||20},${b.contrato||0},${b.extra_cliente||0}) RETURNING *`;
    return NextResponse.json(r[0]);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
