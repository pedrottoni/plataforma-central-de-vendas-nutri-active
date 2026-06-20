import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Marketing() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Central de Marketing</h1>
        <p className="text-muted-foreground">
          Análise de campanhas e gerador de prompts Midjourney.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Campanhas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">em breve — conecte o backend para funcionalidade AI</p>
        </CardContent>
      </Card>
    </div>
  )
}
