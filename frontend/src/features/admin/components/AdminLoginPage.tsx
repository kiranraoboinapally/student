import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage(): React.ReactNode {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const logoSrc = "/Logo.png";
  const theme = "#650C08";

  const currentDate = useMemo(() => {
    const d = new Date();
    return d
      .toLocaleString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "");
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = { username, password };
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.token) {
        setError("Invalid Username or Password");
        setLoading(false);
        return;
      }

      login(data.token, data.role_id, data.expires_in_hours);

      if (data.force_password_change) {
        navigate("/change-password");
      } else {
        // Redirect based on Role ID
        if (data.role_id === 1) {
          navigate("/admin/dashboard");
        } else if (data.role_id === 2) {
          navigate("/faculty/dashboard");
        } else if (data.role_id === 3) {
          navigate("/institute/dashboard");
        } else {
          navigate("/admin/dashboard"); // Default
        }
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${theme} 0%, #8B1A1A 50%, #1a1a1a 100%)`,
      }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl shadow-2xl p-8 border"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderColor: theme,
          }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            {logoSrc && <img src={logoSrc} alt="Logo" className="h-16 mx-auto mb-4" />}
            <h1 className="text-3xl font-bold mb-2" style={{ color: theme }}>
              Admin Portal
            </h1>
            <p className="text-gray-600 text-sm">{currentDate}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="p-4 rounded-lg mb-6 text-sm font-medium text-white"
              style={{ backgroundColor: "#D32F2F" }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: theme }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., admin1"
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition"
                style={{
                  borderColor: username ? theme : "#e0e0e0",
                  backgroundColor: "#f9f9f9",
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: theme }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition pr-10"
                  style={{
                    borderColor: password ? theme : "#e0e0e0",
                    backgroundColor: "#f9f9f9",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition transform hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: theme }}
            >
              <LogIn className="w-5 h-5" />
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Not an admin?{" "}
              <a
                href="/"
                className="font-semibold hover:underline"
                style={{ color: theme }}
              >
                Go back to home
              </a>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 rounded-lg text-white text-xs" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
          <p className="font-semibold mb-2">Demo Credentials:</p>
          <p>Username: admin1</p>
          <p>Password: admin</p>
        </div>
      </div>
    </div>
  );
}