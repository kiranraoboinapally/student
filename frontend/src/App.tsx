import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthProvider";

import LandingPage from "./shared/components/LandingPage";
import StudentLoginPage from "./features/student/components/StudentLoginPage";
import StudentRegistrationPage from "./features/student/components/StudentRegistrationPage";
import AdminLoginPage from "./features/admin/components/AdminLoginPage";

import StudentDashboard from "./features/student/components/StudentDashboard";
import AdminDashboard from "./features/admin/components/AdminDashboard";
import ChangePasswordPage from "./features/auth/components/ChangePasswordPage";
import ForgotPasswordPage from "./features/auth/components/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/components/ResetPasswordPage";



function Protected({ children, allowedRole }: { children: JSX.Element; allowedRole: number }) {
  const { token, roleId } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  if (roleId !== allowedRole) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Auth Pages */}
          <Route path="/login" element={<StudentLoginPage />} />
          <Route path="/register" element={<StudentRegistrationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <Protected allowedRole={5}>
                <StudentDashboard />
              </Protected>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <Protected allowedRole={1}>
                <AdminDashboard />
              </Protected>
            }
          />


          <Route
            path="/change-password"
            element={
              <Protected allowedRole={5}>
                <ChangePasswordPage />
              </Protected>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
