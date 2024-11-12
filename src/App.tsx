import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminDashboard } from '@/pages/dashboard/AdminDashboard';
import { CoachDashboard } from '@/pages/dashboard/CoachDashboard';
import { CustomerDashboard } from '@/pages/dashboard/CustomerDashboard';

function App() {
  return (
    <>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/coach"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <DashboardLayout>
                  <CoachDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <DashboardLayout>
                  <CustomerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </>
  );
}

export default App;