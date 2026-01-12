import { useState, useEffect, useCallback } from 'react';
import { useAuth, apiBase } from '../../auth/AuthProvider';
import { Calendar, CheckCircle, XCircle, RefreshCw, Users, Save } from 'lucide-react';

interface Student {
    enrollment_number: number;
    student_name: string;
    course_name?: string;
}

interface AttendanceRecord {
    enrollment_number: number;
    date: string;
    present: boolean;
    subject_code: string;
}

export default function AttendanceMarker() {
    const { authFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [subjectCode, setSubjectCode] = useState('');
    const [attendance, setAttendance] = useState<Record<number, boolean>>({});

    const loadStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${apiBase}/faculty/students`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || []);

                // Initialize all students as present by default
                const initialAttendance: Record<number, boolean> = {};
                (data.students || []).forEach((s: Student) => {
                    initialAttendance[s.enrollment_number] = true;
                });
                setAttendance(initialAttendance);
            }
        } catch (e) {
            console.error('Failed to load students:', e);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadStudents();
    }, [loadStudents]);

    const toggleAttendance = (enrollmentNumber: number) => {
        setAttendance(prev => ({
            ...prev,
            [enrollmentNumber]: !prev[enrollmentNumber]
        }));
    };

    const markAllPresent = () => {
        const updated: Record<number, boolean> = {};
        students.forEach(s => { updated[s.enrollment_number] = true; });
        setAttendance(updated);
    };

    const markAllAbsent = () => {
        const updated: Record<number, boolean> = {};
        students.forEach(s => { updated[s.enrollment_number] = false; });
        setAttendance(updated);
    };

    const handleSaveAttendance = async () => {
        if (!selectedDate) {
            alert('Please select a date');
            return;
        }

        const records = students.map(s => ({
            enrollment_number: s.enrollment_number,
            date: selectedDate,
            present: attendance[s.enrollment_number] ?? true,
            subject_code: subjectCode,
        }));

        setSaving(true);
        try {
            const res = await authFetch(`${apiBase}/faculty/attendance/mark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records }),
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Attendance marked successfully for ${data.count} students!`);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save attendance');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const presentCount = Object.values(attendance).filter(v => v).length;
    const absentCount = Object.values(attendance).filter(v => !v).length;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>
                    <p className="text-gray-500 text-sm mt-1">Mark daily attendance for your students</p>
                </div>
                <button
                    onClick={loadStudents}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Date and Subject Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={16} className="inline mr-2" />
                            Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject Code (Optional)
                        </label>
                        <input
                            type="text"
                            value={subjectCode}
                            onChange={(e) => setSubjectCode(e.target.value)}
                            placeholder="e.g., CS101"
                            className="w-full border border-gray-300 rounded-lg p-2.5"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={markAllPresent}
                            className="flex-1 px-4 py-2.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                        >
                            All Present
                        </button>
                        <button
                            onClick={markAllAbsent}
                            className="flex-1 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                        >
                            All Absent
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                    label="Total Students"
                    value={students.length}
                    icon={<Users size={20} />}
                    color="blue"
                />
                <SummaryCard
                    label="Present"
                    value={presentCount}
                    icon={<CheckCircle size={20} />}
                    color="green"
                />
                <SummaryCard
                    label="Absent"
                    value={absentCount}
                    icon={<XCircle size={20} />}
                    color="red"
                />
                <SummaryCard
                    label="Attendance %"
                    value={students.length > 0 ? `${Math.round((presentCount / students.length) * 100)}%` : '0%'}
                    icon={<Calendar size={20} />}
                    color="purple"
                />
            </div>

            {/* Student List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">No students found in your institute</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr key={student.enrollment_number} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                                {student.enrollment_number}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {student.student_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {student.course_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleAttendance(student.enrollment_number)}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${attendance[student.enrollment_number]
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        }`}
                                                >
                                                    {attendance[student.enrollment_number] ? (
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle size={14} /> Present
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1">
                                                            <XCircle size={14} /> Absent
                                                        </span>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Save Button */}
                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={handleSaveAttendance}
                                disabled={saving || students.length === 0}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-md"
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    color
}: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className={`p-4 rounded-xl ${colorClasses[color]} flex items-center gap-4`}>
            <div className="p-3 rounded-full bg-white/50">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium opacity-80">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );
}
