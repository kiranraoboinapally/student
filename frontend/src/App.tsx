import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider";

import LandingPage from "./components/LandingPage";
import StudentLoginPage from "./components/StudentLoginPage";
import StudentRegistrationPage from "./components/StudentRegistrationPage";
import AdminLoginPage from "./components/AdminLoginPage";

import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// NEW ADMIN DATA ENTRY PAGES
import AdminFeeCreationPage from "./pages/AdminFeeCreationPage";
import AdminAttendancePage from "./pages/AdminAttendancePage";
import AdminMarksUploadPage from "./pages/AdminMarksUploadPage";

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

          {/* NEW ADMIN DATA ENTRY ROUTES */}
          <Route
            path="/admin/create-fees"
            element={
              <Protected allowedRole={1}>
                <AdminFeeCreationPage />
              </Protected>
            }
          />
          <Route
            path="/admin/record-attendance"
            element={
              <Protected allowedRole={1}>
                <AdminAttendancePage />
              </Protected>
            }
          />
          <Route
            path="/admin/upload-marks"
            element={
              <Protected allowedRole={1}>
                <AdminMarksUploadPage />
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
