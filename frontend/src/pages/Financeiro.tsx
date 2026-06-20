import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Financeiro() {
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
        <TabsContent value="dashboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">em breve — conecte o Supabase para dados reais</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vendas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">em breve</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="despesas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">em breve</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="uploads" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">em breve</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
