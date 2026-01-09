import React, { useState, useEffect } from "react";
import { useAuth, apiBase } from "../../../auth/AuthProvider"; // Adjust path as needed
import { UserPlus, School, User } from "lucide-react";

export default function InstituteUserManagement() {
    const { authFetch } = useAuth();

    const [institutes, setInstitutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingInstitutes, setLoadingInstitutes] = useState(true);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [formData, setFormData] = useState({
        institute_id: "",
        username: "",
        full_name: "",
        email: "",
        role_id: 3, // Default to Institute Admin
        temp_password: "",
    });

    useEffect(() => {
        fetchInstitutes();
    }, []);

    const fetchInstitutes = async () => {
        try {
            // Assuming existing endpoint returns list of institutes
            const res = await authFetch(`${apiBase}/admin/institutes?limit=100`);
            if (res.ok) {
                const data = await res.json();
                setInstitutes(data.data || []);
            }
        } catch (e) {
            console.error("Failed to load institutes", e);
        } finally {
            setLoadingInstitutes(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const payload = {
                ...formData,
                institute_id: Number(formData.institute_id),
                role_id: Number(formData.role_id),
            };

            const res = await authFetch(`${apiBase}/admin/institutes/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "User created successfully!" });
                setFormData({
                    institute_id: formData.institute_id, // Keep institute selected
                    username: "",
                    full_name: "",
                    email: "",
                    role_id: 3,
                    temp_password: "",
                });
            } else {
                setMessage({ type: "error", text: data.error || "Failed to create user" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Connection failed" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto mt-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-full">
                    <UserPlus className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Create Institute User</h2>
                    <p className="text-sm text-gray-500">Create Admin or Faculty accounts for an institute</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 mb-4 rounded ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Institute Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Institute</label>
                    <div className="relative">
                        <select
                            name="institute_id"
                            value={formData.institute_id}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                        >
                            <option value="">-- Choose Institute --</option>
                            {institutes.map((inst: any) => (
                                <option key={inst.institute_id} value={inst.institute_id}>
                                    {inst.name || inst.institute_name} ({inst.code || inst.institute_code})
                                </option>
                            ))}
                        </select>
                        <School className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    {loadingInstitutes && <p className="text-xs text-gray-400 mt-1">Loading institutes...</p>}
                </div>

                {/* Role Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer border p-3 rounded hover:bg-gray-50 flex-1">
                            <input
                                type="radio"
                                name="role_id"
                                value="3"
                                checked={Number(formData.role_id) === 3}
                                onChange={handleChange}
                                className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-medium">Institute Admin</span>
                        </label>
                        {/* 
               <label className="flex items-center gap-2 cursor-pointer border p-3 rounded hover:bg-gray-50 flex-1">
                 <input
                    type="radio"
                    name="role_id"
                    value="2"
                    checked={Number(formData.role_id) === 2}
                    onChange={handleChange}
                    className="text-indigo-600 focus:ring-indigo-500"
                 />
                 <span className="font-medium">Faculty (Direct)</span>
              </label> 
              */}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="e.g. admin_mit"
                                className="w-full pl-10 pr-4 py-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                            <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. John Doe"
                            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="admin@institute.com"
                            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Generic Password</label>
                        <input
                            type="text"
                            name="temp_password"
                            value={formData.temp_password}
                            onChange={handleChange}
                            required
                            placeholder="Min 6 chars"
                            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded transition flex items-center justify-center gap-2"
                >
                    {loading ? "Creating..." : "Create User"}
                </button>

            </form>
        </div>
    );
}
