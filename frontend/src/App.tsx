import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthProvider"; // ✅ import useAuth
import LandingPage from "./components/LandingPage";
import StudentLoginPage from "./components/StudentLoginPage";
import AdminLoginPage from "./components/AdminLoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ChangePasswordPage from "./pages/ChangePasswordPage";

function Protected({ children, allowedRole }: { children: JSX.Element; allowedRole: number }) {
  const { token, roleId } = useAuth(); // ✅ useAuth now works
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

          {/* Login Pages */}
          <Route path="/login" element={<StudentLoginPage />} />
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
