import { NextResponse } from 'next/server';
import sql from '@/lib/db';

// PUT — editar custo
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const b = await req.json();
    const r = await sql`
      UPDATE custos SET
        obra_id       = ${b.obra_id},
        fornecedor_id = ${b.fornecedor_id},
        categoria     = ${b.categoria},
        descricao     = ${b.descricao},
        valor         = ${b.valor},
        extra         = ${b.extra},
        tipo          = ${b.tipo},
        obs           = ${b.obs}
      WHERE id = ${params.id}
      RETURNING *`;
    return NextResponse.json(r[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — remover custo
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await sql`DELETE FROM custos WHERE id = ${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
