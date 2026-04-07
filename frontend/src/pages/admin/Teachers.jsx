import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import Modal from '../../components/Modal'
import { cn, formatDate } from '../../lib/utils'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { Plus, Search, Users, ToggleLeft, ToggleRight, KeyRound, Trash2, Loader2, BookOpen, X } from 'lucide-react'

// Guruhlarni tag sifatida kiritish komponenti
function GroupsInput({ value, onChange }) {
  const [input, setInput] = useState('')

  const addGroup = () => {
    const g = input.trim()
    if (!g) return
    if (value.includes(g)) { toast.error(`"${g}" guruh allaqachon qo'shilgan`); return }
    onChange([...value, g])
    setInput('')
  }

  const removeGroup = (g) => onChange(value.filter(x => x !== g))

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Guruh nomi (1-A, MT-22, ...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addGroup() } }}
          className="input flex-1"
        />
        <button type="button" onClick={addGroup} className="btn-primary btn-sm px-4">
          +
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(g => (
            <span key={g} className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-medium">
              {g}
              <button type="button" onClick={() => removeGroup(g)} className="hover:text-red-500 touch-manipulation">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      {value.length === 0 && (
        <p className="text-xs text-slate-400">Guruh nomini yozing va + tugmasini bosing</p>
      )}
    </div>
  )
}

