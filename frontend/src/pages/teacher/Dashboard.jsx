import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import StatCard from '../../components/StatCard'
import GradeBadge from '../../components/GradeBadge'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/utils'
import api from '../../lib/api'
import { GraduationCap, FileText, CheckCircle, Clock, BarChart2, BookOpen, Users } from 'lucide-react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { PageLoader } from '../../components/Spinner'

const COLORS = ['#ef4444', '#eab308', '#3b82f6', '#10b981']

export default function TeacherDashboard() {
  const { user }              = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/teacher/dashboard')
      .then(({ data }) => setStats(data.data.stats))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout title="O'qituvchi Paneli"><PageLoader /></DashboardLayout>

  const pieData = [
    { name: '2', value: stats.gradeDistribution?.[2] || 0 },
    { name: '3', value: stats.gradeDistribution?.[3] || 0 },
    { name: '4', value: stats.gradeDistribution?.[4] || 0 },
    { name: '5', value: stats.gradeDistribution?.[5] || 0 },
  ].filter(d => d.value > 0)

  const myGroups = stats.groups || user?.groups || []

  return (
    <DashboardLayout title="O'qituvchi Paneli">
      <div className="space-y-5">
        {/* Fan va guruhlar info */}
        <div className="card p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700">
          <div className="flex flex-wrap items-start gap-4">
            {stats.subject && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Fan</p>
                <div className="flex items-center gap-1.5">
                  <BookOpen size={16} className="text-amber-400" />
                  <span className="text-white font-bold">{stats.subject}</span>
                </div>
              </div>
            )}
            {myGroups.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Boshqaradigan guruhlar</p>
                <div className="flex flex-wrap gap-1.5">
                  {myGroups.map(g => (
                    <span key={g} className="badge bg-indigo-500/20 text-indigo-300 border-indigo-500/30">{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Talabalarim"  value={stats.totalStudents}      icon={GraduationCap} iconColor="text-blue-600"    iconBg="bg-blue-50" />
          <StatCard title="Jami Ishlar"  value={stats.totalSubmissions}   icon={FileText}      iconColor="text-slate-600"   iconBg="bg-slate-100" />
          <StatCard title="Baholangan"   value={stats.gradedSubmissions}  icon={CheckCircle}   iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          <StatCard title="Kutilmoqda"   value={stats.pendingSubmissions} icon={Clock}         iconColor="text-yellow-600"  iconBg="bg-yellow-50" />
        </div>

        {/* Guruh statistikasi */}
        {stats.groupStats?.length > 0 && (
          <div className="card p-4">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users size={16} className="text-indigo-500" /> Guruhlar bo'yicha
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {stats.groupStats.map(g => (
                <div key={g.group} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                  <p className="font-bold text-indigo-800">{g.group}</p>
                  <p className="text-xs text-indigo-600 mt-0.5">{g.count} talaba</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-primary-500" /> Baholar Taqsimoti
            </h2>
            {!pieData.length
              ? <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Hali baholar yo'q</div>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                      formatter={(v, n) => [v, `${n} baho`]} />
                    <Legend iconType="circle" iconSize={9} formatter={(v) => `${v} baho`} />
                  </PieChart>
                </ResponsiveContainer>
              )
            }
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-primary-500" /> Oxirgi Baholar
            </h2>
            <div className="space-y-3">
              {!stats.recentGrades?.length
                ? <p className="text-slate-400 text-sm text-center py-6">Hali baholar yo'q</p>
                : stats.recentGrades.map((g, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{g.student?.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {g.student?.group && <span className="text-indigo-500 mr-1">[{g.student.group}]</span>}
                        {g.submission?.title}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <GradeBadge grade={g.gradeNumber} />
                      <p className="text-xs text-slate-400 mt-0.5">{g.percentage?.toFixed(0)}%</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
