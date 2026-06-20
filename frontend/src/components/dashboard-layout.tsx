import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Home, Wallet, Megaphone, Headphones,
  Box, Search, ListTodo, Settings,
  Rocket,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/resumo', label: 'Resumo', icon: Home },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/marketing', label: 'Central de Marketing', icon: Megaphone },
  { to: '/atendimento', label: 'Atendimento', icon: Headphones },
  { to: '/anuncios', label: 'Meus Anúncios', icon: Box },
  { to: '/concorrencia', label: 'Concorrência', icon: Search },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function DashboardLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-sidebar-background flex flex-col">
        {/* Brand */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-sidebar-primary" />
            <span className="font-semibold text-sidebar-foreground">
              Shopee Growth Quest
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-accent-foreground">A</span>
            </div>
            <div>
              <div className="text-sm font-medium text-sidebar-foreground">Admin</div>
              <div className="text-xs text-muted-foreground">Nível 1 | 0 XP</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
