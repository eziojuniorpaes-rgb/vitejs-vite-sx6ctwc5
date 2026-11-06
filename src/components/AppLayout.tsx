import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNavigation } from './BottomNavigation'
import { Header } from './Header'

interface Props { theme: 'light' | 'dark'; onToggleTheme: () => void }

export function AppLayout({ theme, onToggleTheme }: Props) {
  return <div className="app" data-theme={theme}>
    <Sidebar />
    <div className="workspace"><Header theme={theme} onToggleTheme={onToggleTheme} /><main><Outlet /></main></div>
    <BottomNavigation />
  </div>
}
