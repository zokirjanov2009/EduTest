import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import GradeBadge from '../../components/GradeBadge'
import { cn, formatDate } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import {
  Plus, Search, GraduationCap, ToggleLeft, ToggleRight,
  Loader2, Copy, Eye, EyeOff, Trash2, BookOpen,
} from 'lucide-react'

export default function TeacherStudents() {
  const { user } = useAuth()
  const [students, setStudents]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [page, setPage]             = useState(1)
  const [pagination, setPagination] = useState({})
  const [teacherGroups, setTeacherGroups] = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [successInfo, setSuccessInfo] = useState(null)
  const [form, setForm]             = useState({ name: '', email: '', password: '', group: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showPwd, setShowPwd]       = useState(false)

  const fetchStudents = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, search })
    if (filterGroup) params.append('group', filterGroup)
    api.get(`/teacher/students?${params}`)
      .then(({ data }) => {
        setStudents(data.data.students)
        setPagination(data.pagination)
        // Backend "teacherGroups" qaytaradi
        if (data.data.teacherGroups?.length) {
          setTeacherGroups(data.data.teacherGroups)
        }
      })
      .catch(() => toast.error("Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStudents() }, [page, search, filterGroup])

  // Teacher guruhlarini user dan olamiz (agar fetch bo'lmagan bo'lsa)
  const myGroups = teacherGroups.length > 0 ? teacherGroups : (user?.groups || [])

  // Birinchi guruhni default qilish
  useEffect(() => {
    if (myGroups.length > 0 && !form.group) {
      setForm(f => ({ ...f, group: myGroups[0] }))
    }
  }, [myGroups.length])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.group) { toast.error('Guruh tanlang!'); return }
    setSubmitting(true)
    try {
      await api.post('/teacher/students', form)
      toast.success('Talaba yaratildi!')
      setSuccessInfo({ ...form })
      setCreateModal(false)
      setForm({ name: '', email: '', password: '', group: myGroups[0] || '' })
      fetchStudents()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Xatolik')
    } finally { setSubmitting(false) }
  }

  const handleToggle = async (id) => {
    try {
      const { data } = await api.patch(`/teacher/students/${id}/toggle`)
      toast.success(data.message)
      fetchStudents()
    } catch { toast.error('Xatolik') }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ni o'chirasizmi?`)) return
    try {
      await api.delete(`/teacher/students/${id}`)
      toast.success("O'chirildi!")
      fetchStudents()
    } catch { toast.error('Xatolik') }
  }

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Nusxalandi!')
  }

  return (
    <DashboardLayout title="Mening Talabalarim">
      <div className="space-y-4 pb-6">

        {/* Teacher info */}
        {(user?.subject || myGroups.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
            {user?.subject && (
              <span className="badge bg-violet-50 text-violet-700 border-violet-200">
                📚 {user.subject}
              </span>
            )}
            {myGroups.map(g => (
              <span key={g} className="badge bg-indigo-100 text-indigo-700 border-indigo-300 font-bold">{g}</span>
            ))}
          </div>
        )}

        {/* Success banner */}
        {successInfo && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-bold text-emerald-800 mb-2 text-sm">✅ {successInfo.name} yaratildi!</p>
                <div className="space-y-2">
                  {[['Guruh', successInfo.group], ['Email', successInfo.email], ['Parol', successInfo.password]].map(([lbl, val]) => (
                    <div key={lbl} className="flex items-center gap-2">
                      <span className="text-xs text-emerald-700 font-medium w-14">{lbl}:</span>
                      <code className="bg-white px-2.5 py-1 rounded-lg text-xs text-emerald-900 border border-emerald-200 flex-1 min-w-0 truncate">{val}</code>
                      <button onClick={() => copyText(val)} className="p-1.5 rounded-lg hover:bg-emerald-100 flex-shrink-0">
                        <Copy size={13} className="text-emerald-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setSuccessInfo(null)} className="text-emerald-400 text-xl leading-none">×</button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Ism yoki email..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="input pl-9 py-2.5" />
            </div>
            {myGroups.length > 1 && (
              <select value={filterGroup}
                onChange={(e) => { setFilterGroup(e.target.value); setPage(1) }}
                className="input py-2.5 w-auto flex-shrink-0">
                <option value="">Barchasi</option>
                {myGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            )}
          </div>
          <button onClick={() => setCreateModal(true)} className="btn-primary flex-shrink-0">
            <Plus size={16} /> <span className="hidden xs:inline">Talaba</span>
          </button>
        </div>

        {/* Desktop table */}
        <div className="card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Talaba', 'Guruh', 'Ishlar', 'Oxirgi Baho', 'Holat', 'Sana', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="py-14 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={7} className="py-14 text-center text-slate-400 text-sm">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />Hali talabalar yo'q
                  </td></tr>
                ) : students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 font-bold text-xs">{s.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                        {s.group || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge bg-slate-100 text-slate-700 border-slate-200 text-xs">
                        {s._count?.submissions ?? 0} ta
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {s.gradeReports?.[0]
                        ? <GradeBadge grade={s.gradeReports[0].gradeNumber} />
                        : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('badge text-xs', s.isActive
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200')}>
                        {s.isActive ? 'Faol' : 'Blok'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-0.5">
                        <button onClick={() => handleToggle(s.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100">
                          {s.isActive
                            ? <ToggleRight size={17} className="text-green-500" />
                            : <ToggleLeft  size={17} className="text-red-400" />}
                        </button>
                        <button onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-14 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              </div>
            ) : students.length === 0 ? (
              <div className="py-14 text-center text-slate-400 text-sm">Hali talabalar yo'q</div>
            ) : students.map((s) => (
              <div key={s.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-xs">{s.name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                        <p className="text-xs text-slate-400 truncate">{s.email}</p>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button onClick={() => handleToggle(s.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100">
                          {s.isActive
                            ? <ToggleRight size={17} className="text-green-500" />
                            : <ToggleLeft  size={17} className="text-red-400" />}
                        </button>
                        <button onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.group && (
                        <span className="badge bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">{s.group}</span>
                      )}
                      <span className="badge bg-slate-100 text-slate-600 border-slate-200 text-xs">{s._count?.submissions ?? 0} ish</span>
                      {s.gradeReports?.[0] && <GradeBadge grade={s.gradeReports[0].gradeNumber} />}
                      <span className={cn('badge text-xs', s.isActive
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200')}>
                        {s.isActive ? 'Faol' : 'Blok'}
                      </span>
                    </div>
                  </div>
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
                    className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                      p === page ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 text-slate-600')}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Yangi Talaba Qo'shish">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Ism Familiya <span className="text-red-400">*</span></label>
            <input type="text" placeholder="Karimov Jasur" required minLength={2} className="input"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Guruh <span className="text-red-400">*</span></label>
            {myGroups.length > 0 ? (
              <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}
                className="input" required>
                <option value="">Guruh tanlang</option>
                {myGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
              <input type="text" placeholder="Guruh nomi" required className="input"
                value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
            )}
          </div>
          <div>
            <label className="label">Email <span className="text-red-400">*</span></label>
            <input type="email" placeholder="student@email.com" required className="input"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Parol <span className="text-red-400">*</span></label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} placeholder="Kamida 6 belgi" required minLength={6}
                className="input pr-10" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Bekor</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting && <Loader2 size={14} className="animate-spin" />} Yaratish
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
