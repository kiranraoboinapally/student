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
    Search,
    Download,
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
    semester: number;
}

interface TimePeriod {
    id: string;
    label: string;
    start: string;
    end: string;
}

interface AttendanceRecord {
    enrollment_number: number;
    student_name: string;
    date: string;
    status: 'present' | 'absent' | 'late';
    subject_code: string;
    time_period?: string;
    marked_at?: string;
}

interface AttendanceSummary {
    enrollment_number: number;
    student_name: string;
    total_classes: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
}

type ViewMode = 'mark' | 'view' | 'reports';
type AttendanceStatus = 'present' | 'absent' | 'late';

// ==================== TIME PERIODS (Customize as needed) ====================
const TIME_PERIODS: TimePeriod[] = [
    { id: '1', label: '9:00 - 10:00 AM', start: '09:00', end: '10:00' },
    { id: '2', label: '10:00 - 11:00 AM', start: '10:00', end: '11:00' },
    { id: '3', label: '11:00 - 12:00 PM', start: '11:00', end: '12:00' },
    { id: '4', label: '12:00 - 1:00 PM', start: '12:00', end: '13:00' },
    { id: '5', label: '2:00 - 3:00 PM', start: '14:00', end: '15:00' },
    { id: '6', label: '3:00 - 4:00 PM', start: '15:00', end: '16:00' },
    { id: '7', label: '4:00 - 5:00 PM', start: '16:00', end: '17:00' },
];

