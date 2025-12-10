import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, apiBase } from "../auth/AuthProvider";

export default function LoginPage(): JSX.Element {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoSrc = "/Logo.png";

  // formatted current date/time
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
        second: "2-digit",
        hour12: false,
      })
      .replace(",", "");
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        student_id: Number(studentId),
        password,
      };

      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || data.message || "Login failed");
        setLoading(false);
        return;
      }

      const token = data.token;
      const expires = data.expires_in_hours;

      if (!token) {
        setError("No token returned by server");
        setLoading(false);
        return;
      }

      login(token, expires);
      navigate("/student/profile");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  // right panel gradient + grid effect
  const rightPanelStyle: React.CSSProperties = {
    backgroundColor: "#650C08",
    backgroundImage: [
      "radial-gradient(circle at 95% 5%, rgba(255,220,210,0.28) 0%, rgba(255,220,210,0.12) 12%, rgba(255,220,210,0.03) 28%, transparent 45%)",
      "linear-gradient(135deg, #7a1d16 0%, #650C08 35%, #b77a6f 100%)",
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 18px)"
    ].join(", "),
    backgroundBlendMode: "overlay, normal, normal",
  };

  return (
    <div className="min-h-screen bg-white flex justify-center items-center p-4">
      <div className="w-full max-w-6xl min-h-[560px] rounded-xl shadow-1xl flex overflow-hidden">

        {/* LEFT PANEL */}
        <div className="w-[30%] min-w-[200px] bg-gray-100 flex flex-col justify-center items-center p-3">
          <div
            className="w-26 h-26 rounded-full flex justify-center items-center shadow-xl"
            style={{ backgroundColor: "#650C08" }}
          >
            <img src={logoSrc} alt="Logo" className="w-[70%] h-[70%] object-contain" />
          </div>

          <div className="mt-2 font-semibold text-gray-800 tracking-wide">
            Welcome To Login Page!
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div
          className="w-[64%] flex-1 flex flex-col text-white p-10 min-h-full"
          style={rightPanelStyle}
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold">Singhania University</h1>
            <p className="opacity-90 mt-1">Degree &amp; PG College (Private University)</p>
            <h2 className="text-3xl font-extrabold mt-6 text-rose-100">STUDENT PORTAL</h2>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="mt-6 flex-grow">
            <label className="font-semibold">Student ID</label>
            <input
              type="text"
              inputMode="numeric"
              required
              disabled={loading}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
              className="w-full p-3 rounded-md mt-2 mb-4 text-black bg-white outline-none focus:ring-2 focus:ring-rose-200"
            />

            <label className="font-semibold">Password</label>
            <input
              type="password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-md mt-2 mb-4 text-black bg-white outline-none focus:ring-2 focus:ring-rose-200"
            />

            <div className="flex items-center gap-4 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-[#650C08] font-bold px-5 py-2 rounded-md shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Log In"}
              </button>

              <a href="#" className="underline font-semibold text-rose-100">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-md bg-black/30 text-red-200 font-semibold">
                {error}
              </div>
            )}

            <p className="mt-5 text-sm opacity-90">
              First login: Use Student ID &amp; DOB (ddmmyyyy) as password.
            </p>
          </form>

          {/* FOOTER — pinned to bottom */}
          <div className="flex justify-between text-sm opacity-90 mt-auto pt-6">
            <span>{currentDate}</span>
            <span>eVarsity ERP • ABC Technologies</span>
          </div>

        </div>
      </div>
    </div>
  );
}
