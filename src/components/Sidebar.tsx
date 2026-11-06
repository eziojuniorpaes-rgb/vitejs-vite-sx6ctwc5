import { NavButton } from './NavButton'

export function Sidebar() {
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark">C</span><div><strong>Comunicação</strong><small>Verbo Cuiabá</small></div></div>
    <nav>
      <NavButton to="/" icon="⌂" label="Início" />
      <NavButton to="/relatorios" icon="▤" label="Relatórios" />
      <NavButton to="/relatorios/novo" icon="＋" label="Novo relatório" />
      <NavButton to="/ocorrencias" icon="⌕" label="Ocorrências" />
      <NavButton to="/perfil" icon="◉" label="Minha conta" />
    </nav>
    <div className="sidebar-user"><span className="avatar">EP</span><div><strong>Ézio Paes</strong><small>Liderança Geral</small></div></div>
  </aside>
}
