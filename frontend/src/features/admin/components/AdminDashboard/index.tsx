import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthProvider";
import AdminService from "../../services/adminService";
import type {
    PendingUser,
    Student,
    Institute,
    Course,
    Subject,
    Faculty,
    Notice,
    FeePayment
} from "../../services/adminService";
import {
    BarChart3,
    Users,
    GraduationCap,
    AlertCircle,
    CheckCircle,
    LogOut,
    RefreshCw,
    File,
    DollarSign,
    BookOpen,
    Building2,
    Plus,
    Trash2,
    X,
    ChevronRight,
    Home
} from "lucide-react";
import StatCard from "../../../../shared/components/StatCard";
import Modal from "../../../../shared/components/Modal";
import InstituteDrillDown from "./InstituteDrillDown";
import CourseDrillDown from "./CourseDrillDown";
import StudentsByInstitute from "./StudentsByInstitute";
import StatisticsCharts from "./StatisticsCharts";

const theme = "#650C08";

type TabType = "overview" | "institutes" | "students" | "analytics" | "courses" | "subjects" | "faculty" | "notices" | "fees";

// Breadcrumb navigation state
type DrillDownLevel = "institutes" | "courses" | "students";

export default function AdminDashboard() {
    const { authFetch, logout } = useAuth();
    const navigate = useNavigate();
    const service = new AdminService(authFetch);

    // Tabs
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    // Drill-down navigation state
    const [drillDownLevel, setDrillDownLevel] = useState<DrillDownLevel>("institutes");
    const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    // Data States
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [stats, setStats] = useState({ totalStudents: 0, totalUsers: 0, activeUsers: 0 });
    const [adminStats, setAdminStats] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);

    const [institutes, setInstitutes] = useState<Institute[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [feePayments, setFeePayments] = useState<FeePayment[]>([]);

    // Modal States
    const [showInstituteModal, setShowInstituteModal] = useState(false);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showFacultyModal, setShowFacultyModal] = useState(false);
    const [showNoticeModal, setShowNoticeModal] = useState(false);

    // Form States
    const [instituteForm, setInstituteForm] = useState<Institute>({ name: "", code: "", address: "", city: "", state: "", country: "", contact_number: "", email: "" });
    const [courseForm, setCourseForm] = useState<Course>({ name: "", code: "", duration_years: 0, institute_id: 0 });
    const [subjectForm, setSubjectForm] = useState<Subject>({ name: "", code: "", credits: 0, semester: 0, course_id: 0 });
    const [facultyForm, setFacultyForm] = useState<Faculty>({ name: "", email: "", phone: "", qualification: "", specialization: "" });
    const [noticeForm, setNoticeForm] = useState<Notice>({ title: "", description: "", created_at: new Date().toISOString() });

    // Loading States
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    // Real-time admin notifications via WebSocket
    useEffect(() => {
        if (!authFetch) return;
        const token = (window.localStorage.getItem('app_token') as string | null);
        if (!token) return;
        const wsUrl = (window.location.protocol === 'https:' ? 'wss' : 'ws') + '://localhost:8080/ws/admin?token=' + encodeURIComponent(token);
        let ws: WebSocket | null = null;
        try {
            ws = new WebSocket(wsUrl);
            ws.onopen = () => console.log('Admin websocket connected');
            ws.onmessage = (ev) => {
                try {
                    const msg = JSON.parse(ev.data);
                    console.log('ws msg', msg);
                    if (msg.event === 'marks_uploaded' || msg.event === 'payment_recorded' || msg.event === 'registration_status_changed') {
                        alert(`Admin Notification: ${msg.event} — ${JSON.stringify(msg.payload)}`);
                        loadAllData();
                    }
                } catch (e) {
                    console.error('invalid ws message', e);
                }
            };
            ws.onclose = () => console.log('Admin websocket closed');
        } catch (e) {
            console.error('ws error', e);
        }
        return () => { if (ws) ws.close(); };
    }, [authFetch]);

    async function loadAllData() {
        try {
            setRefreshing(true);
            const [pendingData, studentsData, institutesData, coursesData, subjectsData, facultyData, noticesData, feesData, adminStatsData] = await Promise.all([
                service.getPendingUsers(),
                service.getStudents(1, 1000),
                service.getInstitutes(),
                service.getCourses(),
                service.getSubjects(),
                service.getFaculty(),
                service.getNotices(),
                service.getFeePayments(),
                service.getAdminStats(),
            ]);

            setPendingUsers(pendingData);
            setStudents(studentsData.students);
            setInstitutes(institutesData);
            setCourses(coursesData);
            setSubjects(subjectsData);
            setFaculty(facultyData);
            setNotices(noticesData);
            setFeePayments(feesData);
            setAdminStats(adminStatsData || {});

            setStats({
                totalStudents: studentsData.total,
                totalUsers: studentsData.total + 1,
                activeUsers: studentsData.total - pendingData.length,
            });

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        } finally {
            setRefreshing(false);
        }
    }

    const handleApproveUser = async (user: PendingUser) => {
        try {
            await service.approveUser(user.user_id);
            setPendingUsers(prev => prev.filter(u => u.user_id !== user.user_id));
            setShowActionModal(false);
            alert("User approved successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to approve user");
        }
    };

    const handleRejectUser = async (user: PendingUser) => {
        try {
            await service.rejectUser(user.user_id);
            setPendingUsers(prev => prev.filter(u => u.user_id !== user.user_id));
            setShowActionModal(false);
            alert("User rejected successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to reject user");
        }
    };

    const handleCreateInstitute = async () => {
        if (!instituteForm.name) { alert("Name required"); return; }
        try {
            await service.createInstitute(instituteForm);
            alert("Institute created successfully");
            setShowInstituteModal(false);
            setInstituteForm({ name: "", code: "", address: "", city: "", state: "", country: "", contact_number: "", email: "" });
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to create institute");
        }
    };

    const handleDeleteInstitute = async (id: number) => {
        if (window.confirm("Delete this institute?")) {
            try {
                await service.deleteInstitute(id);
                alert("Institute deleted");
                loadAllData();
            } catch (err) {
                console.error(err);
                alert("Failed to delete institute");
            }
        }
    };

    const handleCreateCourse = async () => {
        if (!courseForm.name) { alert("Name required"); return; }
        try {
            await service.createCourse(courseForm);
            alert("Course created successfully");
            setShowCourseModal(false);
            setCourseForm({ name: "", code: "", duration_years: 0, institute_id: 0 });
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to create course");
        }
    };

    const handleDeleteCourse = async (id: number) => {
        if (window.confirm("Delete this course?")) {
            try {
                await service.deleteCourse(id);
                alert("Course deleted");
                loadAllData();
            } catch (err) {
                console.error(err);
                alert("Failed to delete course");
            }
        }
    };

    const handleCreateSubject = async () => {
        if (!subjectForm.name) { alert("Name required"); return; }
        try {
            await service.createSubject(subjectForm);
            alert("Subject created successfully");
            setShowSubjectModal(false);
            setSubjectForm({ name: "", code: "", credits: 0, semester: 0, course_id: 0 });
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to create subject");
        }
    };

    const handleDeleteSubject = async (id: number) => {
        if (window.confirm("Delete this subject?")) {
            try {
                await service.deleteSubject(id);
                alert("Subject deleted");
                loadAllData();
            } catch (err) {
                console.error(err);
                alert("Failed to delete subject");
            }
        }
    };

    const handleCreateFaculty = async () => {
        if (!facultyForm.name) { alert("Name required"); return; }
        try {
            await service.createFaculty(facultyForm);
            alert("Faculty created successfully");
            setShowFacultyModal(false);
            setFacultyForm({ name: "", email: "", phone: "", qualification: "", specialization: "" });
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to create faculty");
        }
    };

    const handleDeleteFaculty = async (id: number) => {
        if (window.confirm("Delete this faculty?")) {
            try {
                await service.deleteFaculty(id);
                alert("Faculty deleted");
                loadAllData();
            } catch (err) {
                console.error(err);
                alert("Failed to delete faculty");
            }
        }
    };

    const handleCreateNotice = async () => {
        if (!noticeForm.title) { alert("Title required"); return; }
        try {
            await service.createNotice(noticeForm);
            alert("Notice created successfully");
            setShowNoticeModal(false);
            setNoticeForm({ title: "", description: "", created_at: new Date().toISOString() });
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to create notice");
        }
    };

    const handleDeleteNotice = async (id: number) => {
        if (window.confirm("Delete this notice?")) {
            try {
                await service.deleteNotice(id);
                alert("Notice deleted");
                loadAllData();
            } catch (err) {
                console.error(err);
                alert("Failed to delete notice");
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    // Drill-down handlers
    const handleSelectInstitute = (institute: Institute) => {
        setSelectedInstitute(institute);
        setDrillDownLevel("courses");
    };

    const handleSelectCourse = (course: Course) => {
        setSelectedCourse(course);
        setDrillDownLevel("students");
    };

    const handleBackToInstitutes = () => {
        setSelectedInstitute(null);
        setSelectedCourse(null);
        setDrillDownLevel("institutes");
    };

    const handleBackToCourses = () => {
        setSelectedCourse(null);
        setDrillDownLevel("courses");
    };

    const filteredUsers = pendingUsers.filter(u =>
        `${u.full_name} ${u.email} ${u.username}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme} 0%, #8B1A1A 50%, #1a1a1a 100%)` }}>
                <div className="text-white text-lg">Loading admin dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${theme} 0%, #8B1A1A 50%, #1a1a1a 100%)` }}>
            {/* NAVBAR */}
            <nav className="flex justify-between items-center px-6 py-4 bg-white/5 backdrop-blur border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm bg-white">
                        <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                        <p className="text-xs text-white/80">ERP Management System</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => loadAllData()}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-white/5 text-white px-3 py-2 rounded hover:bg-white/10"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing' : 'Refresh'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </nav>

            {/* BREADCRUMB NAVIGATION */}
            {activeTab === "institutes" && (
                <div className="px-6 pt-4">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                        <button
                            onClick={handleBackToInstitutes}
                            className="hover:text-white transition-colors flex items-center gap-1"
                        >
                            <Home size={16} />
                            Institutes
                        </button>
                        {selectedInstitute && (
                            <>
                                <ChevronRight size={16} />
                                <button
                                    onClick={() => setDrillDownLevel("courses")}
                                    className="hover:text-white transition-colors"
                                >
                                    {selectedInstitute.name}
                                </button>
                            </>
                        )}
                        {selectedCourse && (
                            <>
                                <ChevronRight size={16} />
                                <span className="text-white">{selectedCourse.name || selectedCourse.course_name}</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* TAB NAVIGATION */}
            <div className="flex gap-0 px-6 pt-6 pb-0 flex-wrap">
                {[
                    { id: "overview", label: "Overview" },
                    { id: "institutes", label: "Institutes & Students" },
                    { id: "analytics", label: "Analytics" },
                    { id: "courses", label: "Courses" },
                    { id: "subjects", label: "Subjects" },
                    { id: "faculty", label: "Faculty" },
                    { id: "notices", label: "Notices" },
                    { id: "fees", label: "Fee Payments" },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as TabType);
                            if (tab.id === "institutes") {
                                handleBackToInstitutes();
                            }
                        }}
                        className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${activeTab === tab.id
                            ? "text-white border-white"
                            : "text-white/60 border-transparent hover:text-white/80"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 px-6 py-8 max-w-[1600px] mx-auto w-full">
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="text-white" />} />
                            <StatCard title="Total Students" value={stats.totalStudents} icon={<GraduationCap className="text-white" />} />
                            <StatCard title="Pending Approvals" value={pendingUsers.length} icon={<AlertCircle className="text-white" />} />
                            <StatCard title="Active Students" value={stats.activeUsers} icon={<CheckCircle className="text-white" />} />
                        </div>

                        {adminStats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <StatCard title="Institutes" value={adminStats.total_institutes || 0} icon={<Building2 className="text-white" />} />
                                <StatCard title="Fees Paid (₹)" value={adminStats.total_fees_paid ? Math.round(adminStats.total_fees_paid) : 0} icon={<DollarSign className="text-white" />} />
                                <StatCard title="Pending Fees (₹)" value={adminStats.total_pending_fees ? Math.round(adminStats.total_pending_fees) : 0} icon={<File className="text-white" />} />
                                <StatCard title="Passed Students" value={adminStats.passed_students_count || 0} icon={<CheckCircle className="text-white" />} />
                            </div>
                        )}

                        <div className="bg-white/95 rounded-xl shadow p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Pending Registrations</h2>
                                    <p className="text-sm text-gray-600">{filteredUsers.length} of {pendingUsers.length} awaiting review</p>
                                </div>
                                <input
                                    className="px-3 py-2 rounded border"
                                    placeholder="Search by name, email..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {filteredUsers.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="mx-auto mb-2 text-green-500" size={48} />
                                    <p className="text-gray-900 font-semibold">All Caught Up!</p>
                                    <p className="text-gray-600">No pending student registrations</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="text-gray-600 border-b">
                                                <th className="py-3">Name</th>
                                                <th className="py-3">Email</th>
                                                <th className="py-3">Enrollment</th>
                                                <th className="py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(user => (
                                                <tr key={user.user_id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 text-gray-900">{user.full_name}</td>
                                                    <td className="py-3 text-gray-700">{user.email}</td>
                                                    <td className="py-3 text-gray-700 font-mono text-xs">{user.username}</td>
                                                    <td className="py-3 text-right">
                                                        <button
                                                            onClick={() => { setSelectedUser(user); setShowActionModal(true); }}
                                                            className="bg-[#650C08] text-white px-3 py-1 rounded hover:bg-[#8B1A1A]"
                                                        >Review</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* INSTITUTES TAB WITH DRILL-DOWN */}
                {activeTab === "institutes" && (
                    <>
                        {drillDownLevel === "institutes" && (
                            <InstituteDrillDown
                                institutes={institutes}
                                courses={courses}
                                students={students}
                                onSelectInstitute={handleSelectInstitute}
                            />
                        )}
                        {drillDownLevel === "courses" && selectedInstitute && (
                            <CourseDrillDown
                                selectedInstitute={selectedInstitute}
                                courses={courses}
                                students={students}
                                onSelectCourse={handleSelectCourse}
                                onBack={handleBackToInstitutes}
                            />
                        )}
                        {drillDownLevel === "students" && (
                            <StudentsByInstitute
                                selectedInstitute={selectedInstitute}
                                selectedCourse={selectedCourse}
                                students={students}
                                courses={courses}
                                onBack={selectedCourse ? handleBackToCourses : handleBackToInstitutes}
                            />
                        )}
                    </>
                )}

                {/* ANALYTICS TAB */}
                {activeTab === "analytics" && (
                    <StatisticsCharts
                        institutes={institutes}
                        courses={courses}
                        students={students}
                        feePayments={feePayments}
                    />
                )}

                {/* COURSES TAB */}
                {activeTab === "courses" && (
                    <div className="bg-white/95 rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Courses</h2>
                            <button
                                onClick={() => setShowCourseModal(true)}
                                className="bg-[#650C08] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#8B1A1A]"
                            >
                                <Plus size={16} /> Add Course
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-gray-600 border-b bg-gray-50">
                                        <th className="py-3 px-4">Name</th>
                                        <th className="py-3 px-4">Code</th>
                                        <th className="py-3 px-4">Duration (Years)</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.length > 0 ? courses.map(course => (
                                        <tr key={course.course_id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900">{course.name || course.course_name}</td>
                                            <td className="py-3 px-4 text-gray-700">{course.code || course.course_code || '-'}</td>
                                            <td className="py-3 px-4 text-gray-700">{course.duration_years || '-'}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteCourse(course.course_id!)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="py-4 text-center text-gray-500">No courses found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SUBJECTS TAB */}
                {activeTab === "subjects" && (
                    <div className="bg-white/95 rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Subjects</h2>
                            <button
                                onClick={() => setShowSubjectModal(true)}
                                className="bg-[#650C08] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#8B1A1A]"
                            >
                                <Plus size={16} /> Add Subject
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-gray-600 border-b bg-gray-50">
                                        <th className="py-3 px-4">Name</th>
                                        <th className="py-3 px-4">Code</th>
                                        <th className="py-3 px-4">Semester</th>
                                        <th className="py-3 px-4">Credits</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.length > 0 ? subjects.map(subject => (
                                        <tr key={subject.subject_id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900">{subject.name || subject.subject_name}</td>
                                            <td className="py-3 px-4 text-gray-700">{subject.code || subject.subject_code || '-'}</td>
                                            <td className="py-3 px-4 text-gray-700">{subject.semester || '-'}</td>
                                            <td className="py-3 px-4 text-gray-700">{subject.credits || '-'}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteSubject(subject.subject_id!)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center text-gray-500">No subjects found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* FACULTY TAB */}
                {activeTab === "faculty" && (
                    <div className="bg-white/95 rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Faculty</h2>
                            <button
                                onClick={() => setShowFacultyModal(true)}
                                className="bg-[#650C08] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#8B1A1A]"
                            >
                                <Plus size={16} /> Add Faculty
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-gray-600 border-b bg-gray-50">
                                        <th className="py-3 px-4">Name</th>
                                        <th className="py-3 px-4">Email</th>
                                        <th className="py-3 px-4">Phone</th>
                                        <th className="py-3 px-4">Specialization</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {faculty.length > 0 ? faculty.map(fac => (
                                        <tr key={fac.faculty_id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900">{fac.name || fac.faculty_name}</td>
                                            <td className="py-3 px-4 text-gray-700">{fac.email || '-'}</td>
                                            <td className="py-3 px-4 text-gray-700">{fac.phone || '-'}</td>
                                            <td className="py-3 px-4 text-gray-700">{fac.specialization || '-'}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteFaculty(fac.faculty_id!)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center text-gray-500">No faculty found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* NOTICES TAB */}
                {activeTab === "notices" && (
                    <div className="bg-white/95 rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Notices</h2>
                            <button
                                onClick={() => setShowNoticeModal(true)}
                                className="bg-[#650C08] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#8B1A1A]"
                            >
                                <Plus size={16} /> Add Notice
                            </button>
                        </div>
                        <div className="space-y-4">
                            {notices.length > 0 ? notices.map(notice => (
                                <div key={notice.notice_id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{notice.title}</h3>
                                        <p className="text-gray-700 text-sm mt-1">{notice.description}</p>
                                        <p className="text-xs text-gray-500 mt-2">{new Date(notice.created_at).toLocaleDateString("en-IN")}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteNotice(notice.notice_id!)}
                                        className="text-red-600 hover:text-red-800 ml-4"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">No notices found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* FEE PAYMENTS TAB */}
                {activeTab === "fees" && (
                    <div className="bg-white/95 rounded-xl shadow p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Fee Payment History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-gray-600 border-b bg-gray-50">
                                        <th className="py-3 px-4">Student Name</th>
                                        <th className="py-3 px-4">Amount Paid (₹)</th>
                                        <th className="py-3 px-4">Fee Type</th>
                                        <th className="py-3 px-4">Payment Date</th>
                                        <th className="py-3 px-4">Transaction No.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feePayments.length > 0 ? feePayments.map((payment, idx) => (
                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-900">{payment.student_name || '-'}</td>
                                            <td className="py-3 px-4 text-gray-700">₹{(payment.amount_paid || 0).toLocaleString("en-IN")}</td>
                                            <td className="py-3 px-4 text-gray-700">{payment.fee_type || '-'}</td>
                                            <td className="py-3 px-4 text-gray-700">{payment.payment_date || '-'}</td>
                                            <td className="py-3 px-4 text-gray-700 font-mono">{payment.transaction_number || '-'}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center text-gray-500">No fee payments found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {showActionModal && selectedUser && (
                <ConfirmActionModal
                    user={selectedUser}
                    onApprove={() => handleApproveUser(selectedUser)}
                    onReject={() => handleRejectUser(selectedUser)}
                    onClose={() => setShowActionModal(false)}
                />
            )}

            {showInstituteModal && (
                <Modal
                    title="Add Institute"
                    onClose={() => setShowInstituteModal(false)}
                    onSave={handleCreateInstitute}
                >
                    <input type="text" placeholder="Name" value={instituteForm.name} onChange={e => setInstituteForm({ ...instituteForm, name: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="text" placeholder="Code" value={instituteForm.code || ""} onChange={e => setInstituteForm({ ...instituteForm, code: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="text" placeholder="City" value={instituteForm.city || ""} onChange={e => setInstituteForm({ ...instituteForm, city: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="text" placeholder="Contact" value={instituteForm.contact_number || ""} onChange={e => setInstituteForm({ ...instituteForm, contact_number: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                </Modal>
            )}

            {showCourseModal && (
                <Modal
                    title="Add Course"
                    onClose={() => setShowCourseModal(false)}
                    onSave={handleCreateCourse}
                >
                    <input type="text" placeholder="Name" value={courseForm.name || ""} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="text" placeholder="Code" value={courseForm.code || ""} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="number" placeholder="Duration (Years)" value={courseForm.duration_years || ""} onChange={e => setCourseForm({ ...courseForm, duration_years: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2" />
                    <select value={courseForm.institute_id || 0} onChange={e => setCourseForm({ ...courseForm, institute_id: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2">
                        <option value={0}>Select Institute</option>
                        {institutes.map(inst => (
                            <option key={inst.institute_id} value={inst.institute_id}>{inst.name}</option>
                        ))}
                    </select>
                </Modal>
            )}

            {showSubjectModal && (
                <Modal
                    title="Add Subject"
                    onClose={() => setShowSubjectModal(false)}
                    onSave={handleCreateSubject}
                >
                    <input type="text" placeholder="Name" value={subjectForm.name || ""} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="text" placeholder="Code" value={subjectForm.code || ""} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="number" placeholder="Credits" value={subjectForm.credits || ""} onChange={e => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="number" placeholder="Semester" value={subjectForm.semester || ""} onChange={e => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2" />
                    <select value={subjectForm.course_id || 0} onChange={e => setSubjectForm({ ...subjectForm, course_id: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2">
                        <option value={0}>Select Course</option>
                        {courses.map(course => (
                            <option key={course.course_id} value={course.course_id}>{course.name || course.course_name}</option>
                        ))}
                    </select>
                </Modal>
            )}

            {showFacultyModal && (
                <Modal
                    title="Add Faculty"
                    onClose={() => setShowFacultyModal(false)}
                    onSave={handleCreateFaculty}
                >
                    <input type="text" placeholder="Name" value={facultyForm.name || ""} onChange={e => setFacultyForm({ ...facultyForm, name: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="email" placeholder="Email" value={facultyForm.email || ""} onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="tel" placeholder="Phone" value={facultyForm.phone || ""} onChange={e => setFacultyForm({ ...facultyForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="text" placeholder="Qualification" value={facultyForm.qualification || ""} onChange={e => setFacultyForm({ ...facultyForm, qualification: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <input type="text" placeholder="Specialization" value={facultyForm.specialization || ""} onChange={e => setFacultyForm({ ...facultyForm, specialization: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                </Modal>
            )}

            {showNoticeModal && (
                <Modal
                    title="Add Notice"
                    onClose={() => setShowNoticeModal(false)}
                    onSave={handleCreateNotice}
                >
                    <input type="text" placeholder="Title" value={noticeForm.title || ""} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                    <textarea placeholder="Description" value={noticeForm.description || ""} onChange={e => setNoticeForm({ ...noticeForm, description: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded mb-2" />
                </Modal>
            )}
        </div>
    );
}

// Confirm Action Modal Component
function ConfirmActionModal({ user, onApprove, onReject, onClose }: { user: PendingUser; onApprove: () => void; onReject: () => void; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Review Registration</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="px-6 py-4">
                    <div className="space-y-2">
                        <p><span className="font-semibold">Name:</span> {user.full_name}</p>
                        <p><span className="font-semibold">Email:</span> {user.email}</p>
                        <p><span className="font-semibold">Username:</span> {user.username}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onReject}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Reject
                    </button>
                    <button
                        onClick={onApprove}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Approve
                    </button>
                </div>
            </div>
        </div>
    );
}
