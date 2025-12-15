import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBase } from "../auth/AuthProvider";

export default function ForgotPasswordPage(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rightPanelStyle: React.CSSProperties = {
    backgroundColor: "#650C08",
    backgroundImage: [
      "radial-gradient(circle at 95% 5%, rgba(255,220,210,0.28) 0%, rgba(255,220,210,0.12) 12%, rgba(255,220,210,0.03) 28%, transparent 45%)",
      "linear-gradient(135deg, #7a1d16 0%, #650C08 35%, #b77a6f 100%)",
      "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 18px)"
    ].join(", "),
    backgroundBlendMode: "overlay, normal, normal",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to send reset link");
        setLoading(false);
        return;
      }

      setSuccess(true);
      if (data.token) {
        setToken(data.token);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex justify-center items-center p-6">
      <div className="w-full max-w-6xl min-h-[620px] rounded-2xl shadow-2xl flex overflow-hidden flex-col lg:flex-row">

        <div className="w-full lg:w-[35%] bg-gray-100 flex flex-col items-center justify-center p-10 text-center">
          <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-8 border-white">
            <img src="/Logo.png" alt="ABCD University" className="w-full h-full object-contain" />
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
            Password Recovery
          </div>
        </div>

        <div className="w-full lg:w-[65%] flex flex-col p-12 text-white" style={rightPanelStyle}>
          <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-extrabold text-rose-100 text-center mb-10">
              FORGOT PASSWORD
            </h2>

            {success ? (
              <div className="bg-green-600/20 border border-green-400 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Reset Link Sent!</h3>
                <p className="mb-4">If your email exists in our system, a password reset link has been sent.</p>

                {token && (
                  <div className="bg-white/10 p-4 rounded-lg mb-4">
                    <p className="text-sm mb-2">Your reset token:</p>
                    <code className="bg-black/30 p-2 rounded text-sm break-all block">{token}</code>
                    <p className="text-xs mt-2 opacity-75">Copy this token and use it to reset your password.</p>
                  </div>
                )}

                <button
                  onClick={() => navigate("/reset-password")}
                  className="w-full bg-white text-[#650C08] font-bold text-lg py-4 rounded-lg shadow-xl hover:shadow-2xl transition mt-4"
                >
                  Reset Password Now
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full mt-4 text-rose-100 underline font-medium text-center"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <p className="text-rose-100 text-center mb-6">
                  Enter your email address and we will send you a link to reset your password.
                </p>

                <div>
                  <label className="block text-lg font-semibold mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 rounded-lg text-black bg-white focus:ring-4 focus:ring-rose-200 outline-none transition"
                    placeholder="Enter your email"
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
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full mt-6 text-rose-100 underline font-medium text-center"
                >
                  Back to Login
                </button>
              </form>
            )}

            <div className="mt-auto pt-10 text-center text-sm opacity-90">
              <p>ERP • Powered by SlashCurate Technologies Pvt Ltd</p>
              <p className="mt-2">© 2025 ABCD University</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
