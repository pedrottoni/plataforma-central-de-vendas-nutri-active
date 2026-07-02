import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Concorrencia() {
  return (
    <div className="space-y-6">


      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-muted-foreground">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Monitor de Preços</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Conecte o backend para busca automática de concorrência e comparação de preços.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Produtos Monitorados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aguardando backend...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Alertas de Preço</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aguardando backend...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
