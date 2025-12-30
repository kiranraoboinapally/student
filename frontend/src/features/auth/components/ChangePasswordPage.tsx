import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, apiBase } from "../AuthProvider";

export default function ChangePasswordPage(): JSX.Element {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError("Please fill both fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`${apiBase}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to change password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate("/student/dashboard"), 1000);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Change Password</h2>
        <form onSubmit={handleChange} className="flex flex-col gap-4">
          <div>
            <label className="block font-semibold mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-300"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 font-semibold text-sm">{error}</div>
          )}
          {success && (
            <div className="text-green-600 font-semibold text-sm">
              Password changed successfully! Redirecting...
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
