import { useEffect, useState } from "react";
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
    LogOut,
    Plus,
    RefreshCw,
    Home,
    ChevronRight,
    Building2,
    DollarSign,
    X,
    Users,
    File as FileIcon,
    Edit,
    Trash2,
    BookOpen,
    ChevronLeft
} from "lucide-react";
import Modal from "../../../../shared/components/Modal";
import InstituteDrillDown from "./InstituteDrillDown";
import CourseDrillDown from "./CourseDrillDown";
import StudentsByInstitute from "./StudentsByInstitute";
import FeeVerificationDashboard from "./FeeVerificationDashboard";
import AcademicUploads from "./AcademicUploads";
import AnalyticsDashboard from "./AnalyticsDashboard";
import UniversityOverview from "./UniversityOverview";


const Pagination = ({ current, total, onPageChange }: { current: number, total: number, onPageChange: (p: number) => void }) => {
    const totalPages = Math.ceil(total / 20); // assuming 20 limit
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
            <div className="text-sm text-gray-500">
                Showing page <span className="font-medium">{current}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
                <button
                    disabled={current === 1}
                    onClick={() => onPageChange(current - 1)}
                    className="p-1.5 rounded border border-gray-200 enabled:hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    disabled={current === totalPages}
                    onClick={() => onPageChange(current + 1)}
                    className="p-1.5 rounded border border-gray-200 enabled:hover:bg-gray-100 disabled:opacity-50 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

type TabType = "overview" | "institutes" | "analytics" | "subjects" | "academics" | "faculty" | "notices" | "fees";

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
    const [pendingTotal, setPendingTotal] = useState(0);
    const [students] = useState<Student[]>([]);
    const [studentsTotal] = useState(0);
    const [adminStats, setAdminStats] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);

    const [institutes, setInstitutes] = useState<Institute[]>([]);
    const [institutesTotal, setInstitutesTotal] = useState(0);
    const [courses, setCourses] = useState<Course[]>([]);
    const [coursesTotal, setCoursesTotal] = useState(0);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectsTotal, setSubjectsTotal] = useState(0);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [facultyTotal, setFacultyTotal] = useState(0);
    const [notices, setNotices] = useState<Notice[]>([]);
    const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
    const [feesTotal, setFeesTotal] = useState(0);

    // Pagination States
    const [pages, setPages] = useState<Record<string, number>>({
        students: 1,
        institutes: 1,
        courses: 1,
        subjects: 1,
        faculty: 1,
        fees: 1,
        pending: 1
    });

    // Modal States
    const [showInstituteModal, setShowInstituteModal] = useState(false);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showFacultyModal, setShowFacultyModal] = useState(false);
    const [showNoticeModal, setShowNoticeModal] = useState(false);

    // Form States
    const [instituteForm, setInstituteForm] = useState<Institute>({ institute_name: "", institute_code: "", address: "", city: "", state: "", contact_number: "", contact_email: "" } as any);
    const [courseForm, setCourseForm] = useState<Course>({ name: "", code: "", duration: 0, institute_id: 0 } as any);
    const [subjectForm, setSubjectForm] = useState<Subject>({ subject_name: "", subject_code: "", credits: 0, semester: 0, course_id: 0 } as any);
    const [facultyForm, setFacultyForm] = useState<Faculty>({ faculty_name: "", email: "", phone: "", department: "", position: "" } as any);
    const [noticeForm, setNoticeForm] = useState<Notice>({ title: "", description: "", created_at: new Date().toISOString() });

    // Loading States
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboardBase();
    }, []);

    // Load only base data for dashboard (stats + pending)
    async function loadDashboardBase() {
        try {
            setLoading(true);
            const [statsData, pendingData, noticesData] = await Promise.all([
                service.getAdminStats(),
                service.getPendingUsers(1, 5),
                service.getNotices()
            ]);
            setAdminStats(statsData || {});
            setPendingUsers(pendingData.pending_registrations);
            setPendingTotal(pendingData.total);
            setNotices(noticesData);

            // Pre-load lookup data for modals
            const [instLook/*, courseLook*/] = await Promise.all([
                service.getInstitutes(1, 1000),
                //service.getCourses(1, 1000)
            ]);
            setInstitutes(instLook.institutes);
            setInstitutesTotal(instLook.total);
            //setCourses(courseLook.courses);
            //setCoursesTotal(courseLook.total);

            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }

    // Lazy load tab data
    useEffect(() => {
        if (activeTab === "overview") return;
        loadTabData(activeTab);
    }, [activeTab, pages]);

    async function loadTabData(tab: TabType) {
        try {
            setRefreshing(true);
            const page = pages[tab] || 1;
            const limit = 70;

            switch (tab) {
                case "institutes":
                    const iData = await service.getInstitutes(page, limit);
                    setInstitutes(iData.institutes);
                    setInstitutesTotal(iData.total);
                    break;
                case "subjects":
                    const subData = await service.getSubjects(page, limit);
                    setSubjects(subData.subjects);
                    setSubjectsTotal(subData.total);
                    break;
                case "faculty":
                    const fData = await service.getFaculty(page, limit);
                    setFaculty(fData.faculty);
                    setFacultyTotal(fData.total);
                    break;
                case "fees":
                    const feeData = await service.getFeePayments(page, limit);
                    setFeePayments(feeData.payments);
                    setFeesTotal(feeData.total);
                    break;
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRefreshing(false);
        }
    }

    async function loadAllData() {
        // Legacy or refresh all
        loadDashboardBase();
        if (activeTab !== "overview") loadTabData(activeTab);
    }

    const handleReviewUser = (user: PendingUser) => {
        setSelectedUser(user);
        setShowActionModal(true);
    };

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
            setCourseForm({ name: "", code: "", duration: 0, institute_id: selectedInstitute?.institute_id || 0 } as any);
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

    // Computed Stats for Overview
    const dashboardStats = {
        ...adminStats,
        total_pending: pendingTotal || pendingUsers.length,
        active_colleges: institutesTotal || institutes.length,
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-[#650C08] animate-spin" />
                    <div className="text-[#650C08] font-medium text-lg">Loading University Dashboard...</div>
                </div>
            </div>
        );
    }

    const SidebarItem = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
        <button
            onClick={() => { setActiveTab(id); if (id === "institutes") handleBackToInstitutes(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${activeTab === id
                ? "bg-[#650C08] text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100 hover:text-[#650C08]"
                }`}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col fixed h-full z-20">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#650C08] flex items-center justify-center">
                        <span className="text-white font-bold text-xl">U</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none">UniAdmin</h1>
                        <p className="text-xs text-gray-500 mt-1">Management Portal</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-1">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Main</p>
                        <SidebarItem id="overview" label="Dashboard" icon={Home} />
                        <SidebarItem id="institutes" label="Colleges" icon={Building2} />
                        <SidebarItem id="faculty" label="Faculty" icon={Users} />
                    </div>

                    <div className="space-y-1 mt-8">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Management</p>
                        <SidebarItem id="fees" label="Fee Payments" icon={DollarSign} />
                        <SidebarItem id="academics" label="Academics" icon={FileIcon} />
                        <SidebarItem id="notices" label="Holidays & Notices" icon={Bell} />
                        <SidebarItem id="subjects" label="Subjects" icon={BookOpen} />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 ml-64 min-w-0 flex flex-col">
                {/* TOP HEADER */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-8 py-4 flex justify-between items-center shadow-sm">
                    {/* Breadcrumbs or Title */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 capitalize">
                            {activeTab === 'overview' ? 'Admin Dashboard' :
                                activeTab === 'institutes' ? 'Colleges Management' :
                                    activeTab}
                        </h2>
                        {activeTab === "institutes" && (selectedInstitute || selectedCourse) && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="hover:text-[#650C08] cursor-pointer" onClick={handleBackToInstitutes}>Colleges</span>
                                {selectedInstitute && (
                                    <>
                                        <ChevronRight size={14} />
                                        <span
                                            className={`${!selectedCourse ? 'text-gray-900 font-medium' : 'hover:text-[#650C08] cursor-pointer'}`}
                                            onClick={() => setDrillDownLevel("courses")}
                                        >
                                            {selectedInstitute.institute_name}
                                        </span>
                                    </>
                                )}
                                {selectedCourse && (
                                    <>
                                        <ChevronRight size={14} />
                                        <span className="text-gray-900 font-medium">{selectedCourse.name}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => loadAllData()} disabled={refreshing} className="p-2 text-gray-500 hover:text-[#650C08] hover:bg-gray-50 rounded-full transition-all">
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="h-8 w-px bg-gray-200 mx-2"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900">University Admin</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#650C08] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">

                        {activeTab === "overview" && (
                            <UniversityOverview
                                stats={dashboardStats}
                                pendingUsers={pendingUsers}
                                notices={notices}
                                onReviewUser={handleReviewUser}
                                onNavigate={(tab) => {
                                    if (tab === 'students') {
                                        setActiveTab('institutes'); // Redirect to institutes drill down
                                    } else {
                                        setActiveTab(tab as TabType);
                                    }
                                }}
                            />
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
                                        onAdd={() => {
                                            setEditingId(null);
                                            setCourseForm({ name: "", code: "", duration: 0, institute_id: selectedInstitute.institute_id } as any);
                                            setShowCourseModal(true);
                                        }}
                                        onEdit={(c) => startEdit('course', c)}
                                        onDelete={handleDeleteCourse}
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


                        {activeTab === "analytics" && (
                            <AnalyticsDashboard
                                institutes={institutes}
                                courses={courses}
                                students={students}
                                feePayments={feePayments}
                                subjects={subjects}
                                adminStats={adminStats}
                            />
                        )}


                        {activeTab === "academics" && (
                            <AcademicUploads
                                institutes={institutes}
                                courses={courses}
                                subjects={subjects}
                                students={students}
                            />
                        )}

                        {activeTab === "subjects" && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Subjects Repository</h2>
                                        <p className="text-sm text-gray-500">Manage subjects and credits</p>
                                    </div>
                                    <button
                                        onClick={() => setShowSubjectModal(true)}
                                        className="bg-[#650C08] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#8B1A1A] shadow-sm transition-all"
                                    >
                                        <Plus size={18} /> Add Subject
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-600 font-medium">
                                            <tr>
                                                <th className="py-3 px-6">Subject Name</th>
                                                <th className="py-3 px-6">Code</th>
                                                <th className="py-3 px-6">Semester</th>
                                                <th className="py-3 px-6">Credits</th>
                                                <th className="py-3 px-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {subjects.length > 0 ? subjects.map(subject => (
                                                <tr key={subject.subject_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-6 font-medium text-gray-900">{subject.subject_name}</td>
                                                    <td className="py-4 px-6 text-gray-600"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{subject.subject_code || 'N/A'}</span></td>
                                                    <td className="py-4 px-6 text-gray-600">Sem {subject.semester}</td>
                                                    <td className="py-4 px-6 text-gray-600">{subject.credits}</td>
                                                    <td className="py-4 px-6 text-right flex justify-end gap-2">
                                                        <button onClick={() => startEdit('subject', subject)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeleteSubject(subject.subject_id!)} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center text-gray-500">No subjects found.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination
                                    current={pages.subjects}
                                    total={subjectsTotal}
                                    onPageChange={(p) => setPages({ ...pages, subjects: p })}
                                />
                            </div>
                        )}

                        {activeTab === "faculty" && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                                            <div key={fac.faculty_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group relative">
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                    <button onClick={() => startEdit('faculty', fac)} className="text-gray-500 hover:text-blue-600 bg-gray-100 rounded-full p-2"><Edit size={16} /></button>
                                                    <button onClick={() => handleDeleteFaculty(fac.faculty_id!)} className="text-gray-500 hover:text-red-600 bg-gray-100 rounded-full p-2"><Trash2 size={16} /></button>
                                                </div>

                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-16 h-16 rounded-full bg-[#650C08]/10 flex items-center justify-center text-[#650C08] text-2xl font-bold">
                                                        {(fac.faculty_name || 'F').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{fac.faculty_name}</h3>
                                                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 mt-1">
                                                            {fac.position || 'Faculty Member'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                                        <span className="text-gray-400 w-4"><Users size={16} /></span>
                                                        <span className="truncate">{fac.department || 'General Department'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                                        <span className="text-gray-400 w-4">@</span>
                                                        <span className="truncate">{fac.email || 'No email provided'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                                        <span className="text-gray-400 w-4">#</span>
                                                        <span>{fac.phone || 'No phone'}</span>
                                                    </div>
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
                                {faculty.length > 0 && (
                                    <Pagination
                                        current={pages.faculty}
                                        total={facultyTotal}
                                        onPageChange={(p) => setPages({ ...pages, faculty: p })}
                                    />
                                )}
                            </div>
                        )}

                        {activeTab === "notices" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex justify-between items-center bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Notice Board</h2>
                                            <p className="text-sm text-gray-500 mt-1">Announcements & Updates</p>
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
                                            {notices.length > 0 ? notices.map((notice) => (
                                                <div key={notice.notice_id} className="relative pl-10 group">
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
                                                                <button onClick={() => handleDeleteNotice(notice.notice_id!)} className="text-gray-300 hover:text-red-500 transition-colors">
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

                                <div className="lg:col-span-1">
                                    <div className="space-y-6">
                                        <div className="bg-[#650C08] text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
                                            <div className="relative z-10">
                                                <h3 className="text-lg font-bold mb-2">Quick Stats</h3>
                                                <div className="text-4xl font-bold mb-1">{notices.length}</div>
                                                <p className="text-red-200 text-sm">Active Notices</p>
                                            </div>
                                            <div className="absolute right-[-20px] top-[-20px] opacity-10">
                                                <span className="text-[150px]">📢</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "fees" && (
                            <div className="space-y-6">
                                <FeeVerificationDashboard
                                    payments={feePayments}
                                    institutes={institutes}
                                    courses={courses}
                                    students={students}
                                    onRefresh={loadAllData}
                                    adminStats={adminStats}
                                />
                                <Pagination
                                    current={pages.fees}
                                    total={feesTotal}
                                    onPageChange={(p) => setPages({ ...pages, fees: p })}
                                />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* MODALS */}
            {/* Same modals as before, just kept for functionality */}
            {showInstituteModal && (
                <Modal onClose={() => setShowInstituteModal(false)} onSave={handleCreateOrUpdateInstitute} title={editingId ? "Edit College" : "Add College"}>
                    <div className="space-y-4">
                        <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#650C08] outline-none" placeholder="Institute Name" value={instituteForm.institute_name} onChange={e => setInstituteForm({ ...instituteForm, institute_name: e.target.value })} />
                        <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#650C08] outline-none" placeholder="Email" value={instituteForm.contact_email} onChange={e => setInstituteForm({ ...instituteForm, contact_email: e.target.value })} />
                        <input className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#650C08] outline-none" placeholder="Location" value={instituteForm.address} onChange={e => setInstituteForm({ ...instituteForm, address: e.target.value })} />
                    </div>
                </Modal>
            )}

            {showCourseModal && (
                <Modal onClose={() => setShowCourseModal(false)} onSave={handleCreateOrUpdateCourse} title={editingId ? "Edit Course" : "Add Course"}>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded" placeholder="Course Name" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} />
                        <input className="w-full p-2 border rounded" placeholder="Code" value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} />
                        <input className="w-full p-2 border rounded" type="number" placeholder="Duration (Years)" value={courseForm.duration_years} onChange={e => setCourseForm({ ...courseForm, duration_years: Number(e.target.value) })} />
                        <select
                            className="w-full p-2 border rounded"
                            value={courseForm.institute_id || ""}
                            onChange={e => setCourseForm({ ...courseForm, institute_id: Number(e.target.value) })}
                        >
                            <option value="">Select Institute</option>
                            {institutes.map(inst => (
                                <option key={inst.institute_id} value={inst.institute_id}>{inst.institute_name}</option>
                            ))}
                        </select>
                    </div>
                </Modal>
            )}

            {showSubjectModal && (
                <Modal onClose={() => setShowSubjectModal(false)} onSave={handleCreateOrUpdateSubject} title={editingId ? "Edit Subject" : "Add Subject"}>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded" placeholder="Subject Name" value={subjectForm.subject_name} onChange={e => setSubjectForm({ ...subjectForm, subject_name: e.target.value })} />
                        <input className="w-full p-2 border rounded" placeholder="Code" value={subjectForm.subject_code} onChange={e => setSubjectForm({ ...subjectForm, subject_code: e.target.value })} />
                        <input className="w-full p-2 border rounded" type="number" placeholder="Semester" value={subjectForm.semester} onChange={e => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })} />
                        <input className="w-full p-2 border rounded" type="number" placeholder="Credits" value={subjectForm.credits} onChange={e => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })} />
                    </div>
                </Modal>
            )}

            {showFacultyModal && (
                <Modal onClose={() => setShowFacultyModal(false)} onSave={handleCreateOrUpdateFaculty} title={editingId ? "Edit Faculty" : "Add Faculty"}>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded" placeholder="Name" value={facultyForm.faculty_name} onChange={e => setFacultyForm({ ...facultyForm, faculty_name: e.target.value })} />
                        <input className="w-full p-2 border rounded" placeholder="Position" value={facultyForm.position} onChange={e => setFacultyForm({ ...facultyForm, position: e.target.value })} />
                        <input className="w-full p-2 border rounded" placeholder="Email" value={facultyForm.email} onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })} />
                        <input className="w-full p-2 border rounded" placeholder="Department" value={facultyForm.department} onChange={e => setFacultyForm({ ...facultyForm, department: e.target.value })} />
                    </div>
                </Modal>
            )}

            {showNoticeModal && (
                <Modal onClose={() => setShowNoticeModal(false)} onSave={handleCreateOrUpdateNotice} title={editingId ? "Edit Notice" : "Post Notice"}>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded" placeholder="Title" value={noticeForm.title} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} />
                        <textarea className="w-full p-2 border rounded h-32" placeholder="Description" value={noticeForm.description} onChange={e => setNoticeForm({ ...noticeForm, description: e.target.value })} />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowNoticeModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleCreateOrUpdateNotice} className="px-4 py-2 bg-[#650C08] text-white rounded">Save</button>
                        </div>
                    </div>
                </Modal>
            )}

            {showActionModal && selectedUser && (
                <ConfirmActionModal
                    user={selectedUser}
                    onApprove={() => handleApproveUser(selectedUser)}
                    onReject={() => handleRejectUser(selectedUser)}
                    onClose={() => setShowActionModal(false)}
                />
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
