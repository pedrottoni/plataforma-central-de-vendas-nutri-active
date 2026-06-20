import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function Configuracoes() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'não configurado'
  const apiUrl = import.meta.env.VITE_API_URL || 'não configurado'

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
          <CardTitle>Conexões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Supabase</p>
              <p className="text-xs text-muted-foreground font-mono">{supabaseUrl}</p>
            </div>
            <Badge variant="default">Conectado</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Backend API</p>
              <p className="text-xs text-muted-foreground font-mono">{apiUrl}</p>
            </div>
            <Badge variant="secondary">Em breve</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provedor de IA</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configuração de LLM será implementada quando o backend estiver pronto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
