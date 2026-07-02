import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/ui/badge'
import { useUser, useTasks, useProducts, useTransactions, useLowStockItems } from '@/hooks/use-data'
import { TrendingUp, Package, DollarSign, ShoppingCart, AlertTriangle } from 'lucide-react'

export function Resumo() {
  const { data: user } = useUser()
  const { data: tasks = [] } = useTasks(user?.id)
  const { data: products = [] } = useProducts(user?.id)
  const { data: transactions = [] } = useTransactions(user?.id)
  const { data: lowStock = [] } = useLowStockItems(user?.id)

  const pendingTasks = tasks.filter(t => !t.is_completed)
  const totalRevenue = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalInvested = products.reduce((sum, p) => sum + p.total_invested, 0)
  const totalDespesas = totalExpenses + totalInvested
  const profit = totalRevenue - totalDespesas
  const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0.0'

  // Mock trend data (would come from backend)
  const trends = {
    products: { value: 12, direction: 'up' as const },
    revenue: { value: 8.5, direction: 'up' as const },
    expenses: { value: 3.2, direction: 'down' as const },
    profit: { value: 15.3, direction: 'up' as const },
  }

  // Revenue chart data (last 7 days mock)
  const chartData = [
    { day: 'Seg', value: 420 },
    { day: 'Ter', value: 380 },
    { day: 'Qua', value: 510 },
    { day: 'Qui', value: 290 },
    { day: 'Sex', value: 620 },
    { day: 'Sáb', value: 480 },
    { day: 'Dom', value: 350 },
  ]
  const maxChartValue = Math.max(...chartData.map(d => d.value))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Package} label="Produtos" value={products.length} description={`${transactions.filter(t => t.type === 'INCOME').length} vendas`} trend={{ value: trends.products.value, positive: true }} />
        <KpiCard icon={DollarSign} label="Receita" value={`R$ ${totalRevenue.toFixed(2)}`} description={`${transactions.filter(t => t.type === 'INCOME').length} vendas`} valueColor="text-success" trend={{ value: trends.revenue.value, positive: true }} />
        <KpiCard icon={ShoppingCart} label="Despesas" value={`R$ ${totalDespesas.toFixed(2)}`} description={`${transactions.filter(t => t.type === 'EXPENSE').length} transações + R$ ${totalInvested.toFixed(2)} investido`} valueColor="text-destructive" trend={{ value: trends.expenses.value, positive: false }} />
        <KpiCard icon={TrendingUp} label="Lucro" value={`R$ ${profit.toFixed(2)}`} description={`margem ${margin}%`} trend={{ value: trends.profit.value, positive: true }} />
      </div>

      {/* Revenue Chart + Tasks */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Receita — Últimos 7 dias</CardTitle>
              <span className="text-xs text-muted-foreground font-mono-nums">
                R$ {chartData.reduce((s, d) => s + d.value, 0).toFixed(0)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-44 flex items-end gap-2">
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-mono-nums">
                    R$ {d.value}
                  </span>
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                    style={{ height: `${(d.value / maxChartValue) * 140}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Tarefas Pendentes</CardTitle>
              <Badge variant="secondary" className="font-mono-nums">
                {pendingTasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Tudo em dia! Nenhuma tarefa pendente.
              </p>
            ) : (
              <div className="space-y-0">
                {pendingTasks.slice(0, 6).map(task => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      task.priority <= 1 ? 'bg-destructive' :
                      task.priority <= 2 ? 'bg-warning' :
                      'bg-muted-foreground/50'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{task.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {task.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                        task.category === 'vendas' ? 'bg-primary/12 text-primary border-primary/20' :
                        task.category === 'estoque' ? 'bg-warning/12 text-warning border-warning/20' :
                        task.category === 'marketing' ? 'bg-pink-500/12 text-pink-400 border-pink-500/20' :
                        task.category === 'concorrencia' ? 'bg-purple-500/12 text-purple-400 border-purple-500/20' :
                        ''
                      }`}
                    >
                      {task.category}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts + Level */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Stock Alerts */}
        <Card className="bg-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Alertas de Estoque
              </CardTitle>
              <Badge variant="secondary" className="font-mono-nums">
                {lowStock.length} itens
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {products.length === 0
                  ? 'Nenhum produto cadastrado ainda.'
                  : 'Todos os produtos com estoque OK.'}
              </p>
            ) : (
              <div className="space-y-0">
                {lowStock.slice(0, 5).map(item => {
                  const pct = Math.min((item.stock / 20) * 100, 100)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                    >
                      <span className="text-[13px] font-medium flex-1 truncate">
                        {item.title}
                      </span>
                      <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full ${
                            item.stock <= 3 ? 'bg-destructive' :
                            item.stock <= 8 ? 'bg-warning' :
                            'bg-success'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono-nums text-muted-foreground w-12 text-right shrink-0">
                        {item.stock} un.
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Level & XP */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Nível & XP</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold font-mono-nums text-primary">
                    {user.level}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">nível atual</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono-nums">{user.xp} XP</span>
                    <span className="text-muted-foreground font-mono-nums">
                      {(user.level * 100)} XP
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min((user.xp % 100), 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    {100 - (user.xp % 100)} XP para o próximo nível
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
