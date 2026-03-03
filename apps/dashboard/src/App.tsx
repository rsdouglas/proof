import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Testimonials from './pages/Testimonials'
import Widgets from './pages/Widgets'
import Collect from './pages/Collect'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/testimonials" element={<PrivateRoute><Layout><Testimonials /></Layout></PrivateRoute>} />
          <Route path="/widgets" element={<PrivateRoute><Layout><Widgets /></Layout></PrivateRoute>} />
          <Route path="/collect" element={<PrivateRoute><Layout><Collect /></Layout></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
