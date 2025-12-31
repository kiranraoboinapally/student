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
    Bell,
    Settings,
    User,
    LogOut,
    Menu,
    Plus,
    RefreshCw,
    Home,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Building2,
    DollarSign,
    X,
    Users,
    GraduationCap,
    File as FileIcon,
    Edit,
    Trash2
} from "lucide-react";
import Modal from "../../../../shared/components/Modal";
import InstituteDrillDown from "./InstituteDrillDown";
import CourseDrillDown from "./CourseDrillDown";
import StudentsByInstitute from "./StudentsByInstitute";
import FeeVerificationDashboard from "./FeeVerificationDashboard";
import AcademicUploads from "./AcademicUploads";
import AnalyticsDashboard from "./AnalyticsDashboard";
import UniversityOverview from "./UniversityOverview";

const theme = "#650C08";

type TabType = "overview" | "institutes" | "students" | "analytics" | "courses" | "subjects" | "academics" | "faculty" | "notices" | "fees";

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
    const [instituteForm, setInstituteForm] = useState<Institute>({ institute_name: "", institute_code: "", address: "", city: "", state: "", contact_number: "", contact_email: "" } as any);
    const [courseForm, setCourseForm] = useState<Course>({ name: "", code: "", duration_years: 0, institute_id: 0 } as any);
    const [subjectForm, setSubjectForm] = useState<Subject>({ subject_name: "", subject_code: "", credits: 0, semester: 0, course_id: 0 } as any);
    const [facultyForm, setFacultyForm] = useState<Faculty>({ faculty_name: "", email: "", phone: "", department: "", position: "" } as any);
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

            // Enrich students with IDs for filtering
            const instMap = new Map((institutesData || []).map(i => [i.institute_name, i.institute_id]));
            const courseMap = new Map((coursesData || []).map(c => [c.name, c.course_id]));

            const enrichedStudents = (studentsData.students || []).map(s => ({
                ...s,
                institute_id: s.institute_name ? instMap.get(s.institute_name) : undefined,
                course_id: s.course_name ? courseMap.get(s.course_name) : undefined
            }));

            setStudents(enrichedStudents);
            setInstitutes(institutesData);
            setCourses(coursesData);
            setSubjects(subjectsData);
            setFaculty(facultyData);
            setNotices(noticesData);
            setFeePayments(feesData);
            setAdminStats(adminStatsData || {});

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

    // Edit Mode States
    const [editingId, setEditingId] = useState<number | null>(null);

    // --- GENERIC EDIT HANDLERS ---
    const startEdit = (type: 'institute' | 'course' | 'subject' | 'faculty' | 'notice', item: any) => {
        setEditingId(item.institute_id || item.course_id || item.subject_id || item.faculty_id || item.notice_id || item.id);
        if (type === 'institute') {
            setInstituteForm(item);
            setShowInstituteModal(true);
        } else if (type === 'course') {
            setCourseForm(item);
            setShowCourseModal(true);
        } else if (type === 'subject') {
            setSubjectForm(item);
            setShowSubjectModal(true);
        } else if (type === 'faculty') {
            setFacultyForm(item);
            setShowFacultyModal(true);
        } else if (type === 'notice') {
            setNoticeForm(item);
            setShowNoticeModal(true);
        }
    };

    const handleCreateOrUpdateInstitute = async () => {
        if (!instituteForm.institute_name) { alert("Name required"); return; }
        try {
            if (editingId) {
                await service.updateInstitute(editingId, instituteForm);
                alert("Institute updated successfully");
            } else {
                await service.createInstitute(instituteForm);
                alert("Institute created successfully");
            }
            setShowInstituteModal(false);
            setEditingId(null);
            setInstituteForm({ institute_name: "", institute_code: "", address: "", city: "", state: "", contact_number: "", contact_email: "" } as any);
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to save institute");
        }
    };

    const handleCreateOrUpdateCourse = async () => {
        if (!courseForm.name) { alert("Name required"); return; }
        try {
            if (editingId) {
                await service.updateCourse(editingId, courseForm);
                alert("Course updated successfully");
            } else {
                await service.createCourse(courseForm);
                alert("Course created successfully");
            }
            setShowCourseModal(false);
            setEditingId(null);
            setCourseForm({ name: "", code: "", duration: 0, institute_id: 0 } as any);
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to save course");
        }
    };

    const handleCreateOrUpdateSubject = async () => {
        if (!subjectForm.subject_name) { alert("Name required"); return; }
        try {
            if (editingId) {
                await service.updateSubject(editingId, subjectForm);
                alert("Subject updated successfully");
            } else {
                await service.createSubject(subjectForm);
                alert("Subject created successfully");
            }
            setShowSubjectModal(false);
            setEditingId(null);
            setSubjectForm({ subject_name: "", subject_code: "", credits: 0, semester: 0, course_id: 0 } as any);
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to save subject");
        }
    };

    const handleCreateOrUpdateFaculty = async () => {
        if (!facultyForm.faculty_name) { alert("Name required"); return; }
        try {
            if (editingId) {
                await service.updateFaculty(editingId, facultyForm);
                alert("Faculty updated successfully");
            } else {
                await service.createFaculty(facultyForm);
                alert("Faculty created successfully");
            }
            setShowFacultyModal(false);
            setEditingId(null);
            setFacultyForm({ faculty_name: "", email: "", phone: "", department: "", position: "" } as any);
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to save faculty");
        }
    };

    const handleCreateOrUpdateNotice = async () => {
        if (!noticeForm.title) { alert("Title required"); return; }
        try {
            if (editingId) {
                await service.updateNotice(editingId, noticeForm);
                alert("Notice updated successfully");
            } else {
                await service.createNotice(noticeForm);
                alert("Notice created successfully");
            }
            setShowNoticeModal(false);
            setEditingId(null);
            setNoticeForm({ title: "", description: "", created_at: new Date().toISOString() });
            loadAllData();
        } catch (err) {
            console.error(err);
            alert("Failed to save notice");
        }
    };

    // --- DELETE HANDLERS ---
    const handleDeleteCourse = async (id: number) => {
        if (window.confirm("Delete this course?")) {
            await service.deleteCourse(id);
            loadAllData();
        }
    };
    const handleDeleteSubject = async (id: number) => {
        if (window.confirm("Delete this subject?")) {
            await service.deleteSubject(id);
            loadAllData();
        }
    };
    const handleDeleteFaculty = async (id: number) => {
        if (window.confirm("Delete this faculty?")) {
            await service.deleteFaculty(id);
            loadAllData();
        }
    };
    const handleDeleteNotice = async (id: number) => {
        if (window.confirm("Delete this notice?")) {
            await service.deleteNotice(id);
            loadAllData();
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
                    <button onClick={() => loadAllData()} disabled={refreshing} className="flex items-center gap-2 bg-white/5 text-white px-3 py-2 rounded hover:bg-white/10">
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing' : 'Refresh'}
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </nav>

            {/* BREADCRUMB */}
            {activeTab === "institutes" && (
                <div className="px-6 pt-4">
                    <div className="flex items-center gap-2 text-sm text-white/80">
                        <button onClick={handleBackToInstitutes} className="hover:text-white transition-colors flex items-center gap-1">
                            <Home size={16} /> Institutes
                        </button>
                        {selectedInstitute && (
                            <>
                                <ChevronRight size={16} />
                                <button onClick={() => setDrillDownLevel("courses")} className="hover:text-white transition-colors">
                                    {selectedInstitute.institute_name}
                                </button>
                            </>
                        )}
                        {selectedCourse && (
                            <>
                                <ChevronRight size={16} />
                                <span className="text-white">{selectedCourse.name}</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* TABS */}
            <div className="flex gap-0 px-6 pt-6 pb-0 flex-wrap">
                {[
                    { id: "overview", label: "Overview" },
                    { id: "institutes", label: "Institutes & Students" },
                    { id: "analytics", label: "Analytics" },
                    { id: "courses", label: "Courses" },
                    { id: "subjects", label: "Subjects" },
                    { id: "academics", label: "Academics" },
                    { id: "faculty", label: "Faculty" },
                    { id: "notices", label: "Notices" },
                    { id: "fees", label: "Fee Payments" },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as TabType); if (tab.id === "institutes") handleBackToInstitutes(); }}
                        className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${activeTab === tab.id ? "text-white border-white" : "text-white/60 border-transparent hover:text-white/80"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 px-6 py-8 max-w-[1600px] mx-auto w-full">

                {activeTab === "overview" && (
                    <div className="space-y-8">
                        <UniversityOverview
                            stats={adminStats}
                            pendingUsers={pendingUsers}
                            notices={notices}
                            onNavigate={(tab) => {
                                // Handle navigation logic
                                if (tab === 'students') {
                                    setActiveTab('institutes');
                                    // Logic to show students would go here, but for now just switching tab
                                } else {
                                    setActiveTab(tab as TabType);
                                }
                            }}
                        />

                        {/* Keep the detailed table for Review action context if needed, 
                            or we can move the review modal triggers to within the component.
                            For now, let's keep the Pending Registration Table below as a detailed view 
                            specifically if the user wants to see ALL of them, or we can just rely on the component.
                            Actually, the component has a "Review All" button.
                            Let's keep the Pending Table ONLY if we scroll down, or maybe hide it? 
                            The user asked to make it "more better". Replacing it is better.
                            But wait, where is the logic to open the modal? 
                            The new component calls onNavigate.
                            Let's add the table ONLY if there are pending users, below the overview?
                            No, let's put the Pending Users Table inside a dedicated section or just keep it 
                            revealed when clicking "Approve Users" which sets tab to... ?
                            
                            Actually, the existing code had the table right there.
                            The user wants a DASHBOARD.
                            Let's just put the detailed table below the Overview component if there are any pending users,
                            or strictly use the Overview.
                            
                            Better yet: The 'Review' button in the new component calls `onNavigate('overview')`.
                            So remaining on 'overview' is correct.
                            Let's keep the table but styling it as "Detailed Pending Queue" below the dashboard.
                        */}

                        {pendingUsers.length > 0 && (
                            <div className="bg-white/95 rounded-xl shadow p-6 mt-8">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Detailed Pending Queue</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-gray-500 border-b">
                                            <tr>
                                                <th className="py-2">Name</th>
                                                <th className="py-2">Email</th>
                                                <th className="py-2">Date</th>
                                                <th className="py-2 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(user => (
                                                <tr key={user.user_id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 font-medium">{user.full_name}</td>
                                                    <td className="py-3 text-gray-600">{user.email}</td>
                                                    <td className="py-3 text-gray-500">{new Date(user.created_at || '').toLocaleDateString()}</td>
                                                    <td className="py-3 text-right">
                                                        <button
                                                            onClick={() => { setSelectedUser(user); setShowActionModal(true); }}
                                                            className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-orange-200"
                                                        >
                                                            Review
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                {
                    activeTab === "analytics" && (
                        <AnalyticsDashboard
                            institutes={institutes}
                            courses={courses}
                            students={students}
                            feePayments={feePayments}
                            subjects={subjects}
                            adminStats={adminStats}
                        />
                    )
                }

                {/* COURSES TAB */}
                {
                    activeTab === "courses" && (
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
                                                <td className="py-3 px-4 text-gray-900">{course.name}</td>
                                                <td className="py-3 px-4 text-gray-700">{course.code || '-'}</td>
                                                <td className="py-3 px-4 text-gray-700">{course.duration_years || '-'}</td>
                                                <td className="py-3 px-4 text-right flex justify-end gap-2">
                                                    <button onClick={() => startEdit('course', course)} className="text-blue-600 hover:text-blue-800">
                                                        <Edit size={16} />
                                                    </button>
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
                    )
                }

                {/* ACADEMICS TAB */}
                {
                    activeTab === "academics" && (
                        <AcademicUploads
                            institutes={institutes}
                            courses={courses}
                            subjects={subjects}
                            students={students}
                        />
                    )
                }

                {/* SUBJECTS TAB */}
                {
                    activeTab === "subjects" && (
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
                                                <td className="py-3 px-4 text-gray-900">{subject.subject_name}</td>
                                                <td className="py-3 px-4 text-gray-700">{subject.subject_code || '-'}</td>
                                                <td className="py-3 px-4 text-gray-700">{subject.semester || '-'}</td>
                                                <td className="py-3 px-4 text-gray-700">{subject.credits || '-'}</td>
                                                <td className="py-3 px-4 text-right flex justify-end gap-2">
                                                    <button onClick={() => startEdit('subject', subject)} className="text-blue-600 hover:text-blue-800">
                                                        <Edit size={16} />
                                                    </button>
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
                    )
                }

                {/* FACULTY TAB */}
                {/* FACULTY TAB - MODERN CARDS */}
                {
                    activeTab === "faculty" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white/95 rounded-xl shadow p-4 backdrop-blur">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Faculty Directory</h2>
                                    <p className="text-sm text-gray-500">Manage registered faculty members</p>
                                </div>
                                <button
                                    onClick={() => setShowFacultyModal(true)}
                                    className="bg-[#650C08] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#8B1A1A] transition-colors shadow-md"
                                >
                                    <Plus size={18} /> Add Faculty
                                </button>
                            </div>

                            {faculty.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {faculty.map((fac) => (
                                        <div key={fac.faculty_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button
                                                    onClick={() => startEdit('faculty', fac)}
                                                    className="text-gray-400 hover:text-blue-600 bg-white rounded-full p-2 shadow-sm"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFaculty(fac.faculty_id!)}
                                                    className="text-gray-400 hover:text-red-600 bg-white rounded-full p-2 shadow-sm"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#650C08] to-[#991b1b] flex items-center justify-center text-white text-xl font-bold border-4 border-white shadow-md">
                                                    {(fac.faculty_name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{fac.faculty_name}</h3>
                                                    <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mt-1">
                                                        {fac.position || 'Faculty'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                        {/* Email Icon placeholder using simpler div to avoid importing if not needed, or assume Lucide is available globally? No, need imports. */}
                                                        <span className="text-gray-400">@</span>
                                                    </div>
                                                    <span className="truncate">{fac.email || 'No email provided'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-gray-400">#</span>
                                                    </div>
                                                    <span>{fac.phone || 'No phone provided'}</span>
                                                </div>
                                                {fac.department && (
                                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-gray-400">🎓</span>
                                                        </div>
                                                        <span>{fac.department}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <Users className="text-gray-400" size={32} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No Faculty Registered</h3>
                                    <p className="text-gray-500 mt-1">Get started by adding your first faculty member.</p>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* NOTICES TAB */}
                {/* NOTICES TAB - TIMELINE */}
                {
                    activeTab === "notices" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex justify-between items-center bg-white/95 rounded-xl shadow p-4 backdrop-blur">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Notice Board</h2>
                                        <p className="text-sm text-gray-500">Announcements & Updates</p>
                                    </div>
                                    <button
                                        onClick={() => setShowNoticeModal(true)}
                                        className="bg-[#650C08] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#8B1A1A] transition-colors shadow-md"
                                    >
                                        <Plus size={18} /> New Notice
                                    </button>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
                                    {notices.length > 0 ? (
                                        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-100"></div>
                                    ) : null}

                                    <div className="space-y-8 relative">
                                        {notices.length > 0 ? notices.map((notice, idx) => (
                                            <div key={notice.notice_id} className="relative pl-10 group">
                                                {/* Timeline Dot */}
                                                <div className="absolute left-[-5px] top-1 w-4 h-4 rounded-full border-4 border-white bg-[#650C08] shadow-sm z-10 group-hover:scale-125 transition-transform"></div>

                                                <div className="bg-gray-50 rounded-xl p-5 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group-hover:-translate-y-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-[#650C08] bg-red-50 px-2 py-1 rounded uppercase tracking-wider">
                                                            {new Date(notice.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => startEdit('notice', notice)} className="text-gray-300 hover:text-blue-600 transition-colors">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteNotice(notice.notice_id!)}
                                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h3>
                                                    <p className="text-gray-600 text-sm leading-relaxed">{notice.description}</p>
                                                    <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                                                        <span>🕒 Posted {new Date(notice.created_at).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <span className="text-2xl">📢</span>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900">No Notices Yet</h3>
                                                <p className="text-gray-500 mt-1">Create your first announcement to notify students and faculty.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity Mini Feed / Summary could go here */}
                            <div className="space-y-6">
                                <div className="bg-[#650C08] text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h3 className="tex-lg font-bold mb-2">Quick Stats</h3>
                                        <div className="text-4xl font-bold mb-1">{notices.length}</div>
                                        <p className="text-red-200 text-sm">Active Notices</p>
                                    </div>
                                    <div className="absolute right-[-20px] top-[-20px] opacity-10">
                                        <span className="text-[150px]">📢</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* FEE PAYMENTS TAB - ADVANCED VERIFICATION DASHBOARD */}
                {
                    activeTab === "fees" && (
                        <FeeVerificationDashboard
                            payments={feePayments}
                            institutes={institutes}
                            courses={courses}
                            students={students}
                            onRefresh={loadAllData}
                        />
                    )
                }


                {/* MODALS */}
                {
                    showActionModal && selectedUser && (
                        <ConfirmActionModal
                            user={selectedUser}
                            onApprove={() => handleApproveUser(selectedUser)}
                            onReject={() => handleRejectUser(selectedUser)}
                            onClose={() => setShowActionModal(false)}
                        />
                    )
                }

                {
                    showInstituteModal && (
                        <Modal
                            title="Add Institute"
                            onClose={() => setShowInstituteModal(false)}
                            onSave={handleCreateOrUpdateInstitute}
                        >
                            <input type="text" placeholder="Name" value={instituteForm.institute_name} onChange={e => setInstituteForm({ ...instituteForm, institute_name: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="text" placeholder="Code" value={instituteForm.institute_code || ""} onChange={e => setInstituteForm({ ...instituteForm, institute_code: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="text" placeholder="City" value={instituteForm.city || ""} onChange={e => setInstituteForm({ ...instituteForm, city: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="text" placeholder="Contact" value={instituteForm.contact_number || ""} onChange={e => setInstituteForm({ ...instituteForm, contact_number: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                        </Modal>
                    )
                }

                {
                    showCourseModal && (
                        <Modal
                            title="Add Course"
                            onClose={() => setShowCourseModal(false)}
                            onSave={handleCreateOrUpdateCourse}
                        >
                            <input type="text" placeholder="Name" value={courseForm.name || ""} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="text" placeholder="Code" value={courseForm.code || ""} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="number" placeholder="Duration (Years)" value={courseForm.duration_years || ""} onChange={e => setCourseForm({ ...courseForm, duration_years: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2" />
                            <select value={courseForm.institute_id || 0} onChange={e => setCourseForm({ ...courseForm, institute_id: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2">
                                <option value={0}>Select Institute</option>
                                {institutes.map(inst => (
                                    <option key={inst.institute_id} value={inst.institute_id}>{inst.institute_name}</option>
                                ))}
                            </select>
                        </Modal>
                    )
                }

                {
                    showSubjectModal && (
                        <Modal
                            title="Add Subject"
                            onClose={() => setShowSubjectModal(false)}
                            onSave={handleCreateOrUpdateSubject}
                        >
                            <input type="text" placeholder="Name" value={subjectForm.subject_name || ""} onChange={e => setSubjectForm({ ...subjectForm, subject_name: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="text" placeholder="Code" value={subjectForm.subject_code || ""} onChange={e => setSubjectForm({ ...subjectForm, subject_code: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="number" placeholder="Credits" value={subjectForm.credits || ""} onChange={e => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="number" placeholder="Semester" value={subjectForm.semester || ""} onChange={e => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2" />
                            <select value={subjectForm.course_id || 0} onChange={e => setSubjectForm({ ...subjectForm, course_id: Number(e.target.value) })} className="w-full px-3 py-2 border rounded mb-2">
                                <option value={0}>Select Course</option>
                                {courses.map(course => (
                                    <option key={course.course_id} value={course.course_id}>{course.name}</option>
                                ))}
                            </select>
                        </Modal>
                    )
                }

                {
                    showFacultyModal && (
                        <Modal
                            title="Add Faculty"
                            onClose={() => setShowFacultyModal(false)}
                            onSave={handleCreateOrUpdateFaculty}
                        >
                            <input type="text" placeholder="Name" value={facultyForm.faculty_name || ""} onChange={e => setFacultyForm({ ...facultyForm, faculty_name: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="email" placeholder="Email" value={facultyForm.email || ""} onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="tel" placeholder="Phone" value={facultyForm.phone || ""} onChange={e => setFacultyForm({ ...facultyForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="text" placeholder="Department" value={facultyForm.department || ""} onChange={e => setFacultyForm({ ...facultyForm, department: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <input type="text" placeholder="Position" value={facultyForm.position || ""} onChange={e => setFacultyForm({ ...facultyForm, position: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                        </Modal>
                    )
                }

                {
                    showNoticeModal && (
                        <Modal
                            title="Add Notice"
                            onClose={() => setShowNoticeModal(false)}
                            onSave={handleCreateOrUpdateNotice}
                        >
                            <input type="text" placeholder="Title" value={noticeForm.title || ""} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} className="w-full px-3 py-2 border rounded mb-2" />
                            <textarea placeholder="Description" value={noticeForm.description || ""} onChange={e => setNoticeForm({ ...noticeForm, description: e.target.value })} rows={4} className="w-full px-3 py-2 border rounded mb-2" />
                        </Modal>
                    )
                }
            </div>
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
