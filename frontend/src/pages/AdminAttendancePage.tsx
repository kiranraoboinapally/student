// File: frontend/pages/AdminAttendancePage.tsx

import React, { useState } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

// Mock student list for demonstration, in a real app you'd fetch this
const mockStudents = [
    { enrollment_number: 20250001, full_name: "Alice Smith" },
    { enrollment_number: 20250002, full_name: "Bob Johnson" },
    { enrollment_number: 20250003, full_name: "Charlie Brown" },
];

interface AttendanceEntry {
    enrollment_number: number;
    status: 'present' | 'absent';
}

export default function AdminAttendancePage() {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [subjectCode, setSubjectCode] = useState("");
    const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<AttendanceEntry[]>(mockStudents.map(s => ({ enrollment_number: s.enrollment_number, status: 'present' })));
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAttendanceChange = (en: number, status: 'present' | 'absent') => {
        setAttendance(prev => prev.map(entry => 
            entry.enrollment_number === en ? { ...entry, status } : entry
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        const payload = {
            subject_code: subjectCode,
            class_date: `${classDate}T00:00:00Z`, // API expects ISO format
            attendance: attendance.map(a => ({
                enrollment_number: Number(a.enrollment_number),
                status: a.status
            }))
        };

        try {
            const res = await authFetch(`${apiBase}/admin/attendance/record`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || "Failed to record attendance." });
                return;
            }

            setMessage({ type: 'success', text: data.message || "Attendance recorded successfully!" });

        } catch (err) {
            setMessage({ type: 'error', text: "Network error. Could not connect to API." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#650C08]">Record Class Attendance</h1>
                <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                    ← Back to Dashboard
                </button>
            </header>

            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 border-b pb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                            <input
                                type="text"
                                required
                                value={subjectCode}
                                onChange={(e) => setSubjectCode(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                                placeholder="e.g., CS101"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class Date</label>
                            <input
                                type="date"
                                required
                                value={classDate}
                                onChange={(e) => setClassDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                            />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold pt-4 text-gray-800">Student List</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {mockStudents.map((student) => {
                                    const currentStatus = attendance.find(a => a.enrollment_number === student.enrollment_number)?.status || 'present';
                                    return (
                                        <tr key={student.enrollment_number}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.enrollment_number}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.full_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center space-x-4">
                                                    <label className="inline-flex items-center">
                                                        <input
                                                            type="radio"
                                                            checked={currentStatus === 'present'}
                                                            onChange={() => handleAttendanceChange(student.enrollment_number, 'present')}
                                                            className="form-radio text-green-600"
                                                        />
                                                        <span className="ml-2 text-green-600 font-semibold">Present</span>
                                                    </label>
                                                    <label className="inline-flex items-center">
                                                        <input
                                                            type="radio"
                                                            checked={currentStatus === 'absent'}
                                                            onChange={() => handleAttendanceChange(student.enrollment_number, 'absent')}
                                                            className="form-radio text-red-600"
                                                        />
                                                        <span className="ml-2 text-red-600 font-semibold">Absent</span>
                                                    </label>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>


                    {message && (
                        <div className={`p-3 rounded-md text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !subjectCode || !classDate}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#650C08] hover:bg-[#7a1d16] disabled:opacity-50 transition"
                    >
                        {loading ? "Recording Attendance..." : "Record Attendance"}
                    </button>
                </form>
            </div>
        </div>
    );
}