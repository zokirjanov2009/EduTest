import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import StatCard from '../../components/StatCard'
import GradeBadge from '../../components/GradeBadge'
import { cn, formatDate, statusColors, statusLabels, fileTypeIcons } from '../../lib/utils'
import api from '../../lib/api'
import { FileText, CheckCircle, Clock, TrendingUp, Upload, ArrowRight } from 'lucide-react'
import { PageLoader } from '../../components/Spinner'

export default function StudentDashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/student/dashboard')
      .then(({ data }) => setStats(data.data.stats))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout title="Mening Panelim"><PageLoader /></DashboardLayout>

  return (
    <DashboardLayout title="Mening Panelim">
      <div className="space-y-5">
        {/* Stats grid - 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Jami Ishlar"   value={stats?.totalSubmissions ?? 0}  icon={FileText}    iconColor="text-slate-600"   iconBg="bg-slate-100" />
          <StatCard title="Baholangan"    value={stats?.gradedSubmissions ?? 0} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          <StatCard title="Kutilmoqda"    value={stats?.pendingSubmissions ?? 0} icon={Clock}      iconColor="text-yellow-600"  iconBg="bg-yellow-50" />
          <StatCard title="O'rtacha"      value={stats?.avgGrade ? `${stats.avgGrade}/5` : '—'}
            subtitle={stats?.avgPercentage ? `${stats.avgPercentage}%` : undefined}
            icon={TrendingUp} iconColor="text-primary-600" iconBg="bg-primary-50" />
        </div>

        {/* Upload CTA */}
        <Link to="/student/upload"
          className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100 transition-all group touch-manipulation">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
            <Upload className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm sm:text-base">Yangi Mustaqil Ish Yuklash</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">PDF, Word yoki Excel — AI test yaratadi</p>
          </div>
          <ArrowRight className="text-primary-400 group-hover:translate-x-1 transition-transform flex-shrink-0" size={20} />
        </Link>

        {/* Recent submissions */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Oxirgi Ishlarim</h2>
            <Link to="/student/submissions" className="text-sm text-primary-600 hover:underline font-medium">
              Barchasi →
            </Link>
          </div>
          {!stats?.recentSubmissions?.length ? (
            <div className="text-center py-10 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Hali hech qanday ish yuklanmagan</p>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.recentSubmissions.map((s) => (
                <Link key={s.id}
                  to={s.status === 'GRADED' ? `/student/submissions/${s.id}` :
                      s.status === 'TESTED'  ? `/student/test/${s.tests?.[0]?.id || ''}` : '#'}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors group touch-manipulation">
                  <span className="text-xl flex-shrink-0">{fileTypeIcons[s.fileType] || '📄'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate text-sm">{s.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(s.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.gradeReport
                      ? <GradeBadge grade={s.gradeReport.gradeNumber} />
                      : <span className={cn('badge text-xs', statusColors[s.status])}>{statusLabels[s.status]}</span>
                    }
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
