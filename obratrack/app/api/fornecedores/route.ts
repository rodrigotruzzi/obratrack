import { NextResponse } from 'next/server';
import sql from '@/lib/db';
export async function GET() {
  try { return NextResponse.json(await sql`SELECT * FROM fornecedores ORDER BY nome`); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const r = await sql`INSERT INTO fornecedores (nome,cnpj,especialidade,tel,email,responsavel,cidade,estado,obs) VALUES (${b.nome},${b.cnpj||null},${b.especialidade||null},${b.tel||null},${b.email||null},${b.responsavel||null},${b.cidade||null},${b.estado||null},${b.obs||null}) RETURNING *`;
    return NextResponse.json(r[0]);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
