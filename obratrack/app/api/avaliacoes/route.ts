import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sql = getDb();
  try {
    const r = await sql`SELECT av.*, o.nome as obra_nome, f.nome as fornecedor_nome FROM avaliacoes av LEFT JOIN obras o ON av.obra_id=o.id LEFT JOIN fornecedores f ON av.fornecedor_id=f.id ORDER BY av.created_at DESC`;
    return NextResponse.json(r);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req: Request) {
  const sql = getDb();
  try {
    const b = await req.json();
    const r = await sql`INSERT INTO avaliacoes (obra_id,fornecedor_id,qualidade,prazo,custo,limpeza,seguranca,gestao,obs) VALUES (${b.obra_id},${b.fornecedor_id},${b.qualidade||0},${b.prazo||0},${b.custo||0},${b.limpeza||0},${b.seguranca||0},${b.gestao||0},${b.obs||null}) RETURNING *`;
    return NextResponse.json(r[0]);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const sql = getDb();
  try {
    const { id } = await req.json();
    await sql`DELETE FROM avaliacoes WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
