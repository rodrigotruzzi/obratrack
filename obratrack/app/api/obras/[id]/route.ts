import { NextResponse } from 'next/server';
import sql from '@/lib/db';
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const b = await req.json();
    const r = await sql`UPDATE obras SET codigo=${b.codigo||null},nome=${b.nome},cliente=${b.cliente||null},local_obra=${b.local_obra||null},cidade=${b.cidade||null},estado=${b.estado||null},status=${b.status},avanco=${b.avanco||0},inicio=${b.inicio||null},prazo=${b.prazo||20},contrato=${b.contrato||0},extra_cliente=${b.extra_cliente||0} WHERE id=${params.id} RETURNING *`;
    return NextResponse.json(r[0]);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try { await sql`DELETE FROM obras WHERE id=${params.id}`; return NextResponse.json({ ok: true }); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
