import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string | number
  label: string
  sublabel?: string
}

interface CustomSelectProps {
  value: string | number
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  onChange: (value: string | number) => void
}

export function CustomSelect({ value, options, placeholder = 'Selecionar...', disabled, onChange }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full h-9 rounded-md border border-border bg-background pl-3 pr-2 text-sm text-left focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? (
            <>
              {selected.label}
              {selected.sublabel && <span className="text-muted-foreground ml-1.5 text-xs">{selected.sublabel}</span>}
            </>
          ) : placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-md border border-border bg-popover shadow-xl max-h-60 overflow-y-auto">
          <button
            type="button"
            onClick={() => { setOpen(false) }}
            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {placeholder}
          </button>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                opt.value === value
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-foreground hover:bg-secondary/60'
              }`}
            >
              {opt.label}
              {opt.sublabel && (
                <span className="text-muted-foreground ml-1">{opt.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
