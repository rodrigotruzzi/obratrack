import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const r = await sql`SELECT c.*,o.nome as obra_nome,f.nome as fornecedor_nome FROM contratacoes c LEFT JOIN obras o ON c.obra_id=o.id LEFT JOIN fornecedores f ON c.fornecedor_id=f.id ORDER BY c.created_at DESC`;
    return NextResponse.json(r);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const r = await sql`INSERT INTO contratacoes (obra_id,fornecedor_id,categoria,valor,extra,obs) VALUES (${b.obra_id},${b.fornecedor_id},${b.categoria||null},${b.valor||0},${b.extra||0},${b.obs||null}) RETURNING *`;
    return NextResponse.json(r[0]);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function DELETE(req: Request) {
  try { const { id } = await req.json(); await sql`DELETE FROM contratacoes WHERE id=${id}`; return NextResponse.json({ ok: true }); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
