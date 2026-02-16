import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { OrganizerRoute } from './components/OrganizerRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Home } from './pages/Home'
import { Events } from './pages/Events'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminInstances } from './pages/admin/Instances'
import { AdminUsers } from './pages/admin/Users'
import { InstanceForm } from './pages/admin/InstanceForm'
import { OrganizerForm } from './pages/admin/OrganizerForm'
import { OrganizerDashboard } from './pages/organizer/Dashboard'
import { OrganizerEvents } from './pages/organizer/Events'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Home - Redireciona baseado no role */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          
          {/* Lista pública de eventos */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/instances"
            element={
              <AdminRoute>
                <AdminInstances />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/instances/new"
            element={
              <AdminRoute>
                <InstanceForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/instances/:id/edit"
            element={
              <AdminRoute>
                <InstanceForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/new"
            element={
              <AdminRoute>
                <OrganizerForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id/edit"
            element={
              <AdminRoute>
                <OrganizerForm />
              </AdminRoute>
            }
          />
          
          {/* Organizer Routes */}
          <Route
            path="/organizer"
            element={
              <OrganizerRoute>
                <OrganizerDashboard />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/events"
            element={
              <OrganizerRoute>
                <OrganizerEvents />
              </OrganizerRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