// Get current time period based on current time
const getCurrentTimePeriod = (): string => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;

    for (const period of TIME_PERIODS) {
        const [startHour, startMin] = period.start.split(':').map(Number);
        const [endHour, endMin] = period.end.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        if (currentTime >= startTime && currentTime < endTime) {
            return period.id;
        }
    }
    return TIME_PERIODS[0].id; // Default to first period
};

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
    const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(getCurrentTimePeriod());
    const [searchQuery, setSearchQuery] = useState("");
    
    // Attendance State
    const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
    
    // View Attendance State
    const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
    const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
    
    // Existing Attendance Check
    const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[] | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Get selected time period details
    const selectedPeriodDetails = TIME_PERIODS.find(p => p.id === selectedTimePeriod);

    // ==================== LOAD INITIAL DATA ====================
    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [coursesRes, studentsRes] = await Promise.all([
                authFetch(`${apiBase}/faculty/my-courses`),
                authFetch(`${apiBase}/faculty/students`)
            ]);

            if (coursesRes.ok) {
                const coursesData = await coursesRes.json();
                const courses = coursesData.courses || [];
                const courseNames = [...new Set(courses.map((c: any) => c.course_name))] as string[];
                setAssignedCourses(courseNames);
                
                const subjectsList: Subject[] = courses.map((c: any) => ({
                    subject_code: c.subject_code || `SUB${c.course_stream_id}`,
                    subject_name: c.subject_name || c.course_name,
                    semester: c.semester || 1
                }));
                setSubjects(subjectsList);
                
                if (courseNames.length > 0) {
                    setSelectedCourse(courseNames[0]);
                }
                if (subjectsList.length > 0) {
                    setSelectedSubject(subjectsList[0].subject_code);
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

    // ==================== FILTERED STUDENTS ====================
    const filteredStudents = students.filter(s => {
        const matchesCourse = !selectedCourse || s.course_name === selectedCourse;
        const matchesSearch = !searchQuery || 
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.enrollment_number.toString().includes(searchQuery);
        const isActive = s.status === 'Active' || s.status === 'Alumni';
        return matchesCourse && matchesSearch && isActive;
    });

    // ==================== CHECK EXISTING ATTENDANCE ====================
    useEffect(() => {
        const checkExisting = async () => {
            if (!selectedCourse || !selectedSubject || !selectedDate || !selectedTimePeriod || viewMode !== 'mark') {
                setExistingAttendance(null);
                return;
            }
            
            try {
                const res = await authFetch(
                    `${apiBase}/faculty/attendance/check?course=${encodeURIComponent(selectedCourse)}&subject=${selectedSubject}&date=${selectedDate}&time_period=${selectedTimePeriod}`
                );
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.exists && data.records && data.records.length > 0) {
                        setExistingAttendance(data.records);
                        const existing: Record<number, AttendanceStatus> = {};
                        data.records.forEach((r: AttendanceRecord) => {
                            existing[r.enrollment_number] = r.status;
                        });
                        setAttendance(existing);
                        setIsEditing(false);
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
        };

        checkExisting();
    }, [selectedCourse, selectedSubject, selectedDate, selectedTimePeriod, viewMode, filteredStudents.length]);

    // Initialize attendance when students change
    useEffect(() => {
        if (!existingAttendance && filteredStudents.length > 0) {
            const init: Record<number, AttendanceStatus> = {};
            filteredStudents.forEach(s => {
                if (!attendance[s.enrollment_number]) {
                    init[s.enrollment_number] = 'present';
                }
            });
            if (Object.keys(init).length > 0) {
                setAttendance(prev => ({ ...prev, ...init }));
            }
        }
    }, [filteredStudents, existingAttendance]);

    // ==================== LOAD ATTENDANCE HISTORY ====================
    useEffect(() => {
        const loadHistory = async () => {
            if (!selectedCourse || !selectedSubject || viewMode === 'mark') return;
            
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
        };

        loadHistory();
    }, [viewMode, selectedCourse, selectedSubject, viewMonth, viewYear, authFetch]);

    // ==================== ATTENDANCE ACTIONS ====================
    const setStudentAttendance = (enrollmentNumber: number, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [enrollmentNumber]: status }));
    };

    const markAllAs = (status: AttendanceStatus) => {
        const updated: Record<number, AttendanceStatus> = {};
        filteredStudents.forEach(s => {
            updated[s.enrollment_number] = status;
        });
        setAttendance(updated);
    };

    const handleSaveAttendance = async () => {
        if (!selectedSubject) {
            alert("Please select a subject");
            return;
        }
        if (!selectedCourse) {
            alert("Please select a course");
            return;
        }
        if (!selectedTimePeriod) {
            alert("Please select a time period");
            return;
        }
        if (filteredStudents.length === 0) {
            alert("No students to mark attendance for");
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
                course_name: selectedCourse,
                semester: selectedSemester,
                time_period: selectedTimePeriod,
                time_period_label: selectedPeriodDetails?.label
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
                setExistingAttendance(records as AttendanceRecord[]);
                setIsEditing(false);
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
    };

    const attendancePercentage = stats.total > 0 
        ? Math.round(((stats.present + stats.late) / stats.total) * 100) 
        : 0;

    // ==================== EXPORT FUNCTION ====================
    const exportAttendance = () => {
        const csvContent = [
            ['Enrollment No', 'Student Name', 'Father Name', 'Course', 'Date', 'Time Period', 'Subject', 'Status'].join(','),
            ...filteredStudents.map(s => [
                s.enrollment_number,
                `"${s.full_name}"`,
                `"${s.father_name}"`,
                `"${s.course_name}"`,
                selectedDate,
                `"${selectedPeriodDetails?.label || ''}"`,
                selectedSubject,
                attendance[s.enrollment_number] || 'present'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${selectedSubject}_${selectedDate}_${selectedTimePeriod}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const canMark = !existingAttendance || isEditing;

    // ==================== RENDER ====================
    return (
        <div className="space-y-6">
            {/* ==================== HEADER ==================== */}
            <div className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Attendance Management
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

            {/* ==================== FILTERS ==================== */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Course */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <BookOpen size={14} className="inline mr-1" />
                            Course
                        </label>
                        <select
                            value={selectedCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#650C08]/20 focus:border-[#650C08] outline-none"
                        >
                            <option value="">-- Select Course --</option>
                            {assignedCourses.map(course => (
                                <option key={course} value={course}>{course}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <BookOpen size={14} className="inline mr-1" />
                            Subject
                        </label>
                        <select
                            value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#650C08]/20 focus:border-[#650C08] outline-none"
                        >
                            <option value="">-- Select Subject --</option>
                            {subjects.map(sub => (
                                <option key={sub.subject_code} value={sub.subject_code}>
                                    {sub.subject_code} - {sub.subject_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Semester */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semester
                        </label>
                        <select
                            value={selectedSemester}
                            onChange={e => setSelectedSemester(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Second Row - Date & Time Period (Mark mode) or Month/Year (View mode) */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    {viewMode === 'mark' ? (
                        <>
                            {/* Date */}
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
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#650C08]/20"
                                />
                            </div>

                            {/* Time Period */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Clock size={14} className="inline mr-1" />
                                    Class Time Period
                                </label>
                                <select
                                    value={selectedTimePeriod}
                                    onChange={e => setSelectedTimePeriod(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#650C08]/20"
                                >
                                    {TIME_PERIODS.map(period => (
                                        <option key={period.id} value={period.id}>
                                            {period.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Search size={14} className="inline mr-1" />
                                    Search Student
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Name or enrollment..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 pr-8 outline-none focus:ring-2 focus:ring-[#650C08]/20"
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Month */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Month
                                </label>
                                <select
                                    value={viewMonth}
                                    onChange={e => setViewMonth(Number(e.target.value))}
                                    className="w-full border rounded-lg p-2.5"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Year */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Year
                                </label>
                                <select
                                    value={viewYear}
                                    onChange={e => setViewYear(Number(e.target.value))}
                                    className="w-full border rounded-lg p-2.5"
                                >
                                    {[2023, 2024, 2025, 2026].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ==================== CLASS INFO BANNER (Mark mode) ==================== */}
            {viewMode === 'mark' && selectedCourse && selectedSubject && selectedPeriodDetails && (
                <div className="bg-gradient-to-r from-[#650C08] to-[#8B1A1A] rounded-xl p-4 text-white">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-lg">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-white/80 text-sm">Current Class</p>
                                <p className="font-bold text-lg">{selectedSubject}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-white/80 text-xs">Date</p>
                                <p className="font-semibold">
                                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-white/80 text-xs">Time Period</p>
                                <p className="font-semibold">{selectedPeriodDetails.label}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-white/80 text-xs">Semester</p>
                                <p className="font-semibold">{selectedSemester}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== EXISTING ATTENDANCE WARNING ==================== */}
            {viewMode === 'mark' && existingAttendance && !isEditing && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" size={24} />
                        <div>
                            <p className="font-medium text-amber-800">
                                Attendance already marked
                            </p>
                            <p className="text-sm text-amber-600">
                                {selectedSubject} • {selectedPeriodDetails?.label} • {new Date(selectedDate).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 font-medium whitespace-nowrap transition-colors"
                    >
                        Edit Attendance
                    </button>
                </div>
            )}

            {/* ==================== MARK ATTENDANCE VIEW ==================== */}
            {viewMode === 'mark' && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Students" value={stats.total} icon={<Users size={20} />} color="blue" />
                        <StatCard label="Present" value={stats.present} icon={<CheckCircle size={20} />} color="green" />
                        <StatCard label="Absent" value={stats.absent} icon={<XCircle size={20} />} color="red" />
                        <StatCard 
                            label="Attendance %" 
                            value={`${attendancePercentage}%`} 
                            icon={<BarChart3 size={20} />} 
                            color={attendancePercentage >= 75 ? "green" : attendancePercentage >= 50 ? "yellow" : "red"} 
                        />
                    </div>

                    {/* Quick Actions */}
                    {canMark && filteredStudents.length > 0 && (
                        <div className="bg-white rounded-xl border p-4 shadow-sm flex flex-wrap items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">Quick Actions:</span>
                            <button
                                onClick={() => markAllAs('present')}
                                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium transition-colors"
                            >
                                ✓ All Present
                            </button>
                            <button
                                onClick={() => markAllAs('absent')}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                            >
                                ✗ All Absent
                            </button>
                            <button
                                onClick={() => markAllAs('late')}
                                className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium transition-colors"
                            >
                                ◔ All Late
                            </button>
                            <div className="flex-1" />
                            <button
                                onClick={exportAttendance}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2 transition-colors"
                            >
                                <Download size={16} /> Export
                            </button>
                        </div>
                    )}

                    {/* Student List Table */}
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        {loading ? (
                            <LoadingState message="Loading students..." />
                        ) : !selectedCourse || !selectedSubject ? (
                            <EmptyState 
                                icon={<BookOpen size={48} />}
                                message="Select a course and subject to mark attendance" 
                            />
                        ) : filteredStudents.length === 0 ? (
                            <EmptyState 
                                icon={<Users size={48} />}
                                message={searchQuery ? "No students match your search" : "No students found for this course"} 
                            />
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                                                    #
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Enrollment No.
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Student Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                                                    Father's Name
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Attendance
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredStudents.map((student, index) => {
                                                const status = attendance[student.enrollment_number] || 'present';
                                                const rowBg = status === 'absent' ? 'bg-red-50/50' : 
                                                              status === 'late' ? 'bg-yellow-50/50' : '';
                                                
                                                return (
                                                    <tr 
                                                        key={student.enrollment_number} 
                                                        className={`hover:bg-gray-50 transition-colors ${rowBg}`}
                                                    >
                                                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                                                {student.enrollment_number}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{student.full_name}</p>
                                                                {student.email && (
                                                                    <p className="text-xs text-gray-500 mt-0.5">{student.email}</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                                                            {student.father_name}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-center gap-1.5">
                                                                <StatusButton
                                                                    label="P"
                                                                    title="Present"
                                                                    active={status === 'present'}
                                                                    color="green"
                                                                    onClick={() => canMark && setStudentAttendance(student.enrollment_number, 'present')}
                                                                    disabled={!canMark}
                                                                />
                                                                <StatusButton
                                                                    label="A"
                                                                    title="Absent"
                                                                    active={status === 'absent'}
                                                                    color="red"
                                                                    onClick={() => canMark && setStudentAttendance(student.enrollment_number, 'absent')}
                                                                    disabled={!canMark}
                                                                />
                                                                <StatusButton
                                                                    label="L"
                                                                    title="Late"
                                                                    active={status === 'late'}
                                                                    color="yellow"
                                                                    onClick={() => canMark && setStudentAttendance(student.enrollment_number, 'late')}
                                                                    disabled={!canMark}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer with Save Button */}
                                {canMark && (
                                    <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-gray-600 flex flex-wrap gap-3">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                                <span className="font-medium">{stats.present}</span> Present
                                            </span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                                <span className="font-medium">{stats.absent}</span> Absent
                                            </span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                                <span className="font-medium">{stats.late}</span> Late
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleSaveAttendance}
                                            disabled={saving}
                                            className="w-full sm:w-auto px-6 py-2.5 bg-[#650C08] text-white rounded-lg hover:bg-[#520a06] disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
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
            )}

            {/* ==================== VIEW RECORDS ==================== */}
            {viewMode === 'view' && (
                <ViewAttendanceRecords
                    loading={loading}
                    records={attendanceHistory}
                    month={viewMonth}
                    year={viewYear}
                    selectedCourse={selectedCourse}
                    selectedSubject={selectedSubject}
                />
            )}

            {/* ==================== REPORTS ==================== */}
            {viewMode === 'reports' && (
                <AttendanceReports
                    loading={loading}
                    summary={attendanceSummary}
                    course={selectedCourse}
                    subject={selectedSubject}
                    month={viewMonth}
                    year={viewYear}
                />
            )}
        </div>
    );
}

// ==================== VIEW ATTENDANCE RECORDS COMPONENT ====================
function ViewAttendanceRecords({ 
    loading, 
    records, 
    month, 
    year,
    selectedCourse,
    selectedSubject 
}: {
    loading: boolean;
    records: AttendanceRecord[];
    month: number;
    year: number;
    selectedCourse: string;
    selectedSubject: string;
}) {
    const dates = [...new Set(records.map(r => r.date))].sort();
    
    const studentsMap = new Map<number, { enrollment_number: number; student_name: string }>();
    records.forEach(r => {
        if (!studentsMap.has(r.enrollment_number)) {
            studentsMap.set(r.enrollment_number, { 
                enrollment_number: r.enrollment_number, 
                student_name: r.student_name 
            });
        }
    });
    const students = Array.from(studentsMap.values());

    const getStatus = (enrollment: number, date: string) => {
        return records.find(r => r.enrollment_number === enrollment && r.date === date)?.status;
    };

    const statusIcon: Record<string, JSX.Element> = {
        present: <Check className="text-green-600" size={14} />,
        absent: <X className="text-red-600" size={14} />,
        late: <Clock className="text-yellow-600" size={14} />
    };

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">
                    Attendance Records - {monthName}
                </h3>
                {selectedCourse && selectedSubject && (
                    <p className="text-sm text-gray-500 mt-1">
                        {selectedCourse} • {selectedSubject}
                    </p>
                )}
            </div>

            {loading ? (
                <LoadingState message="Loading attendance records..." />
            ) : !selectedCourse || !selectedSubject ? (
                <EmptyState 
                    icon={<BookOpen size={48} />}
                    message="Select a course and subject to view records" 
                />
            ) : records.length === 0 ? (
                <EmptyState 
                    icon={<Calendar size={48} />}
                    message="No attendance records found for this period" 
                />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50 min-w-[200px]">
                                        Student
                                    </th>
                                    {dates.map(d => (
                                        <th key={d} className="px-2 py-3 text-center font-medium text-gray-600 min-w-[45px]">
                                            <div>{new Date(d).getDate()}</div>
                                            <div className="text-xs text-gray-400 font-normal">
                                                {new Date(d).toLocaleDateString('en', { weekday: 'short' })}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600 min-w-[70px]">
                                        %
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map(student => {
                                    const studentRecords = records.filter(r => r.enrollment_number === student.enrollment_number);
                                    const presentCount = studentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
                                    const totalCount = dates.length;
                                    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

                                    return (
                                        <tr key={student.enrollment_number} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 sticky left-0 bg-white">
                                                <p className="font-medium text-gray-900">{student.student_name}</p>
                                                <p className="text-xs text-gray-500">{student.enrollment_number}</p>
                                            </td>
                                            {dates.map(d => {
                                                const status = getStatus(student.enrollment_number, d);
                                                return (
                                                    <td key={d} className="px-2 py-3 text-center">
                                                        {status ? statusIcon[status] : <span className="text-gray-300">-</span>}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
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

                    <div className="p-4 border-t bg-gray-50 flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-gray-600 font-medium">Legend:</span>
                        <span className="flex items-center gap-1.5">
                            <Check className="text-green-600" size={14} /> Present
                        </span>
                        <span className="flex items-center gap-1.5">
                            <X className="text-red-600" size={14} /> Absent
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="text-yellow-600" size={14} /> Late
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}

// ==================== ATTENDANCE REPORTS COMPONENT ====================
function AttendanceReports({ 
    loading, 
    summary, 
    course, 
    subject,
    month,
    year 
}: {
    loading: boolean;
    summary: AttendanceSummary[];
    course: string;
    subject: string;
    month: number;
    year: number;
}) {
    const lowAttendance = summary.filter(s => s.percentage < 75);
    const criticalAttendance = summary.filter(s => s.percentage < 50);
    const avgAttendance = summary.length > 0 
        ? Math.round(summary.reduce((acc, s) => acc + s.percentage, 0) / summary.length) 
        : 0;

    const exportReport = () => {
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        const csv = [
            [`Attendance Report - ${course} - ${subject} - ${monthName}`],
            [],
            ['Enrollment No', 'Student Name', 'Total Classes', 'Present', 'Absent', 'Late', 'Percentage', 'Status'].join(','),
            ...summary.map(s => [
                s.enrollment_number, 
                `"${s.student_name}"`, 
                s.total_classes, 
                s.present, 
                s.absent, 
                s.late, 
                `${s.percentage}%`,
                s.percentage >= 75 ? 'Regular' : s.percentage >= 50 ? 'Warning' : 'Detained'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `attendance_report_${subject}_${month}_${year}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                    label="Total Students" 
                    value={summary.length} 
                    icon={<Users size={20} />} 
                    color="blue" 
                />
                <StatCard 
                    label="Avg Attendance" 
                    value={`${avgAttendance}%`} 
                    icon={<BarChart3 size={20} />} 
                    color={avgAttendance >= 75 ? "green" : avgAttendance >= 50 ? "yellow" : "red"} 
                />
                <StatCard 
                    label="Below 75%" 
                    value={lowAttendance.length} 
                    icon={<AlertCircle size={20} />} 
                    color="yellow" 
                />
                <StatCard 
                    label="Below 50%" 
                    value={criticalAttendance.length} 
                    icon={<XCircle size={20} />} 
                    color="red" 
                />
            </div>

            {/* Critical Alert */}
            {criticalAttendance.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <XCircle className="text-red-600" size={20} />
                        <h4 className="font-semibold text-red-800">Critical: Students below 50% attendance</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {criticalAttendance.map(s => (
                            <span key={s.enrollment_number} className="px-3 py-1.5 bg-white border border-red-200 rounded-full text-sm text-red-700 font-medium">
                                {s.student_name} ({s.percentage}%)
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-800">Attendance Summary Report</h3>
                        <p className="text-sm text-gray-500">
                            {course && subject ? `${course} • ${subject} • ${monthName}` : monthName}
                        </p>
                    </div>
                    <button 
                        onClick={exportReport} 
                        disabled={summary.length === 0}
                        className="px-4 py-2 bg-[#650C08] text-white rounded-lg hover:bg-[#520a06] text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FileSpreadsheet size={16} /> Export Report
                    </button>
                </div>

                {loading ? (
                    <LoadingState message="Generating report..." />
                ) : !course || !subject ? (
                    <EmptyState 
                        icon={<BookOpen size={48} />}
                        message="Select a course and subject to view report" 
                    />
                ) : summary.length === 0 ? (
                    <EmptyState 
                        icon={<BarChart3 size={48} />}
                        message="No attendance data available for report" 
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Enrollment</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Student Name</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Total</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Present</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Absent</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Late</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600">%</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {summary.map((s, i) => (
                                    <tr 
                                        key={s.enrollment_number} 
                                        className={`hover:bg-gray-50 ${
                                            s.percentage < 50 ? 'bg-red-50/50' : 
                                            s.percentage < 75 ? 'bg-yellow-50/50' : ''
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                {s.enrollment_number}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{s.student_name}</td>
                                        <td className="px-4 py-3 text-center text-gray-600">{s.total_classes}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-green-600 font-medium">{s.present}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-red-600 font-medium">{s.absent}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-yellow-600 font-medium">{s.late}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                s.percentage >= 75 ? 'bg-green-100 text-green-700' :
                                                s.percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {s.percentage}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {s.percentage >= 75 ? (
                                                <span className="text-green-600 font-medium">Regular</span>
                                            ) : s.percentage >= 50 ? (
                                                <span className="text-yellow-600 font-medium">Warning</span>
                                            ) : (
                                                <span className="text-red-600 font-bold">Detained</span>
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

// ==================== REUSABLE UI COMPONENTS ====================

function TabButton({ active, onClick, icon, label }: {
    active: boolean;
    onClick: () => void;
    icon: JSX.Element;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                active 
                    ? 'bg-white text-[#650C08] shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
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
    color: 'blue' | 'green' | 'red' | 'yellow';
}) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        green: 'bg-green-50 text-green-600 border-green-100',
        red: 'bg-red-50 text-red-600 border-red-100',
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100'
    };

    return (
        <div className={`p-4 rounded-xl border ${colors[color]}`}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/60 rounded-lg">{icon}</div>
                <div>
                    <p className="text-xs opacity-75">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                </div>
            </div>
        </div>
    );
}

function StatusButton({ label, title, active, color, onClick, disabled }: {
    label: string;
    title: string;
    active: boolean;
    color: 'green' | 'red' | 'yellow';
    onClick: () => void;
    disabled: boolean;
}) {
    const activeColors = {
        green: 'bg-green-500 text-white shadow-green-200',
        red: 'bg-red-500 text-white shadow-red-200',
        yellow: 'bg-yellow-500 text-white shadow-yellow-200'
    };
    
    const inactiveColors = {
        green: 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600',
        red: 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600',
        yellow: 'bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                active 
                    ? `${activeColors[color]} shadow-md` 
                    : inactiveColors[color]
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
            {label}
        </button>
    );
}

function LoadingState({ message }: { message: string }) {
    return (
        <div className="text-center py-16">
            <RefreshCw className="animate-spin mx-auto text-gray-400 mb-3" size={32} />
            <p className="text-gray-500">{message}</p>
        </div>
    );
}

function EmptyState({ message, icon }: { message: string; icon?: JSX.Element }) {
    return (
        <div className="text-center py-16">
            <div className="mx-auto text-gray-300 mb-4">
                {icon || <Users size={48} />}
            </div>
            <p className="text-gray-500">{message}</p>
        </div>
    );
}