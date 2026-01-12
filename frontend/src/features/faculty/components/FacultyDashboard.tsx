import React, { useState, useEffect } from "react";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import { Link } from "react-router-dom";
import AttendanceMarker from "./AttendanceMarker";
import InternalMarksEntry from "./InternalMarksEntry";

export default function FacultyDashboard() {
    const { authFetch, logout, roleId } = useAuth();
    const [activeTab, setActiveTab] = useState("attendance");

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Navbar */}
            <nav className="bg-blue-800 text-white p-4 flex justify-between items-center shadow-md">
                <div className="text-xl font-bold flex items-center gap-2">
                    🏫 Faculty Portal
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-sm opacity-80">Role ID: {roleId}</span>
                    <button onClick={logout} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-64 bg-white shadow-lg hidden md:block">
                    <div className="p-4">
                        <h2 className="text-gray-500 uppercase text-xs font-semibold mb-2">Academic</h2>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => setActiveTab("attendance")}
                                    className={`w-full text-left px-4 py-2 rounded ${activeTab === "attendance" ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                                >
                                    📅 Mark Attendance
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab("marks")}
                                    className={`w-full text-left px-4 py-2 rounded ${activeTab === "marks" ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                                >
                                    📝 Internal Marks
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab("assignments")}
                                    className={`w-full text-left px-4 py-2 rounded ${activeTab === "assignments" ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                                >
                                    📋 Assignments
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab("courses")}
                                    className={`w-full text-left px-4 py-2 rounded ${activeTab === "courses" ? "bg-blue-100 text-blue-800 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                                >
                                    📚 My Courses
                                </button>
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {activeTab === "attendance" && <AttendanceMarker />}
                    {activeTab === "marks" && <InternalMarksEntry />}
                    {activeTab === "assignments" && <AssignmentManager />}
                    {activeTab === "courses" && <div className="text-gray-500">Course management (Coming Soon)</div>}
                </main>
            </div>
        </div>
    );
}

// -------------------- Sub-components --------------------

function AssignmentManager() {
    const { authFetch } = useAuth();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>("");
    const [assignments, setAssignments] = useState<any[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewSubmissionsId, setViewSubmissionsId] = useState<number | null>(null);

    // Fetch courses on load
    useEffect(() => {
        // Fetch all courses for selection (In real app, filter by faculty)
        authFetch(`${apiBase}/admin/courses?limit=100`)
            .then(res => res.json())
            .then(data => {
                if (data.data) setCourses(data.data);
            })
            .catch(err => console.error(err));
    }, []);

    // Fetch assignments when course selected
    useEffect(() => {
        if (!selectedCourse) return;
        // The API expects course_id (int)
        // Find course ID from selectedCourse string (assuming it's formatted or just ID)
        // Let's assume selectedCourse is string ID
        authFetch(`${apiBase}/faculty/assignments/course/${selectedCourse}`)
            .then(res => res.json())
            .then(data => {
                if (data.data) setAssignments(data.data);
                else setAssignments([]);
            })
            .catch(err => console.error(err));
    }, [selectedCourse]);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Assignment Manager</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50"
                    disabled={!selectedCourse}
                >
                    + Create Assignment
                </button>
            </header>

            {/* Course Selector */}
            <div className="bg-white p-4 rounded shadow">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
                <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                >
                    <option value="">-- Select a Course to Manage --</option>
                    {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.course_name} ({c.stream})</option>
                    ))}
                </select>
            </div>

            {/* Assignments List */}
            {selectedCourse && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assignments.map(a => (
                        <div key={a.assignment_id} className="bg-white p-5 rounded-lg shadow border border-gray-200 hover:shadow-md transition">
                            <h3 className="font-bold text-lg mb-1">{a.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 truncate">{a.description}</p>
                            <div className="text-xs text-gray-500 mb-4">
                                <div>Due: {new Date(a.due_date).toLocaleDateString()}</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewSubmissionsId(a.assignment_id)}
                                    className="flex-1 bg-blue-50 text-blue-700 py-1 rounded hover:bg-blue-100 text-sm"
                                >
                                    View Submissions
                                </button>
                            </div>
                        </div>
                    ))}
                    {assignments.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded shadow-sm">
                            No assignments found for this course. Create one?
                        </div>
                    )}
                </div>
            )}

            {showCreateModal && (
                <CreateAssignmentModal
                    courseId={selectedCourse}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        // Refresh
                        const c = selectedCourse;
                        setSelectedCourse("");
                        setTimeout(() => setSelectedCourse(c), 0);
                    }}
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

function CreateAssignmentModal({ courseId, onClose, onSuccess }: { courseId: string, onClose: () => void, onSuccess: () => void }) {
    const { authFetch } = useAuth();
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authFetch(`${apiBase}/faculty/assignments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    course_id: parseInt(courseId),
                    title,
                    description: desc,
                    due_date: dueDate,
                    file_path: "" // Optional
                })
            });
            if (res.ok) {
                alert("Assignment Created!");
                onSuccess();
            } else {
                const d = await res.json();
                alert("Error: " + d.error);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to create assignment");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold mb-4">Create Assignment</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input required className="w-full border p-2 rounded" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea className="w-full border p-2 rounded" rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <input type="date" required className="w-full border p-2 rounded" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                            {loading ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function SubmissionsModal({ assignmentId, onClose }: { assignmentId: number, onClose: () => void }) {
    const { authFetch } = useAuth();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch(`${apiBase}/faculty/assignments/${assignmentId}/submissions`)
            .then(res => res.json())
            .then(data => {
                if (data.data) setSubmissions(data.data);
            })
            .finally(() => setLoading(false));
    }, [assignmentId]);

    const handleGrade = async (subId: number, grade: string, feedback: string) => {
        const res = await authFetch(`${apiBase}/faculty/submissions/${subId}/grade`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grade, feedback })
        });
        if (res.ok) {
            alert("Graded!");
            // Refresh logic if needed
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Submissions</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black">✖</button>
                </div>

                <div className="flex-1 overflow-auto">
                    {loading ? <div className="text-center p-4">Loading...</div> : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">Student ID</th>
                                    <th className="p-3">File</th>
                                    <th className="p-3">Submitted At</th>
                                    <th className="p-3">Grade</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map(s => (
                                    <SubmissionRow key={s.submission_id} sub={s} onGrade={handleGrade} />
                                ))}
                                {submissions.length === 0 && (
                                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No submissions yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

function SubmissionRow({ sub, onGrade }: { sub: any, onGrade: (id: number, g: string, f: string) => void }) {
    const [grade, setGrade] = useState(sub.grade || "");
    const [feedback, setFeedback] = useState(sub.feedback || "");

    return (
        <tr className="border-b">
            <td className="p-3">{sub.student_id}</td>
            <td className="p-3 text-blue-600 underline cursor-pointer">{sub.file_path}</td>
            <td className="p-3 text-sm text-gray-500">{new Date(sub.submitted_at).toLocaleString()}</td>
            <td className="p-3">
                <input
                    className="w-16 border rounded p-1"
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="A+"
                />
            </td>
            <td className="p-3">
                <button
                    onClick={() => onGrade(sub.submission_id, grade, feedback)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                    Save
                </button>
            </td>
        </tr>
    )
}
