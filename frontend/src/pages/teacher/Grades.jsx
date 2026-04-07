import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import GradeBadge from '../../components/GradeBadge'
import { cn, formatDate, fileTypeIcons } from '../../lib/utils'
import api from '../../lib/api'
import { Search, ClipboardList, Loader2, Eye, CheckCircle, XCircle, Info, BookOpen } from 'lucide-react'

export default function TeacherGrades() {
  const [grades, setGrades]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [pagination, setPagination] = useState({})
  const [selected, setSelected]   = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetch = () => {
    setLoading(true)
    api.get(`/teacher/grades?page=${page}`)
      .then(({ data }) => { setGrades(data.data.grades); setPagination(data.pagination) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [page])

  const openDetail = async (id) => {
    setDetailLoading(true)
    try { const { data } = await api.get(`/teacher/grades/${id}`); setSelected(data.data.grade) }
    finally { setDetailLoading(false) }
  }

  const filtered = search
    ? grades.filter(g =>
        g.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
        g.submission?.title?.toLowerCase().includes(search.toLowerCase()))
    : grades

  return (
    <DashboardLayout title="Baholar Jadvali">
      <div className="space-y-4 pb-6">
        {/* Toolbar */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Talaba yoki ish nomi..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2.5" />
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex-shrink-0">
            <Info size={13} className="text-amber-600" />
            <span className="text-xs text-amber-700 font-medium hidden sm:inline">Faqat ko'rish</span>
          </div>
        </div>

        {/* Mobile: cards | Desktop: table */}
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Talaba', 'Guruh', 'Ish', 'Fayl', 'Ball', 'Baho', 'Sana', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="py-14 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-14 text-center text-slate-400">
                    <ClipboardList className="w-7 h-7 mx-auto mb-2 opacity-30" /><p className="text-sm">Hali baholar yo'q</p>
                  </td></tr>
                ) : filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 font-bold text-xs">{g.student?.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-slate-900 text-sm">{g.student?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                        {g.student?.group || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[140px]">
                      <p className="text-xs font-medium text-slate-800 truncate">{g.submission?.title}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-base">{fileTypeIcons[g.submission?.fileType] || '📄'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 text-sm">{g.testResult?.score}/5</span>
                      <span className="text-slate-400 text-xs ml-1">({g.percentage?.toFixed(0)}%)</span>
                    </td>
                    <td className="px-4 py-3.5"><GradeBadge grade={g.gradeNumber} /></td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{formatDate(g.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => openDetail(g.id)}
                        className="p-1.5 rounded-lg hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition-colors touch-manipulation">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-14 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-14 text-center text-slate-400">
                <ClipboardList className="w-7 h-7 mx-auto mb-2 opacity-30" /><p className="text-sm">Hali baholar yo'q</p>
              </div>
            ) : filtered.map((g) => (
              <div key={g.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-700 font-bold text-xs">{g.student?.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <p className="font-semibold text-slate-900 text-sm">{g.student?.name}</p>
                      {g.student?.group && (
                        <span className="badge bg-indigo-50 text-indigo-600 border-indigo-200 text-xs">
                          {g.student.group}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-2 truncate">{g.submission?.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <GradeBadge grade={g.gradeNumber} />
                      <span className="text-sm font-bold text-slate-700">{g.testResult?.score}/5</span>
                      <span className="text-xs text-slate-400">({g.percentage?.toFixed(0)}%)</span>
                      <span className="text-xs text-slate-400">{fileTypeIcons[g.submission?.fileType]}</span>
                    </div>
                  </div>
                  <button onClick={() => openDetail(g.id)}
                    className="btn-icon bg-primary-50 text-primary-600 hover:bg-primary-100 flex-shrink-0 touch-manipulation">
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">Jami: {pagination.total}</span>
              <div className="flex gap-1.5">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-colors touch-manipulation',
                      p === page ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 text-slate-600')}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grade Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Baho Tafsiloti" size="lg">
        {detailLoading
          ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          : selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Talaba</p>
                  <p className="font-bold text-slate-900 text-sm">{selected.student?.name}</p>
                  <p className="text-xs text-slate-500">{selected.student?.email}</p>
                  {selected.student?.group && (
                    <span className="badge bg-indigo-50 text-indigo-700 border-indigo-200 text-xs mt-1.5">
                      <BookOpen size={9} className="mr-0.5" />{selected.student.group}
                    </span>
                  )}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Mustaqil Ish</p>
                  <p className="font-bold text-slate-900 text-sm">{selected.submission?.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{selected.submission?.fileName}</p>
                </div>
              </div>

              <div className="flex items-center gap-5 bg-slate-50 rounded-xl p-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-900">{selected.testResult?.score}/5</p>
                  <p className="text-xs text-slate-500">Ball</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-900">{selected.percentage?.toFixed(0)}%</p>
                  <p className="text-xs text-slate-500">Foiz</p>
                </div>
                <div className="flex-1 flex justify-end">
                  <GradeBadge grade={selected.gradeNumber} large />
                </div>
              </div>

              {selected.aiSummary && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-primary-700 mb-1">🤖 AI Fikr-Mulohaza</p>
                  <p className="text-sm text-slate-700">{selected.aiSummary}</p>
                </div>
              )}

              {selected.testResult?.test?.questions && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Test Natijalari:</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selected.testResult.test.questions.map((q, i) => {
                      const ans = selected.testResult.answers?.[i]?.selectedAnswer
                      const ok  = ans === q.correctAnswer
                      return (
                        <div key={i} className={cn('rounded-xl p-3 border text-xs', ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')}>
                          <div className="flex items-start gap-2">
                            {ok ? <CheckCircle size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                : <XCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />}
                            <div>
                              <p className="font-medium text-slate-800">{i + 1}. {q.question}</p>
                              <p className="mt-1">
                                <span className="text-slate-500">Talaba: </span>
                                <span className={ok ? 'text-emerald-700 font-semibold' : 'text-red-600 font-semibold'}>{ans || '—'}</span>
                                {!ok && <span className="text-slate-500 ml-2">| To'g'ri: <span className="text-emerald-700 font-semibold">{q.correctAnswer}</span></span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        }
      </Modal>
    </DashboardLayout>
  )
}
