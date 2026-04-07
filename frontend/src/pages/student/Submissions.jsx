import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import GradeBadge from '../../components/GradeBadge'
import { cn, formatDate, statusColors, statusLabels, fileTypeIcons } from '../../lib/utils'
import api from '../../lib/api'
import { FileText, Plus, ArrowRight, Loader2, Brain } from 'lucide-react'

export default function StudentSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)
  const [pagination, setPagination]   = useState({})

  useEffect(() => {
    setLoading(true)
    api.get(`/student/submissions?page=${page}`)
      .then(({ data }) => { setSubmissions(data.data.submissions); setPagination(data.pagination) })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <DashboardLayout title="Mening Ishlarim">
      <div className="space-y-4 pb-6">
        <div className="flex justify-end">
          <Link to="/student/upload" className="btn-primary">
            <Plus size={16} /> Yangi Ish
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="card p-10 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium mb-4">Hali hech qanday ish yuklanmagan</p>
            <Link to="/student/upload" className="btn-primary">
              <Plus size={16} /> Birinchi Ishni Yuklash
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => {
              const hasTest  = s.tests?.length > 0
              const isGraded = s.status === 'GRADED'
              const isTested = s.status === 'TESTED'
              return (
                <div key={s.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5 flex-shrink-0">{fileTypeIcons[s.fileType] || '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{s.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(s.createdAt)}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={cn('badge text-xs', statusColors[s.status])}>{statusLabels[s.status]}</span>
                        {isGraded && s.gradeReport && (
                          <>
                            <GradeBadge grade={s.gradeReport.gradeNumber} />
                            <span className="text-sm font-bold text-slate-700">{s.gradeReport.percentage?.toFixed(0)}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  {(isTested || isGraded) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                      {isTested && hasTest && (
                        <Link to={`/student/test/${s.tests[0].id}`} className="btn-primary btn-sm flex-1 justify-center py-2">
                          <Brain size={14} /> Test Boshlash
                        </Link>
                      )}
                      {isGraded && (
                        <Link to={`/student/submissions/${s.id}`} className="btn-secondary btn-sm flex-1 justify-center py-2">
                          Natijani Ko'rish <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={cn('w-9 h-9 rounded-xl text-sm font-medium transition-colors touch-manipulation',
                  p === page ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600')}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
