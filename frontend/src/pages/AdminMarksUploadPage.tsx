// File: frontend/pages/AdminMarksUploadPage.tsx

import React, { useState } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

// Mock student list for demonstration, in a real app you'd fetch this
const mockStudents = [
    { enrollment_number: 20250001, full_name: "Alice Smith", marks: 0, grade: "" },
    { enrollment_number: 20250002, full_name: "Bob Johnson", marks: 0, grade: "" },
    { enrollment_number: 20250003, full_name: "Charlie Brown", marks: 0, grade: "" },
];

interface MarkEntry {
    enrollment_number: number;
    full_name: string;
    marks: number;
    grade: string;
}

export default function AdminMarksUploadPage() {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [subjectCode, setSubjectCode] = useState("");
    const [semester, setSemester] = useState("");
    const [marksType, setMarksType] = useState("Internal");
    const [marksList, setMarksList] = useState<MarkEntry[]>(mockStudents);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleMarksChange = (en: number, value: number) => {
        setMarksList(prev => prev.map(entry => 
            entry.enrollment_number === en ? { ...entry, marks: value } : entry
        ));
    };

    const handleGradeChange = (en: number, value: string) => {
        setMarksList(prev => prev.map(entry => 
            entry.enrollment_number === en ? { ...entry, grade: value.toUpperCase() } : entry
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        // Filter out students with no marks entered (optional)
        const validMarks = marksList.filter(m => m.marks > 0);

        if (validMarks.length === 0) {
            setMessage({ type: 'error', text: "No marks entered for upload." });
            setLoading(false);
            return;
        }

        const payload = {
            subject_code: subjectCode,
            semester: Number(semester),
            marks_type: marksType,
            marks: validMarks.map(m => ({
                enrollment_number: m.enrollment_number,
                marks_obtained: m.marks,
                grade: m.grade
            }))
        };

        try {
            const res = await authFetch(`${apiBase}/admin/marks/upload`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                setMessage({ type: 'error', text: data.error || "Failed to upload marks." });
                return;
            }

            setMessage({ type: 'success', text: data.message || "Marks uploaded successfully!" });

        } catch (err) {
            setMessage({ type: 'error', text: "Network error. Could not connect to API." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-[#650C08]">Upload Student Marks</h1>
                <button
                    onClick={() => navigate("/admin/dashboard")}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                    ← Back to Dashboard
                </button>
            </header>

            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 border-b pb-4">
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
                            <label className="block text-sm font-medium text-gray-700">Semester</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                                placeholder="e.g., 5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Marks Type</label>
                            <select
                                required
                                value={marksType}
                                onChange={(e) => setMarksType(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                            >
                                <option value="Internal">Internal</option>
                                <option value="External">External (Final Exam)</option>
                                <option value="Practical">Practical</option>
                            </select>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold pt-4 text-gray-800">Enter Marks (Max Marks: 100 - Adjust as needed)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Marks Obtained</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Grade (Optional)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {marksList.map((student) => (
                                    <tr key={student.enrollment_number}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.enrollment_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.full_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100" // Set max marks here
                                                value={student.marks || ""}
                                                onChange={(e) => handleMarksChange(student.enrollment_number, Number(e.target.value))}
                                                className="w-full border rounded-md p-2 text-center"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <input
                                                type="text"
                                                value={student.grade}
                                                onChange={(e) => handleGradeChange(student.enrollment_number, e.target.value)}
                                                className="w-full border rounded-md p-2 text-center uppercase"
                                                maxLength={4}
                                            />
                                        </td>
                                    </tr>
                                ))}
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
                        disabled={loading || !subjectCode || !semester}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#650C08] hover:bg-[#7a1d16] disabled:opacity-50 transition"
                    >
                        {loading ? "Uploading Marks..." : "Upload Marks"}
                    </button>
                </form>
            </div>
        </div>
    );
}