import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Atendimento() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Atendimento</h1>
        <p className="text-muted-foreground">
          Gerador de respostas e análise de sentimento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerador de Respostas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">em breve — conecte o backend para funcionalidade AI</p>
        </CardContent>
      </Card>
    </div>
  )
}
