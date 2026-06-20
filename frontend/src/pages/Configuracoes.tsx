import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Configuração do provedor de IA e chaves de API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provedor de IA</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">em breve — conecte o backend para configurar LLM</p>
        </CardContent>
      </Card>
    </div>
  )
}
