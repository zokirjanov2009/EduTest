import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react'

const ROLE_HOME = {
  ADMIN:   '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
}

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { toast.error('Email va parolni kiriting!'); return }
    setLoading(true)
    try {
      const user = await login(email.trim(), password)
      toast.success(`Xush kelibsiz, ${user.name}!`)
      navigate(ROLE_HOME[user.role] || '/login', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message
      if (err?.response?.status === 429) {
        toast.error('Juda ko\'p urinish. Biroz kuting.')
      } else {
        toast.error(msg || "Email yoki parol noto'g'ri!")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-2xl border border-primary-500/30 mb-4">
            <BookOpen className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-3xl font-black text-white">EduTest</h1>
          <p className="text-slate-400 mt-1 text-sm">Mustaqil ishlarni AI bilan tekshirish</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Tizimga kirish</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
              <input
                type="email" placeholder="email@example.com" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Parol</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} placeholder="••••••••" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all text-sm"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-500 active:bg-primary-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2">
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Kirish...' : 'Kirish'}
            </button>
          </form>
          <div className="mt-5 p-3 bg-white/5 rounded-xl border border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Login/parolni <span className="text-primary-400 font-semibold">Admin</span> yoki{' '}
              <span className="text-primary-400 font-semibold">O'qituvchi</span>dan oling
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
