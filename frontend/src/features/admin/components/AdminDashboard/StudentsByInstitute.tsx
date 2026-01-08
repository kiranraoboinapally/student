import React, { useState, useMemo, useEffect } from "react";
import { Users, ArrowLeft, Search, Filter, Download, RefreshCw } from "lucide-react";
import type { Institute, Course, Student } from "../../services/adminService";
import AdminService from "../../services/adminService";
import { useAuth } from "../../../auth/AuthProvider";

interface StudentsByInstituteProps {
    selectedInstitute: Institute | null;
    selectedCourse: Course | null;
    students: Student[]; // kept for compatibility, but no longer used for display
    courses: Course[];
    onBack: () => void;
}

export default function StudentsByInstitute({ selectedInstitute, selectedCourse, students, courses, onBack }: StudentsByInstituteProps) {
    const { authFetch } = useAuth();
    const service = new AdminService(authFetch);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState<string>("all");

    // Server-side pagination & loading
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [serverStudents, setServerStudents] = useState<Student[]>([]);

    // Updated useEffect: fetches students from backend with proper filters and pagination
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
            course_id: selectedCourse?.course_id,
            search: searchTerm || undefined,
        })
        .then(res => {
            // Backend returns "students" key
            setServerStudents(res.students || []);
            // Backend returns "pagination" object
            setTotal(res.pagination?.total || 0);
        })
        .catch(err => {
            console.error("Failed to fetch students:", err);
            setServerStudents([]);
            setTotal(0);
        })
        .finally(() => setLoading(false));
    }, [page, searchTerm, selectedInstitute, selectedCourse, service]);

    // Optional: Reset page to 1 when search term changes
    useEffect(() => {
        setPage(1);
    }, [searchTerm]);

    const handleExport = () => {
        const headers = ['Name', 'Email', 'Username', 'Course', 'Status'];
        const csvContent = [
            headers.join(','),
            ...serverStudents.map(s => [
                s.full_name || '',
                s.email || '',
                s.username || '',
                s.course_name || '',
                s.status || 'Active'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students-${(selectedCourse?.name || selectedInstitute?.institute_name || 'all').replace(/\s+/g, '_')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-lg">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[#650C08] hover:text-[#8B1A1A] mb-4 font-medium transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to {selectedCourse ? 'Courses' : 'Institutes'}
                </button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center">
                            <Users className="text-white" size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedCourse ? selectedCourse.name || selectedCourse.course_name : selectedInstitute?.institute_name || selectedInstitute?.name || 'All Students'}
                            </h2>
                            <p className="text-gray-600">
                                {total} Student{total !== 1 ? 's' : ''}
                                {selectedCourse ? ' Enrolled' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={serverStudents.length === 0}
                        className="flex items-center gap-2 bg-[#650C08] text-white px-4 py-2 rounded-lg hover:bg-[#8B1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent"
                        />
                    </div>

                    {/* Course Filter (only if no course pre-selected) */}
                    {!selectedCourse && (
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent appearance-none bg-white"
                            >
                                <option value="all">All Courses</option>
                                {courses.map((course) => (
                                    <option key={course.course_id} value={String(course.course_id)}>
                                        {course.name || course.course_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="text-center py-12">
                    <RefreshCw className="mx-auto mb-4 text-[#650C08] animate-spin" size={32} />
                    <p className="text-gray-600">Loading students...</p>
                </div>
            )}

            {/* Students Table */}
            {!loading && (
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
                                        Username
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {serverStudents.map((student, idx) => (
                                    <tr key={student.enrollment_number || student.user_id || idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center text-white font-bold">
                                                    {(student.full_name || student.student_name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {student.full_name || student.student_name || 'Unnamed Student'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{student.email || student.student_email_id || '-'}</td>
                                        <td className="px-6 py-4 text-gray-700 font-mono text-sm">
                                            {student.username || student.enrollment_number || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                {student.status || student.student_status || 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {serverStudents.length === 0 && !loading && (
                        <div className="p-12 text-center">
                            <Users className="mx-auto mb-4 text-gray-300" size={48} />
                            <p className="text-gray-500 font-medium">No students found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {searchTerm ? "Try adjusting your search" : "This institute or course has no students yet"}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {total > limit && !loading && (
                <div className="flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-100">
                    <span className="text-sm text-gray-600">
                        Page <strong>{page}</strong> of <strong>{Math.ceil(total / limit)}</strong>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= Math.ceil(total / limit)}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Summary Footer */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg text-center">
                <p className="text-sm text-gray-600">
                    Showing <span className="font-bold text-gray-900">{serverStudents.length}</span> of{' '}
                    <span className="font-bold text-gray-900">{total}</span> total students
                </p>
            </div>
        </div>
    );
}