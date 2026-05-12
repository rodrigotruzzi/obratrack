'use client';
import { useState, useEffect, useCallback } from 'react';

type Page = 'dashboard'|'obras'|'contratos'|'fornecedores'|'custos'|'desempenho'|'relatorios'|'configuracoes';

const CATS = ['Carpetes e Tecidos','Civil / Acabamento','Combate à Incêndio','Comunicação Visual','Demolição','Elétrica','Gesso','Hidráulica','Iluminação','Limpeza','Marcenaria','Materiais de Construção','Pedras e Mármores','Pintura','Projetos','Serralheria','Transportes e Fretes','Vidros e Espelhos','Vinílicos','AVAC / Climatização','Outro'];

function fmtR(v: number) { if(!v&&v!==0) return '—'; if(v>=1000000) return 'R$'+(v/1000000).toFixed(1)+'M'; if(v>=1000) return 'R$'+(v/1000).toFixed(0)+'K'; return 'R$'+v.toFixed(0); }
function fmtFull(v: number) { return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0}); }
function notaColor(n: number|null) { if(!n) return 'var(--text3)'; return n>=8?'var(--green)':n>=6?'var(--accent)':'var(--red)'; }
function initials(nome: string) { return nome.split(' ').slice(0,2).map((w:string)=>w[0]).join('').toUpperCase(); }
function avatarBg(i: number) { return ['linear-gradient(135deg,var(--green),#1a8a48)','linear-gradient(135deg,var(--blue),#2266bb)','linear-gradient(135deg,var(--purple),#6633cc)','linear-gradient(135deg,var(--accent),var(--accent2))','linear-gradient(135deg,var(--red),#990000)'][i%5]; }

function StatusBadge({s}: {s: string}) {
  const m: Record<string,string> = {'Concluída':'badge-green','Em andamento':'badge-yellow','Atrasada':'badge-red','Iniciando':'badge-blue'};
  return <span className={`badge ${m[s]||'badge-gray'}`}>{s}</span>;
}

