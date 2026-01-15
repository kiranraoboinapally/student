import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
    Users,
    BookOpen,
    GraduationCap,
    Home,
    LogOut,
    RefreshCw,
    Plus,
    UserPlus,
    DollarSign,
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    XCircle
} from "lucide-react";

type TabType = "overview" | "students" | "faculty" | "courses" | "fees" | "attendance" | "marks";

export default function InstituteDashboard(): React.ReactNode {
    const { authFetch, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    // Data Lists
    const [students, setStudents] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [fees, setFees] = useState<any[]>([]);
    const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
    const [marks, setMarks] = useState<any[]>([]);
    const [assignCourseCourses, setAssignCourseCourses] = useState<any[]>([]);

    // Student Management - filters & pagination states
    const [studentSearchTerm, setStudentSearchTerm] = useState("");
    const [studentStatusFilter, setStudentStatusFilter] = useState("");
    const [studentCourseFilter, setStudentCourseFilter] = useState("");
    const [studentCurrentPage, setStudentCurrentPage] = useState(1);
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Faculty Management - filters & pagination states
    const [facultySearchTerm, setFacultySearchTerm] = useState("");
    const [facultyStatusFilter, setFacultyStatusFilter] = useState("");
    const [facultyCurrentPage, setFacultyCurrentPage] = useState(1);
    const [loadingFaculty, setLoadingFaculty] = useState(false);

    // Courses Management - filters & pagination states
    const [courseSearchTerm, setCourseSearchTerm] = useState("");
    const [courseCurrentPage, setCourseCurrentPage] = useState(1);
    const [loadingCourses, setLoadingCourses] = useState(false);

    const ITEMS_PER_PAGE = 10;

    // Modals
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
    const [showAddCourseModal, setShowAddCourseModal] = useState(false);
    const [assignCourseModal, setAssignCourseModal] = useState<{ facultyId: number; facultyName: string } | null>(null);

    const loadStats = useCallback(async () => {
        try {
            const res = await authFetch(`${apiBase}/institute/dashboard/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        const loadAssignCourses = async () => {
            try {
                const res = await authFetch(`${apiBase}/institute/courses`);
                if (res.ok) {
                    const data = await res.json();
                    setAssignCourseCourses(data.data || data.courses || []);
                }
            } catch (e) {
                console.error("Failed to fetch courses:", e);
            }
        };

        loadAssignCourses();
    }, [authFetch]);

    const loadStudents = useCallback(async () => {
        try {
            setLoadingStudents(true);
            const res = await authFetch(`${apiBase}/institute/students`);
            const data = await res.json();
            setStudents(data.data || data.students || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStudents(false);
        }
    }, [authFetch]);

    const loadFaculty = useCallback(async () => {
        try {
            setLoadingFaculty(true);
            const res = await authFetch(`${apiBase}/institute/faculty`);
            const data = await res.json();
            setFaculty(data.data || data.faculty || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFaculty(false);
        }
    }, [authFetch]);

    const loadCourses = useCallback(async () => {
        try {
            setLoadingCourses(true);
            const res = await authFetch(`${apiBase}/institute/courses`);
            const data = await res.json();
            setCourses(data.data || data.courses || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCourses(false);
        }
    }, [authFetch]);

    const loadFees = useCallback(async () => {
        try {
            const res = await authFetch(`${apiBase}/institute/fees`);
            const data = await res.json();
            setFees(data.fees || []);
        } catch (e) {
            console.error(e);
        }
    }, [authFetch]);

    const loadAttendance = useCallback(async () => {
        try {
            const res = await authFetch(`${apiBase}/institute/attendance`);
            const data = await res.json();
            setAttendanceSummary(data);
        } catch (e) {
            console.error(e);
        }
    }, [authFetch]);

    const loadMarks = useCallback(async () => {
        try {
            const res = await authFetch(`${apiBase}/institute/internal-marks`);
            const data = await res.json();
            setMarks(data.marks || []);
        } catch (e) {
            console.error(e);
        }
    }, [authFetch]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    useEffect(() => {
        if (activeTab === "students") loadStudents();
        if (activeTab === "faculty") loadFaculty();
        if (activeTab === "courses") loadCourses();
        if (activeTab === "fees") loadFees();
        if (activeTab === "attendance") loadAttendance();
        if (activeTab === "marks") loadMarks();
    }, [activeTab, loadStudents, loadFaculty, loadCourses, loadFees, loadAttendance, loadMarks]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        if (activeTab !== "overview") {
            if (activeTab === "students") await loadStudents();
            if (activeTab === "faculty") await loadFaculty();
            if (activeTab === "courses") await loadCourses();
            if (activeTab === "fees") await loadFees();
            if (activeTab === "attendance") await loadAttendance();
            if (activeTab === "marks") await loadMarks();
        }
        setRefreshing(false);
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const SidebarItem = ({ id, label, icon: Icon }: { id: TabType; label: string; icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${activeTab === id
                ? "bg-[#650C08] text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100 hover:text-[#650C08]"
                }`}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </button>
    );

    // ─── Student filtering & pagination logic ─────────────────────────────────
    const filteredStudents = useMemo(() => {
        let result = [...students];

        // Search by name or enrollment
        if (studentSearchTerm.trim()) {
            const term = studentSearchTerm.toLowerCase().trim();
            result = result.filter(s =>
                (s.full_name || s.student_name || "").toLowerCase().includes(term) ||
                String(s.enrollment_number || "").includes(term)
            );
        }

        // Status filter
        if (studentStatusFilter) {
            result = result.filter(s => (s.status || "Active") === studentStatusFilter);
        }

        // Course filter
        if (studentCourseFilter) {
            result = result.filter(s => s.course_name === studentCourseFilter);
        }

        return result;
    }, [students, studentSearchTerm, studentStatusFilter, studentCourseFilter]);

    const availableStudentCourses = useMemo(() => {
        const set = new Set(students.map(s => s.course_name).filter(Boolean));
        return Array.from(set).sort() as string[];
    }, [students]);

    const studentTotalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const studentIndexOfLast = studentCurrentPage * ITEMS_PER_PAGE;
    const studentIndexOfFirst = studentIndexOfLast - ITEMS_PER_PAGE; // More robust calculation
    const currentStudents = filteredStudents.slice(studentIndexOfFirst, studentIndexOfLast);
    // ─── Faculty filtering & pagination logic ─────────────────────────────────
    const filteredFaculty = useMemo(() => {
        let result = [...faculty];

        // Search by name, email, username
        if (facultySearchTerm.trim()) {
            const term = facultySearchTerm.toLowerCase().trim();
            result = result.filter(f =>
                (f.full_name || "").toLowerCase().includes(term) ||
                (f.email || "").toLowerCase().includes(term) ||
                (f.username || "").toLowerCase().includes(term)
            );
        }

        // Status filter
        if (facultyStatusFilter) {
            result = result.filter(f => (f.approval_status || "pending") === facultyStatusFilter);
        }

        return result;
    }, [faculty, facultySearchTerm, facultyStatusFilter]);

    const facultyTotalPages = Math.ceil(filteredFaculty.length / ITEMS_PER_PAGE);
    const facultyIndexOfLast = facultyCurrentPage * ITEMS_PER_PAGE;
    const facultyIndexOfFirst = facultyCurrentPage * ITEMS_PER_PAGE - ITEMS_PER_PAGE;
    const currentFaculty = filteredFaculty.slice(facultyIndexOfFirst, facultyIndexOfLast);

    // ─── Courses filtering & pagination logic ─────────────────────────────────
    const filteredCourses = useMemo(() => {
        let result = [...courses];

        // Search by course name or stream
        if (courseSearchTerm.trim()) {
            const term = courseSearchTerm.toLowerCase().trim();
            result = result.filter(c =>
                (c.course_name || "").toLowerCase().includes(term) ||
                (c.stream || "").toLowerCase().includes(term)
            );
        }

        return result;
    }, [courses, courseSearchTerm]);

    const coursesTotalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
    const coursesIndexOfLast = courseCurrentPage * ITEMS_PER_PAGE;
    const coursesIndexOfFirst = courseCurrentPage * ITEMS_PER_PAGE - ITEMS_PER_PAGE;
    const currentCourses = filteredCourses.slice(coursesIndexOfFirst, coursesIndexOfLast);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-[#650C08] animate-spin" />
                    <div className="text-[#650C08] font-medium text-lg">Loading Institute Dashboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col fixed h-full z-20">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#650C08] flex items-center justify-center">
                        <span className="text-white font-bold text-xl">I</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none">
                            {stats?.institute_name?.substring(0, 12) || "Institute"}
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">Admin Portal</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main</p>
                        <SidebarItem id="overview" label="Dashboard" icon={Home} />
                        <SidebarItem id="students" label="Students" icon={Users} />
                        <SidebarItem id="faculty" label="Faculty" icon={GraduationCap} />
                        <SidebarItem id="courses" label="Courses" icon={BookOpen} />
                    </div>

                    <div className="space-y-1 mt-8">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Academic</p>
                        <SidebarItem id="attendance" label="Attendance" icon={Calendar} />
                        <SidebarItem id="marks" label="Internal Marks" icon={FileText} />
                        <SidebarItem id="fees" label="Fee Collection" icon={DollarSign} />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 ml-64 min-w-0 flex flex-col">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-8 py-4 flex justify-between items-center shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 capitalize">
                            {activeTab === 'overview' ? 'Institute Dashboard' : activeTab}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={handleRefresh} disabled={refreshing} className="p-2 text-gray-500 hover:text-[#650C08] hover:bg-gray-50 rounded-full transition-all">
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900">Institute Admin</p>
                                <p className="text-xs text-gray-500">{stats?.institute_name || 'Administrator'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#650C08] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                I
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-2 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {activeTab === "overview" && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard title="Total Students" value={stats?.total_students} icon={<Users size={24} />} color="blue" />
                                    <StatCard title="Active Students" value={stats?.active_students} icon={<CheckCircle size={24} />} color="green" />
                                    <StatCard title="Total Faculty" value={stats?.total_faculty} icon={<GraduationCap size={24} />} color="yellow" />
                                    <StatCard title="Courses Offered" value={stats?.total_courses} icon={<BookOpen size={24} />} color="purple" />
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <button
                                            onClick={() => setShowAddStudentModal(true)}
                                            className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600"
                                        >
                                            <UserPlus size={24} />
                                            <span className="font-medium text-sm">Add Student</span>
                                        </button>
                                        <button
                                            onClick={() => setShowAddFacultyModal(true)}
                                            className="p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all flex flex-col items-center gap-2 text-gray-600 hover:text-green-600"
                                        >
                                            <GraduationCap size={24} />
                                            <span className="font-medium text-sm">Add Faculty</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("attendance")}
                                            className="p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all flex flex-col items-center gap-2 text-gray-600 hover:text-purple-600"
                                        >
                                            <Calendar size={24} />
                                            <span className="font-medium text-sm">View Attendance</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("fees")}
                                            className="p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-all flex flex-col items-center gap-2 text-gray-600 hover:text-orange-600"
                                        >
                                            <DollarSign size={24} />
                                            <span className="font-medium text-sm">Fee Collection</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Students</h3>
                                        <div className="space-y-3">
                                            {students.slice(0, 5).map((s, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{s.student_name || s.full_name}</p>
                                                        <p className="text-xs text-gray-500">{s.enrollment_number}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                        {s.status || 'Active'}
                                                    </span>
                                                </div>
                                            ))}
                                            {students.length === 0 && (
                                                <p className="text-gray-500 text-center py-4">No students found</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">Faculty Members</h3>
                                        <div className="space-y-3">
                                            {faculty.slice(0, 5).map((f, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{f.full_name}</p>
                                                        <p className="text-xs text-gray-500">{f.department || f.email}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${f.approval_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {f.approval_status || 'Pending'}
                                                    </span>
                                                </div>
                                            ))}
                                            {faculty.length === 0 && (
                                                <p className="text-gray-500 text-center py-4">No faculty found</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "students" && (
                            <div className="space-y-2 animate-fadeIn">
                                <div className="flex justify-between items-center flex-wrap gap-4">
                                    <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
                                    <button
                                        onClick={() => setShowAddStudentModal(true)}
                                        className="bg-[#650C08] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#8B1A1A] shadow-md transition-all"
                                    >
                                        <Plus size={18} /> Add Student
                                    </button>
                                </div>

                                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                            <input
                                                type="text"
                                                value={studentSearchTerm}
                                                onChange={(e) => {
                                                    setStudentSearchTerm(e.target.value);
                                                    setStudentCurrentPage(1);
                                                }}
                                                placeholder="Name or Enrollment..."
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#650C08]/30"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <select
                                                value={studentStatusFilter}
                                                onChange={(e) => {
                                                    setStudentStatusFilter(e.target.value);
                                                    setStudentCurrentPage(1);
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#650C08]/30"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Active">Active</option>
                                                <option value="PassOutDegreePending">Passout / Degree Pending</option>
                                                <option value="Alumni">Alumni</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                                            <select
                                                value={studentCourseFilter}
                                                onChange={(e) => {
                                                    setStudentCourseFilter(e.target.value);
                                                    setStudentCurrentPage(1);
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#650C08]/30"
                                            >
                                                <option value="">All Courses</option>
                                                {availableStudentCourses.map((course) => (
                                                    <option key={course} value={course}>
                                                        {course}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-end">
                                            <p className="text-sm text-gray-600">
                                                Showing {filteredStudents.length} of {students.length} students
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    {loadingStudents ? (
                                        <div className="py-20 text-center text-gray-500">
                                            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#650C08]" />
                                            <p>Loading students...</p>
                                        </div>
                                    ) : filteredStudents.length === 0 ? (
                                        <div className="py-16 text-center text-gray-500">
                                            <Users size={48} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium">No students found</p>
                                            <p className="text-sm mt-1">Try adjusting filters or add a new student</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pattern / Duration</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {currentStudents.map((s, i) => (
                                                            <tr key={i} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-sm font-mono text-gray-900">{s.enrollment_number}</td>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-medium text-gray-900">{s.full_name || s.student_name || '-'}</div>
                                                                    <div className="text-xs text-gray-500">{s.email || '-'}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">{s.course_name || '-'}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">{s.batch || '-'}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                                    {s.program_pattern || '-'} • {s.duration_years ? `${s.duration_years} year${s.duration_years > 1 ? 's' : ''}` : '-'}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span
                                                                        className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${s.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                                            s.status === 'PassOutDegreePending' ? 'bg-amber-100 text-amber-800' :
                                                                                s.status === 'Alumni' ? 'bg-blue-100 text-blue-800' :
                                                                                    'bg-gray-100 text-gray-800'
                                                                            }`}
                                                                    >
                                                                        {s.status === 'PassOutDegreePending'
                                                                            ? 'Passout / Degree Pending'
                                                                            : s.status || 'Active'}
                                                                    </span>
                                                                </td>

                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "faculty" && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-800">Faculty Management</h2>
                                    <button
                                        onClick={() => setShowAddFacultyModal(true)}
                                        className="bg-[#650C08] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#8B1A1A] shadow-md transition-all"
                                    >
                                        <Plus size={18} /> Add Faculty
                                    </button>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                            <input
                                                type="text"
                                                value={facultySearchTerm}
                                                onChange={(e) => {
                                                    setFacultySearchTerm(e.target.value);
                                                    setFacultyCurrentPage(1);
                                                }}
                                                placeholder="Name, email or username..."
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#650C08]/30"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <select
                                                value={facultyStatusFilter}
                                                onChange={(e) => {
                                                    setFacultyStatusFilter(e.target.value);
                                                    setFacultyCurrentPage(1);
                                                }}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#650C08]/30"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    {loadingFaculty ? (
                                        <div className="py-20 text-center text-gray-500">
                                            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#650C08]" />
                                            <p>Loading faculty...</p>
                                        </div>
                                    ) : filteredFaculty.length === 0 ? (
                                        <div className="py-16 text-center text-gray-500">
                                            <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium">No faculty found</p>
                                            <p className="text-sm mt-1">Try adjusting filters or add a new faculty</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Course</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {currentFaculty.map((f, i) => (
                                                            <tr key={i} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4">
                                                                    <div className="text-sm font-medium text-gray-900">{f.full_name}</div>
                                                                    <div className="text-xs text-gray-500">{f.email}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                                    {/* Re-added Department column */}
                                                                    {f.department || 'General'}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">{f.username}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                                    {f.course_name || 'Not Assigned'}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span
                                                                        className={`px-3 py-1 text-xs rounded-full font-medium ${f.approval_status === 'approved'
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : f.approval_status === 'rejected'
                                                                                ? 'bg-red-100 text-red-700'
                                                                                : 'bg-yellow-100 text-yellow-700'
                                                                            }`}
                                                                    >
                                                                        {f.approval_status || 'Pending'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    {f.approval_status === 'approved' && (
                                                                        <button
                                                                            onClick={() => setAssignCourseModal({ facultyId: f.id, facultyName: f.full_name })}
                                                                            className="text-[#650C08] hover:text-[#8B1A1A] text-sm font-semibold flex items-center justify-end gap-1 ml-auto"
                                                                        >
                                                                            <Plus size={14} /> Assign Course
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                                                <div className="text-sm text-gray-700">
                                                    Showing <span className="font-medium">{facultyIndexOfFirst + 1}</span> to{" "}
                                                    <span className="font-medium">{Math.min(facultyIndexOfLast, filteredFaculty.length)}</span> of{" "}
                                                    <span className="font-medium">{filteredFaculty.length}</span> results
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setFacultyCurrentPage(p => Math.max(p - 1, 1))}
                                                        disabled={facultyCurrentPage === 1}
                                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Previous
                                                    </button>
                                                    <button
                                                        onClick={() => setFacultyCurrentPage(p => Math.min(p + 1, facultyTotalPages))}
                                                        disabled={facultyCurrentPage === facultyTotalPages}
                                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "courses" && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-gray-800">Courses Management</h2>
                                    <button
                                        onClick={() => setShowAddCourseModal(true)}
                                        className="bg-[#650C08] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#8B1A1A] shadow-md transition-all"
                                    >
                                        <Plus size={18} /> Request New Course
                                    </button>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-md">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                                            <input
                                                type="text"
                                                value={courseSearchTerm}
                                                onChange={(e) => {
                                                    setCourseSearchTerm(e.target.value);
                                                    setCourseCurrentPage(1);
                                                }}
                                                placeholder="Course name or stream..."
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#650C08]/30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    {loadingCourses ? (
                                        <div className="py-20 text-center text-gray-500">
                                            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#650C08]" />
                                            <p>Loading courses...</p>
                                        </div>
                                    ) : filteredCourses.length === 0 ? (
                                        <div className="py-16 text-center text-gray-500">
                                            <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium">No courses found</p>
                                            <p className="text-sm mt-1">Try adjusting search or request a new course</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Name</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stream</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Count</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {currentCourses.map((c, i) => (
                                                            <tr key={i} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.course_name}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">{c.stream || '-'}</td>
                                                                <td className="px-6 py-4 text-sm text-gray-500">{c.student_count || 0}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                                                <div className="text-sm text-gray-700">
                                                    Showing <span className="font-medium">{coursesIndexOfFirst + 1}</span> to{" "}
                                                    <span className="font-medium">{Math.min(coursesIndexOfLast, filteredCourses.length)}</span> of{" "}
                                                    <span className="font-medium">{filteredCourses.length}</span> results
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setCourseCurrentPage(p => Math.max(p - 1, 1))}
                                                        disabled={courseCurrentPage === 1}
                                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Previous
                                                    </button>
                                                    <button
                                                        onClick={() => setCourseCurrentPage(p => Math.min(p + 1, coursesTotalPages))}
                                                        disabled={courseCurrentPage === coursesTotalPages}
                                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "fees" && (
                            <div className="space-y-6 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-gray-800">Fee Collection</h2>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {fees.map((f, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{f.enrollment_number}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{f.student_name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{f.fee_type}</td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{f.fee_amount?.toLocaleString()}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 text-xs rounded-full ${f.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {f.payment_status || 'Pending'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {fees.length === 0 && (
                                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No fee records found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "attendance" && (
                            <div className="space-y-6 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-gray-800">Attendance Summary</h2>
                                {attendanceSummary ? (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <StatCard title="Total Records" value={attendanceSummary.total_records} icon={<Calendar size={24} />} color="blue" />
                                        <StatCard title="Present" value={attendanceSummary.present} icon={<CheckCircle size={24} />} color="green" />
                                        <StatCard title="Absent" value={attendanceSummary.absent} icon={<XCircle size={24} />} color="red" />
                                        <StatCard
                                            title="Attendance %"
                                            value={`${Math.round(attendanceSummary.attendance_percent || 0)}%`}
                                            icon={<Calendar size={24} />}
                                            color="purple"
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                                        No attendance data available
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "marks" && (
                            <div className="space-y-6 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-gray-800">Internal Marks</h2>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {marks.map((m, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{m.enrollment_number}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">{m.subject_name}</div>
                                                            <div className="text-xs text-gray-500">{m.subject_code}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{m.mark_type}</td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{m.marks_obtained} / {m.max_marks}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 text-xs rounded-full capitalize ${m.status === 'published' ? 'bg-green-100 text-green-700' :
                                                                m.status === 'locked' ? 'bg-blue-100 text-blue-700' :
                                                                    m.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {m.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {marks.length === 0 && (
                                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No marks found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Add Student Modal - Updated with course dropdown */}
            {showAddStudentModal && (
                <AddStudentModal
                    authFetch={authFetch}
                    onClose={() => setShowAddStudentModal(false)}
                    onSuccess={() => {
                        setShowAddStudentModal(false);
                        loadStudents();
                    }}
                    availableCourses={assignCourseCourses.map((c) => c.course_name)}
                />
            )}

            {/* Add Faculty Modal */}
            {showAddFacultyModal && (
                <AddFacultyModal
                    authFetch={authFetch}
                    onClose={() => setShowAddFacultyModal(false)}
                    onSuccess={() => {
                        setShowAddFacultyModal(false);
                        loadFaculty();
                    }}
                />
            )}

            {/* Add Course Modal */}
            {showAddCourseModal && (
                <AddCourseModal
                    authFetch={authFetch}
                    onClose={() => setShowAddCourseModal(false)}
                    onSuccess={() => {
                        setShowAddCourseModal(false);
                        loadCourses();
                    }}
                />
            )}

            {/* Assign Course Modal */}
            {assignCourseModal && (
                <AssignCourseModal
                    authFetch={authFetch}
                    facultyId={assignCourseModal.facultyId}
                    facultyName={assignCourseModal.facultyName}
                    onClose={() => setAssignCourseModal(null)}
                    onSuccess={() => {
                        setAssignCourseModal(null);
                        loadFaculty();
                    }}
                />
            )}
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        yellow: "bg-yellow-100 text-yellow-600",
        purple: "bg-purple-100 text-purple-600",
        red: "bg-red-100 text-red-600",
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-full ${colorClasses[color]}`}>{icon}</div>
            <div>
                <p className="text-gray-500 text-sm font-medium uppercase">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value ?? 0}</p>
            </div>
        </div>
    );
}

function AddStudentModal({ authFetch, onClose, onSuccess, availableCourses }: { authFetch: any; onClose: () => void; onSuccess: () => void; availableCourses: string[] }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        enrollment_number: '',
        student_name: '',
        email: '',
        phone: '',
        course_name: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.enrollment_number || !form.student_name) {
            alert('Enrollment number and name are required');
            return;
        }
        setLoading(true);
        try {
            const res = await authFetch(`${apiBase}/institute/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enrollment_number: parseInt(form.enrollment_number),
                    student_name: form.student_name,
                    email: form.email || null,
                    phone: form.phone || null,
                    course_name: form.course_name || null
                })
            });
            if (res.ok) {
                alert('Student added successfully!');
                onSuccess();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to add student');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to add student');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in">
                <h2 className="text-xl font-bold mb-6 text-gray-900">Add New Student</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number *</label>
                        <input
                            type="text"
                            value={form.enrollment_number}
                            onChange={e => setForm({ ...form, enrollment_number: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            placeholder="e.g., 202401001"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
                        <input
                            type="text"
                            value={form.student_name}
                            onChange={e => setForm({ ...form, student_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                        <select
                            value={form.course_name}
                            onChange={e => setForm({ ...form, course_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                            required
                        >
                            <option value="">Select Course</option>
                            {/* filter(Boolean) ensures we don't show empty rows */}
                            {availableCourses.filter(Boolean).map((course, i) => (
                                <option key={i} value={course}>
                                    {course}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#650C08] text-white rounded-lg hover:bg-[#8B1A1A] disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddCourseModal({ authFetch, onClose, onSuccess }: { authFetch: any; onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        course_name: '',
        stream: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.course_name || !form.stream) {
            alert('Course name and stream are required');
            return;
        }
        setLoading(true);
        try {
            const res = await authFetch(`${apiBase}/institute/request-course-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_name: form.course_name,
                    stream: form.stream
                })
            });
            if (res.ok) {
                alert('Course request submitted successfully! It will appear once approved.');
                onSuccess();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to submit course request');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to submit course request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in">
                <h2 className="text-xl font-bold mb-6 text-gray-900">Request New Course</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                        <input
                            type="text"
                            value={form.course_name}
                            onChange={e => setForm({ ...form, course_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            placeholder="e.g., MASTER OF ARTS - PSYCHOLOGY"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stream *</label>
                        <input
                            type="text"
                            value={form.stream}
                            onChange={e => setForm({ ...form, stream: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            placeholder="e.g., Arts"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#650C08] text-white rounded-lg hover:bg-[#8B1A1A] disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AddFacultyModal({ authFetch, onClose, onSuccess }: { authFetch: any; onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [courseStreams, setCourseStreams] = useState<any[]>([]);
    const [form, setForm] = useState({
        username: '',
        email: '',
        full_name: '',
        department: '', // Will be set from selected course name
        position: '',
        temp_password: '',
        course_stream_id: '' // For initial course assignment
    });

    useEffect(() => {
        // Load courses for this institute from master_students data
        const loadCourses = async () => {
            try {
                const res = await authFetch(`${apiBase}/institute/courses`);
                if (res.ok) {
                    const data = await res.json();
                    // courses come from master_students grouped by course_name
                    setCourseStreams(data.data || []);
                }
            } catch (e) {
                console.error('Failed to load courses:', e);
            }
        };
        loadCourses();
    }, [authFetch]);

    const handleCourseChange = (courseName: string) => {
        setForm({
            ...form,
            course_stream_id: courseName, // Using course_name instead of ID
            department: courseName
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username || !form.email || !form.full_name || !form.temp_password || !form.course_stream_id) {
            alert('All required fields must be filled including course selection');
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch(`${apiBase}/institute/faculty`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username,
                    email: form.email,
                    full_name: form.full_name,
                    department: form.department || 'General',
                    position: form.position,
                    temp_password: form.temp_password
                })
            });

            if (res.ok) {
                alert('Faculty added successfully! When they login, they can manage students in the assigned course.');
                onSuccess();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to add faculty');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to add faculty');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in">
                <h2 className="text-xl font-bold mb-2 text-gray-900">Add New Faculty</h2>
                <p className="text-sm text-gray-500 mb-6">Faculty will need university approval before they can login.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                            type="text"
                            value={form.full_name}
                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Course *</label>
                        <select
                            value={form.course_stream_id}
                            onChange={e => handleCourseChange(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                            required
                        >
                            <option value="">Select a course...</option>
                            {courseStreams.length === 0 ? (
                                <option disabled>No courses available</option>
                            ) : (
                                courseStreams.map((cs, i) => (
                                    <option key={i} value={cs.course_name}>
                                        {cs.course_name} ({cs.student_count || cs.count || 0} students)
                                    </option>
                                ))
                            )}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Faculty will be assigned to this course and can manage its students.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        <select
                            value={form.position}
                            onChange={e => setForm({ ...form, position: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                        >
                            <option value="">Select...</option>
                            <option value="Professor">Professor</option>
                            <option value="Associate Professor">Associate Professor</option>
                            <option value="Assistant Professor">Assistant Professor</option>
                            <option value="Lecturer">Lecturer</option>
                            <option value="Guest Faculty">Guest Faculty</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password *</label>
                        <input
                            type="password"
                            value={form.temp_password}
                            onChange={e => setForm({ ...form, temp_password: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            minLength={6}
                            placeholder="Min 6 characters"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#650C08] text-white rounded-lg hover:bg-[#8B1A1A] disabled:opacity-50"
                        >
                            {loading ? 'Adding...' : 'Add Faculty'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Modal for assigning courses to faculty
function AssignCourseModal({ authFetch, facultyId, facultyName, onClose, onSuccess }: {
    authFetch: any;
    facultyId: number;
    facultyName: string;
    onClose: () => void;
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false);
    const [courseStreams, setCourseStreams] = useState<any[]>([]);
    const [form, setForm] = useState({
        course_stream_id: '',
        semester: '',
        subject_code: '',
        academic_year: ''
    });

    useEffect(() => {
        const loadCourseStreams = async () => {
            try {
                const res = await authFetch(`${apiBase}/institute/courses`);
                if (res.ok) {
                    const data = await res.json();
                    setCourseStreams(data.data || []);
                }
            } catch (e) {
                console.error('Failed to load courses:', e);
            }
        };

        loadCourseStreams();
    }, [authFetch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.course_stream_id) {
            alert('Please select a course');
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch(`${apiBase}/institute/faculty-assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    faculty_id: facultyId,
                    course_stream_id: parseInt(form.course_stream_id),
                    semester: form.semester ? parseInt(form.semester) : null,
                    subject_code: form.subject_code || null,
                    academic_year: form.academic_year || null
                })
            });

            if (res.ok) {
                alert('Faculty assigned to course successfully!');
                onSuccess();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to assign course');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to assign course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-2 text-gray-900">Assign Course to Faculty</h2>
                <p className="text-sm text-gray-500 mb-6">Assigning to: <strong>{facultyName}</strong></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                        <select
                            value={form.course_stream_id}
                            onChange={e => setForm({ ...form, course_stream_id: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                            required
                        >
                            <option value="">Select a course...</option>
                            {courseStreams.map((cs, i) => (
                                <option key={i} value={cs.course_name}>
                                    {cs.course_name} ({cs.student_count})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                            <select
                                value={form.semester}
                                onChange={e => setForm({ ...form, semester: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white"
                            >
                                <option value="">All</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                    <option key={s} value={s}>Semester {s}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                            <input
                                type="text"
                                value={form.academic_year}
                                onChange={e => setForm({ ...form, academic_year: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg p-2.5"
                                placeholder="e.g., 2024-25"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code (Optional)</label>
                        <input
                            type="text"
                            value={form.subject_code}
                            onChange={e => setForm({ ...form, subject_code: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            placeholder="e.g., CS101"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-[#650C08] text-white rounded-lg hover:bg-[#8B1A1A] disabled:opacity-50"
                        >
                            {loading ? 'Assigning...' : 'Assign Course'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}