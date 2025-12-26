import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentRegistrationPage() {
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollment_number: enrollment,
          full_name: fullName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess(
        "Access request submitted successfully. Please wait for admin approval."
      );

      setEnrollment("");
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-500 to-purple-700">
      <div className="bg-white rounded-lg shadow-lg p-10 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">
          Request Student Portal Access
        </h2>

        {error && (
          <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>
        )}
        {success && (
          <p className="bg-green-100 text-green-700 p-3 rounded mb-4">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enrollment Number"
            className="w-full border p-3 rounded"
            value={enrollment}
            onChange={(e) => setEnrollment(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Full Name"
            className="w-full border p-3 rounded"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full border p-3 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Create Password"
            className="w-full border p-3 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full border p-3 rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 text-white p-3 rounded font-semibold hover:bg-purple-800"
          >
            {loading ? "Submitting..." : "Request Access"}
          </button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-6">
          Already approved?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-purple-700 font-semibold cursor-pointer"
          >
            Login here
          </span>
        </p>
      </div>
    </div>
  );
}
