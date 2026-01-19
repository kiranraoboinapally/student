import { useState, useEffect, useCallback } from "react";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import {
    Calendar,
    CheckCircle,
    XCircle,
    RefreshCw,
    Users,
    Save,
    Clock,
    BookOpen,
    ChevronDown,
    Search,
    Download,
    Filter,
    Eye,
    Edit3,
    BarChart3,
    AlertCircle,
    Check,
    X,
    FileSpreadsheet
} from "lucide-react";

// ==================== INTERFACES ====================
interface Student {
    student_id: number;
    enrollment_number: number;
    full_name: string;
    father_name: string;
    email: string;
    phone: string | null;
    course_name: string;
    batch: string;
    session: string;
    status: string;
}

interface Subject {
    subject_code: string;
    subject_name: string;
    credits: number;
    semester: number;
}

interface AttendanceRecord {
    enrollment_number: number;
    student_name: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    subject_code: string;
    marked_at: string;
}

interface AttendanceSummary {
    enrollment_number: number;
    student_name: string;
    total_classes: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
}

type ViewMode = 'mark' | 'view' | 'reports';
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// ==================== MAIN COMPONENT ====================
export default function AttendanceMarker() {
    const { authFetch } = useAuth();
    
    // View State
    const [viewMode, setViewMode] = useState<ViewMode>('mark');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Data State
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
    
    // Filter State
    const [selectedCourse, setSelectedCourse] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedSemester, setSelectedSemester] = useState<number>(1);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Attendance State
    const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
    const [lectureNumber, setLectureNumber] = useState<number>(1);
    const [lectureTime, setLectureTime] = useState("09:00");
    
    // View Attendance State
    const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
    const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
    
    // Existing Attendance Check
    const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[] | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // ==================== LOAD INITIAL DATA ====================
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            // Load faculty's assigned courses and students
            const [coursesRes, studentsRes] = await Promise.all([
                authFetch(`${apiBase}/faculty/my-courses`),
                authFetch(`${apiBase}/faculty/students`)
            ]);

            if (coursesRes.ok) {
                const coursesData = await coursesRes.json();
                const courses = coursesData.courses || [];
                const courseNames = [...new Set(courses.map((c: any) => c.course_name))] as string[];
                setAssignedCourses(courseNames);
                
                // Extract subjects from courses
                const subjectsList: Subject[] = courses.map((c: any) => ({
                    subject_code: c.subject_code || `SUB${c.course_stream_id}`,
                    subject_name: c.subject_name || c.course_name,
                    credits: c.credits || 3,
                    semester: c.semester || 1
                }));
                setSubjects(subjectsList);
                
                if (courseNames.length > 0) {
                    setSelectedCourse(courseNames[0]);
                }
            }

            if (studentsRes.ok) {
                const studentsData = await studentsRes.json();
                setStudents(studentsData.students || []);
            }
        } catch (e) {
            console.error("Error loading data:", e);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    // ==================== CHECK EXISTING ATTENDANCE ====================
    const checkExistingAttendance = useCallback(async () => {
        if (!selectedCourse || !selectedSubject || !selectedDate) return;
        
        try {
            const res = await authFetch(
                `${apiBase}/faculty/attendance/check?course=${encodeURIComponent(selectedCourse)}&subject=${selectedSubject}&date=${selectedDate}`
            );
            
            if (res.ok) {
                const data = await res.json();
                if (data.exists && data.records) {
                    setExistingAttendance(data.records);
                    // Pre-fill attendance from existing records
                    const existing: Record<number, AttendanceStatus> = {};
                    data.records.forEach((r: AttendanceRecord) => {
                        existing[r.enrollment_number] = r.status;
                    });
                    setAttendance(existing);
                } else {
                    setExistingAttendance(null);
                    // Initialize all as present
                    const init: Record<number, AttendanceStatus> = {};
                    filteredStudents.forEach(s => {
                        init[s.enrollment_number] = 'present';
                    });
                    setAttendance(init);
                }
            }
        } catch (e) {
            console.error("Error checking attendance:", e);
            setExistingAttendance(null);
        }
    }, [selectedCourse, selectedSubject, selectedDate, authFetch]);

    useEffect(() => {
        if (viewMode === 'mark') {
            checkExistingAttendance();
        }
    }, [selectedCourse, selectedSubject, selectedDate, viewMode, checkExistingAttendance]);

    // ==================== LOAD ATTENDANCE HISTORY ====================
    const loadAttendanceHistory = useCallback(async () => {
        if (!selectedCourse || !selectedSubject) return;
        
        setLoading(true);
        try {
            const res = await authFetch(
                `${apiBase}/faculty/attendance/history?course=${encodeURIComponent(selectedCourse)}&subject=${selectedSubject}&month=${viewMonth}&year=${viewYear}`
            );
            
            if (res.ok) {
                const data = await res.json();
                setAttendanceHistory(data.records || []);
                setAttendanceSummary(data.summary || []);
            }
        } catch (e) {
            console.error("Error loading history:", e);
        } finally {
            setLoading(false);
        }
    }, [selectedCourse, selectedSubject, viewMonth, viewYear, authFetch]);

    useEffect(() => {
        if (viewMode === 'view' || viewMode === 'reports') {
            loadAttendanceHistory();
        }
    }, [viewMode, loadAttendanceHistory]);

    // ==================== FILTERED STUDENTS ====================
    const filteredStudents = students.filter(s => {
        const matchesCourse = !selectedCourse || s.course_name === selectedCourse;
        const matchesSearch = !searchQuery || 
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.enrollment_number.toString().includes(searchQuery);
        const isActive = s.status === 'Active' || s.status === 'Alumni';
        return matchesCourse && matchesSearch && isActive;
    });

    // ==================== ATTENDANCE ACTIONS ====================
    const setStudentAttendance = (enrollmentNumber: number, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [enrollmentNumber]: status }));
    };

    const markAllAs = (status: AttendanceStatus) => {
        const updated: Record<number, AttendanceStatus> = {};
        filteredStudents.forEach(s => {
            updated[s.enrollment_number] = status;
        });
        setAttendance(prev => ({ ...prev, ...updated }));
    };

    const handleSaveAttendance = async () => {
        if (!selectedSubject) {
            alert("Please select a subject");
            return;
        }

        setSaving(true);
        try {
            const records = filteredStudents.map(s => ({
                enrollment_number: s.enrollment_number,
                student_name: s.full_name,
                date: selectedDate,
                status: attendance[s.enrollment_number] || 'present',
                subject_code: selectedSubject,
                lecture_number: lectureNumber,
                lecture_time: lectureTime,
                course_name: selectedCourse,
                semester: selectedSemester
            }));

            const endpoint = isEditing 
                ? `${apiBase}/faculty/attendance/update`
                : `${apiBase}/faculty/attendance/mark`;

            const res = await authFetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ records })
            });

            if (res.ok) {
                alert(isEditing ? "Attendance updated successfully!" : "Attendance saved successfully!");
                setIsEditing(false);
                checkExistingAttendance();
            } else {
                const error = await res.json();
                alert(error.message || "Failed to save attendance");
            }
        } catch (e) {
            console.error(e);
            alert("Error saving attendance");
        } finally {
            setSaving(false);
        }
    };

    // ==================== STATISTICS ====================
    const stats = {
        total: filteredStudents.length,
        present: filteredStudents.filter(s => attendance[s.enrollment_number] === 'present').length,
        absent: filteredStudents.filter(s => attendance[s.enrollment_number] === 'absent').length,
        late: filteredStudents.filter(s => attendance[s.enrollment_number] === 'late').length,
        excused: filteredStudents.filter(s => attendance[s.enrollment_number] === 'excused').length,
    };

    const attendancePercentage = stats.total > 0 
        ? Math.round(((stats.present + stats.late) / stats.total) * 100) 
        : 0;

    // ==================== EXPORT FUNCTION ====================
    const exportAttendance = () => {
        const csvContent = [
            ['Enrollment No', 'Student Name', 'Father Name', 'Date', 'Status', 'Subject'].join(','),
            ...filteredStudents.map(s => [
                s.enrollment_number,
                `"${s.full_name}"`,
                `"${s.father_name}"`,
                selectedDate,
                attendance[s.enrollment_number] || 'present',
                selectedSubject
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${selectedCourse}_${selectedDate}.csv`;
        a.click();
    };

    // ==================== RENDER ====================
    return (
        <div className="space-y-6">
            {/* HEADER WITH VIEW TOGGLE */}
            <div className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Attendance Management System
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>
                    
                    {/* View Mode Tabs */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <TabButton 
                            active={viewMode === 'mark'} 
                            onClick={() => setViewMode('mark')}
                            icon={<Edit3 size={16} />}
                            label="Mark Attendance"
                        />
                        <TabButton 
                            active={viewMode === 'view'} 
                            onClick={() => setViewMode('view')}
                            icon={<Eye size={16} />}
                            label="View Records"
                        />
                        <TabButton 
                            active={viewMode === 'reports'} 
                            onClick={() => setViewMode('reports')}
                            icon={<BarChart3 size={16} />}
                            label="Reports"
                        />
                    </div>
                </div>
            </div>

            {/* COURSE & SUBJECT SELECTION */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Course Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <BookOpen size={14} className="inline mr-1" />
                            Select Course
                        </label>
                        <select
                            value={selectedCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#650C08]/20 focus:border-[#650C08]"
                        >
                            <option value="">-- Select Course --</option>
                            {assignedCourses.map(course => (
                                <option key={course} value={course}>{course}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <BookOpen size={14} className="inline mr-1" />
                            Select Subject
                        </label>
                        <select
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#650C08]/20 focus:border-[#650C08]"
                        >
                            <option value="">-- Select Subject --</option>
                            {subjects.map(sub => (
                                <option key={sub.subject_code} value={sub.subject_code}>
                                    {sub.subject_code} - {sub.subject_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Semester Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semester
                        </label>
                        <select
                            value={selectedSemester}
                            onChange={e => setSelectedSemester(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#650C08]/20 focus:border-[#650C08]"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Selection (for Mark mode) / Month-Year (for View mode) */}
                    {viewMode === 'mark' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar size={14} className="inline mr-1" />
                                Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#650C08]/20 focus:border-[#650C08]"
                            />
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                                <select
                                    value={viewMonth}
                                    onChange={e => setViewMonth(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                <select
                                    value={viewYear}
                                    onChange={e => setViewYear(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                >
                                    {[2023, 2024, 2025].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Additional Options for Mark Mode */}
                {viewMode === 'mark' && (
                    <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock size={14} className="inline mr-1" />
                                Lecture Number
                            </label>
                            <select
                                value={lectureNumber}
                                onChange={e => setLectureNumber(Number(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg p-2.5"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                    <option key={num} value={num}>Lecture {num}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock size={14} className="inline mr-1" />
                                Lecture Time
                            </label>
                            <input
                                type="time"
                                value={lectureTime}
                                onChange={e => setLectureTime(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Search size={14} className="inline mr-1" />
                                Search Student
                            </label>
                            <input
                                type="text"
                                placeholder="Name or Enrollment No..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* EXISTING ATTENDANCE WARNING */}
            {viewMode === 'mark' && existingAttendance && !isEditing && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-yellow-600" size={24} />
                        <div>
                            <p className="font-medium text-yellow-800">
                                Attendance already marked for this date
                            </p>
                            <p className="text-sm text-yellow-600">
                                {existingAttendance.length} records found. You can edit if needed.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 font-medium"
                    >
                        Edit Attendance
                    </button>
                </div>
            )}

            {/* CONTENT BASED ON VIEW MODE */}
            {viewMode === 'mark' && (
                <MarkAttendanceView
                    loading={loading}
                    students={filteredStudents}
                    attendance={attendance}
                    stats={stats}
                    attendancePercentage={attendancePercentage}
                    existingAttendance={existingAttendance}
                    isEditing={isEditing}
                    saving={saving}
                    setStudentAttendance={setStudentAttendance}
                    markAllAs={markAllAs}
                    handleSaveAttendance={handleSaveAttendance}
                    exportAttendance={exportAttendance}
                    selectedSubject={selectedSubject}
                />
            )}

            {viewMode === 'view' && (
                <ViewAttendanceRecords
                    loading={loading}
                    attendanceHistory={attendanceHistory}
                    selectedCourse={selectedCourse}
                    viewMonth={viewMonth}
                    viewYear={viewYear}
                />
            )}

            {viewMode === 'reports' && (
                <AttendanceReports
                    loading={loading}
                    summary={attendanceSummary}
                    selectedCourse={selectedCourse}
                    selectedSubject={selectedSubject}
                />
            )}
        </div>
    );
}

// ==================== MARK ATTENDANCE VIEW ====================
function MarkAttendanceView({
    loading,
    students,
    attendance,
    stats,
    attendancePercentage,
    existingAttendance,
    isEditing,
    saving,
    setStudentAttendance,
    markAllAs,
    handleSaveAttendance,
    exportAttendance,
    selectedSubject
}: {
    loading: boolean;
    students: Student[];
    attendance: Record<number, AttendanceStatus>;
    stats: { total: number; present: number; absent: number; late: number; excused: number };
    attendancePercentage: number;
    existingAttendance: AttendanceRecord[] | null;
    isEditing: boolean;
    saving: boolean;
    setStudentAttendance: (id: number, status: AttendanceStatus) => void;
    markAllAs: (status: AttendanceStatus) => void;
    handleSaveAttendance: () => void;
    exportAttendance: () => void;
    selectedSubject: string;
}) {
    const canMark = !existingAttendance || isEditing;

    return (
        <>
            {/* STATISTICS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Total Students" value={stats.total} icon={<Users />} color="blue" />
                <StatCard label="Present" value={stats.present} icon={<CheckCircle />} color="green" />
                <StatCard label="Absent" value={stats.absent} icon={<XCircle />} color="red" />
                <StatCard label="Late" value={stats.late} icon={<Clock />} color="yellow" />
                <StatCard 
                    label="Attendance %" 
                    value={`${attendancePercentage}%`} 
                    icon={<BarChart3 />} 
                    color={attendancePercentage >= 75 ? "green" : attendancePercentage >= 50 ? "yellow" : "red"} 
                />
            </div>

            {/* QUICK ACTIONS */}
            {canMark && (
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
                        <button
                            onClick={() => markAllAs('present')}
                            className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium flex items-center gap-2"
                        >
                            <Check size={16} /> Mark All Present
                        </button>
                        <button
                            onClick={() => markAllAs('absent')}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium flex items-center gap-2"
                        >
                            <X size={16} /> Mark All Absent
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={exportAttendance}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2"
                        >
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>
            )}

            {/* STUDENT LIST */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {loading ? (
                    <LoadingState message="Loading students..." />
                ) : students.length === 0 ? (
                    <EmptyState message="No students found for the selected course" />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Enrollment No.
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Father's Name
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Attendance Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {students.map((student, index) => (
                                        <StudentRow
                                            key={student.enrollment_number}
                                            index={index + 1}
                                            student={student}
                                            status={attendance[student.enrollment_number] || 'present'}
                                            onStatusChange={(status) => setStudentAttendance(student.enrollment_number, status)}
                                            disabled={!canMark}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* SAVE BUTTON */}
                        {canMark && (
                            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    {stats.present + stats.late} of {stats.total} students marked present/late
                                </p>
                                <button
                                    onClick={handleSaveAttendance}
                                    disabled={saving || !selectedSubject}
                                    className="px-6 py-2.5 bg-[#650C08] text-white rounded-lg hover:bg-[#520a06] disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Save size={18} />
                                    {saving ? "Saving..." : isEditing ? "Update Attendance" : "Save Attendance"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

// ==================== STUDENT ROW ====================
function StudentRow({
    index,
    student,
    status,
    onStatusChange,
    disabled
}: {
    index: number;
    student: Student;
    status: AttendanceStatus;
    onStatusChange: (status: AttendanceStatus) => void;
    disabled: boolean;
}) {
    const statusColors: Record<AttendanceStatus, string> = {
        present: 'bg-green-100 text-green-700 border-green-300',
        absent: 'bg-red-100 text-red-700 border-red-300',
        late: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        excused: 'bg-blue-100 text-blue-700 border-blue-300'
    };

    const rowBg = status === 'absent' ? 'bg-red-50' : 
                  status === 'late' ? 'bg-yellow-50' : 
                  status === 'excused' ? 'bg-blue-50' : '';

    return (
        <tr className={`hover:bg-gray-50 transition-colors ${rowBg}`}>
            <td className="px-4 py-3 text-sm text-gray-500">{index}</td>
            <td className="px-4 py-3">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {student.enrollment_number}
                </span>
            </td>
            <td className="px-4 py-3">
                <div>
                    <p className="font-medium text-gray-900">{student.full_name}</p>
                    {student.email && (
                        <p className="text-xs text-gray-500">{student.email}</p>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{student.father_name}</td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2">
                    {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => !disabled && onStatusChange(s)}
                            disabled={disabled}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                status === s
                                    ? statusColors[s] + ' ring-2 ring-offset-1 ring-current'
                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </td>
        </tr>
    );
}

// ==================== VIEW ATTENDANCE RECORDS ====================
function ViewAttendanceRecords({
    loading,
    attendanceHistory,
    selectedCourse,
    viewMonth,
    viewYear
}: {
    loading: boolean;
    attendanceHistory: AttendanceRecord[];
    selectedCourse: string;
    viewMonth: number;
    viewYear: number;
}) {
    // Get unique dates
    const dates = [...new Set(attendanceHistory.map(r => r.date))].sort();
    
    // Get unique students
    const students = [...new Map(
        attendanceHistory.map(r => [r.enrollment_number, { enrollment_number: r.enrollment_number, student_name: r.student_name }])
    ).values()];

    // Create attendance matrix
    const getStatus = (enrollmentNumber: number, date: string) => {
        const record = attendanceHistory.find(
            r => r.enrollment_number === enrollmentNumber && r.date === date
        );
        return record?.status;
    };

    const statusIcon: Record<string, JSX.Element> = {
        present: <Check className="text-green-600" size={16} />,
        absent: <X className="text-red-600" size={16} />,
        late: <Clock className="text-yellow-600" size={16} />,
        excused: <AlertCircle className="text-blue-600" size={16} />
    };

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">
                    Attendance Records - {new Date(viewYear, viewMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-sm text-gray-500">{selectedCourse}</p>
            </div>

            {loading ? (
                <LoadingState message="Loading attendance records..." />
            ) : attendanceHistory.length === 0 ? (
                <EmptyState message="No attendance records found for this period" />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50">
                                    Student
                                </th>
                                {dates.map(date => (
                                    <th key={date} className="px-3 py-3 text-center text-xs font-semibold text-gray-600">
                                        {new Date(date).getDate()}
                                        <br />
                                        <span className="text-gray-400 font-normal">
                                            {new Date(date).toLocaleDateString('en', { weekday: 'short' })}
                                        </span>
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    %
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map(student => {
                                const studentRecords = attendanceHistory.filter(
                                    r => r.enrollment_number === student.enrollment_number
                                );
                                const presentCount = studentRecords.filter(
                                    r => r.status === 'present' || r.status === 'late'
                                ).length;
                                const percentage = dates.length > 0 
                                    ? Math.round((presentCount / dates.length) * 100) 
                                    : 0;

                                return (
                                    <tr key={student.enrollment_number} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 sticky left-0 bg-white">
                                            <p className="font-medium text-gray-900 text-sm">{student.student_name}</p>
                                            <p className="text-xs text-gray-500">{student.enrollment_number}</p>
                                        </td>
                                        {dates.map(date => {
                                            const status = getStatus(student.enrollment_number, date);
                                            return (
                                                <td key={date} className="px-3 py-3 text-center">
                                                    {status ? statusIcon[status] : <span className="text-gray-300">-</span>}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                percentage >= 75 ? 'bg-green-100 text-green-700' :
                                                percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legend */}
            <div className="p-4 border-t bg-gray-50 flex items-center gap-6">
                <span className="text-sm text-gray-600">Legend:</span>
                <div className="flex items-center gap-2">
                    <Check className="text-green-600" size={16} />
                    <span className="text-sm">Present</span>
                </div>
                <div className="flex items-center gap-2">
                    <X className="text-red-600" size={16} />
                    <span className="text-sm">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="text-yellow-600" size={16} />
                    <span className="text-sm">Late</span>
                </div>
                <div className="flex items-center gap-2">
                    <AlertCircle className="text-blue-600" size={16} />
                    <span className="text-sm">Excused</span>
                </div>
            </div>
        </div>
    );
}

// ==================== ATTENDANCE REPORTS ====================
function AttendanceReports({
    loading,
    summary,
    selectedCourse,
    selectedSubject
}: {
    loading: boolean;
    summary: AttendanceSummary[];
    selectedCourse: string;
    selectedSubject: string;
}) {
    const lowAttendance = summary.filter(s => s.percentage < 75);
    const criticalAttendance = summary.filter(s => s.percentage < 50);

    const exportReport = () => {
        const csvContent = [
            ['Enrollment No', 'Student Name', 'Total Classes', 'Present', 'Absent', 'Late', 'Excused', 'Percentage'].join(','),
            ...summary.map(s => [
                s.enrollment_number,
                `"${s.student_name}"`,
                s.total_classes,
                s.present,
                s.absent,
                s.late,
                s.excused,
                `${s.percentage}%`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${selectedCourse}_${selectedSubject}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Alert Cards */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-yellow-600" size={24} />
                        <h4 className="font-semibold text-yellow-800">Low Attendance (&lt;75%)</h4>
                    </div>
                    <p className="text-2xl font-bold text-yellow-700">{lowAttendance.length} Students</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <XCircle className="text-red-600" size={24} />
                        <h4 className="font-semibold text-red-800">Critical Attendance (&lt;50%)</h4>
                    </div>
                    <p className="text-2xl font-bold text-red-700">{criticalAttendance.length} Students</p>
                </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-800">Attendance Summary Report</h3>
                        <p className="text-sm text-gray-500">{selectedCourse} - {selectedSubject}</p>
                    </div>
                    <button
                        onClick={exportReport}
                        className="px-4 py-2 bg-[#650C08] text-white rounded-lg hover:bg-[#520a06] text-sm font-medium flex items-center gap-2"
                    >
                        <FileSpreadsheet size={16} /> Export Report
                    </button>
                </div>

                {loading ? (
                    <LoadingState message="Generating report..." />
                ) : summary.length === 0 ? (
                    <EmptyState message="No data available for report" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enrollment</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student Name</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Total</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Present</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Absent</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Late</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Percentage</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {summary.map((s, i) => (
                                    <tr key={s.enrollment_number} className={`hover:bg-gray-50 ${s.percentage < 50 ? 'bg-red-50' : s.percentage < 75 ? 'bg-yellow-50' : ''}`}>
                                        <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3 font-mono text-sm">{s.enrollment_number}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{s.student_name}</td>
                                        <td className="px-4 py-3 text-center text-sm">{s.total_classes}</td>
                                        <td className="px-4 py-3 text-center text-sm text-green-600 font-medium">{s.present}</td>
                                        <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{s.absent}</td>
                                        <td className="px-4 py-3 text-center text-sm text-yellow-600 font-medium">{s.late}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                s.percentage >= 75 ? 'bg-green-100 text-green-700' :
                                                s.percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {s.percentage}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {s.percentage >= 75 ? (
                                                <span className="text-green-600 text-sm font-medium">Regular</span>
                                            ) : s.percentage >= 50 ? (
                                                <span className="text-yellow-600 text-sm font-medium">Warning</span>
                                            ) : (
                                                <span className="text-red-600 text-sm font-medium">Detained</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== HELPER COMPONENTS ====================
function TabButton({ active, onClick, icon, label }: {
    active: boolean;
    onClick: () => void;
    icon: JSX.Element;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                    ? 'bg-white text-[#650C08] shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
            }`}
        >
            {icon}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

function StatCard({ label, value, icon, color }: {
    label: string;
    value: string | number;
    icon: JSX.Element;
    color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
        purple: 'bg-purple-50 text-purple-600 border-purple-100'
    };

    return (
        <div className={`p-4 rounded-xl border ${colors[color]}`}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/50 rounded-lg">{icon}</div>
                <div>
                    <p className="text-xs opacity-80">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
}

function LoadingState({ message }: { message: string }) {
    return (
        <div className="text-center py-12">
            <RefreshCw className="animate-spin mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-500">{message}</p>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-12">
            <Users className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">{message}</p>
        </div>
    );
}