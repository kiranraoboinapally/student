import React, { useState, useMemo } from "react";
import { Building2, Users, BookOpen, ChevronRight, Search } from "lucide-react";
import type { Institute, Course, Student } from "../../services/adminService";

interface InstituteDrillDownProps {
    institutes: Institute[];
    courses: Course[];
    students: Student[];
    onSelectInstitute: (institute: Institute) => void;
}

export default function InstituteDrillDown({ institutes, courses, students, onSelectInstitute }: InstituteDrillDownProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9; // Show more cards per page

    const instituteStats = useMemo(() => {
        return institutes.map(institute => {
            const instituteCourses = courses.filter(c =>
                c.institute_id === institute.institute_id ||
                (c.institute_name && c.institute_name === institute.institute_name)
            );

            const instituteStudents = students.filter(s =>
                s.institute_id === institute.institute_id ||
                s.institute_name === institute.institute_name
            );

            const activeStudents = instituteStudents.filter(s =>
                s.student_status && s.student_status.toLowerCase() === "active"
            );

            return {
                ...institute,
                courseCount: instituteCourses.length,
                totalStudents: instituteStudents.length,
                activeStudents: activeStudents.length
            };
        });
    }, [institutes, courses, students]);

    const filteredInstitutes = useMemo(() => {
        return instituteStats
            .filter(inst =>
                inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (inst.city && inst.city.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [instituteStats, searchTerm]);

    const totalPages = Math.ceil(filteredInstitutes.length / itemsPerPage);
    const paginatedInstitutes = filteredInstitutes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white/95 backdrop-blur rounded-lg p-2 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search institutes..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-8 pr-2 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#650C08] focus:border-transparent"
                    />
                </div>
            </div>

            {/* Institute Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedInstitutes.map(institute => (
                    <div
                        key={institute.institute_id}
                        onClick={() => onSelectInstitute(institute)}
                        className="bg-white/95 backdrop-blur rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-[#650C08] group"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center">
                                    <Building2 className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#650C08] transition-colors">
                                        {institute.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">{institute.code || 'N/A'}</p>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-400 group-hover:text-[#650C08] group-hover:translate-x-1 transition-all" size={16} />
                        </div>

                        {/* Location */}
                        {institute.city && (
                            <p className="text-xs text-gray-600 mb-2">
                                📍 {institute.city}{institute.state ? `, ${institute.state}` : ''}
                            </p>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-blue-50 rounded-lg p-2">
                                <BookOpen className="mx-auto mb-1 text-blue-600" size={16} />
                                <p className="text-sm font-bold text-blue-900">{institute.courseCount}</p>
                                <p className="text-xs text-blue-600">Courses</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2">
                                <Users className="mx-auto mb-1 text-green-600" size={16} />
                                <p className="text-sm font-bold text-green-900">{institute.totalStudents}</p>
                                <p className="text-xs text-green-600">Students</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-2">
                                <Users className="mx-auto mb-1 text-purple-600" size={16} />
                                <p className="text-sm font-bold text-purple-900">{institute.activeStudents}</p>
                                <p className="text-xs text-purple-600">Active</p>
                            </div>
                        </div>

                        {/* Contact */}
                        {institute.contact_number && (
                            <p className="text-xs text-gray-500 mt-2">Contact: {institute.contact_number}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4 text-sm">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {filteredInstitutes.length === 0 && (
                <div className="bg-white/95 rounded-lg p-8 text-center shadow-sm">
                    <Building2 className="mx-auto mb-2 text-gray-300" size={36} />
                    <p className="text-gray-500 font-medium">No institutes found</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria</p>
                </div>
            )}
        </div>
    );
}
