import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Anuncios() {
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
              <CardTitle>Lista de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">em breve — conecte o Supabase para gerenciar produtos</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="estoque" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Controle de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">em breve</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="precificacao" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Calculadora de Precificação</CardTitle>
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
