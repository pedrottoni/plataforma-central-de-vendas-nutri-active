import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, Server, Brain, Key, Globe, Activity } from 'lucide-react'

export function Configuracoes() {
  const [shopeeStatus, setShopeeStatus] = useState<{ connected: boolean; shop_id: string | null; expires_at: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/shopee/status')
      .then(r => r.json())
      .then(setShopeeStatus)
      .catch(() => setShopeeStatus({ connected: false, shop_id: null, expires_at: null }))
  }, [])

  const handleConnect = async () => {
    const res = await fetch('/api/shopee/auth/url')
    const data = await res.json()
    window.open(data.url, '_blank')
  }

  const handleRefresh = async () => {
    await fetch('/api/shopee/refresh', { method: 'POST' })
    const res = await fetch('/api/shopee/status')
    const data = await res.json()
    setShopeeStatus(data)
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'não configurado'
  const apiUrl = import.meta.env.VITE_API_URL || 'não configurado'
  const supabaseConfigured = supabaseUrl !== 'não configurado' && supabaseUrl.length > 0
  const apiConfigured = apiUrl !== 'não configurado' && apiUrl.length > 0

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-success/12 flex items-center justify-center">
              <Database className="h-4 w-4 text-success" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Supabase</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    supabaseConfigured ? 'text-success border-success/30' : 'text-destructive border-destructive/30'
                  }`}
                >
                  {supabaseConfigured ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono-nums truncate max-w-[180px]">
                {supabaseConfigured ? supabaseUrl : 'Configure VITE_SUPABASE_URL'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-warning/12 flex items-center justify-center">
              <Server className="h-4 w-4 text-warning" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Backend API</span>
                <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                  {apiConfigured ? 'Conectado' : 'Em breve'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono-nums truncate max-w-[180px]">
                {apiConfigured ? apiUrl : 'Configure VITE_API_URL'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-purple-500/12 flex items-center justify-center">
              <Brain className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">IA / LLM</span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Em breve
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Configuração pendente
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connections Detail */}
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Conexões
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] font-mono-nums">
              2 de 3 ativas
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {/* Supabase */}
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-success/12 flex items-center justify-center">
                  <Database className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">Supabase (PostgreSQL)</p>
                  <p className="text-xs text-muted-foreground font-mono-nums">
                    Banco de dados + autenticação + Storage
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-xs text-success font-mono-nums">Ativo</span>
              </div>
            </div>

            {/* Backend API */}
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-warning/12 flex items-center justify-center">
                  <Server className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium">Backend API (FastAPI)</p>
                  <p className="text-xs text-muted-foreground font-mono-nums">
                    Scrapers, AI, CSV upload, automações
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-warning" />
                <span className="text-xs text-warning font-mono-nums">Em breve</span>
              </div>
            </div>

            {/* IA / LLM */}
            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/12 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">IA / LLM Provider</p>
                  <p className="text-xs text-muted-foreground font-mono-nums">
                    Geração de prompts, respostas, análise
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span className="text-xs text-muted-foreground font-mono-nums">Pendente</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Versão</span>
                <span className="text-xs font-mono-nums">v1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Framework</span>
                <span className="text-xs font-mono-nums">React 19 + Vite 8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">UI</span>
                <span className="text-xs font-mono-nums">Tailwind 4 + shadcn/ui</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Database</span>
                <span className="text-xs font-mono-nums">Supabase PostgreSQL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">State</span>
                <span className="text-xs font-mono-nums">TanStack Query v5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Charts</span>
                <span className="text-xs font-mono-nums">Recharts</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            Chaves de API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">VITE_SUPABASE_URL</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    supabaseConfigured ? 'text-success border-success/30' : 'text-muted-foreground'
                  }`}
                >
                  {supabaseConfigured ? 'Configurada' : 'Não configurada'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono-nums">
                {supabaseConfigured ? '***' + supabaseUrl.slice(-8) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">VITE_API_URL</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    apiConfigured ? 'text-success border-success/30' : 'text-muted-foreground'
                  }`}
                >
                  {apiConfigured ? 'Configurada' : 'Não configurada'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-mono-nums">
                {apiConfigured ? '***' + apiUrl.slice(-8) : '—'}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Chaves são lidas de <code className="text-primary">.env</code> no build time. Nunca são expostas ao cliente.
          </p>
        </CardContent>
      </Card>

      {/* Shopee Connection */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-orange-500" />
            Shopee Open Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shopeeStatus?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default">Conectado</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Loja: </span>
                  {shopeeStatus.shop_id}
                </p>
                {shopeeStatus.expires_at && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Expira em: </span>
                    {shopeeStatus.expires_at}
                  </p>
                )}
              </div>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Atualizar Token
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Badge variant="secondary">Desconectado</Badge>
              <div>
                <Button onClick={handleConnect} size="sm">
                  Conectar Shopee
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