export default function AdminTeachers() {
  const [teachers, setTeachers]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [pagination, setPagination] = useState({})
  const [createModal, setCreateModal] = useState(false)
  const [resetModal, setResetModal]   = useState({ open: false, userId: '', name: '' })
  const [form, setForm] = useState({ name: '', email: '', password: '', subject: '', groups: [] })
  const [resetPwd, setResetPwd]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetch = () => {
    setLoading(true)
    api.get(`/admin/teachers?page=${page}&search=${search}`)
      .then(({ data }) => { setTeachers(data.data.teachers); setPagination(data.pagination) })
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [page, search])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (form.groups.length === 0) { toast.error("Kamida 1 ta guruh qo'shing!"); return }
    setSubmitting(true)
    try {
      await api.post('/admin/teachers', form)
      toast.success("O'qituvchi yaratildi!")
      setCreateModal(false)
      setForm({ name: '', email: '', password: '', subject: '', groups: [] })
      fetch()
    } catch (err) { toast.error(err?.response?.data?.message || 'Xatolik') }
    finally { setSubmitting(false) }
  }

  const handleToggle = async (id) => {
    try { const { data } = await api.patch(`/admin/users/${id}/toggle`); toast.success(data.message); fetch() }
    catch { toast.error('Xatolik') }
  }

  const handleResetPwd = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try {
      await api.patch(`/admin/users/${resetModal.userId}/reset-password`, { newPassword: resetPwd })
      toast.success('Parol yangilandi!')
      setResetModal({ open: false, userId: '', name: '' }); setResetPwd('')
    } catch (err) { toast.error(err?.response?.data?.message || 'Xatolik') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ni o'chirasizmi?`)) return
    try { await api.delete(`/admin/users/${id}`); toast.success("O'chirildi!"); fetch() }
    catch { toast.error('Xatolik') }
  }

  return (
    <DashboardLayout title="O'qituvchilar Boshqaruvi">
      <div className="space-y-4 pb-6">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Ism, email yoki fan..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input pl-9 py-2.5" />
          </div>
          <button onClick={() => setCreateModal(true)} className="btn-primary">
            <Plus size={16} /> <span className="hidden sm:inline">O'qituvchi Qo'shish</span>
          </button>
        </div>

        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Ism', 'Fan', 'Guruhlar', 'Talabalar', 'Holat', 'Sana', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="py-14 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></td></tr>
                ) : teachers.length === 0 ? (
                  <tr><td colSpan={7} className="py-14 text-center text-slate-400">
                    <Users className="w-7 h-7 mx-auto mb-2 opacity-30" /><p className="text-sm">Topilmadi</p>
                  </td></tr>
                ) : teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-700 font-bold text-xs">{t.name[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge bg-amber-50 text-amber-700 border-amber-200 text-xs">
                        📚 {t.subject || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(t.groups || []).map(g => (
                          <span key={g} className="badge bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">{g}</span>
                        ))}
                        {(!t.groups || !t.groups.length) && <span className="text-slate-400 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="badge bg-blue-50 text-blue-700 border-blue-200 text-xs">{t._count?.students ?? 0} ta</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('badge text-xs', t.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                        {t.isActive ? 'Faol' : 'Blok'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => handleToggle(t.id)} className="p-1.5 rounded-lg hover:bg-slate-100 touch-manipulation">
                          {t.isActive ? <ToggleRight size={17} className="text-green-500" /> : <ToggleLeft size={17} className="text-red-400" />}
                        </button>
                        <button onClick={() => setResetModal({ open: true, userId: t.id, name: t.name })}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 touch-manipulation">
                          <KeyRound size={14} />
                        </button>
                        <button onClick={() => handleDelete(t.id, t.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 touch-manipulation">
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
              <div className="py-14 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" /></div>
            ) : teachers.length === 0 ? (
              <div className="py-14 text-center text-slate-400 text-sm">O'qituvchilar topilmadi</div>
            ) : teachers.map((t) => (
              <div key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-700 font-bold">{t.name[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400 truncate">{t.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {t.subject && (
                          <span className="badge bg-amber-50 text-amber-700 border-amber-200 text-xs">📚 {t.subject}</span>
                        )}
                        {(t.groups || []).map(g => (
                          <span key={g} className="badge bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">{g}</span>
                        ))}
                        <span className="badge bg-blue-50 text-blue-700 border-blue-200 text-xs">{t._count?.students ?? 0} talaba</span>
                        <span className={cn('badge text-xs', t.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                          {t.isActive ? 'Faol' : 'Blok'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button onClick={() => handleToggle(t.id)} className="btn-icon hover:bg-slate-100 touch-manipulation">
                      {t.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} className="text-red-400" />}
                    </button>
                    <button onClick={() => setResetModal({ open: true, userId: t.id, name: t.name })}
                      className="btn-icon hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 touch-manipulation">
                      <KeyRound size={15} />
                    </button>
                    <button onClick={() => handleDelete(t.id, t.name)}
                      className="btn-icon hover:bg-red-50 text-slate-400 hover:text-red-600 touch-manipulation">
                      <Trash2 size={15} />
                    </button>
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
                    className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-colors touch-manipulation',
                      p === page ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 text-slate-600')}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Yangi O'qituvchi Qo'shish">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Ism Familiya <span className="text-red-400">*</span></label>
            <input type="text" placeholder="Abdullayev Jasur" required minLength={2} className="input"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Fan Nomi <span className="text-red-400">*</span></label>
            <input type="text" placeholder="Matematika, Fizika, Ingliz tili..." required className="input"
              value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="label">Boshqaradigan Guruhlar <span className="text-red-400">*</span></label>
            <GroupsInput value={form.groups} onChange={(groups) => setForm({ ...form, groups })} />
          </div>
          <div>
            <label className="label">Email <span className="text-red-400">*</span></label>
            <input type="email" placeholder="teacher@email.com" required className="input"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Parol <span className="text-red-400">*</span></label>
            <input type="password" placeholder="Kamida 6 belgi" required minLength={6} className="input"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
            💡 O'qituvchi faqat belgilangan guruhlardagi talabalarni ko'ra va boshqara oladi
          </div>
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Bekor</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting && <Loader2 size={14} className="animate-spin" />} Yaratish
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Pwd Modal */}
      <Modal isOpen={resetModal.open} onClose={() => setResetModal({ open: false, userId: '', name: '' })}
        title={`Parol: ${resetModal.name}`} size="sm">
        <form onSubmit={handleResetPwd} className="space-y-3">
          <div>
            <label className="label">Yangi Parol</label>
            <input type="password" placeholder="Kamida 6 belgi" required minLength={6} className="input"
              value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} />
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setResetModal({ open: false, userId: '', name: '' })} className="btn-secondary flex-1">Bekor</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting && <Loader2 size={14} className="animate-spin" />} Saqlash
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
