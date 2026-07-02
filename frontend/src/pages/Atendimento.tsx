import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Atendimento() {
  return (
    <div className="space-y-6">


      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-muted-foreground">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Gerador de Respostas</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Conecte o backend para funcionalidade de gerar respostas automatizadas e análise de sentimento de clientes.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mensagens Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aguardando backend...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Respostas Geradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aguardando backend...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
