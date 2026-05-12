import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const [obras, fornecedores, contratacoes, aditivos, avaliacoes] = await Promise.all([
      sql`SELECT * FROM obras ORDER BY created_at DESC`,
      sql`SELECT * FROM fornecedores`,
      sql`SELECT * FROM contratacoes`,
      sql`SELECT * FROM aditivos`,
      sql`SELECT * FROM avaliacoes`,
    ]);
    const custoExec = (obraId: number) => {
      const base = contratacoes.filter((c: any) => c.obra_id === obraId).reduce((s: number, c: any) => s + Number(c.valor||0) + Number(c.extra||0), 0);
      const adt = aditivos.filter((a: any) => a.obra_id === obraId).reduce((s: number, a: any) => s + Number(a.valor||0), 0);
      return base + adt;
    };
    const notaForn = (obraId: number, fornId: number) => {
      const avs = avaliacoes.filter((a: any) => a.obra_id === obraId && a.fornecedor_id === fornId);
      if (!avs.length) return null;
      return avs.map((a: any) => (Number(a.qualidade)+Number(a.prazo)+Number(a.custo)+Number(a.limpeza)+Number(a.seguranca)+Number(a.gestao))/6).reduce((s: number, v: number) => s+v, 0) / avs.length;
    };
    const totalContrato = obras.reduce((s: number, o: any) => s + Number(o.contrato||0) + Number(o.extra_cliente||0), 0);
    const totalExec = obras.reduce((s: number, o: any) => s + custoExec(o.id), 0);
    const totalAditivos = aditivos.reduce((s: number, a: any) => s + Number(a.valor||0), 0);
    // avg nota
    const allNotas = avaliacoes.map((a: any) => (Number(a.qualidade)+Number(a.prazo)+Number(a.custo)+Number(a.limpeza)+Number(a.seguranca)+Number(a.gestao))/6);
    const notaMedia = allNotas.length ? allNotas.reduce((s: number,v: number)=>s+v,0)/allNotas.length : null;
    const avgCrit = (k: string) => avaliacoes.length ? avaliacoes.reduce((s: number, a: any) => s+Number(a[k]||0), 0)/avaliacoes.length : null;
    return NextResponse.json({
      obras, fornecedores, contratacoes, aditivos, avaliacoes,
      kpi: {
        totalObras: obras.length,
        obrasAndamento: obras.filter((o: any) => o.status === 'Em andamento').length,
        obrasConcluidas: obras.filter((o: any) => o.status === 'Concluída').length,
        obrasAtrasadas: obras.filter((o: any) => o.status === 'Atrasada').length,
        totalContrato, totalExec, totalAditivos, margem: totalContrato - totalExec,
        notaMedia,
        criterios: { qualidade: avgCrit('qualidade'), prazo: avgCrit('prazo'), custo: avgCrit('custo'), limpeza: avgCrit('limpeza'), seguranca: avgCrit('seguranca'), gestao: avgCrit('gestao') },
      }
    });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
