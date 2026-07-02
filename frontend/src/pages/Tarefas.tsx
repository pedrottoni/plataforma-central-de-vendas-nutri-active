import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/components/kpi-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUser, useTasks, useCompleteTask, useCreateTask, useDeleteTask } from '@/hooks/use-data'
import { CheckCircle2, Circle, Filter, Plus, Trash2, X } from 'lucide-react'

export function Tarefas() {
  const { data: user } = useUser()
  const { data: tasks = [], isLoading } = useTasks(user?.id)
  const completeTask = useCompleteTask()
  const createTask = useCreateTask()
  const deleteTask = useDeleteTask()
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('vendas')
  const [newPriority, setNewPriority] = useState(2)

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.is_completed
    if (filter === 'completed') return t.is_completed
    return true
  })

  const pendingCount = tasks.filter(t => !t.is_completed).length
  const completedCount = tasks.filter(t => t.is_completed).length

  const categoryConfig: Record<string, { color: string; label: string }> = {
    vendas: { color: 'bg-primary/12 text-primary border-primary/20', label: 'Vendas' },
    estoque: { color: 'bg-warning/12 text-warning border-warning/20', label: 'Estoque' },
    concorrencia: { color: 'bg-purple-500/12 text-purple-400 border-purple-500/20', label: 'Concorrência' },
    marketing: { color: 'bg-pink-500/12 text-pink-400 border-pink-500/20', label: 'Marketing' },
    anuncio: { color: 'bg-success/12 text-success border-success/20', label: 'Anúncio' },
    relatorio: { color: 'bg-yellow-500/12 text-yellow-400 border-yellow-500/20', label: 'Relatório' },
  }

  const handleCreate = () => {
    if (!newTitle.trim() || !user?.id) return
    createTask.mutate({
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      priority: newPriority,
      user_id: user.id,
    }, {
      onSuccess: () => {
        setNewTitle('')
        setNewDescription('')
        setNewCategory('vendas')
        setNewPriority(2)
        setShowForm(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 grid-cols-2">
        <KpiCard icon={Circle} label="Pendentes" value={pendingCount} description="tarefas aguardando" valueColor="" />
        <KpiCard icon={CheckCircle2} label="Concluídas" value={completedCount} description="tarefas finalizadas" valueColor="text-success" />
      </div>

      {/* Create Task Form */}
      {showForm && (
        <Card className="bg-card border-primary/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Nova Tarefa</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Título *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Atualizar estoque do Whey"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Descrição
                </label>
                <textarea
                  placeholder="Detalhes da tarefa..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Prioridade
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value={1}>P1 — Alta</option>
                    <option value={2}>P2 — Média</option>
                    <option value={3}>P3 — Baixa</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || createTask.isPending}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  {createTask.isPending ? 'Criando...' : 'Criar Tarefa'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + Create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(['pending', 'completed', 'all'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="text-xs"
            >
              {f === 'pending' ? 'Pendentes' : f === 'completed' ? 'Concluídas' : 'Todas'}
              <span className="ml-1.5 font-mono-nums opacity-70">
                {f === 'pending' ? pendingCount : f === 'completed' ? completedCount : tasks.length}
              </span>
            </Button>
          ))}
        </div>
        {!showForm && (
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nova Tarefa
          </Button>
        )}
      </div>

      {/* Task List */}
      {isLoading ? (
        <Card className="bg-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">Carregando tarefas...</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              {filter === 'pending'
                ? 'Nenhuma tarefa pendente. Tudo em dia!'
                : 'Nenhuma tarefa encontrada.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <Card
              key={task.id}
              className={`bg-card ${task.is_completed ? 'opacity-50' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Priority dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
                    task.priority <= 1 ? 'bg-destructive' :
                    task.priority <= 2 ? 'bg-warning' :
                    'bg-muted-foreground/40'
                  }`} />

                  {/* Task info — bigger gap between title and description */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${
                        task.is_completed ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {task.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                          categoryConfig[task.category]?.color ?? ''
                        }`}
                      >
                        {categoryConfig[task.category]?.label ?? task.category}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Priority badge + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono-nums ${
                        task.priority <= 1 ? 'text-destructive border-destructive/30' :
                        task.priority <= 2 ? 'text-warning border-warning/30' :
                        'text-muted-foreground'
                      }`}
                    >
                      P{task.priority}
                    </Badge>
                    {!task.is_completed && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeTask.mutate(task.id)}
                          disabled={completeTask.isPending}
                          className="text-xs h-7"
                        >
                          Concluir
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteTask.mutate(task.id)}
                          disabled={deleteTask.isPending}
                          className="h-7 w-7 text-destructive/60 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {task.is_completed && (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
