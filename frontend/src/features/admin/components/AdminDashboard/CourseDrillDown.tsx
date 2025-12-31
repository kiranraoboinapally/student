import React, { useState, useMemo } from "react";
import { BookOpen, Users, Clock, ChevronRight, ArrowLeft, Search } from "lucide-react";
import type { Institute, Course, Student } from "../../services/adminService";

interface CourseDrillDownProps {
    selectedInstitute: Institute;
    courses: Course[];
    students: Student[];
    onSelectCourse: (course: Course) => void;
    onBack: () => void;
}

export default function CourseDrillDown({ selectedInstitute, courses, students, onSelectCourse, onBack }: CourseDrillDownProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filter courses for selected institute
    // Filter courses for selected institute (Hybrid Match)
    const instituteCourses = useMemo(() => {
        return courses.filter(c => {
            // Match by ID
            if (c.institute_id === selectedInstitute.institute_id) return true;
            // Match by Name (Fallback)
            if (c.institute_name === selectedInstitute.institute_name) return true;
            // Match by enriched property if present (from previous steps)
            // ...
            return false;
        });
    }, [courses, selectedInstitute]);

    // Calculate stats for each course
    const courseStats = useMemo(() => {
        return instituteCourses.map(course => {
            // In a real scenario, you'd have enrollment data
            return {
                ...course,
                studentCount: 0, // Would be calculated from enrollment data
                activeStudents: 0,
                totalSemesters: (course.duration_years || 0) * 2
            };
        });
    }, [instituteCourses]);

    const filteredCourses = courseStats.filter(course =>
        (course.name || course.course_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.code || course.course_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group courses by department/branch
    const coursesByDepartment = useMemo(() => {
        const grouped = new Map<string, typeof courseStats>();
        filteredCourses.forEach(course => {
            const dept = (course.name || course.course_name || 'General').split(' ')[0];
            if (!grouped.has(dept)) {
                grouped.set(dept, []);
            }
            grouped.get(dept)!.push(course);
        });
        return Array.from(grouped.entries());
    }, [filteredCourses]);

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-lg">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[#650C08] hover:text-[#8B1A1A] mb-4 font-medium transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Institutes
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center">
                        <BookOpen className="text-white" size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedInstitute.name}</h2>
                        <p className="text-gray-600">{instituteCourses.length} Courses Available</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search courses by name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent"
                    />
                </div>
            </div>

            {/* Courses Grouped by Department */}
            {coursesByDepartment.map(([department, deptCourses]) => (
                <div key={department} className="space-y-4">
                    <h3 className="text-lg font-bold text-white/90 px-2">{department} Department</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {deptCourses.map((course) => (
                            <div
                                key={course.course_id || course.id}
                                onClick={() => onSelectCourse(course)}
                                className="bg-white/95 backdrop-blur rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-[#650C08] group"
                            >
                                {/* Course Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-900 text-base group-hover:text-[#650C08] transition-colors line-clamp-2">
                                            {course.name || course.course_name}
                                        </h4>
                                        <p className="text-sm text-gray-500 font-mono mt-1">{course.code || course.course_code || 'N/A'}</p>
                                    </div>
                                    <ChevronRight className="text-gray-400 group-hover:text-[#650C08] group-hover:translate-x-1 transition-all flex-shrink-0" size={20} />
                                </div>

                                {/* Course Stats */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                                        <Users className="mx-auto mb-1 text-blue-600" size={16} />
                                        <p className="text-sm font-bold text-blue-900">{course.studentCount}</p>
                                        <p className="text-xs text-blue-600">Enrolled</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-2 text-center">
                                        <Clock className="mx-auto mb-1 text-green-600" size={16} />
                                        <p className="text-sm font-bold text-green-900">{course.duration_years || 0}Y</p>
                                        <p className="text-xs text-green-600">Duration</p>
                                    </div>
                                </div>

                                {/* Description if available */}
                                {course.description && (
                                    <p className="text-xs text-gray-600 line-clamp-2 border-t border-gray-100 pt-2">
                                        {course.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {filteredCourses.length === 0 && (
                <div className="bg-white/95 rounded-xl p-12 text-center shadow-lg">
                    <BookOpen className="mx-auto mb-4 text-gray-300" size={48} />
                    <p className="text-gray-500 font-medium">No courses found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria</p>
                </div>
            )}
        </div>
    );
}