function Modal({id,open,onClose,title,sub,children,wide}: any) {
  if(!open) return null;
  return (
    <div className="modal-overlay open" onClick={(e)=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal" style={wide?{maxWidth:680}:{}}>
        <div className="modal-title">{title}</div>
        {sub&&<div className="modal-sub">{sub}</div>}
        {children}
      </div>
    </div>
  );
}

function Field({label,children}: any) {
  return <div className="form-group"><label className="form-label">{label}</label>{children}</div>;
}

function Input({id,...props}: any) {
  return <input className="form-input" id={id} {...props}/>;
}

function Select({id,children,...props}: any) {
  return <select className="form-input" id={id} {...props}>{children}</select>;
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [data, setData] = useState<any>({obras:[],fornecedores:[],contratacoes:[],aditivos:[],avaliacoes:[],kpi:{}});
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalObra, setModalObra] = useState(false);
  const [modalForn, setModalForn] = useState(false);
  const [modalCont, setModalCont] = useState(false);
  const [modalAdt, setModalAdt] = useState(false);
  const [modalAval, setModalAval] = useState(false);

  // Forms
  const emptyObra = {id:null,codigo:'',nome:'',cliente:'',local_obra:'',cidade:'',estado:'',status:'Em andamento',avanco:0,inicio:'',prazo:20,contrato:0,extra_cliente:0};
  const emptyForn = {id:null,nome:'',cnpj:'',especialidade:CATS[1],tel:'',email:'',responsavel:'',cidade:'',estado:'',obs:''};
  const emptyCont = {obra_id:'',fornecedor_id:'',categoria:CATS[0],valor:0,extra:0,obs:''};
  const emptyAdt = {obra_id:'',fornecedor_id:'',descricao:'',valor:0,data_aditivo:new Date().toISOString().split('T')[0],aprovado_por:''};
  const emptyAval = {obra_id:'',fornecedor_id:'',qualidade:0,prazo:0,custo:0,limpeza:0,seguranca:0,gestao:0,obs:''};

  const [obra, setObra] = useState<any>(emptyObra);
  const [forn, setForn] = useState<any>(emptyForn);
  const [cont, setCont] = useState<any>(emptyCont);
  const [adt, setAdt] = useState<any>(emptyAdt);
  const [aval, setAval] = useState<any>(emptyAval);

  // Filters
  const [obraSearch, setObraSearch] = useState('');
  const [obraStatus, setObraStatus] = useState('');

  const refresh = useCallback(async () => {
    const r = await fetch('/api/dashboard').then(x=>x.json());
    if(!r.error) setData(r);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Helpers
  const custoExec = (obraId: number) => {
    const base = data.contratacoes.filter((c:any)=>c.obra_id===obraId).reduce((s:number,c:any)=>s+Number(c.valor||0)+Number(c.extra||0),0);
    const adt2 = data.aditivos.filter((a:any)=>a.obra_id===obraId).reduce((s:number,a:any)=>s+Number(a.valor||0),0);
    return base+adt2;
  };
  const notaForn = (fornId: number) => {
    const avs = data.avaliacoes.filter((a:any)=>a.fornecedor_id===fornId);
    if(!avs.length) return null;
    return avs.map((a:any)=>(Number(a.qualidade)+Number(a.prazo)+Number(a.custo)+Number(a.limpeza)+Number(a.seguranca)+Number(a.gestao))/6).reduce((s:number,v:number)=>s+v,0)/avs.length;
  };
  const totalForn = (obraId: number) => data.contratacoes.filter((c:any)=>c.obra_id===obraId).reduce((s:number,c:any)=>s+Number(c.valor||0)+Number(c.extra||0),0);
  const totalAdt = (obraId: number) => data.aditivos.filter((a:any)=>a.obra_id===obraId).reduce((s:number,a:any)=>s+Number(a.valor||0),0);

  // CRUD helpers
  async function saveObra() {
    if(!obra.nome.trim()) return alert('Nome obrigatório');
    const method = obra.id?'PUT':'POST';
    const url = obra.id?`/api/obras/${obra.id}`:'/api/obras';
    await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(obra)});
    setModalObra(false); setObra(emptyObra); refresh();
  }
  async function delObra(id: number) {
    if(!confirm('Remover obra?')) return;
    await fetch(`/api/obras/${id}`,{method:'DELETE'}); refresh();
  }
  async function saveForn() {
    if(!forn.nome.trim()) return alert('Nome obrigatório');
    const method = forn.id?'PUT':'POST';
    const url = forn.id?`/api/fornecedores/${forn.id}`:'/api/fornecedores';
    await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(forn)});
    setModalForn(false); setForn(emptyForn); refresh();
  }
  async function delForn(id: number) {
    if(!confirm('Remover fornecedor?')) return;
    await fetch(`/api/fornecedores/${id}`,{method:'DELETE'}); refresh();
  }
  async function saveCont() {
    if(!cont.obra_id||!cont.fornecedor_id) return alert('Selecione obra e fornecedor');
    await fetch('/api/contratacoes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cont)});
    setModalCont(false); setCont(emptyCont); refresh();
  }
  async function delCont(id: number) {
    if(!confirm('Remover contratação?')) return;
    await fetch('/api/contratacoes',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); refresh();
  }
  async function saveAdt() {
    if(!adt.obra_id||!adt.descricao||!adt.valor) return alert('Preencha obra, descrição e valor');
    await fetch('/api/aditivos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(adt)});
    setModalAdt(false); setAdt(emptyAdt); refresh();
  }
  async function delAdt(id: number) {
    if(!confirm('Remover aditivo?')) return;
    await fetch('/api/aditivos',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); refresh();
  }
  async function saveAval() {
    if(!aval.obra_id||!aval.fornecedor_id) return alert('Selecione obra e fornecedor');
    await fetch('/api/avaliacoes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(aval)});
    setModalAval(false); setAval(emptyAval); refresh();
  }
  async function delAval(id: number) {
    if(!confirm('Remover avaliação?')) return;
    await fetch('/api/avaliacoes',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); refresh();
  }

  function exportCSV() {
    const rows = [['Código','Obra','Cliente','Status','Avanço','Custo Exec.','Contrato Cliente']];
    data.obras.forEach((o:any) => rows.push([o.codigo||'',o.nome,o.cliente||'',o.status,o.avanco+'%',custoExec(o.id),(Number(o.contrato||0)+Number(o.extra_cliente||0)).toString()]));
    const csv = rows.map((r:string[])=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv); a.download='obratrack.csv'; a.click();
  }

  const filteredObras = data.obras.filter((o:any) => {
    if(obraStatus && o.status!==obraStatus) return false;
    if(obraSearch) { const q=obraSearch.toLowerCase(); if(!o.nome?.toLowerCase().includes(q)&&!o.cliente?.toLowerCase().includes(q)&&!(o.codigo||'').toLowerCase().includes(q)) return false; }
    return true;
  });

  const { kpi } = data;

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:12,background:'var(--bg)'}}>
      <div style={{width:32,height:32,borderRadius:'50%',border:'2px solid var(--border)',borderTopColor:'var(--accent)',animation:'spin 1s linear infinite'}}/>
      <span style={{color:'var(--text3)',fontSize:13,fontFamily:'var(--mono)'}}>Carregando ObraTrack...</span>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const navItems: {id:Page,icon:string,label:string,section:string}[] = [
    {id:'dashboard',icon:'⬡',label:'Dashboard',section:'Principal'},
    {id:'obras',icon:'◫',label:'Obras',section:'Principal'},
    {id:'contratos',icon:'◈',label:'Contratos',section:'Principal'},
    {id:'fornecedores',icon:'◉',label:'Fornecedores',section:'Principal'},
    {id:'custos',icon:'⬕',label:'Custos',section:'Análise'},
    {id:'desempenho',icon:'◎',label:'Desempenho',section:'Análise'},
    {id:'relatorios',icon:'◌',label:'Relatórios',section:'Análise'},
    {id:'configuracoes',icon:'◧',label:'Configurações',section:'Config'},
  ];

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'var(--bg)'}}>
      {/* SIDEBAR */}
      <aside style={{position:'fixed',left:0,top:0,bottom:0,width:220,background:'var(--bg2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',zIndex:100}}>
        <div style={{padding:'20px 20px 16px',borderBottom:'1px solid var(--border)',marginBottom:18,display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
          <div style={{width:56,height:56,borderRadius:12,background:'var(--bg3)',border:'1px solid var(--border2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'var(--accent)'}}>OT</div>
          <div style={{textAlign:'center'}}>
            <div style={{fontWeight:800,fontSize:16,color:'var(--text)'}}>Obra<span style={{color:'var(--accent)'}}>Track</span></div>
            <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',letterSpacing:2,textTransform:'uppercase',marginTop:3}}>Gestão de Obras</div>
          </div>
        </div>
        {['Principal','Análise','Config'].map(section => (
          <div key={section} style={{padding:'0 14px',marginBottom:6}}>
            <div style={{fontSize:9,color:'var(--text3)',fontFamily:'var(--mono)',letterSpacing:2,textTransform:'uppercase',padding:'0 10px',marginBottom:6}}>{section}</div>
            {navItems.filter(n=>n.section===section).map(n=>(
              <div key={n.id} className={`nav-item${page===n.id?' active':''}`} onClick={()=>setPage(n.id)}>
                <span style={{fontSize:15,width:18,textAlign:'center'}}>{n.icon}</span> {n.label}
              </div>
            ))}
          </div>
        ))}
        <div style={{marginTop:'auto',padding:'16px 24px',borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),var(--accent2))',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,color:'#000'}}>RT</div>
            <div><div style={{fontSize:12,fontWeight:500,color:'var(--text)'}}>Rodrigo Truzzi</div><div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>Gestor</div></div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{marginLeft:220,flex:1,padding:'28px 32px',minHeight:'100vh'}}>

        {/* ===== DASHBOARD ===== */}
        {page==='dashboard' && (
          <div className="fade-in">
            <div className="topbar">
              <div><div className="page-title">Dashboard de Obras</div><div className="page-sub">{data.obras.length} obras cadastradas · {kpi.obrasAndamento||0} em andamento</div></div>
              <div style={{display:'flex',gap:10}}><button className="btn btn-ghost" onClick={exportCSV}>⬇ Exportar</button><button className="btn btn-primary" onClick={()=>{setObra(emptyObra);setModalObra(true);}}>＋ Nova Obra</button></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
              {[
                {cls:'c-accent',label:'Custo Total Exec.',value:fmtR(kpi.totalExec||0),sub:fmtFull(kpi.totalExec||0)},
                {cls:'c-red',label:'Total Aditivos',value:fmtR(kpi.totalAditivos||0),sub:`${data.aditivos.length} lançamentos`},
                {cls:'c-green',label:'Obras Concluídas',value:kpi.obrasConcluidas||0,sub:`de ${kpi.totalObras||0} total`},
                {cls:'c-red',label:'Obras Atrasadas',value:kpi.obrasAtrasadas||0,sub:'requerem atenção'},
              ].map((k,i)=>(
                <div key={i} className={`kpi-card ${k.cls}`}>
                  <div className="kpi-label">{k.label}</div>
                  <div className={`kpi-value ${k.cls}`}>{k.value}</div>
                  <div className="kpi-meta">{k.sub}</div>
                  <div className="kpi-bar"><div className="kpi-bar-fill" style={{width:'100%',background:`var(--${k.cls.replace('c-','')})`}}/></div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
              <div className="card">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                  <div className="section-title">Obras Recentes</div>
                  <span style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)',cursor:'pointer'}} onClick={()=>setPage('obras')}>ver todas →</span>
                </div>
                <div className="table-wrap">
                  <table><thead><tr><th>Obra / Cliente</th><th>Status</th><th>Avanço</th><th>Custo Exec.</th></tr></thead>
                  <tbody>
                    {data.obras.slice(0,6).map((o:any)=>(
                      <tr key={o.id}>
                        <td><div style={{fontWeight:500,color:'var(--text)',fontSize:12}}>{o.nome}</div><div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{o.cliente}</div></td>
                        <td><StatusBadge s={o.status}/></td>
                        <td><div style={{display:'flex',alignItems:'center',gap:6}}><div className="prog" style={{width:60,height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${o.avanco}%`,background:'var(--accent)',borderRadius:2}}/></div><span style={{fontFamily:'var(--mono)',fontSize:11}}>{o.avanco}%</span></div></td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{fmtFull(custoExec(o.id))}</td>
                      </tr>
                    ))}
                    {!data.obras.length&&<tr><td colSpan={4}><div className="empty-state"><p>Nenhuma obra cadastrada</p></div></td></tr>}
                  </tbody></table>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                <div className="nota-final-card">
                  <div className="section-title" style={{justifyContent:'center',marginBottom:10}}>Nota Média</div>
                  <div className="nota-final-val" style={{color:notaColor(kpi.notaMedia)}}>{kpi.notaMedia?kpi.notaMedia.toFixed(1):'—'}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text3)',marginBottom:10}}>/ 10,0 pontos</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12}}>
                    {[['Qualidade','qualidade','var(--green)'],['Prazo','prazo','var(--accent)'],['Custo','custo','var(--blue)'],['Limpeza','limpeza','var(--purple)'],['Segurança','seguranca','var(--green)'],['Gestão','gestao','var(--accent)']].map(([l,k,c])=>(
                      <div key={k} style={{background:'var(--bg3)',borderRadius:8,padding:'9px 4px',textAlign:'center'}}>
                        <div style={{fontFamily:'var(--mono)',fontSize:15,fontWeight:600,color:c}}>{kpi.criterios?.[k]?.toFixed(1)||'—'}</div>
                        <div style={{fontSize:9,fontFamily:'var(--mono)',color:'var(--text3)',marginTop:2}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card" style={{marginBottom:0}}>
                  <div className="section-title" style={{marginBottom:12}}>Margem Bruta</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:22,fontWeight:700,color:(kpi.margem||0)>=0?'var(--green)':'var(--red)'}}>{fmtR(kpi.margem||0)}</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>Contrato: {fmtFull(kpi.totalContrato||0)}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>Execução: {fmtFull(kpi.totalExec||0)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== OBRAS ===== */}
        {page==='obras' && (
          <div className="fade-in">
            <div className="topbar">
              <div><div className="page-title">Obras</div><div className="page-sub">Gerencie todas as obras cadastradas</div></div>
              <div style={{display:'flex',gap:10}}><button className="btn btn-ghost" onClick={exportCSV}>⬇ Exportar</button><button className="btn btn-primary" onClick={()=>{setObra(emptyObra);setModalObra(true);}}>＋ Nova Obra</button></div>
            </div>
            <div className="filter-bar">
              {['','Em andamento','Concluída','Atrasada','Iniciando'].map(s=>(
                <button key={s} className={`filter-chip${obraStatus===s?' active':''}`} onClick={()=>setObraStatus(s)}>{s||'Todas'}</button>
              ))}
              <input className="search-box" placeholder="🔍 Buscar..." value={obraSearch} onChange={e=>setObraSearch(e.target.value)}/>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table><thead><tr><th>Obra</th><th>Cliente</th><th>Local</th><th>Status</th><th>Avanço</th><th>Custo Exec.</th><th>Contrato</th><th></th></tr></thead>
                <tbody>
                  {filteredObras.map((o:any)=>(
                    <tr key={o.id}>
                      <td><div style={{fontWeight:500,color:'var(--text)',fontSize:12}}>{o.nome}</div><div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{o.codigo}</div></td>
                      <td>{o.cliente||'—'}</td>
                      <td style={{fontSize:11,color:'var(--text3)'}}>{[o.cidade,o.estado].filter(Boolean).join('/')}</td>
                      <td><StatusBadge s={o.status}/></td>
                      <td><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:60,height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${o.avanco}%`,background:'var(--accent)',borderRadius:2}}/></div><span style={{fontFamily:'var(--mono)',fontSize:11}}>{o.avanco}%</span></div></td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12}}>{fmtFull(custoExec(o.id))}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12}}>{fmtFull(Number(o.contrato||0)+Number(o.extra_cliente||0))}</td>
                      <td><div style={{display:'flex',gap:4}}>
                        <button className="btn btn-edit" onClick={()=>{setObra({...o,inicio:o.inicio?o.inicio.split('T')[0]:'',id:o.id});setModalObra(true);}}>✎</button>
                        <button className="btn btn-danger" onClick={()=>delObra(o.id)}>✕</button>
                      </div></td>
                    </tr>
                  ))}
                  {!filteredObras.length&&<tr><td colSpan={8}><div className="empty-state"><div className="icon">◫</div><p>Nenhuma obra encontrada</p></div></td></tr>}
                </tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ===== CONTRATOS ===== */}
        {page==='contratos' && (
          <div className="fade-in">
            <div className="topbar">
              <div><div className="page-title">Contratos</div><div className="page-sub">Valores vendidos ao cliente vs. custo de execução</div></div>
              <div style={{display:'flex',gap:10}}>
                <button className="btn btn-ghost" onClick={()=>{setAdt(emptyAdt);setModalAdt(true);}}>＋ Lançar Aditivo</button>
                <button className="btn btn-primary" onClick={()=>{setObra(emptyObra);setModalObra(true);}}>＋ Nova Obra</button>
              </div>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table><thead><tr><th>Código</th><th>Obra</th><th>Cliente</th><th>Contrato Cliente</th><th>Extra Cliente</th><th>Total Forn.</th><th>Aditivos</th><th>Margem</th><th>Status</th></tr></thead>
                <tbody>
                  {data.obras.map((o:any)=>{
                    const contCliente = Number(o.contrato||0)+Number(o.extra_cliente||0);
                    const exec = custoExec(o.id);
                    const margem = contCliente - exec;
                    return (
                      <tr key={o.id}>
                        <td style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)'}}>{o.codigo||'—'}</td>
                        <td style={{fontWeight:500,color:'var(--text)',fontSize:12}}>{o.nome}</td>
                        <td>{o.cliente||'—'}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{fmtFull(Number(o.contrato||0))}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12,color:Number(o.extra_cliente)>0?'var(--yellow)':'var(--text3)'}}>{Number(o.extra_cliente)>0?'+'+fmtFull(Number(o.extra_cliente)):'—'}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{fmtFull(totalForn(o.id))}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12,color:totalAdt(o.id)>0?'var(--red)':'var(--text3)'}}>{totalAdt(o.id)>0?'+'+fmtFull(totalAdt(o.id)):'—'}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12,fontWeight:600,color:margem>=0?'var(--green)':'var(--red)'}}>{fmtFull(margem)}</td>
                        <td><StatusBadge s={o.status}/></td>
                      </tr>
                    );
                  })}
                  {!data.obras.length&&<tr><td colSpan={9}><div className="empty-state"><p>Nenhuma obra</p></div></td></tr>}
                </tbody></table>
              </div>
            </div>
            <div className="card">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div className="section-title">Aditivos Lançados</div>
              </div>
              <div className="table-wrap">
                <table><thead><tr><th>Obra</th><th>Fornecedor</th><th>Descrição</th><th>Valor</th><th>Data</th><th>Aprovado por</th><th></th></tr></thead>
                <tbody>
                  {data.aditivos.map((a:any)=>(
                    <tr key={a.id}>
                      <td style={{fontSize:12,color:'var(--text)'}}>{a.obra_nome||'—'}</td>
                      <td>{a.fornecedor_nome||'—'}</td>
                      <td>{a.descricao}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--red)'}}>+{fmtFull(Number(a.valor))}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text3)'}}>{a.data_aditivo?new Date(a.data_aditivo).toLocaleDateString('pt-BR'):'—'}</td>
                      <td style={{fontSize:11}}>{a.aprovado_por||'—'}</td>
                      <td><button className="btn btn-danger" onClick={()=>delAdt(a.id)}>✕</button></td>
                    </tr>
                  ))}
                  {!data.aditivos.length&&<tr><td colSpan={7}><div className="empty-state"><p>Nenhum aditivo lançado</p></div></td></tr>}
                </tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ===== FORNECEDORES ===== */}
        {page==='fornecedores' && (
          <div className="fade-in">
            <div className="topbar">
              <div><div className="page-title">Fornecedores</div><div className="page-sub">Cadastro, desempenho e avaliações</div></div>
              <button className="btn btn-primary" onClick={()=>{setForn(emptyForn);setModalForn(true);}}>＋ Novo Fornecedor</button>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table><thead><tr><th>#</th><th>Fornecedor</th><th>Especialidade</th><th>Cidade / UF</th><th>Obras</th><th>Total Exec.</th><th>Nota Média</th><th></th></tr></thead>
                <tbody>
                  {data.fornecedores.map((f:any,i:number)=>{
                    const obras = data.contratacoes.filter((c:any)=>c.fornecedor_id===f.id).length;
                    const total = data.contratacoes.filter((c:any)=>c.fornecedor_id===f.id).reduce((s:number,c:any)=>s+Number(c.valor||0)+Number(c.extra||0),0);
                    const nota = notaForn(f.id);
                    return (
                      <tr key={f.id}>
                        <td><div className="forn-avatar" style={{background:avatarBg(i)}}>{initials(f.nome)}</div></td>
                        <td><div style={{fontWeight:500,color:'var(--text)',fontSize:12}}>{f.nome}</div><div style={{fontSize:10,color:'var(--text3)',fontFamily:'var(--mono)'}}>{f.cnpj||'—'}</div></td>
                        <td style={{fontSize:11}}>{f.especialidade||'—'}</td>
                        <td style={{fontSize:11,color:'var(--text3)'}}>{[f.cidade,f.estado].filter(Boolean).join(' / ')||'—'}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{obras}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{total>0?fmtFull(total):'—'}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:600,color:notaColor(nota)}}>{nota?nota.toFixed(1):'—'}</td>
                        <td><div style={{display:'flex',gap:4}}>
                          <button className="btn btn-edit" onClick={()=>{setForn({...f,id:f.id});setModalForn(true);}}>✎</button>
                          <button className="btn btn-danger" onClick={()=>delForn(f.id)}>✕</button>
                        </div></td>
                      </tr>
                    );
                  })}
                  {!data.fornecedores.length&&<tr><td colSpan={8}><div className="empty-state"><div className="icon">◉</div><p>Nenhum fornecedor cadastrado</p></div></td></tr>}
                </tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ===== CUSTOS ===== */}
        {page==='custos' && (
          <div className="fade-in">
            <div className="topbar">
              <div><div className="page-title">Custos de Execução</div><div className="page-sub">Contratações e análise financeira por obra e fornecedor</div></div>
              <button className="btn btn-primary" onClick={()=>{setCont(emptyCont);setModalCont(true);}}>＋ Contratar Fornecedor</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:22}}>
              {[
                {cls:'c-accent',label:'Total Contratado',value:fmtR(data.contratacoes.reduce((s:number,c:any)=>s+Number(c.valor||0),0))},
                {cls:'c-red',label:'Total Extras Forn.',value:fmtR(data.contratacoes.reduce((s:number,c:any)=>s+Number(c.extra||0),0))},
                {cls:'c-blue',label:'Total Aditivos',value:fmtR(data.aditivos.reduce((s:number,a:any)=>s+Number(a.valor||0),0))},
              ].map((k,i)=>(
                <div key={i} className={`kpi-card ${k.cls}`}>
                  <div className="kpi-label">{k.label}</div>
                  <div className={`kpi-value ${k.cls}`}>{k.value}</div>
                  <div className="kpi-bar"><div className="kpi-bar-fill" style={{width:'100%',background:`var(--${k.cls.replace('c-','')})`}}/></div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              <div className="card" style={{marginBottom:0}}>
                <div className="section-title" style={{marginBottom:14}}>Custo por Obra</div>
                {data.obras.slice(0,8).map((o:any)=>{
                  const maxC = Math.max(...data.obras.map((x:any)=>custoExec(x.id)),1);
                  const pct = (custoExec(o.id)/maxC*100).toFixed(0);
                  return (
                    <div key={o.id} className="chart-row">
                      <div className="chart-label">{o.nome}</div>
                      <div className="chart-bar-bg"><div className="chart-bar-fill" style={{width:`${pct}%`,background:'var(--accent)'}}/></div>
                      <div className="chart-val">{fmtR(custoExec(o.id))}</div>
                    </div>
                  );
                })}
                {!data.obras.length&&<div style={{color:'var(--text3)',fontSize:12,padding:'10px 0'}}>Nenhuma obra</div>}
              </div>
              <div className="card" style={{marginBottom:0}}>
                <div className="section-title" style={{marginBottom:14}}>Custo por Fornecedor</div>
                {data.fornecedores.slice(0,8).map((f:any,i:number)=>{
                  const total = data.contratacoes.filter((c:any)=>c.fornecedor_id===f.id).reduce((s:number,c:any)=>s+Number(c.valor||0)+Number(c.extra||0),0);
                  const maxF = Math.max(...data.fornecedores.map((x:any)=>data.contratacoes.filter((c:any)=>c.fornecedor_id===x.id).reduce((s:number,c:any)=>s+Number(c.valor||0)+Number(c.extra||0),0)),1);
                  return (
                    <div key={f.id} className="chart-row">
                      <div className="chart-label">{f.nome}</div>
                      <div className="chart-bar-bg"><div className="chart-bar-fill" style={{width:`${(total/maxF*100).toFixed(0)}%`,background:['var(--blue)','var(--green)','var(--purple)','var(--accent)','var(--red)'][i%5]}}/></div>
                      <div className="chart-val">{fmtR(total)}</div>
                    </div>
                  );
                })}
                {!data.fornecedores.length&&<div style={{color:'var(--text3)',fontSize:12,padding:'10px 0'}}>Nenhum fornecedor</div>}
              </div>
            </div>
            <div className="card">
              <div className="section-title" style={{marginBottom:14}}>Contratações de Fornecedores</div>
              <div className="table-wrap">
                <table><thead><tr><th>Obra</th><th>Fornecedor</th><th>Categoria</th><th>Valor Contratado</th><th>Extra Previsto</th><th>Total</th><th></th></tr></thead>
                <tbody>
                  {data.contratacoes.map((c:any)=>(
                    <tr key={c.id}>
                      <td style={{fontSize:12,color:'var(--text)'}}>{c.obra_nome||'—'}</td>
                      <td>{c.fornecedor_nome||'—'}</td>
                      <td style={{fontSize:11}}>{c.categoria||'—'}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12}}>{fmtFull(Number(c.valor||0))}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12,color:Number(c.extra)>0?'var(--yellow)':'var(--text3)'}}>{Number(c.extra)>0?'+'+fmtFull(Number(c.extra)):'—'}</td>
                      <td style={{fontFamily:'var(--mono)',fontSize:12,fontWeight:600}}>{fmtFull(Number(c.valor||0)+Number(c.extra||0))}</td>
                      <td><button className="btn btn-danger" onClick={()=>delCont(c.id)}>✕</button></td>
                    </tr>
                  ))}
                  {!data.contratacoes.length&&<tr><td colSpan={7}><div className="empty-state"><p>Nenhuma contratação registrada</p></div></td></tr>}
                </tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ===== DESEMPENHO ===== */}
        {page==='desempenho' && (
          <div className="fade-in">
            <div className="topbar">
              <div><div className="page-title">Desempenho</div><div className="page-sub">Avaliações e indicadores por fornecedor e obra</div></div>
              <button className="btn btn-primary" onClick={()=>{setAval(emptyAval);setModalAval(true);}}>★ Avaliar Fornecedor</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              <div className="card" style={{marginBottom:0}}>
                <div className="section-title" style={{marginBottom:14}}>Nota por Fornecedor</div>
                {data.fornecedores.map((f:any,i:number)=>{
                  const nota = notaForn(f.id);
                  return (
                    <div key={f.id} className="chart-row">
                      <div className="chart-label">{f.nome}</div>
                      <div className="chart-bar-bg"><div className="chart-bar-fill" style={{width:nota?`${(nota/10*100).toFixed(0)}%`:'0%',background:notaColor(nota)}}/></div>
                      <div className="chart-val" style={{color:notaColor(nota)}}>{nota?nota.toFixed(1):'—'}</div>
                    </div>
                  );
                })}
                {!data.fornecedores.length&&<div style={{color:'var(--text3)',fontSize:12}}>Nenhum fornecedor</div>}
              </div>
              <div className="card" style={{marginBottom:0}}>
                <div className="section-title" style={{marginBottom:14}}>Média por Critério</div>
                {[['Qualidade','qualidade','var(--green)'],['Prazo','prazo','var(--accent)'],['Custo','custo','var(--blue)'],['Limpeza','limpeza','var(--purple)'],['Segurança','seguranca','var(--red)'],['Gestão','gestao','var(--green)']].map(([l,k,c])=>{
                  const avg = data.avaliacoes.length?data.avaliacoes.reduce((s:number,a:any)=>s+Number(a[k]||0),0)/data.avaliacoes.length:0;
                  return (
                    <div key={k} className="chart-row">
                      <div className="chart-label">{l}</div>
                      <div className="chart-bar-bg"><div className="chart-bar-fill" style={{width:`${(avg/10*100).toFixed(0)}%`,background:c}}/></div>
                      <div className="chart-val" style={{color:c}}>{data.avaliacoes.length?avg.toFixed(1):'—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card">
              <div className="section-title" style={{marginBottom:14}}>Histórico de Avaliações</div>
              <div className="table-wrap">
                <table><thead><tr><th>Obra</th><th>Fornecedor</th><th>Qualidade</th><th>Prazo</th><th>Custo</th><th>Limpeza</th><th>Segurança</th><th>Gestão</th><th>Nota Final</th><th>Data</th><th></th></tr></thead>
                <tbody>
                  {data.avaliacoes.map((a:any)=>{
                    const nota=(Number(a.qualidade)+Number(a.prazo)+Number(a.custo)+Number(a.limpeza)+Number(a.seguranca)+Number(a.gestao))/6;
                    return (
                      <tr key={a.id}>
                        <td style={{fontSize:12,color:'var(--text)'}}>{a.obra_nome||'—'}</td>
                        <td>{a.fornecedor_nome||'—'}</td>
                        {['qualidade','prazo','custo','limpeza','seguranca','gestao'].map(k=>(
                          <td key={k} style={{fontFamily:'var(--mono)',fontSize:12,color:notaColor(Number(a[k]))}}>{a[k]}</td>
                        ))}
                        <td style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:700,color:notaColor(nota)}}>{nota.toFixed(1)}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text3)'}}>{a.created_at?new Date(a.created_at).toLocaleDateString('pt-BR'):'—'}</td>
                        <td><button className="btn btn-danger" onClick={()=>delAval(a.id)}>✕</button></td>
                      </tr>
                    );
                  })}
                  {!data.avaliacoes.length&&<tr><td colSpan={11}><div className="empty-state"><p>Nenhuma avaliação registrada</p></div></td></tr>}
                </tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ===== RELATÓRIOS ===== */}
        {page==='relatorios' && (
          <div className="fade-in">
            <div className="topbar">
              <div><div className="page-title">Relatórios</div><div className="page-sub">Visão gerencial consolidada</div></div>
              <button className="btn btn-ghost" onClick={exportCSV}>⬇ Exportar CSV</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              <div className="card" style={{marginBottom:0}}>
                <div className="section-title" style={{marginBottom:14}}>Resumo Geral</div>
                {[
                  ['Total de Obras',data.obras.length],
                  ['Total Contratos Cliente',fmtFull(kpi.totalContrato||0)],
                  ['Total Custo Execução',fmtFull(kpi.totalExec||0)],
                  ['Margem Bruta',fmtFull(kpi.margem||0)],
                  ['Fornecedores Ativos',data.fornecedores.length],
                  ['Aditivos Registrados',data.aditivos.length],
                ].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:12}}>
                    <span style={{color:'var(--text3)'}}>{k}</span>
                    <span style={{fontFamily:'var(--mono)',fontWeight:600}}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{marginBottom:0}}>
                <div className="section-title" style={{marginBottom:14}}>Obras por Status</div>
                {['Concluída','Em andamento','Atrasada','Iniciando'].map(s=>(
                  <div key={s} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                    <StatusBadge s={s}/>
                    <span style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:600}}>{data.obras.filter((o:any)=>o.status===s).length}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="section-title" style={{marginBottom:14}}>Detalhamento Completo</div>
              <div className="table-wrap">
                <table><thead><tr><th>Código</th><th>Obra</th><th>Cliente</th><th>Custo Exec.</th><th>Aditivos</th><th>Contrato Cliente</th><th>Status</th><th>Nota</th></tr></thead>
                <tbody>
                  {data.obras.map((o:any)=>{
                    const nota = (() => {
                      const avs = data.avaliacoes.filter((a:any)=>a.obra_id===o.id);
                      if(!avs.length) return null;
                      return avs.map((a:any)=>(Number(a.qualidade)+Number(a.prazo)+Number(a.custo)+Number(a.limpeza)+Number(a.seguranca)+Number(a.gestao))/6).reduce((s:number,v:number)=>s+v,0)/avs.length;
                    })();
                    return (
                      <tr key={o.id}>
                        <td style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text3)'}}>{o.codigo||'—'}</td>
                        <td style={{fontWeight:500,color:'var(--text)',fontSize:12}}>{o.nome}</td>
                        <td>{o.cliente||'—'}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{fmtFull(custoExec(o.id))}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12,color:totalAdt(o.id)>0?'var(--red)':'var(--text3)'}}>{totalAdt(o.id)>0?'+'+fmtFull(totalAdt(o.id)):'—'}</td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12}}>{fmtFull(Number(o.contrato||0)+Number(o.extra_cliente||0))}</td>
                        <td><StatusBadge s={o.status}/></td>
                        <td style={{fontFamily:'var(--mono)',fontSize:12,fontWeight:600,color:notaColor(nota)}}>{nota?nota.toFixed(1):'—'}</td>
                      </tr>
                    );
                  })}
                  {!data.obras.length&&<tr><td colSpan={8}><div className="empty-state"><p>Nenhuma obra</p></div></td></tr>}
                </tbody></table>
              </div>
            </div>
          </div>
        )}

        {/* ===== CONFIGURAÇÕES ===== */}
        {page==='configuracoes' && (
          <div className="fade-in">
            <div className="topbar"><div><div className="page-title">Configurações</div><div className="page-sub">Sistema, usuários e preferências</div></div></div>
            <div className="card">
              <div className="section-title" style={{marginBottom:16}}>Identidade da Empresa</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:16}}>
                <div>
                  <div className="form-label">Logo da Empresa</div>
                  <div className="upload-box"><div style={{fontSize:24,marginBottom:8}}>📁</div><div style={{fontSize:12,color:'var(--text3)'}}>Clique para enviar logo</div></div>
                </div>
                <div>
                  <Field label="Nome da Empresa"><Input defaultValue="Varejo Rápido S/A"/></Field>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <Field label="Moeda"><Select><option>BRL — Real</option><option>USD — Dólar</option></Select></Field>
                    <Field label="Fuso Horário"><Select><option>São Paulo (UTC-3)</option><option>Manaus (UTC-4)</option></Select></Field>
                  </div>
                </div>
              </div>
              <div style={{marginTop:16}}>
                <div className="section-title" style={{marginBottom:14}}>Funcionalidades de IA</div>
                {[['Análise automática de contratos','Detecta cláusulas de risco'],['Alertas preditivos de atraso','Baseado no histórico'],['Relatório gerencial automático','Resumo semanal por e-mail']].map(([t,s])=>(
                  <div key={t} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                    <div><div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{t}</div><div style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)'}}>{s}</div></div>
                    <label className="toggle"><input type="checkbox" defaultChecked/><div className="toggle-slider"/></label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== MODAIS ===== */}

      {/* Nova Obra */}
      <Modal open={modalObra} onClose={()=>setModalObra(false)} title={obra.id?'Editar Obra':'Nova Obra'} sub="Preencha os dados da obra e do contrato com o cliente">
        <div style={{fontSize:11,fontWeight:600,color:'var(--accent)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:1,marginBottom:10}}>► DADOS DA OBRA</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Nome da Obra *"><Input value={obra.nome} onChange={(e:any)=>setObra((x:any)=>({...x,nome:e.target.value}))} placeholder="Ex: Loja FastMart Centro"/></Field>
          <Field label="Código"><Input value={obra.codigo} onChange={(e:any)=>setObra((x:any)=>({...x,codigo:e.target.value}))} placeholder="#OBR-2024-001"/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Cliente *"><Input value={obra.cliente} onChange={(e:any)=>setObra((x:any)=>({...x,cliente:e.target.value}))} placeholder="Nome do cliente"/></Field>
          <Field label="Local / Unidade"><Input value={obra.local_obra} onChange={(e:any)=>setObra((x:any)=>({...x,local_obra:e.target.value}))} placeholder="Ex: Unidade Centro"/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Cidade"><Input value={obra.cidade} onChange={(e:any)=>setObra((x:any)=>({...x,cidade:e.target.value}))} placeholder="São Paulo"/></Field>
          <Field label="Estado"><Input value={obra.estado} onChange={(e:any)=>setObra((x:any)=>({...x,estado:e.target.value}))} placeholder="SP" maxLength={2}/></Field>
          <Field label="Status"><Select value={obra.status} onChange={(e:any)=>setObra((x:any)=>({...x,status:e.target.value}))}>{['Iniciando','Em andamento','Concluída','Atrasada'].map(s=><option key={s}>{s}</option>)}</Select></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Data de Início"><Input type="date" value={obra.inicio} onChange={(e:any)=>setObra((x:any)=>({...x,inicio:e.target.value}))} /></Field>
          <Field label="Prazo (dias)"><Input type="number" value={obra.prazo} onChange={(e:any)=>setObra((x:any)=>({...x,prazo:Number(e.target.value)}))} /></Field>
        </div>
        <Field label={`Avanço: ${obra.avanco}%`}><input type="range" min={0} max={100} value={obra.avanco} onChange={e=>setObra((x:any)=>({...x,avanco:Number(e.target.value)}))} style={{width:'100%',accentColor:'var(--accent)'}}/></Field>
        <div style={{fontSize:11,fontWeight:600,color:'var(--accent)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:1,margin:'14px 0 10px'}}>► CONTRATO COM O CLIENTE</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Valor Contrato Cliente (R$)"><Input type="number" value={obra.contrato} onChange={(e:any)=>setObra((x:any)=>({...x,contrato:Number(e.target.value)}))} /></Field>
          <Field label="Extra Cliente (R$)"><Input type="number" value={obra.extra_cliente} onChange={(e:any)=>setObra((x:any)=>({...x,extra_cliente:Number(e.target.value)}))} /></Field>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={()=>setModalObra(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveObra}>Salvar Obra</button>
        </div>
      </Modal>

      {/* Novo Fornecedor */}
      <Modal open={modalForn} onClose={()=>setModalForn(false)} title={forn.id?'Editar Fornecedor':'Novo Fornecedor'} sub="Cadastre os dados do fornecedor">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Nome da Empresa *"><Input value={forn.nome} onChange={(e:any)=>setForn((x:any)=>({...x,nome:e.target.value}))} placeholder="Ex: AlfaBuild Construções"/></Field>
          <Field label="CNPJ"><Input value={forn.cnpj} onChange={(e:any)=>setForn((x:any)=>({...x,cnpj:e.target.value}))} placeholder="00.000.000/0001-00"/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Especialidade *"><Select value={forn.especialidade} onChange={(e:any)=>setForn((x:any)=>({...x,especialidade:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</Select></Field>
          <Field label="Telefone"><Input value={forn.tel} onChange={(e:any)=>setForn((x:any)=>({...x,tel:e.target.value}))} placeholder="(11) 9 0000-0000"/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="E-mail"><Input type="email" value={forn.email} onChange={(e:any)=>setForn((x:any)=>({...x,email:e.target.value}))} placeholder="contato@empresa.com"/></Field>
          <Field label="Responsável"><Input value={forn.responsavel} onChange={(e:any)=>setForn((x:any)=>({...x,responsavel:e.target.value}))} placeholder="Nome do contato"/></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Cidade"><Input value={forn.cidade} onChange={(e:any)=>setForn((x:any)=>({...x,cidade:e.target.value}))} placeholder="São Paulo"/></Field>
          <Field label="Estado"><Input value={forn.estado} onChange={(e:any)=>setForn((x:any)=>({...x,estado:e.target.value}))} placeholder="SP" maxLength={2}/></Field>
        </div>
        <Field label="Observações"><Input value={forn.obs} onChange={(e:any)=>setForn((x:any)=>({...x,obs:e.target.value}))} placeholder="Informações adicionais..."/></Field>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={()=>setModalForn(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveForn}>Salvar Fornecedor</button>
        </div>
      </Modal>

      {/* Contratar Fornecedor */}
      <Modal open={modalCont} onClose={()=>setModalCont(false)} title="Contratar Fornecedor" sub="Registre a contratação de um fornecedor para a obra">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Obra *"><Select value={cont.obra_id} onChange={(e:any)=>setCont((x:any)=>({...x,obra_id:e.target.value}))}><option value="">Selecione a obra</option>{data.obras.map((o:any)=><option key={o.id} value={o.id}>{o.nome}</option>)}</Select></Field>
          <Field label="Fornecedor *"><Select value={cont.fornecedor_id} onChange={(e:any)=>setCont((x:any)=>({...x,fornecedor_id:e.target.value}))}><option value="">Selecione...</option>{data.fornecedores.map((f:any)=><option key={f.id} value={f.id}>{f.nome}</option>)}</Select></Field>
        </div>
        <Field label="Categoria / Serviço"><Select value={cont.categoria} onChange={(e:any)=>setCont((x:any)=>({...x,categoria:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</Select></Field>
        <div style={{fontSize:11,fontWeight:600,color:'var(--accent)',fontFamily:'var(--mono)',textTransform:'uppercase',letterSpacing:1,margin:'14px 0 10px'}}>► VALORES</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Valor Contratado (R$) *"><Input type="number" value={cont.valor} onChange={(e:any)=>setCont((x:any)=>({...x,valor:Number(e.target.value)}))} placeholder="Valor base"/></Field>
          <Field label="Extra Previsto (R$)"><Input type="number" value={cont.extra} onChange={(e:any)=>setCont((x:any)=>({...x,extra:Number(e.target.value)}))} /></Field>
        </div>
        <div style={{background:'rgba(77,156,255,.06)',border:'1px solid rgba(77,156,255,.2)',borderRadius:8,padding:12,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--text3)'}}>Total estimado</span>
          <span style={{fontFamily:'var(--mono)',fontSize:16,fontWeight:700,color:'var(--blue)'}}>{fmtFull(cont.valor+cont.extra)}</span>
        </div>
        <Field label="Observações"><Input value={cont.obs} onChange={(e:any)=>setCont((x:any)=>({...x,obs:e.target.value}))} placeholder="Escopo, condições..."/></Field>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={()=>setModalCont(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveCont}>Salvar Contratação</button>
        </div>
      </Modal>

      {/* Lançar Aditivo */}
      <Modal open={modalAdt} onClose={()=>setModalAdt(false)} title="Lançar Aditivo" sub="Registre um custo adicional de execução">
        <Field label="Obra *"><Select value={adt.obra_id} onChange={(e:any)=>setAdt((x:any)=>({...x,obra_id:e.target.value}))}><option value="">Selecione a obra</option>{data.obras.map((o:any)=><option key={o.id} value={o.id}>{o.nome}</option>)}</Select></Field>
        <Field label="Fornecedor"><Select value={adt.fornecedor_id} onChange={(e:any)=>setAdt((x:any)=>({...x,fornecedor_id:e.target.value}))}><option value="">Selecione...</option>{data.fornecedores.map((f:any)=><option key={f.id} value={f.id}>{f.nome}</option>)}</Select></Field>
        <Field label="Descrição *"><Input value={adt.descricao} onChange={(e:any)=>setAdt((x:any)=>({...x,descricao:e.target.value}))} placeholder="Motivo do aditivo..."/></Field>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Valor (R$) *"><Input type="number" value={adt.valor} onChange={(e:any)=>setAdt((x:any)=>({...x,valor:Number(e.target.value)}))} /></Field>
          <Field label="Data"><Input type="date" value={adt.data_aditivo} onChange={(e:any)=>setAdt((x:any)=>({...x,data_aditivo:e.target.value}))} /></Field>
        </div>
        <Field label="Aprovado por"><Input value={adt.aprovado_por} onChange={(e:any)=>setAdt((x:any)=>({...x,aprovado_por:e.target.value}))} placeholder="Nome do responsável"/></Field>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={()=>setModalAdt(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveAdt}>Lançar Aditivo</button>
        </div>
      </Modal>

      {/* Avaliar Fornecedor */}
      <Modal open={modalAval} onClose={()=>setModalAval(false)} title="Avaliação de Fornecedor" sub="Avalie o fornecedor ao encerrar sua atividade na obra." wide>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <Field label="Obra *"><Select value={aval.obra_id} onChange={(e:any)=>setAval((x:any)=>({...x,obra_id:e.target.value}))}><option value="">Selecione a obra</option>{data.obras.map((o:any)=><option key={o.id} value={o.id}>{o.nome}</option>)}</Select></Field>
          <Field label="Fornecedor *"><Select value={aval.fornecedor_id} onChange={(e:any)=>setAval((x:any)=>({...x,fornecedor_id:e.target.value}))}><option value="">Selecione...</option>{data.fornecedores.map((f:any)=><option key={f.id} value={f.id}>{f.nome}</option>)}</Select></Field>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {[['Qualidade (0–10)','qualidade'],['Prazo (0–10)','prazo'],['Custo (0–10)','custo'],['Limpeza (0–10)','limpeza'],['Segurança (0–10)','seguranca'],['Gestão (0–10)','gestao']].map(([l,k])=>(
            <Field key={k} label={l}><Input type="number" min={0} max={10} step={0.1} value={aval[k]} onChange={(e:any)=>setAval((x:any)=>({...x,[k]:Number(e.target.value)}))} placeholder="0–10"/></Field>
          ))}
        </div>
        <div style={{marginTop:14}}>
          <Field label="Observações"><Input value={aval.obs} onChange={(e:any)=>setAval((x:any)=>({...x,obs:e.target.value}))} placeholder="Comentários sobre a entrega..."/></Field>
        </div>
        <div style={{background:'rgba(45,202,114,.06)',border:'1px solid rgba(45,202,114,.2)',borderRadius:8,padding:12,marginTop:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--text3)'}}>Nota final calculada</span>
          <span style={{fontFamily:'var(--mono)',fontSize:20,fontWeight:700,color:'var(--green)'}}>{((aval.qualidade+aval.prazo+aval.custo+aval.limpeza+aval.seguranca+aval.gestao)/6).toFixed(1)}</span>
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={()=>setModalAval(false)}>Cancelar</button>
          <button className="btn btn-primary" onClick={saveAval}>Salvar Avaliação</button>
        </div>
      </Modal>
    </div>
  );
}
