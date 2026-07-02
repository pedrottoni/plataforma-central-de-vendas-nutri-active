import { type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  description?: string
  valueColor?: string
  trend?: { value: number; positive: boolean }
}

export function KpiCard({ icon: Icon, label, value, description, valueColor, trend }: KpiCardProps) {
  return (
    <Card className="bg-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 opacity-60" />
            {label}
          </span>
          {trend && (
            <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded font-mono-nums ${trend.positive ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive'}`}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        <div className={`text-2xl font-bold font-mono-nums tracking-tight ${valueColor || ''}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
