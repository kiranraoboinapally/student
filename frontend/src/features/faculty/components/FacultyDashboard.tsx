import { useState, useEffect, useCallback } from "react";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import {
    Calendar,
    FileText,
    ClipboardList,
    BookOpen,
    LogOut,
    RefreshCw,
    GraduationCap,
    Users,
    CheckCircle
} from "lucide-react";
import AttendanceMarker from "./AttendanceMarker";
import InternalMarksEntry from "./InternalMarksEntry";
import { useNavigate } from "react-router-dom";

/* =====================================================
   ASSIGNMENT MANAGER (Defined BEFORE Dashboard)
===================================================== */

function AssignmentManager() {
    const { authFetch } = useAuth();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");
    const [assignments, setAssignments] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewSubmissionsId, setViewSubmissionsId] = useState<number | null>(null);

    useEffect(() => {
        // Fetch faculty's assigned courses instead of admin courses
        authFetch(`${apiBase}/faculty/my-courses`)
            .then(res => res.json())
            .then(data => setCourses(data.courses || []))
            .catch(console.error);
    }, [authFetch]);

    useEffect(() => {
        if (!selectedCourse) return;
        authFetch(`${apiBase}/faculty/assignments/course/${selectedCourse}`)
            .then(res => res.json())
            .then(data => setAssignments(data.data || []))
            .catch(console.error);
    }, [selectedCourse, authFetch]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                    Assignment Manager
                </h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    disabled={!selectedCourse}
                    className="bg-[#650C08] text-white px-4 py-2 rounded-lg hover:bg-[#520a06] disabled:opacity-50"
                >
                    + Create Assignment
                </button>
            </div>

            <Card>
                <label className="block text-sm font-medium mb-2">
                    Select Course
                </label>
                <select
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value)}
                    className="w-full border rounded p-2"
                >
                    <option value="">-- Select Course --</option>
                    {courses.map(c => (
                        <option key={c.course_stream_id || c.assignment_id} value={c.course_stream_id}>
                            {c.course_name} ({c.stream})
                        </option>
                    ))}
                </select>
            </Card>

            {selectedCourse && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assignments.map(a => (
                        <Card key={a.assignment_id}>
                            <h4 className="font-semibold">{a.title}</h4>
                            <p className="text-sm text-gray-600 truncate">
                                {a.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                                Due: {new Date(a.due_date).toLocaleDateString()}
                            </p>
                            <button
                                onClick={() => setViewSubmissionsId(a.assignment_id)}
                                className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-sm py-2 rounded"
                            >
                                View Submissions
                            </button>
                        </Card>
                    ))}
                    {assignments.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-8">
                            No assignments found for this course
                        </div>
                    )}
                </div>
            )}

            {showCreateModal && (
                <CreateAssignmentModal
                    courseId={selectedCourse}
                    authFetch={authFetch}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        // Refresh assignments
                        if (selectedCourse) {
                            authFetch(`${apiBase}/faculty/assignments/course/${selectedCourse}`)
                                .then(res => res.json())
                                .then(data => setAssignments(data.data || []))
                                .catch(console.error);
                        }
                    }}
                />
            )}

            {viewSubmissionsId && (
                <SubmissionsModal
                    assignmentId={viewSubmissionsId}
                    authFetch={authFetch}
                    onClose={() => setViewSubmissionsId(null)}
                />
            )}
        </div>
    );
}

/* =====================================================
   FACULTY DASHBOARD (Institute Style)
===================================================== */

type TabType = "attendance" | "marks" | "assignments" | "courses";

