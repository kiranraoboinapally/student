import React, { useState, useMemo } from "react";
import { Users, ArrowLeft, Search, Filter, Download } from "lucide-react";
import type { Institute, Course, Student } from "../../services/adminService";

interface StudentsByInstituteProps {
    selectedInstitute: Institute | null;
    selectedCourse: Course | null;
    students: Student[];
    courses: Course[];
    onBack: () => void;
}

export default function StudentsByInstitute({ selectedInstitute, selectedCourse, students, courses, onBack }: StudentsByInstituteProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCourse, setFilterCourse] = useState<string>("all");

    // In a real scenario, you'd have enrollment data linking students to institutes/courses
    // For now, we'll show all students
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch =
                student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.username.toLowerCase().includes(searchTerm.toLowerCase());

            // Would also filter by course if filterCourse !== "all"
            return matchesSearch;
        });
    }, [students, searchTerm, filterCourse]);

    const handleExport = () => {
        // Simple CSV export
        const headers = ['Name', 'Email', 'Username'];
        const csvContent = [
            headers.join(','),
            ...filteredStudents.map(s => [s.full_name, s.email, s.username].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students-${selectedInstitute?.name || 'all'}.csv`;
        a.click();
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
                                {selectedCourse ? selectedCourse.name || selectedCourse.course_name : selectedInstitute?.name || 'All Students'}
                            </h2>
                            <p className="text-gray-600">{filteredStudents.length} Students{selectedCourse ? ' Enrolled' : ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-[#650C08] text-white px-4 py-2 rounded-lg hover:bg-[#8B1A1A] transition-colors"
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

                    {/* Course Filter */}
                    {!selectedCourse && (
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent appearance-none bg-white"
                            >
                                <option value="all">All Courses</option>
                                {courses
                                    .filter(c => !selectedInstitute || c.institute_id === selectedInstitute.institute_id)
                                    .map(course => (
                                        <option key={course.course_id || course.id} value={course.course_id || course.id}>
                                            {course.name || course.course_name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Students Table */}
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
                            {filteredStudents.map((student, idx) => (
                                <tr key={student.user_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center text-white font-bold">
                                                {student.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{student.full_name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{student.email}</td>
                                    <td className="px-6 py-4 text-gray-700 font-mono text-sm">{student.username}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredStudents.length === 0 && (
                    <div className="p-12 text-center">
                        <Users className="mx-auto mb-4 text-gray-300" size={48} />
                        <p className="text-gray-500 font-medium">No students found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>

            {/* Summary Footer */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                <p className="text-sm text-gray-600 text-center">
                    Showing <span className="font-bold text-gray-900">{filteredStudents.length}</span> of{' '}
                    <span className="font-bold text-gray-900">{students.length}</span> total students
                </p>
            </div>
        </div>
    );
}
