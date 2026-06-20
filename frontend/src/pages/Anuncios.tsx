import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useUser, useProducts } from '@/hooks/use-data'

export function Anuncios() {
  const { data: user } = useUser()
  const { data: products = [] } = useProducts(user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Anúncios</h1>
        <p className="text-muted-foreground">
          CRUD de produtos, upload em massa, kits e importação CSV.
        </p>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="precificacao">Precificação</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Produtos ({products.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum produto cadastrado. CRUD será implementado quando o backend estiver pronto.
                </p>
              ) : (
                <div className="space-y-2">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.category ?? 'Sem categoria'} · SKU: {p.sku ?? '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-medium">R$ {p.price.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            custo: R$ {p.supplier_price.toFixed(2)}
                          </p>
                        </div>
                        <Badge variant={p.stock > 0 ? 'default' : 'destructive'}>
                          {p.stock} un.
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto para monitorar.</p>
              ) : (
                <div className="space-y-2">
                  {products
                    .sort((a, b) => a.stock - b.stock)
                    .slice(0, 10)
                    .map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{p.title}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.stock <= 5 ? 'bg-red-500' : p.stock <= 20 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((p.stock / p.initial_stock) * 100, 100)}%` }}
                            />
                          </div>
                          <Badge variant={p.stock <= 5 ? 'destructive' : 'secondary'}>
                            {p.stock}/{p.initial_stock}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="precificacao" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Calculadora de Precificação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Calculadora de margem será implementada quando o backend estiver pronto.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