export default function FacultyDashboard() {
    const { logout, roleId, authFetch } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>("courses");
    const [myCourses, setMyCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMyCourses = useCallback(async () => {
        try {
            const res = await authFetch(`${apiBase}/faculty/my-courses`);
            if (res.ok) {
                const data = await res.json();
                setMyCourses(data.courses || []);
            }
        } catch (e) {
            console.error('Failed to load courses:', e);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadMyCourses();
    }, [loadMyCourses]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r fixed h-full">
                <div className="p-6 border-b flex gap-3 items-center">
                    <div className="w-9 h-9 bg-[#650C08] rounded flex items-center justify-center">
                        <GraduationCap className="text-white" size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg">Faculty Portal</h1>
                        <p className="text-xs text-gray-500">Role ID: {roleId}</p>
                    </div>
                </div>

                <nav className="p-4 space-y-1">
                    <SidebarItem icon={BookOpen} label="My Courses" tab="courses" active={activeTab} setActive={setActiveTab} />
                    <SidebarItem icon={Calendar} label="Attendance" tab="attendance" active={activeTab} setActive={setActiveTab} />
                    <SidebarItem icon={FileText} label="Internal Marks" tab="marks" active={activeTab} setActive={setActiveTab} />
                    <SidebarItem icon={ClipboardList} label="Assignments" tab="assignments" active={activeTab} setActive={setActiveTab} />
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={() => {
                            logout();
                            navigate("/");
                        }}
                        className="w-full flex gap-2 items-center text-red-600 hover:bg-red-50 px-4 py-2 rounded"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="flex-1 ml-64 flex flex-col">
                <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                    <h2 className="text-xl font-bold capitalize">
                        {activeTab === 'courses' ? 'My Assigned Courses' : activeTab}
                    </h2>
                    <button onClick={loadMyCourses} className="p-2 hover:bg-gray-100 rounded-full">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </header>

                <main className="p-8 space-y-6">
                    {activeTab === "courses" && (
                        <div className="space-y-6">
                            {myCourses.length === 0 && !loading ? (
                                <div className="bg-white rounded-xl border p-12 text-center">
                                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Courses Assigned</h3>
                                    <p className="text-gray-500">Contact your institute admin to get assigned to courses.</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {myCourses.map((course, i) => (
                                        <div key={i} className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-3 rounded-full bg-[#650C08]/10 text-[#650C08]">
                                                    <BookOpen size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{course.course_name}</h3>
                                                    <p className="text-sm text-gray-500">{course.stream}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                {course.semester && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Semester</span>
                                                        <span className="font-medium">{course.semester}</span>
                                                    </div>
                                                )}
                                                {course.subject_code && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Subject</span>
                                                        <span className="font-medium">{course.subject_code}</span>
                                                    </div>
                                                )}
                                                {course.academic_year && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Year</span>
                                                        <span className="font-medium">{course.academic_year}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-green-600">
                                                <CheckCircle size={16} />
                                                <span className="text-sm font-medium">Active Assignment</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "attendance" && (
                        <Card title="Attendance Management">
                            <AttendanceMarker />
                        </Card>
                    )}

                    {activeTab === "marks" && (
                        <Card title="Internal Marks Entry">
                            <InternalMarksEntry />
                        </Card>
                    )}

                    {activeTab === "assignments" && (
                        <Card title="Assignments">
                            <AssignmentManager />
                        </Card>
                    )}
                </main>
            </div>
        </div>
    );
}

/* =====================================================
   REUSABLE COMPONENTS
===================================================== */

function SidebarItem({ icon: Icon, label, tab, active, setActive }: any) {
    return (
        <button
            onClick={() => setActive(tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${active === tab
                ? "bg-[#650C08] text-white"
                : "text-gray-600 hover:bg-gray-100"
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );
}

function Card({ title, children }: any) {
    return (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
            {title && (
                <h3 className="font-bold text-lg mb-4">{title}</h3>
            )}
            {children}
        </div>
    );
}

/* =====================================================
   MODAL COMPONENTS
===================================================== */

function CreateAssignmentModal({ courseId, authFetch, onClose, onSuccess }: {
    courseId: string;
    authFetch: any;
    onClose: () => void;
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        due_date: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.due_date) {
            alert('Title and due date are required');
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch(`${apiBase}/faculty/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: parseInt(courseId),
                    title: form.title,
                    description: form.description,
                    due_date: form.due_date
                })
            });

            if (res.ok) {
                alert('Assignment created successfully!');
                onSuccess();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create assignment');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to create assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-6 text-gray-900">Create Assignment</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                        <input
                            type="datetime-local"
                            value={form.due_date}
                            onChange={e => setForm({ ...form, due_date: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
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
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SubmissionsModal({ assignmentId, authFetch, onClose }: {
    assignmentId: number;
    authFetch: any;
    onClose: () => void
}) {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch(`${apiBase}/faculty/assignments/${assignmentId}/submissions`)
            .then((res: Response) => res.json())
            .then((data: { data?: any[]; submissions?: any[] }) => {
                setSubmissions(data.data || data.submissions || []);
                setLoading(false);
            })
            .catch((err: Error) => {
                console.error(err);
                setLoading(false);
            });
    }, [assignmentId, authFetch]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Submissions</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : submissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users size={48} className="mx-auto text-gray-300 mb-3" />
                        No submissions yet
                    </div>
                ) : (
                    <div className="space-y-4">
                        {submissions.map((s, i) => (
                            <div key={i} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-medium">{s.student_name || 'Student'}</p>
                                        <p className="text-sm text-gray-500">{s.enrollment_number}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${s.grade ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {s.grade || 'Not Graded'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{s.content || s.submission_text}</p>
                                <p className="text-xs text-gray-400">
                                    Submitted: {new Date(s.submitted_at || s.created_at).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
