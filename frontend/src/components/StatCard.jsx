import { cn } from '../lib/utils'

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-primary-600', iconBg = 'bg-primary-50' }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{value ?? 0}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', iconColor)} />
        </div>
      </div>
    </div>
  )
}
