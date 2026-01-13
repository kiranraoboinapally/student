import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import { LogIn, Eye, EyeOff, School } from "lucide-react";

export default function InstituteLoginPage(): React.ReactNode {
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

            // Allow only Institute Admin (3) and Faculty (2)
            if (![2, 3].includes(data.role_id)) {
                setError("Access denied.");
                setLoading(false);
                return;
            }

            login(data.token, data.role_id, data.expires_in_hours);

            if (data.force_password_change) {
                navigate("/change-password");
            } else if (data.role_id === 3) {
                navigate("/institute/dashboard"); // Institute Admin
            } else if (data.role_id === 2) {
                navigate("/faculty/dashboard"); // Faculty
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
                    {/* Header */}
                    <div className="text-center mb-8">
                        {logoSrc && <img src={logoSrc} alt="Logo" className="h-16 mx-auto mb-4" />}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <School className="w-8 h-8" style={{ color: theme }} />
                            <h1 className="text-3xl font-bold" style={{ color: theme }}>
                                Institute Portal
                            </h1>
                        </div>
                        <p className="text-gray-500 text-sm">Institute & Faculty Login</p>
                        <p className="text-gray-600 text-sm mt-2">{currentDate}</p>
                    </div>

                    {/* Error */}
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
                                required
                                disabled={loading}
                                className="w-full px-4 py-3 border-2 rounded-lg"
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
                                    required
                                    disabled={loading}
                                    className="w-full px-4 py-3 border-2 rounded-lg pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    {showPassword ? <EyeOff /> : <Eye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2"
                            style={{ backgroundColor: theme }}
                        >
                            <LogIn />
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}