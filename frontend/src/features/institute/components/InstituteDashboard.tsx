import React, { useEffect, useState, useCallback } from "react";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Users, BookOpen, GraduationCap, School } from "lucide-react";

export default function InstituteDashboard(): React.ReactNode {
    const { authFetch, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "students" | "faculty" | "courses">("overview");

    // Data Lists
    const [students, setStudents] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);

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

    const loadStudents = useCallback(async () => {
        const res = await authFetch(`${apiBase}/institute/students`);
        const data = await res.json();
        setStudents(data.data || []);
    }, [authFetch]);

    const loadFaculty = useCallback(async () => {
        const res = await authFetch(`${apiBase}/institute/faculty`);
        const data = await res.json();
        setFaculty(data.data || []);
    }, [authFetch]);

    const loadCourses = useCallback(async () => {
        const res = await authFetch(`${apiBase}/institute/courses`);
        const data = await res.json();
        setCourses(data.data || []);
    }, [authFetch]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    useEffect(() => {
        if (activeTab === "students") loadStudents();
        if (activeTab === "faculty") loadFaculty();
        if (activeTab === "courses") loadCourses();
    }, [activeTab, loadStudents, loadFaculty, loadCourses]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const theme = "#650C08";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* HEADER */}
            <header className="bg-white shadow px-8 py-4 flex justify-between items-center z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <img src="/Logo.png" alt="Logo" className="h-10" />
                    <h1 className="text-xl font-bold" style={{ color: theme }}>
                        {stats?.institute_name || "Institute Dashboard"}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600 font-medium hidden md:block">Welcome, Institute Admin</span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded text-sm font-semibold transition bg-red-50 text-red-600 hover:bg-red-100"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="flex flex-1">
                {/* SIDEBAR */}
                <aside className="w-64 bg-[#1a1a1a] text-white flex-shrink-0 hidden md:flex flex-col">
                    <div className="p-6">
                        <h2 className="text-sm uppercase text-gray-400 font-bold mb-4 tracking-wider">Menu</h2>
                        <nav className="space-y-2">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'overview' ? 'bg-[#333]' : 'hover:bg-[#252525]'}`}
                            >
                                <School className="w-5 h-5 text-blue-400" />
                                <span>Overview</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("students")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'students' ? 'bg-[#333]' : 'hover:bg-[#252525]'}`}
                            >
                                <Users className="w-5 h-5 text-green-400" />
                                <span>Students</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("faculty")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'faculty' ? 'bg-[#333]' : 'hover:bg-[#252525]'}`}
                            >
                                <GraduationCap className="w-5 h-5 text-yellow-400" />
                                <span>Faculty</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("courses")}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'courses' ? 'bg-[#333]' : 'hover:bg-[#252525]'}`}
                            >
                                <BookOpen className="w-5 h-5 text-purple-400" />
                                <span>Courses</span>
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="flex-1 p-8 overflow-auto">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-gray-500">Loading institute details...</div>
                    ) : (
                        <>
                            {activeTab === "overview" && (
                                <div className="space-y-6 animate-fadeIn">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Institute Overview</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <StatCard title="Total Students" value={stats?.total_students} icon={<Users />} color="blue" />
                                        <StatCard title="Active Students" value={stats?.active_students} icon={<Users />} color="green" />
                                        <StatCard title="Total Faculty" value={stats?.total_faculty} icon={<GraduationCap />} color="yellow" />
                                        <StatCard title="Courses Offered" value={stats?.total_courses} icon={<BookOpen />} color="purple" />
                                    </div>
                                </div>
                            )}

                            {activeTab === "students" && (
                                <div className="bg-white rounded shadow p-6 animate-fadeIn">
                                    <h2 className="text-xl font-bold mb-4">Enrolled Students</h2>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {students.slice(0, 50).map((s) => (
                                                    <tr key={s.student_id}>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.enrollment_number}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{s.full_name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{s.course_name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{s.status || "Active"}</td>
                                                    </tr>
                                                ))}
                                                {students.length === 0 && <tr><td colSpan={4} className="p-4 text-center">No students found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === "faculty" && (
                                <div className="bg-white rounded shadow p-6 animate-fadeIn">
                                    <h2 className="text-xl font-bold mb-4">Institute Faculty</h2>
                                    <ul className="space-y-2">
                                        {faculty.map((f) => (
                                            <li key={f.user_id} className="border p-3 rounded flex justify-between">
                                                <span className="font-semibold">{f.full_name}</span>
                                                <span className="text-gray-500 text-sm">{f.email}</span>
                                            </li>
                                        ))}
                                        {faculty.length === 0 && <p className="text-gray-500">No faculty members found linked to this institute.</p>}
                                    </ul>
                                </div>
                            )}

                            {activeTab === "courses" && (
                                <div className="bg-white rounded shadow p-6 animate-fadeIn">
                                    <h2 className="text-xl font-bold mb-4">Courses & Enrollment</h2>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {courses.map((c, i) => (
                                            <div key={i} className="border p-4 rounded bg-gray-50">
                                                <h3 className="font-bold text-lg">{c.course_name}</h3>
                                                <p className="text-sm text-gray-600 mt-2">Enrolled Students: {c.student_count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
    const colorClasses: any = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        yellow: "bg-yellow-100 text-yellow-600",
        purple: "bg-purple-100 text-purple-600",
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-4 rounded-full ${colorClasses[color]}`}>{icon}</div>
            <div>
                <p className="text-gray-500 text-sm font-medium uppercase">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value ?? 0}</p>
            </div>
        </div>
    );
}
