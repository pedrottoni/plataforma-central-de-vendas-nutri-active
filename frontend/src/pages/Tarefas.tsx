import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Tarefas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <p className="text-muted-foreground">
          Tarefas práticas de operação geradas automaticamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tarefas Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">em breve — conecte o Supabase para ver tarefas</p>
        </CardContent>
      </Card>
    </div>
  )
}
