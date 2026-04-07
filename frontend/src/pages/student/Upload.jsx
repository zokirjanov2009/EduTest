import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { Upload, X, CheckCircle, Loader2, Brain, AlertCircle, FileText } from 'lucide-react'

const ALLOWED = ['pdf','doc','docx','xls','xlsx']
const MAX_MB  = 10
const FILE_ICONS = { pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊' }

export default function StudentUpload() {
  const navigate    = useNavigate()
  const inputRef    = useRef(null)
  const [title, setTitle]   = useState('')
  const [file, setFile]     = useState(null)
  const [drag, setDrag]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep]     = useState('form') // form|processing|done
  const [result, setResult] = useState(null)

  const validate = (f) => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED.includes(ext)) { toast.error('Faqat PDF, Word yoki Excel qabul qilinadi!'); return false }
    if (f.size > MAX_MB * 1024 * 1024) { toast.error(`Maksimal hajm ${MAX_MB}MB!`); return false }
    return true
  }

  const pickFile = (f) => { if (f && validate(f)) setFile(f) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Sarlavha kiriting!'); return }
    if (!file) { toast.error('Fayl tanlang!'); return }
    setLoading(true); setStep('processing')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title.trim())
      const { data } = await api.post('/student/submissions', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data.data); setStep('done')
      toast.success('Fayl yuklandi va testlar tayyor!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Yuklashda xatolik')
      setStep('form')
    } finally { setLoading(false) }
  }

  const ext = file?.name.split('.').pop()?.toLowerCase()

  // Processing
  if (step === 'processing') return (
    <DashboardLayout title="Yuklanmoqda...">
      <div className="max-w-sm mx-auto text-center py-12 px-4">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 border-4 border-primary-100 rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">AI Ishlab Chiqmoqda...</h2>
        <p className="text-slate-500 text-sm mb-6">Fayl o'qilmoqda va test savollar yaratilmoqda</p>
        <div className="space-y-2 text-left">
          {['Fayl yuklanmoqda...', 'Matn ajratilmoqda...', 'AI test yaratmoqda...'].map((s, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <Loader2 size={14} className="animate-spin text-primary-500 flex-shrink-0" />
              <span className="text-sm text-slate-600">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )

  // Done
  if (step === 'done' && result) return (
    <DashboardLayout title="Tayyor!">
      <div className="max-w-sm mx-auto text-center py-8 px-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Muvaffaqiyatli!</h2>
        <p className="text-slate-500 mb-6 text-sm">
          Fayl yuklandi va <strong className="text-primary-600">5 ta test savoli</strong> tayyorlandi
        </p>
        <div className="card p-4 text-left mb-6">
          <p className="text-xs text-slate-500 mb-1">Mustaqil ish</p>
          <p className="font-bold text-slate-900 text-sm">{result.title}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="badge bg-primary-50 text-primary-700 border-primary-200">{result.fileType}</span>
            <span className="badge bg-slate-100 text-slate-600 border-slate-200">~{result.wordCount?.toLocaleString()} so'z</span>
          </div>
        </div>
        <button onClick={() => navigate(`/student/test/${result.testId}`)} className="btn-primary w-full py-3.5 text-base mb-3">
          <Brain size={20} /> Testni Boshlash
        </button>
        <button onClick={() => { setStep('form'); setFile(null); setTitle(''); setResult(null) }}
          className="btn-secondary w-full py-3">
          Yangi Ish Yuklash
        </button>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Mustaqil Ish Yuklash">
      <div className="max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="card p-4 sm:p-5">
            <label className="label">Mustaqil Ish Sarlavhasi <span className="text-red-400">*</span></label>
            <input type="text" placeholder="Masalan: Iqtisodiyot 1-mustaqil ish"
              value={title} onChange={(e) => setTitle(e.target.value)} className="input" required minLength={3} />
          </div>

          {/* Dropzone */}
          <div className="card p-4 sm:p-5">
            <label className="label mb-3 block">Fayl Yuklash <span className="text-red-400">*</span></label>
            {file ? (
              <div className="border-2 border-emerald-300 bg-emerald-50 rounded-2xl p-5 text-center">
                <div className="text-4xl mb-2">{FILE_ICONS[ext] || '📄'}</div>
                <p className="font-semibold text-slate-900 text-sm truncate px-4">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button type="button" onClick={() => setFile(null)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg touch-manipulation">
                  <X size={12} /> O'chirish
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files[0]) }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all touch-manipulation
                  ${drag ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50 active:bg-slate-100'}`}>
                <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 text-sm">Bosing va fayl tanlang</p>
                <p className="text-xs text-slate-400 mt-1">yoki faylni bu yerga tashlang</p>
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  {['PDF', 'Word (.docx)', 'Excel (.xlsx)'].map(t => (
                    <span key={t} className="badge bg-slate-100 text-slate-500 border-slate-200 text-xs">{t}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">Maksimal: {MAX_MB}MB</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => pickFile(e.target.files?.[0])} className="hidden" />
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Fayl yuklanganida <strong>AI avtomatik 5 ta test</strong> yaratadi. Savollar faqat sizning matningiz asosida bo'ladi.
            </p>
          </div>

          <button type="submit" disabled={loading || !file || !title.trim()}
            className="btn-primary w-full py-4 text-base">
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            {loading ? 'Yuklanmoqda...' : 'Yuklash va Test Yaratish'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
