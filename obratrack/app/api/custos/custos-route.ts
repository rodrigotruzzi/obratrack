import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET — listar custos (todos ou filtrado por obra)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const obra_id = searchParams.get('obra_id');

    const custos = obra_id
      ? await sql`
          SELECT c.*, f.nome AS fornecedor_nome
          FROM custos c
          LEFT JOIN fornecedores f ON f.id = c.fornecedor_id
          WHERE c.obra_id = ${obra_id}
          ORDER BY c.created_at DESC`
      : await sql`
          SELECT c.*, f.nome AS fornecedor_nome
          FROM custos c
          LEFT JOIN fornecedores f ON f.id = c.fornecedor_id
          ORDER BY c.created_at DESC`;

    return NextResponse.json(custos);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — adicionar custo
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const r = await sql`
      INSERT INTO custos (obra_id, fornecedor_id, categoria, descricao, valor, extra, tipo, obs)
      VALUES (${b.obra_id}, ${b.fornecedor_id}, ${b.categoria}, ${b.descricao},
              ${b.valor}, ${b.extra}, ${b.tipo}, ${b.obs})
      RETURNING *`;
    return NextResponse.json(r[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
