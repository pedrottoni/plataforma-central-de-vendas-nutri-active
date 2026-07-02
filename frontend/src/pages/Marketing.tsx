import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Marketing() {
  return (
    <div className="space-y-6">


      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-muted-foreground">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Análise de Campanhas</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Conecte o backend para funcionalidade de análise de campanhas e gerador de prompts de imagem.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Campanhas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aguardando backend...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Prompts Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aguardando backend...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
