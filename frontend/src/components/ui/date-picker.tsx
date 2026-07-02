import { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const WEEKDAYS = ['Do','Se','Te','Qa','Qi','Se','Sa']

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(value ? new Date(value + 'T12:00:00') : new Date())

  const selected = value ? new Date(value + 'T12:00:00') : null
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const formatDate = (d: number, m: number, y: number) => {
    const dd = String(d).padStart(2, '0')
    const mm = String(m + 1).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  const isSelected = (d: number) =>
    selected &&
    selected.getFullYear() === year &&
    selected.getMonth() === month &&
    selected.getDate() === d

  const isToday = (d: number) => {
    const now = new Date()
    return now.getFullYear() === year && now.getMonth() === month && now.getDate() === d
  }

  const handlePrev = () => setViewDate(new Date(year, month - 1, 1))
  const handleNext = () => setViewDate(new Date(year, month + 1, 1))

  const displayValue = selected
    ? selected.toLocaleDateString('pt-BR')
    : ''

  return (
    <div className="relative">
      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        readOnly
        value={displayValue}
        onClick={() => setOpen(!open)}
        placeholder="Selecionar data..."
        className="w-full h-9 rounded-md border border-border bg-background pl-9 pr-3 text-sm font-mono-nums focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
      />

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Calendar */}
          <div className="absolute z-50 mt-1.5 rounded-xl border border-border bg-popover shadow-xl p-3 w-[280px] right-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handlePrev}
                className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">{MONTHS[month]}</span>
                <span className="text-sm text-muted-foreground">{year}</span>
              </div>
              <button
                onClick={handleNext}
                className="h-7 w-7 rounded-md hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0">
              {days.map((d, i) =>
                d === null ? (
                  <div key={`empty-${i}`} />
                ) : (
                  <button
                    key={d}
                    onClick={() => {
                      onChange(formatDate(d, month, year))
                      setOpen(false)
                    }}
                    className={`h-8 w-full text-xs font-medium rounded-md transition-colors ${
                      isSelected(d)
                        ? 'bg-primary text-primary-foreground font-bold'
                        : isToday(d)
                        ? 'bg-secondary text-foreground font-semibold'
                        : 'hover:bg-secondary/60 text-foreground'
                    }`}
                  >
                    {d}
                  </button>
                )
              )}
            </div>

            {/* Today button */}
            <div className="mt-2 pt-2 border-t border-border flex justify-center">
              <button
                onClick={() => {
                  const now = new Date()
                  onChange(formatDate(now.getDate(), now.getMonth(), now.getFullYear()))
                  setViewDate(now)
                  setOpen(false)
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Hoje
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
