import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Concorrencia() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Concorrência</h1>
        <p className="text-muted-foreground">
          Monitor de preços — comparação com concorrentes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monitor de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">em breve — conecte o backend para busca de concorrência</p>
        </CardContent>
      </Card>
    </div>
  )
}
