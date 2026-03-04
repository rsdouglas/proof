import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Testimonials from './pages/Testimonials'
import Widgets from './pages/Widgets'
import WidgetDetail from './pages/WidgetDetail'
import Collect from './pages/Collect'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Demo from './pages/Demo'
import Webhooks from './pages/Webhooks'
import ApiKeys from './pages/ApiKeys'

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/webhooks" element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="widgets" element={<Widgets />} />
        <Route path="widgets/:id" element={<WidgetDetail />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="collect" element={<Collect />} />
        <Route path="settings" element={<Settings />} />
        <Route path="api-keys" element={<ApiKeys />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="webhooks" element={<Webhooks />} />      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
