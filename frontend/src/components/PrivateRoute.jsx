import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_HOME = {
  ADMIN:   '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  STUDENT: '/student/dashboard',
}

export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (role && user.role !== role) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />
  }

  return children
}
