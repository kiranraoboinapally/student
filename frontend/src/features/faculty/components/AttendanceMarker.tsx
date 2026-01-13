import { useState, useEffect, useCallback } from "react";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import {
    Calendar,
    CheckCircle,
    XCircle,
    RefreshCw,
    Users,
    Save
} from "lucide-react";

interface Student {
    enrollment_number: number;
    student_name: string;
    course_name?: string;
}

export default function AttendanceMarker() {
    const { authFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [subjectCode, setSubjectCode] = useState("");
    const [attendance, setAttendance] = useState<Record<number, boolean>>({});

    const loadStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${apiBase}/faculty/students`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || []);

                const init: Record<number, boolean> = {};
                (data.students || []).forEach((s: Student) => {
                    init[s.enrollment_number] = true;
                });
                setAttendance(init);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const toggleAttendance = (id: number) => {
        setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const markAll = (value: boolean) => {
        const updated: Record<number, boolean> = {};
        students.forEach(s => (updated[s.enrollment_number] = value));
        setAttendance(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = students.map(s => ({
                enrollment_number: s.enrollment_number,
                date: selectedDate,
                present: attendance[s.enrollment_number] ?? true,
                subject_code: subjectCode
            }));

            const res = await authFetch(
                `${apiBase}/faculty/attendance/mark`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ records })
                }
            );

            if (res.ok) {
                alert("Attendance saved successfully");
            } else {
                alert("Failed to save attendance");
            }
        } finally {
            setSaving(false);
        }
    };

    const present = Object.values(attendance).filter(v => v).length;
    const absent = Object.values(attendance).filter(v => !v).length;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Attendance Management
                    </h2>
                    <p className="text-sm text-gray-500">
                        Mark daily attendance
                    </p>
                </div>
                <button
                    onClick={loadStudents}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* DATE + SUBJECT */}
            <Card>
                <div className="grid md:grid-cols-3 gap-4">
                    <Input
                        label="Date"
                        icon={<Calendar size={16} />}
                        type="date"
                        value={selectedDate}
                        onChange={setSelectedDate}
                    />
                    <Input
                        label="Subject Code"
                        placeholder="CS101"
                        value={subjectCode}
                        onChange={setSubjectCode}
                    />
                    <div className="flex gap-2 items-end">
                        <ActionButton
                            text="All Present"
                            onClick={() => markAll(true)}
                            color="green"
                        />
                        <ActionButton
                            text="All Absent"
                            onClick={() => markAll(false)}
                            color="red"
                        />
                    </div>
                </div>
            </Card>

            {/* SUMMARY */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Summary label="Students" value={students.length} icon={<Users />} />
                <Summary label="Present" value={present} icon={<CheckCircle />} color="green" />
                <Summary label="Absent" value={absent} icon={<XCircle />} color="red" />
                <Summary
                    label="Attendance %"
                    value={
                        students.length
                            ? `${Math.round((present / students.length) * 100)}%`
                            : "0%"
                    }
                    icon={<Calendar />}
                    color="purple"
                />
            </div>

            {/* TABLE */}
            <Card>
                {loading ? (
                    <p className="text-center py-12 text-gray-500">
                        Loading students...
                    </p>
                ) : (
                    <>
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="p-3 text-left">Enrollment</th>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Course</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.enrollment_number} className="border-t">
                                        <td className="p-3 font-mono">{s.enrollment_number}</td>
                                        <td className="p-3 font-medium">{s.student_name}</td>
                                        <td className="p-3 text-gray-500">
                                            {s.course_name || "-"}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => toggleAttendance(s.enrollment_number)}
                                                className={`px-4 py-1.5 rounded-lg font-medium ${
                                                    attendance[s.enrollment_number]
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {attendance[s.enrollment_number]
                                                    ? "Present"
                                                    : "Absent"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#650C08] text-white hover:bg-[#520a06]"
                            >
                                <Save size={18} />
                                {saving ? "Saving..." : "Save Attendance"}
                            </button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}

/* ================== UI HELPERS ================== */

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            {children}
        </div>
    );
}

function Input({ label, value, onChange, type = "text", icon, placeholder }: any) {
    return (
        <div>
            <label className="text-sm font-medium mb-1 flex gap-2 items-center">
                {icon} {label}
            </label>
            <input
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className="w-full border rounded-lg p-2"
            />
        </div>
    );
}

function ActionButton({ text, onClick, color }: any) {
    const map: any = {
        green: "bg-green-100 text-green-700 hover:bg-green-200",
        red: "bg-red-100 text-red-700 hover:bg-red-200"
    };
    return (
        <button onClick={onClick} className={`flex-1 px-4 py-2 rounded-lg ${map[color]}`}>
            {text}
        </button>
    );
}

function Summary({ label, value, icon, color = "blue" }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
        purple: "bg-purple-50 text-purple-600"
    };
    return (
        <div className={`p-4 rounded-xl flex gap-3 ${colors[color]}`}>
            <div className="p-2 bg-white/50 rounded">{icon}</div>
            <div>
                <p className="text-sm">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}