import { useNavigate } from 'react-router-dom'
import { accessLevels, operationalAreas, recentReports, transverseFunctions } from '../data/constants'
import { StatCard } from '../components/StatCard'
import { InfoRow } from '../components/InfoRow'

export function DashboardPage() {
  const navigate = useNavigate()
  return <div className="page-stack">
    <section className="hero card"><div><span className="eyebrow light">PRÓXIMO CULTO</span><h2>Boa noite, Ézio!</h2><p>O próximo relatório sugerido é do Culto do Espírito, hoje às 20h.</p></div><button className="primary" onClick={() => navigate('/relatorios/novo')}>＋ Criar relatório</button></section>
    <section className="stats"><StatCard value="2" label="Rascunhos" /><StatCard value="8" label="Ocorrências no mês" /><StatCard value="3" label="Demandas abertas" /></section>
    <section className="content-grid">
      <div className="card"><div className="card-title"><h3>Relatórios recentes</h3><button onClick={() => navigate('/relatorios')}>Ver todos</button></div>{recentReports.map(report => <div className="list-row" key={report.id}><div><strong>{report.title}</strong><small>{report.date}</small></div><span className={report.status === 'Enviado' ? 'badge sent' : 'badge draft'}>{report.status}</span></div>)}</div>
      <div className="card"><div className="card-title"><h3>Estrutura cadastrada</h3></div><InfoRow label="Áreas operacionais" value={`${operationalAreas.length} áreas`} /><InfoRow label="Funções transversais" value={transverseFunctions.join(' e ')} /><InfoRow label="Níveis de acesso" value={accessLevels.join(' e ')} /></div>
    </section>
  </div>
}
