import React, { useState, useMemo } from "react";
import { Building2, Users, BookOpen, ChevronRight, Search, TrendingUp } from "lucide-react";
import type { Institute, Course, Student } from "../../services/adminService";

interface InstituteDrillDownProps {
    institutes: Institute[];
    courses: Course[];
    students: Student[];
    onSelectInstitute: (institute: Institute) => void;
}

export default function InstituteDrillDown({ institutes, courses, students, onSelectInstitute }: InstituteDrillDownProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // Calculate stats for each institute
    const instituteStats = useMemo(() => {
        return institutes.map(institute => {
            const instituteCourses = courses.filter(c =>
                c.institute_id === institute.institute_id ||
                (c.institute_name && c.institute_name === institute.institute_name)
            );
            const courseIds = instituteCourses.map(c => c.course_id);
            // Note: In a real scenario, you'd have enrollment data. For now, we'll show course count
            return {
                ...institute,
                courseCount: instituteCourses.length,
                studentCount: 0, // Would be calculated from enrollment data
                departments: new Set(instituteCourses.map(c => c.name?.split(' ')[0] || 'General')).size
            };
        });
    }, [institutes, courses]);

    const filteredInstitutes = instituteStats.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.city && inst.city.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search institutes by name or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent"
                    />
                </div>
            </div>

            {/* Institute Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInstitutes.map((institute) => (
                    <div
                        key={institute.institute_id}
                        onClick={() => onSelectInstitute(institute)}
                        className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-[#650C08] group"
                    >
                        {/* Institute Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center">
                                    <Building2 className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#650C08] transition-colors">
                                        {institute.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{institute.code || 'N/A'}</p>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-400 group-hover:text-[#650C08] group-hover:translate-x-1 transition-all" size={20} />
                        </div>

                        {/* Location */}
                        {institute.city && (
                            <p className="text-sm text-gray-600 mb-4">
                                📍 {institute.city}{institute.state ? `, ${institute.state}` : ''}
                            </p>
                        )}

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                <BookOpen className="mx-auto mb-1 text-blue-600" size={18} />
                                <p className="text-xl font-bold text-blue-900">{institute.courseCount}</p>
                                <p className="text-xs text-blue-600">Courses</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                <Users className="mx-auto mb-1 text-green-600" size={18} />
                                <p className="text-xl font-bold text-green-900">{institute.studentCount}</p>
                                <p className="text-xs text-green-600">Students</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-3 text-center">
                                <TrendingUp className="mx-auto mb-1 text-purple-600" size={18} />
                                <p className="text-xl font-bold text-purple-900">{institute.departments}</p>
                                <p className="text-xs text-purple-600">Branches</p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        {institute.contact_number && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500">Contact: {institute.contact_number}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredInstitutes.length === 0 && (
                <div className="bg-white/95 rounded-xl p-12 text-center shadow-lg">
                    <Building2 className="mx-auto mb-4 text-gray-300" size={48} />
                    <p className="text-gray-500 font-medium">No institutes found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
                </div>
            )}
        </div>
    );
}
