import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, apiBase } from "../auth/AuthProvider";

export default function StudentLoginPage(): JSX.Element {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logoSrc = "/Logo.png";

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
      const payload = { username: enrollment, password };
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.token) {
        setError("Invalid Enrollment Number or Password");
        setLoading(false);
        return;
      }

      login(data.token, data.role_id, data.expires_in_hours);

      if (data.force_password_change) {
        navigate("/change-password");
      } else {
        navigate("/student/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
    <div className="min-h-screen bg-white flex justify-center items-center p-6">
      <div className="w-full max-w-6xl min-h-[620px] rounded-2xl shadow-2xl flex overflow-hidden flex-col lg:flex-row">

        {/* LEFT PANEL */}
        <div className="w-full lg:w-[35%] bg-gray-100 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-8 border-white">
            <img src={logoSrc} alt="ABCD University" className="w-full h-full object-contain" />
          </div>

          <h1 className="mt-8 text-4xl font-bold text-gray-800 tracking-wide">
            ABCD University
          </h1>
          <p className="mt-3 text-lg font-semibold text-gray-700">
            Diploma • Degree • PG • PhD
          </p>
          <p className="text-sm text-gray-600">(Private University)</p>
          <p className="mt-4 text-sm text-gray-500">Location, State Pincode</p>

          <div className="mt-10 text-gray-600 font-medium text-lg">
            Student Portal Login
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[65%] flex flex-col p-12 text-white" style={rightPanelStyle}>
          <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-extrabold text-rose-100 text-center mb-10">
              STUDENT LOGIN
            </h2>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-lg font-semibold mb-2">Enrollment Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  disabled={loading}
                  value={enrollment}
                  onChange={(e) => setEnrollment(e.target.value.replace(/\D/g, ""))}
                  className={`w-full px-5 py-4 rounded-lg text-black bg-white focus:ring-4 focus:ring-rose-200 outline-none transition ${
                    error ? "ring-2 ring-red-400" : ""
                  }`}
                  placeholder="Enter enrollment number"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold mb-2">Password</label>
                <input
                  type="password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-5 py-4 rounded-lg text-black bg-white focus:ring-4 focus:ring-rose-200 outline-none transition ${
                    error ? "ring-2 ring-red-400" : ""
                  }`}
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-black/30 text-red-200 text-center font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#650C08] font-bold text-lg py-4 rounded-lg shadow-xl hover:shadow-2xl transition disabled:opacity-60"
              >
                {loading ? "Signing in…" : "Log In"}
              </button>

              <p className="text-sm text-rose-100 mt-6 text-center">
                First time login? Use Enrollment No. & DOB (ddmmyyyy) as password.
              </p>
              <a href="#" className="block text-center text-rose-100 underline mt-3 font-medium">
                Forgot Password?
              </a>
            </form>

            <div className="mt-auto pt-10 flex justify-between text-sm opacity-90">
              <span>{currentDate}</span>
              <span>ERP • SlashCurate Technologies Pvt Ltd</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}