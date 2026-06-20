import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUser, useTasks, useCompleteTask } from '@/hooks/use-data'

export function Tarefas() {
  const { data: user } = useUser()
  const { data: tasks = [], isLoading } = useTasks(user?.id)
  const completeTask = useCompleteTask()
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending')

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.is_completed
    if (filter === 'completed') return t.is_completed
    return true
  })

  const categoryColors: Record<string, string> = {
    vendas: 'bg-blue-500/10 text-blue-500',
    estoque: 'bg-orange-500/10 text-orange-500',
    concorrencia: 'bg-purple-500/10 text-purple-500',
    marketing: 'bg-pink-500/10 text-pink-500',
    anuncio: 'bg-green-500/10 text-green-500',
    relatorio: 'bg-yellow-500/10 text-yellow-500',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <p className="text-muted-foreground">
          Tarefas práticas de operação geradas automaticamente.
        </p>
      </div>

      <div className="flex gap-2">
        {(['pending', 'completed', 'all'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'pending' ? 'Pendentes' : f === 'completed' ? 'Concluídas' : 'Todas'}
            {f === 'pending' && ` (${tasks.filter(t => !t.is_completed).length})`}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              {filter === 'pending'
                ? 'Nenhuma tarefa pendente. Tudo em dia!'
                : 'Nenhuma tarefa encontrada.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <Card key={task.id} className={task.is_completed ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">{task.title}</span>
                    <Badge
                      variant="outline"
                      className={categoryColors[task.category] ?? ''}
                    >
                      {task.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {task.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={task.priority <= 2 ? 'destructive' : 'secondary'}>
                    P{task.priority}
                  </Badge>
                  {!task.is_completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => completeTask.mutate(task.id)}
                      disabled={completeTask.isPending}
                    >
                      Concluir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
