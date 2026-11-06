import { useNavigate } from 'react-router-dom'
import { NavButton } from './NavButton'

export function BottomNavigation() {
  const navigate = useNavigate()
  return <nav className="bottom-nav">
    <NavButton to="/" icon="⌂" label="Início" />
    <NavButton to="/relatorios" icon="▤" label="Relatórios" />
    <button type="button" className="create-button" onClick={() => navigate('/relatorios/novo')} aria-label="Novo relatório">＋</button>
    <NavButton to="/ocorrencias" icon="⌕" label="Ocorrências" />
    <NavButton to="/perfil" icon="◉" label="Conta" />
  </nav>
}
