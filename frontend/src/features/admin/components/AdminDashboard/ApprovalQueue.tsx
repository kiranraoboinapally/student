import { useState, useEffect, useCallback } from 'react';
import { useAuth, apiBase } from '../../../auth/AuthProvider';
import { CheckCircle, XCircle, Clock, Users, BookOpen, FileText, RefreshCw, GraduationCap } from 'lucide-react';

interface PendingFaculty {
    faculty_id: number;
    user_id: number;
    full_name: string;
    email: string;
    department: string;
    position: string;
    institute_id: number;
    institute_name: string;
    created_at: string;
}

interface PendingCourseStream {
    approval_id: number;
    institute_id: number;
    institute_name: string;
    course_stream_id: number;
    course_name: string;
    stream: string;
    requested_at: string;
}

interface PendingMarks {
    institute_id: number;
    institute_name: string;
    semester: number;
    subject_code: string;
    subject_name: string;
    count: number;
}

interface PendingStudent {
    user_id: number;
    full_name: string;
    email: string;
   username: string; // enrollment number
   session: string;
    course_name: string;
    stream: string;
    institute_name: string;
    created_at: string;
}

interface PendingCounts {
    faculty: number;
    course_stream: number;
    marks_batches: number;
    students: number;
}

export default function ApprovalQueue() {
    const { authFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'students' | 'faculty' | 'courses' | 'marks'>('students');

    const [pendingFaculty, setPendingFaculty] = useState<PendingFaculty[]>([]);
    const [pendingCourseStreams, setPendingCourseStreams] = useState<PendingCourseStream[]>([]);
    const [pendingMarks, setPendingMarks] = useState<PendingMarks[]>([]);
    const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
    const [counts, setCounts] = useState<PendingCounts>({ faculty: 0, course_stream: 0, marks_batches: 0, students: 0 });

    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

    const loadPendingApprovals = useCallback(async () => {
        setLoading(true);
        try {
            const [approvalsRes, studentsRes] = await Promise.all([
                authFetch(`${apiBase}/admin/pending-approvals`),
                authFetch(`${apiBase}/admin/pending-student-registrations`)
            ]);

            if (approvalsRes.ok) {
                const data = await approvalsRes.json();
                setPendingFaculty(data.pending_faculty_approvals || []);
                setPendingCourseStreams(data.pending_course_stream_requests || []);
                setPendingMarks(data.pending_marks_submissions || []);

                const countsData = data.counts || { faculty: 0, course_stream: 0, marks_batches: 0,students: 0 };

                if (studentsRes.ok) {
                    const studentsData = await studentsRes.json();
                    setPendingStudents(studentsData.pending_students || []);
                    countsData.students = studentsData.total || studentsData.pending_students?.length || 0;
                }

                setCounts(countsData);
            }
        } catch (e) {
            console.error('Failed to load pending approvals:', e);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        loadPendingApprovals();
    }, [loadPendingApprovals]);

    const handleApproveFaculty = async (facultyId: number, action: 'approve' | 'reject') => {
        setActionLoading(facultyId);
        try {
            const res = await authFetch(`${apiBase}/admin/approve-faculty`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ faculty_id: facultyId, action }),
            });
            if (res.ok) {
                await loadPendingApprovals();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to process approval');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveCourseStream = async (approvalId: number, action: 'approve' | 'reject') => {
        setActionLoading(approvalId);
        try {
            const res = await authFetch(`${apiBase}/admin/approve-course-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approval_id: approvalId, action }),
            });
            if (res.ok) {
                await loadPendingApprovals();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to process approval');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveStudent = async (userId: number, action: 'approve' | 'reject') => {
        setActionLoading(userId);
        try {
            const res = await authFetch(`${apiBase}/admin/approve-student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, action }),
            });
            if (res.ok) {
                await loadPendingApprovals();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to process approval');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkApprove = async (action: 'approve' | 'reject') => {
        if (selectedStudents.length === 0) {
            alert('Please select students first');
            return;
        }

        setActionLoading(-1); // Use -1 for bulk action
        try {
            const res = await authFetch(`${apiBase}/admin/approve-students-bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_ids: selectedStudents, action }),
            });
            if (res.ok) {
                setSelectedStudents([]);
                await loadPendingApprovals();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to process bulk approval');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleSelectStudent = (userId: number) => {
        setSelectedStudents(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedStudents.length === pendingStudents.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(pendingStudents.map(s => s.user_id));
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Pending Approvals</h2>
                <button
                    onClick={loadPendingApprovals}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                    title="Student Registrations"
                    count={counts.students}
                    icon={<GraduationCap size={20} />}
                    color="green"
                    active={activeTab === 'students'}
                    onClick={() => setActiveTab('students')}
                />
                <SummaryCard
                    title="Faculty Approvals"
                    count={counts.faculty}
                    icon={<Users size={20} />}
                    color="blue"
                    active={activeTab === 'faculty'}
                    onClick={() => setActiveTab('faculty')}
                />
                <SummaryCard
                    title="Course-Stream Requests"
                    count={counts.course_stream}
                    icon={<BookOpen size={20} />}
                    color="purple"
                    active={activeTab === 'courses'}
                    onClick={() => setActiveTab('courses')}
                />
                <SummaryCard
                    title="Marks Submissions"
                    count={counts.marks_batches}
                    icon={<FileText size={20} />}
                    color="orange"
                    active={activeTab === 'marks'}
                    onClick={() => setActiveTab('marks')}
                />
            </div>

            {/* Content Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading pending approvals...</div>
                ) : (
                    <>
                        {activeTab === 'students' && (
                            <div>
                                {pendingStudents.length > 0 && (
                                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.length === pendingStudents.length && pendingStudents.length > 0}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-600">
                                                {selectedStudents.length} selected
                                            </span>
                                        </div>
                                        {selectedStudents.length > 0 && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleBulkApprove('approve')}
                                                    disabled={actionLoading === -1}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <CheckCircle size={16} /> Approve Selected
                                                </button>
                                                <button
                                                    onClick={() => handleBulkApprove('reject')}
                                                    disabled={actionLoading === -1}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-1"
                                                >
                                                    <XCircle size={16} /> Reject Selected
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="divide-y">
                                    {pendingStudents.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">No pending student registrations</div>
                                    ) : (
                                        pendingStudents.map((s) => (
                                            <div key={s.user_id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(s.user_id)}
                                                        onChange={() => toggleSelectStudent(s.user_id)}
                                                        className="w-4 h-4 rounded border-gray-300"
                                                    />
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{s.full_name}</h4>
                                                        <p className="text-sm text-gray-500">{s.email}</p>
                                                        <div className="flex gap-4 mt-1 text-xs text-gray-400">
                                                            <span className="font-medium">{s.username}</span>
                                                            <span>{s.course_name} - {s.stream}</span>
                                                            <span>Session {s.session}</span>
                                                            <span className="font-medium text-blue-600">{s.institute_name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApproveStudent(s.user_id, 'approve')}
                                                        disabled={actionLoading === s.user_id}
                                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1"
                                                    >
                                                        <CheckCircle size={16} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveStudent(s.user_id, 'reject')}
                                                        disabled={actionLoading === s.user_id}
                                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-1"
                                                    >
                                                        <XCircle size={16} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'faculty' && (
                            <div className="divide-y">
                                {pendingFaculty.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No pending faculty approvals</div>
                                ) : (
                                    pendingFaculty.map((f) => (
                                        <div key={f.faculty_id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{f.full_name}</h4>
                                                <p className="text-sm text-gray-500">{f.email}</p>
                                                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                                                    <span>{f.department}</span>
                                                    <span>{f.position}</span>
                                                    <span className="font-medium text-blue-600">{f.institute_name}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveFaculty(f.faculty_id, 'approve')}
                                                    disabled={actionLoading === f.faculty_id}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <CheckCircle size={16} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleApproveFaculty(f.faculty_id, 'reject')}
                                                    disabled={actionLoading === f.faculty_id}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-1"
                                                >
                                                    <XCircle size={16} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'courses' && (
                            <div className="divide-y">
                                {pendingCourseStreams.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No pending course-stream requests</div>
                                ) : (
                                    pendingCourseStreams.map((cs) => (
                                        <div key={cs.approval_id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{cs.course_name} - {cs.stream}</h4>
                                                <p className="text-sm text-gray-500">Requested by: {cs.institute_name}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(cs.requested_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveCourseStream(cs.approval_id, 'approve')}
                                                    disabled={actionLoading === cs.approval_id}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <CheckCircle size={16} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => handleApproveCourseStream(cs.approval_id, 'reject')}
                                                    disabled={actionLoading === cs.approval_id}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-1"
                                                >
                                                    <XCircle size={16} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'marks' && (
                            <div className="divide-y">
                                {pendingMarks.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No pending marks submissions</div>
                                ) : (
                                    pendingMarks.map((m, i) => (
                                        <div key={i} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{m.subject_name} ({m.subject_code})</h4>
                                                <p className="text-sm text-gray-500">{m.institute_name} - Semester {m.semester}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {m.count} marks pending review
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full flex items-center gap-1">
                                                    <Clock size={14} /> Submitted
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function SummaryCard({
    title,
    count,
    icon,
    color,
    active,
    onClick
}: {
    title: string;
    count: number;
    icon: React.ReactNode;
    color: string;
    active: boolean;
    onClick: () => void;
}) {
    const colorClasses: Record<string, string> = {
        green: active ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100',
        blue: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
        purple: active ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100',
        orange: active ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    };

    return (
        <button
            onClick={onClick}
            className={`p-4 rounded-xl border transition-all flex items-center gap-4 w-full text-left ${active ? 'border-transparent shadow-lg' : 'border-gray-100 shadow-sm'
                } ${colorClasses[color]}`}
        >
            <div className={`p-3 rounded-full ${active ? 'bg-white/20' : ''}`}>
                {icon}
            </div>
            <div>
                <p className={`text-sm font-medium ${active ? 'text-white/80' : 'text-gray-500'}`}>{title}</p>
                <p className={`text-2xl font-bold ${active ? 'text-white' : ''}`}>{count}</p>
            </div>
        </button>
    );
}

