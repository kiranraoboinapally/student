import { useState, useMemo } from "react";
import {
  BookOpen,
  Users,
  Clock,
  ChevronRight,
  ArrowLeft,
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  Building2,
  TrendingUp
} from "lucide-react";

import type { Student, Course, Institute } from "../../services/adminService";

interface CourseDrillDownProps {
  selectedInstitute: Institute;
  courses: Course[];   // all courses from backend
  students: Student[]; // all students from backend
  onSelectCourse: (course: Course) => void;
  onBack: () => void;
  onAdd: () => void;
  onEdit: (course: Course) => void;
  onDelete: (id: number) => void;
}

type SortKey = "name" | "studentCount" | "duration_years";
type SortOrder = "asc" | "desc";

export default function CourseDrillDown({
  selectedInstitute,
  courses,
  students,
  onSelectCourse,
  onBack,
  onAdd,
  onEdit,
  onDelete
}: CourseDrillDownProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("studentCount");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // --- Filter courses by selected institute ---
  const instituteCourses = useMemo(() => {
    return courses.filter(
      (course) => course.institute_id === selectedInstitute.institute_id
    );
  }, [courses, selectedInstitute]);

  // --- Add stats per course ---
  const courseStats = useMemo(() => {
    return instituteCourses.map((course) => {
      const enrolledStudents = students.filter(
        (s) => s.course_id === course.course_id || s.course_name === course.name
      );
      const enrolled = enrolledStudents.length;
      const active = enrolledStudents.filter((s) => s.status === "active").length;
      const completionRate = enrolled > 0 ? Math.round((active / enrolled) * 100) : 0;

      return {
        ...course,
        studentCount: enrolled,
        activeStudents: active,
        totalSemesters: course.duration_years || 2,
        completionRate
      };
    });
  }, [instituteCourses, students]);

  // --- Sorting ---
  const sortedCourses = useMemo(() => {
    return [...courseStats].sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortOrder === "asc" ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [courseStats, sortKey, sortOrder]);

  // --- Search filter ---
  const filteredCourses = useMemo(() => {
    return sortedCourses.filter((course) =>
      (course.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.code || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, sortedCourses]);

  // --- Toggle sort ---
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
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
          Back to Institutes
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Building2 className="text-[#650C08]" size={28} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedInstitute.institute_name ?? selectedInstitute.name}</h2>
              <p className="text-sm text-gray-500">Courses Overview</p>
            </div>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#650C08] text-white rounded-lg hover:bg-[#8B1A1A] transition-colors shadow-md"
          >
            <Plus size={16} />
            Create Course
          </button>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search courses by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent transition-shadow"
          />
        </div>
        <button onClick={() => toggleSort("studentCount")} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <ArrowUpDown size={16} />
          Sort by Students {sortOrder.toUpperCase()}
        </button>
      </div>

      {/* Courses */}
      <div className="space-y-8">
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map((course) => (
              <div
                key={course.course_id}
                onClick={() => onSelectCourse(course)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-[#650C08] group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900 group-hover:text-[#650C08] line-clamp-1">{course.name}</h4>
                  <ChevronRight className="text-gray-400 group-hover:text-[#650C08] group-hover:translate-x-1 transition-all flex-shrink-0" size={20} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <Users className="mx-auto mb-1 text-blue-600" size={16} />
                    <p className="text-sm font-bold text-blue-900">{course.studentCount}</p>
                    <p className="text-xs text-blue-600">Enrolled</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <Clock className="mx-auto mb-1 text-green-600" size={16} />
                    <p className="text-sm font-bold text-green-900">{course.duration_years || 1}Y</p>
                    <p className="text-xs text-green-600">Duration</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <TrendingUp className="mx-auto mb-1 text-purple-600" size={16} />
                    <p className="text-sm font-bold text-purple-900">{course.completionRate}%</p>
                    <p className="text-xs text-purple-600">Completion</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(course); }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(course.course_id); }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/95 rounded-xl p-12 text-center shadow-lg">
            <BookOpen className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500 font-medium">No courses found for this institute</p>
            <p className="text-sm text-gray-400 mt-1">Get started by creating your first course.</p>
            <button
              onClick={onAdd}
              className="mt-4 flex items-center gap-2 mx-auto px-6 py-3 bg-[#650C08] text-white rounded-lg hover:bg-[#8B1A1A] transition-colors shadow-md"
            >
              <Plus size={18} />
              Create First Course
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
