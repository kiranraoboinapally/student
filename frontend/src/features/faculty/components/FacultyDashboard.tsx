import React, { useState, useEffect } from "react";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import {
    Calendar,
    FileText,
    ClipboardList,
    BookOpen,
    LogOut,
    RefreshCw,
    GraduationCap
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
        authFetch(`${apiBase}/admin/courses?limit=100`)
            .then(res => res.json())
            .then(data => setCourses(data.data || []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!selectedCourse) return;
        authFetch(`${apiBase}/faculty/assignments/course/${selectedCourse}`)
            .then(res => res.json())
            .then(data => setAssignments(data.data || []))
            .catch(console.error);
    }, [selectedCourse]);

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
                        <option key={c.id} value={c.id}>
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
                </div>
            )}

            {showCreateModal && (
                <CreateAssignmentModal
                    courseId={selectedCourse}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => setShowCreateModal(false)}
                />
            )}

            {viewSubmissionsId && (
                <SubmissionsModal
                    assignmentId={viewSubmissionsId}
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
    const { logout, roleId } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>("attendance");

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
                    <SidebarItem icon={Calendar} label="Attendance" tab="attendance" active={activeTab} setActive={setActiveTab} />
                    <SidebarItem icon={FileText} label="Internal Marks" tab="marks" active={activeTab} setActive={setActiveTab} />
                    <SidebarItem icon={ClipboardList} label="Assignments" tab="assignments" active={activeTab} setActive={setActiveTab} />
                    <SidebarItem icon={BookOpen} label="My Courses" tab="courses" active={activeTab} setActive={setActiveTab} />
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
                <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0">
                    <h2 className="text-xl font-bold capitalize">
                        {activeTab}
                    </h2>
                    <RefreshCw size={18} />
                </header>

                <main className="p-8 space-y-6">
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

                    {activeTab === "courses" && (
                        <Card title="My Courses">
                            <div className="text-gray-500">
                                Course management coming soon
                            </div>
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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                active === tab
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