import { cn } from '../lib/utils'

const config = {
  5: { label: "5 — A'lo",        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  4: { label: '4 — Yaxshi',      cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  3: { label: '3 — Qoniqarli',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  2: { label: '2 — Qoniqarsiz',  cls: 'bg-red-50 text-red-700 border-red-200' },
}

export default function GradeBadge({ grade, large }) {
  const c = config[grade] ?? config[2]
  return (
    <span className={cn('badge border font-bold', c.cls, large && 'text-sm px-3 py-1.5')}>
      {c.label}
    </span>
  )
}
