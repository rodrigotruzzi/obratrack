import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const sql = getDb();
  try {
    const b = await req.json();
    const r = await sql`UPDATE fornecedores SET nome=${b.nome},cnpj=${b.cnpj||null},especialidade=${b.especialidade||null},tel=${b.tel||null},email=${b.email||null},responsavel=${b.responsavel||null},cidade=${b.cidade||null},estado=${b.estado||null},obs=${b.obs||null} WHERE id=${params.id} RETURNING *`;
    return NextResponse.json(r[0]);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const sql = getDb();
  try {
    await sql`DELETE FROM fornecedores WHERE id=${params.id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
