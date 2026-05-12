import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const r = await sql`SELECT a.*,o.nome as obra_nome,f.nome as fornecedor_nome FROM aditivos a LEFT JOIN obras o ON a.obra_id=o.id LEFT JOIN fornecedores f ON a.fornecedor_id=f.id ORDER BY a.created_at DESC`;
    return NextResponse.json(r);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const r = await sql`INSERT INTO aditivos (obra_id,fornecedor_id,descricao,valor,data_aditivo,aprovado_por) VALUES (${b.obra_id},${b.fornecedor_id||null},${b.descricao},${b.valor||0},${b.data_aditivo||new Date().toISOString().split('T')[0]},${b.aprovado_por||null}) RETURNING *`;
    return NextResponse.json(r[0]);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function DELETE(req: Request) {
  try { const { id } = await req.json(); await sql`DELETE FROM aditivos WHERE id=${id}`; return NextResponse.json({ ok: true }); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
