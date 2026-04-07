import { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import api from '../lib/api'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (!token) { setLoading(false); return }

    api.get('/auth/me')
      .then(({ data }) => setUser(data.data.user))
      .catch((err) => {
        // Faqat haqiqiy 401 da cookie tozalanadi
        // 429, 500, network xatolarida LOGOUT QILINMAYDI
        if (err.response?.status === 401) {
          Cookies.remove('accessToken')
          Cookies.remove('refreshToken')
          setUser(null)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const { user, accessToken, refreshToken } = data.data
    Cookies.set('accessToken',  accessToken,  { expires: 7,  sameSite: 'Lax' })
    Cookies.set('refreshToken', refreshToken, { expires: 30, sameSite: 'Lax' })
    setUser(user)
    return user
  }

  const logout = () => {
    Cookies.remove('accessToken')
    Cookies.remove('refreshToken')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
