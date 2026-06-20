import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUser, useTasks, useProducts, useTransactions, useLowStockItems } from '@/hooks/use-data'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumo</h1>
        <p className="text-muted-foreground">
          Monitore suas operações Shopee em tempo real.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{transactions.filter(t => t.type === 'INCOME').length} transações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{transactions.filter(t => t.type === 'EXPENSE').length} transações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tarefas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">de {tasks.length} total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nível & XP</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nível {user.level}</span>
                  <span className="text-sm text-muted-foreground">{user.xp} XP</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min((user.xp % 100), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {100 - (user.xp % 100)} XP para o próximo nível
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas de Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length > 0 ? (
              <div className="space-y-2">
                {lowStock.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="destructive">{item.stock} un.</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {products.length === 0
                  ? 'Nenhum produto cadastrado ainda.'
                  : 'Todos os produtos com estoque OK.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {pendingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tarefas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between">
                  <span className="text-sm">{task.title}</span>
                  <Badge variant={task.priority <= 2 ? 'destructive' : 'secondary'}>
                    P{task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
