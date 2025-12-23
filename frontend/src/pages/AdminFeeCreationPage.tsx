// File: frontend/pages/AdminFeeCreationPage.tsx

import React, { useState } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function AdminFeeCreationPage() {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [enrollment, setEnrollment] = useState("");
    const [feeType, setFeeType] = useState("REGISTRATION");
    const [amount, setAmount] = useState("");
    const [semester, setSemester] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        const payload = {
            enrollment_number: Number(enrollment),
            fee_type: feeType,
            fee_amount: Number(amount),
            semester: Number(semester),
        };

        try {
            const res = await authFetch(`${apiBase}/admin/fees/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || "Failed to create fee." });
                return;
            }

            setMessage({ type: 'success', text: data.message || "Fee created successfully!" });
            setEnrollment("");
            setAmount("");
            setSemester("");

        } catch (err) {
            setMessage({ type: 'error', text: "Network error. Could not connect to API." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#650C08]">Create Student Fee Due</h1>
                <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                    ← Back to Dashboard
                </button>
            </header>

            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Enrollment Number</label>
                        <input
                            type="text"
                            required
                            value={enrollment}
                            onChange={(e) => setEnrollment(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                            placeholder="e.g., 20250001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fee Type</label>
                        <select
                            required
                            value={feeType}
                            onChange={(e) => setFeeType(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                        >
                            <option value="REGISTRATION">Registration Fee</option>
                            <option value="EXAMINATION">Examination Fee</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Semester</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-md text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#650C08] hover:bg-[#7a1d16] disabled:opacity-50 transition"
                    >
                        {loading ? "Creating Fee..." : "Create Fee Due"}
                    </button>
                </form>
            </div>
        </div>
    );
}