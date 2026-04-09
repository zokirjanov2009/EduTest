import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import ConfirmDialog from '../../components/ConfirmDialog'
import { cn, formatDate } from '../../lib/utils'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { Search, GraduationCap, ToggleLeft, ToggleRight, Trash2, Loader2, BookOpen } from 'lucide-react'

export default function AdminStudents() {
  const [students, setStudents]     = useState([])
  const [teachers, setTeachers]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterTeacher, setFilterTeacher] = useState('')
  const [page, setPage]             = useState(1)
  const [pagination, setPagination] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [toggleConfirm, setToggleConfirm] = useState(null)

  const fetchStudents = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, search })
    if (filterTeacher) params.append('teacherId', filterTeacher)
    api.get(`/admin/students?${params}`)
      .then(({ data }) => { setStudents(data.data.students); setPagination(data.pagination) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    api.get('/admin/teachers?limit=100').then(({ data }) => setTeachers(data.data.teachers))
  }, [])
  useEffect(() => { fetchStudents() }, [page, search, filterTeacher])

  const handleToggle = async () => {
    try {
      const { data } = await api.patch(`/admin/users/${toggleConfirm.id}/toggle`)
      toast.success(data.message)
      fetchStudents()
    } catch { toast.error('Xatolik') }
    finally { setToggleConfirm(null) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/users/${deleteConfirm.id}`)
      toast.success("O'chirildi!")
      fetchStudents()
    } catch { toast.error('Xatolik') }
    finally { setDeleteConfirm(null) }
  }

  return (
    <DashboardLayout title="Talabalar Boshqaruvi">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Ism yoki email..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input pl-10" />
          </div>
          <select value={filterTeacher} onChange={(e) => { setFilterTeacher(e.target.value); setPage(1) }}
            className="input sm:w-56">
            <option value="">Barcha o'qituvchilar</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.group || 'Guruhsiz'})</option>
            ))}
          </select>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Talaba", "Guruh", "O'qituvchi", "Ishlar", "Holat", "Sana", "Amallar"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>Talabalar topilmadi</p>
                  </td></tr>
                ) : students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 font-bold text-sm">{s.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge bg-indigo-50 text-indigo-700 border-indigo-200">
                        <BookOpen size={11} className="mr-1" />{s.group || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm">{s.teacher?.name ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="badge bg-slate-100 text-slate-700 border-slate-200">{s._count?.submissions ?? 0} ta</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('badge', s.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                        {s.isActive ? 'Faol' : 'Bloklangan'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-sm">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        <button onClick={() => setToggleConfirm({ id: s.id, name: s.name, isActive: s.isActive })}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                          {s.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} className="text-red-400" />}
                        </button>
                        <button onClick={() => setDeleteConfirm({ id: s.id, name: s.name })}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-sm text-slate-500">Jami: {pagination.total} ta</span>
              <div className="flex gap-1.5">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                      p === page ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 text-slate-600')}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title={`"${deleteConfirm?.name}" ni o'chirish`} message="Bu amalni qaytarib bo'lmaydi!" danger />
      <ConfirmDialog isOpen={!!toggleConfirm} onClose={() => setToggleConfirm(null)} onConfirm={handleToggle}
        title={toggleConfirm?.isActive ? 'Bloklash' : 'Faollashtirish'}
        message={`"${toggleConfirm?.name}" ni ${toggleConfirm?.isActive ? 'bloklamoqchimisiz' : 'faollashtirmoqchimisiz'}?`} />
    </DashboardLayout>
  )
}