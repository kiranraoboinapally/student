import React, { useState, useEffect } from "react";
import { Users, ArrowLeft, Search, Download, RefreshCw } from "lucide-react";
import type { Institute } from "../../services/adminService";
import type { CourseFromStudents } from "../../services/adminService";
import AdminService from "../../services/adminService";
import { useAuth } from "../../../auth/AuthProvider";

interface StudentsByInstituteProps {
    selectedInstitute: Institute | null;
    selectedCourse: CourseFromStudents | null;
    students: any[]; // kept for compatibility
    courses: CourseFromStudents[];
    onBack: () => void;
}

export default function StudentsByInstitute({
    selectedInstitute,
    selectedCourse,
    onBack
}: StudentsByInstituteProps) {
    const { authFetch } = useAuth();
    const service = new AdminService(authFetch);

    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [serverStudents, setServerStudents] = useState<any[]>([]);

    // Fetch students — correctly filtered by institute + course name
    useEffect(() => {
        if (!selectedInstitute?.institute_id) {
            setServerStudents([]);
            setTotal(0);
            return;
        }

        setLoading(true);

        service.getStudents({
            page,
            limit,
            institute_id: selectedInstitute.institute_id,
            // Critical: Pass course NAME (string) when course is selected
            course_id: selectedCourse?.name,
            search: searchTerm || undefined,
        })
        .then(res => {
            setServerStudents(res.students || []);
            setTotal(res.pagination?.total || 0);
        })
        .catch(err => {
            console.error("Failed to fetch students:", err);
            setServerStudents([]);
            setTotal(0);
        })
        .finally(() => {
            setLoading(false);
        });
    }, [page, searchTerm, selectedInstitute, selectedCourse, service]);

    // Reset page when context or search changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm, selectedInstitute, selectedCourse]);

    const handleExport = () => {
        const headers = ["Name", "Email", "Enrollment/Username", "Course", "Status"];
        const csvRows = [
            headers.join(","),
            ...serverStudents.map(s => [
                `"${(s.full_name || s.student_name || "").replace(/"/g, '""')}"`,
                s.email || s.student_email_id || "",
                s.enrollment_number || s.username || "",
                `"${(s.course_name || "").replace(/"/g, '""')}"`,
                s.status || s.student_status || "Active"
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `students_${selectedCourse ? selectedCourse.name.replace(/[^a-z0-9]/gi, '_') : selectedInstitute?.institute_name?.replace(/[^a-z0-9]/gi, '_') || 'all'}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-lg">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[#650C08] hover:text-[#8B1A1A] mb-4 font-medium transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to {selectedCourse ? "Courses" : "Institutes"}
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center">
                            <Users className="text-white" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedCourse?.name || selectedInstitute?.institute_name || "Students"}
                            </h2>
                            <p className="text-gray-600 mt-1">
                                {total} Student{total !== 1 ? "s" : ""} {selectedCourse ? "enrolled in this course" : "in this institute"}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={serverStudents.length === 0 || loading}
                        className="flex items-center gap-2 bg-[#650C08] text-white px-5 py-3 rounded-lg hover:bg-[#8B1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={`Search students ${selectedCourse ? "in this course" : "in this institute"}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent outline-none transition-shadow"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-16">
                    <RefreshCw className="mx-auto mb-4 text-[#650C08] animate-spin" size={40} />
                    <p className="text-gray-600 text-lg">Loading students...</p>
                </div>
            )}

            {/* Students Table */}
            {!loading && serverStudents.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Student Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Enrollment / Username
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {serverStudents.map((student, idx) => (
                                    <tr key={student.enrollment_number || student.student_id || idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center text-white font-bold text-lg">
                                                    {(student.full_name || student.student_name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {student.full_name || student.student_name || "Unnamed Student"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {student.email || student.student_email_id || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                                            {student.enrollment_number || student.username || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                {student.status || student.student_status || "Active"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && serverStudents.length === 0 && (
                <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-16 text-center">
                    <Users className="mx-auto mb-6 text-gray-300" size={64} />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        No students found
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        {searchTerm
                            ? "No students match your search in this context."
                            : selectedCourse
                            ? "No students are enrolled in this course yet."
                            : "This institute has no enrolled students yet."}
                    </p>
                </div>
            )}

            {/* Pagination */}
            {!loading && total > limit && (
                <div className="flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-100">
                    <span className="text-sm text-gray-600">
                        Page <strong>{page}</strong> of <strong>{Math.ceil(total / limit)}</strong>
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            disabled={page === 1}
                            className="px-5 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(prev => prev + 1)}
                            disabled={page >= Math.ceil(total / limit)}
                            className="px-5 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Footer */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg text-center border border-gray-100">
                <p className="text-sm text-gray-600">
                    Showing <span className="font-bold text-gray-900">{serverStudents.length}</span> of{" "}
                    <span className="font-bold text-gray-900">{total}</span> student{total !== 1 ? "s" : ""}
                </p>
            </div>
        </div>
    );
}