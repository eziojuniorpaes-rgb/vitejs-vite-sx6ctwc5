import { useLocation } from 'react-router-dom'

const titles: Record<string, string> = {
  '/': 'Início', '/relatorios': 'Relatórios', '/relatorios/novo': 'Novo relatório',
  '/ocorrencias': 'Ocorrências', '/perfil': 'Minha conta',
}

interface Props { theme: 'light' | 'dark'; onToggleTheme: () => void }

export function Header({ theme, onToggleTheme }: Props) {
  const { pathname } = useLocation()
  return <header className="topbar"><div><span className="eyebrow">COMUNICAÇÃO</span><h1>{titles[pathname] ?? 'Comunicação'}</h1></div><button type="button" className="theme-button" onClick={onToggleTheme}>{theme === 'light' ? '☾' : '☀'}</button></header>
}
