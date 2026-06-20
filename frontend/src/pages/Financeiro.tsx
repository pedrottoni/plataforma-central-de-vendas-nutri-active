import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useUser, useTransactions } from '@/hooks/use-data'

export function Financeiro() {
  const { data: user } = useUser()
  const { data: transactions = [] } = useTransactions(user?.id)

  const income = transactions.filter(t => t.type === 'INCOME')
  const expenses = transactions.filter(t => t.type === 'EXPENSE')
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
  const profit = totalIncome - totalExpenses

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">
          Tesouraria: resumo financeiro, registrar vendas, despesas e uploads.
        </p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">R$ {totalIncome.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{income.length} vendas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">R$ {totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{expenses.length} registros</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  R$ {profit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  margem {totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {transactions.length === 0 && (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  Nenhuma transação registrada. Faça upload da planilha do Seller Center na aba Uploads.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vendas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {income.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>
              ) : (
                <div className="space-y-2">
                  {income.slice(0, 20).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="default">R$ {t.amount.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="despesas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma despesa registrada.</p>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 20).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.category} · {new Date(t.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="destructive">R$ {t.amount.toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uploads" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload de CSV será implementado quando o backend estiver pronto.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
