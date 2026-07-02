import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Home, Wallet, Megaphone, Headphones,
  Box, Search, ListTodo, Settings,
  Rocket, Activity, Zap, AlertTriangle,
} from 'lucide-react'

const NAV_OPERATIONS = [
  { to: '/resumo', label: 'Resumo', icon: Home },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/anuncios', label: 'Meus Anúncios', icon: Box, badge: 3 },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo, badge: 7 },
]

const NAV_AGENTS = [
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/atendimento', label: 'Atendimento', icon: Headphones },
  { to: '/concorrencia', label: 'Concorrência', icon: Search },
]

const NAV_SYSTEM = [
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/resumo': { title: 'Resumo', description: 'Visão geral das operações em tempo real' },
  '/financeiro': { title: 'Financeiro', description: 'Tesouraria, vendas, despesas e uploads' },
  '/marketing': { title: 'Central de Marketing', description: 'Campanhas e gerador de prompts' },
  '/atendimento': { title: 'Atendimento', description: 'Respostas e análise de sentimento' },
  '/anuncios': { title: 'Meus Anúncios', description: 'Anúncios, estoque e precificação' },
  '/concorrencia': { title: 'Concorrência', description: 'Monitor de preços concorrentes' },
  '/tarefas': { title: 'Tarefas', description: 'Tarefas operacionais automatizadas' },
  '/configuracoes': { title: 'Configurações', description: 'Conexões e provedores de IA' },
}

export function DashboardLayout() {
  const location = useLocation()
  const meta = PAGE_META[location.pathname] ?? { title: 'Plataforma', description: '' }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-sidebar-background border-r border-border flex flex-col overflow-hidden">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-sm text-sidebar-foreground tracking-tight block">
                Nutri Active
              </span>
              <span className="text-[10px] text-muted-foreground font-mono-nums">
                Quest v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {/* Operations section */}
          <div className="mb-1">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Operações
            </div>
            {NAV_OPERATIONS.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary/12 text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 opacity-60" />
                <span className="flex-1 truncate">{label}</span>
                {badge && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full font-mono-nums">
                    {badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Agents section */}
          <div className="mb-1 mt-3">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Agentes
            </div>
            {NAV_AGENTS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary/12 text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 opacity-60" />
                <span className="flex-1 truncate">{label}</span>
              </NavLink>
            ))}
          </div>

          {/* System section */}
          <div className="mt-3">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Sistema
            </div>
            {NAV_SYSTEM.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary/12 text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 opacity-60" />
                <span className="flex-1 truncate">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-xs font-semibold text-sidebar-accent-foreground">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-sidebar-foreground truncate">Admin</div>
              <div className="text-[11px] text-muted-foreground font-mono-nums">
                Nível 1 · 0 XP
              </div>
            </div>
            <Activity className="h-3.5 w-3.5 text-success" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="px-7 py-4 border-b border-border bg-sidebar-background flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              {meta.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {meta.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground font-mono-nums">
              <Zap className="h-3.5 w-3.5 text-success" />
              <span>Online</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground font-mono-nums">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <span>3 alertas</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
