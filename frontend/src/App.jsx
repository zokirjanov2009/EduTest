import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import LoginPage from './pages/LoginPage'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminTeachers  from './pages/admin/Teachers'
import AdminStudents  from './pages/admin/Students'

// Teacher
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherStudents  from './pages/teacher/Students'
import TeacherGroups    from './pages/teacher/Groups'

// Student
import StudentDashboard from './pages/student/Dashboard'
import StudentUpload    from './pages/student/Upload'
import StudentResult    from './pages/student/Result'
import StudentTest      from './pages/student/Test'
import StudentHistory   from './pages/student/History'

import PrivateRoute from './components/PrivateRoute'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  const map = { ADMIN: '/admin/dashboard', TEACHER: '/teacher/dashboard', STUDENT: '/student/dashboard' }
  return <Navigate to={map[user.role] || '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/"      element={<RootRedirect />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<PrivateRoute role="ADMIN"><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/teachers"  element={<PrivateRoute role="ADMIN"><AdminTeachers /></PrivateRoute>} />
      <Route path="/admin/students"  element={<PrivateRoute role="ADMIN"><AdminStudents /></PrivateRoute>} />

      {/* Teacher */}
      <Route path="/teacher/dashboard" element={<PrivateRoute role="TEACHER"><TeacherDashboard /></PrivateRoute>} />
      <Route path="/teacher/students"  element={<PrivateRoute role="TEACHER"><TeacherStudents /></PrivateRoute>} />
      <Route path="/teacher/groups"    element={<PrivateRoute role="TEACHER"><TeacherGroups /></PrivateRoute>} />

      {/* Student */}
      <Route path="/student/dashboard"        element={<PrivateRoute role="STUDENT"><StudentDashboard /></PrivateRoute>} />
      <Route path="/student/upload"           element={<PrivateRoute role="STUDENT"><StudentUpload /></PrivateRoute>} />
      <Route path="/student/submissions/:id"  element={<PrivateRoute role="STUDENT"><StudentResult /></PrivateRoute>} />
      <Route path="/student/test/:testId"     element={<PrivateRoute role="STUDENT"><StudentTest /></PrivateRoute>} />
      <Route path="/student/history"          element={<PrivateRoute role="STUDENT"><StudentHistory /></PrivateRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}