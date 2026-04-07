import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import GradeBadge from '../../components/GradeBadge'
import { cn, formatDate, statusColors, statusLabels, fileTypeIcons } from '../../lib/utils'
import api from '../../lib/api'
import { FileText, ChevronRight, Upload, Loader2, Brain } from 'lucide-react'

export default function StudentHistory() {
  const navigate    = useNavigate()
  const [subs, setSubs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get(`/student/submissions?page=${page}&limit=15`)
      .then(({ data }) => { setSubs(data.data.submissions); setTotalPages(data.pagination.totalPages) })
      .finally(() => setLoading(false))
  }, [page])

  const handleClick = (s) => {
    if (s.status === 'TESTED' && s.tests?.[0]?.id) navigate(`/student/test/${s.tests[0].id}`)
    else if (s.status === 'GRADED') navigate(`/student/submissions/${s.id}`)
  }

  return (
    <DashboardLayout title="Tarix">
      <div className="space-y-4 pb-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-xs sm:text-sm">Barcha yuklangan mustaqil ishlaringiz</p>
          <Link to="/student/upload" className="btn-primary btn-sm">
            <Upload className="w-3.5 h-3.5" /> Yangi
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : subs.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="font-bold text-slate-600 mb-2 text-sm">Hali ishlar yo'q</h3>
            <Link to="/student/upload" className="btn-primary inline-flex mt-2 btn-sm">
              <Upload className="w-3.5 h-3.5" /> Ish Yuklash
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {subs.map((s) => (
              <div key={s.id}
                onClick={() => handleClick(s)}
                className={cn('flex items-center gap-3 px-4 py-4 border-b border-slate-50 last:border-0 transition-colors group',
                  (s.status === 'TESTED' || s.status === 'GRADED') ? 'cursor-pointer active:bg-slate-100' : '',
                  'hover:bg-slate-50')}>
                <span className="text-2xl flex-shrink-0">{fileTypeIcons[s.fileType] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate text-sm">{s.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(s.createdAt)}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {s.gradeReport
                      ? <GradeBadge grade={s.gradeReport.gradeNumber} />
                      : <span className={cn('badge text-xs', statusColors[s.status])}>{statusLabels[s.status]}</span>
                    }
                    {s.status === 'TESTED' && (
                      <span className="flex items-center gap-1 text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-0.5 rounded-full">
                        <Brain className="w-3 h-3" /> Test topshir
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={cn('w-9 h-9 rounded-xl text-sm font-semibold transition-all touch-manipulation',
                  p === page ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600')}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
