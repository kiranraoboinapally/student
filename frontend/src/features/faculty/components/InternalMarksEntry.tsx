import { useState, useEffect, useCallback } from 'react';
import { useAuth, apiBase } from '../../auth/AuthProvider';
import { FileText, Plus, Send, Save, RefreshCw, Edit2 } from 'lucide-react';

interface Student {
    enrollment_number: number;
    student_name: string;
}

interface InternalMark {
    internal_mark_id: number;
    enrollment_number: number;
    semester: number;
    subject_code: string;
    subject_name: string;
    mark_type: string;
    marks_obtained: number;
    max_marks: number;
    status: string;
    created_at: string;
}

interface StatusCount {
    status: string;
    count: number;
}

export default function InternalMarksEntry() {
    const { authFetch } = useAuth();
    const [activeView, setActiveView] = useState<'entry' | 'list'>('list');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data
    const [students, setStudents] = useState<Student[]>([]);
    const [marks, setMarks] = useState<InternalMark[]>([]);
    const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    // Entry form state
    const [semester, setSemester] = useState<number>(1);
    const [subjectCode, setSubjectCode] = useState('');
    const [markType, setMarkType] = useState('MSE1');
    const [maxMarks, setMaxMarks] = useState<number>(100);
    const [marksData, setMarksData] = useState<Record<number, number>>({});

    const loadStudents = useCallback(async () => {
        try {
            const res = await authFetch(`${apiBase}/faculty/students`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students || []);
            }
        } catch (e) {
            console.error('Failed to load students:', e);
        }
    }, [authFetch]);

    const loadMarks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedStatus) params.append('status', selectedStatus);

            const res = await authFetch(`${apiBase}/faculty/internal-marks?${params}`);
            if (res.ok) {
                const data = await res.json();
                setMarks(data.marks || []);
                setStatusCounts(data.status_counts || []);
            }
        } catch (e) {
            console.error('Failed to load marks:', e);
        } finally {
            setLoading(false);
        }
    }, [authFetch, selectedStatus]);

    useEffect(() => {
        loadStudents();
        loadMarks();
    }, [loadStudents, loadMarks]);

    const handleMarksChange = (enrollmentNumber: number, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= maxMarks) {
            setMarksData(prev => ({ ...prev, [enrollmentNumber]: numValue }));
        } else if (value === '') {
            setMarksData(prev => {
                const updated = { ...prev };
                delete updated[enrollmentNumber];
                return updated;
            });
        }
    };

    const handleSaveMarks = async () => {
        if (!subjectCode) {
            alert('Please enter subject code');
            return;
        }

        const entries = Object.entries(marksData);
        if (entries.length === 0) {
            alert('Please enter marks for at least one student');
            return;
        }

        const marksArray = entries.map(([enrollment, marks]) => ({
            enrollment_number: parseInt(enrollment),
            semester,
            subject_code: subjectCode,
            mark_type: markType,
            marks_obtained: marks,
            max_marks: maxMarks,
        }));

        setSaving(true);
        try {
            const res = await authFetch(`${apiBase}/faculty/internal-marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ marks: marksArray }),
            });

            if (res.ok) {
                const data = await res.json();
                alert(`${data.total_records} marks saved as draft successfully!`);
                setMarksData({});
                setActiveView('list');
                loadMarks();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save marks');
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save marks');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitMarks = async () => {
        const draftMarks = marks.filter(m => m.status === 'draft');
        if (draftMarks.length === 0) {
            alert('No draft marks to submit');
            return;
        }

        if (!confirm(`Submit ${draftMarks.length} draft marks for university approval?`)) {
            return;
        }

        setSaving(true);
        try {
            const res = await authFetch(`${apiBase}/faculty/internal-marks/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_ids: draftMarks.map(m => m.internal_mark_id) }),
            });

            if (res.ok) {
                const data = await res.json();
                alert(`${data.submitted_count} marks submitted for approval!`);
                loadMarks();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to submit marks');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-600';
            case 'submitted': return 'bg-yellow-100 text-yellow-700';
            case 'locked': return 'bg-blue-100 text-blue-700';
            case 'published': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getCount = (status: string) => {
        const found = statusCounts.find(s => s.status === status);
        return found ? found.count : 0;
    };

    const draftCount = getCount('draft');

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Internal Marks Entry</h2>
                    <p className="text-gray-500 text-sm mt-1">Enter and manage internal assessment marks</p>
                </div>
                <div className="flex gap-2">
                    {activeView === 'list' ? (
                        <>
                            <button
                                onClick={() => setActiveView('entry')}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-md"
                            >
                                <Plus size={18} />
                                Enter New Marks
                            </button>
                            {draftCount > 0 && (
                                <button
                                    onClick={handleSubmitMarks}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md"
                                >
                                    <Send size={18} />
                                    Submit Drafts ({draftCount})
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => setActiveView('list')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Back to List
                        </button>
                    )}
                </div>
            </div>

            {activeView === 'list' && (
                <>
                    {/* Status Filter Tabs */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedStatus('')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedStatus === ''
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All ({marks.length})
                        </button>
                        {['draft', 'submitted', 'locked', 'published'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${selectedStatus === status
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status} ({getCount(status)})
                            </button>
                        ))}
                    </div>

                    {/* Marks Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Loading marks...</div>
                        ) : marks.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>No marks found. Click "Enter New Marks" to add some.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sem</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {marks.map((mark) => (
                                            <tr key={mark.internal_mark_id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                                    {mark.enrollment_number}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900">{mark.subject_name}</div>
                                                    <div className="text-xs text-gray-500">{mark.subject_code}</div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{mark.mark_type}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{mark.semester}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                    {mark.marks_obtained} / {mark.max_marks}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(mark.status)}`}>
                                                        {mark.status}
                                                    </span>
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

            {activeView === 'entry' && (
                <>
                    {/* Entry Form Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                                <select
                                    value={semester}
                                    onChange={(e) => setSemester(parseInt(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code *</label>
                                <input
                                    type="text"
                                    value={subjectCode}
                                    onChange={(e) => setSubjectCode(e.target.value)}
                                    placeholder="e.g., CS101"
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mark Type</label>
                                <select
                                    value={markType}
                                    onChange={(e) => setMarkType(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                >
                                    <option value="MSE1">MSE-1</option>
                                    <option value="MSE2">MSE-2</option>
                                    <option value="MSE3">MSE-3</option>
                                    <option value="Assignment">Assignment</option>
                                    <option value="Practical">Practical</option>
                                    <option value="Quiz">Quiz</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Max Marks</label>
                                <input
                                    type="number"
                                    value={maxMarks}
                                    onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
                                    className="w-full border border-gray-300 rounded-lg p-2.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Marks Entry Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {students.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No students found in your institute</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks (out of {maxMarks})</th>
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
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={maxMarks}
                                                            value={marksData[student.enrollment_number] ?? ''}
                                                            onChange={(e) => handleMarksChange(student.enrollment_number, e.target.value)}
                                                            placeholder="0"
                                                            className="w-24 border border-gray-300 rounded-lg p-2 text-center"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Save Button */}
                                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                                    <p className="text-sm text-gray-500">
                                        {Object.keys(marksData).length} of {students.length} students marked
                                    </p>
                                    <button
                                        onClick={handleSaveMarks}
                                        disabled={saving || Object.keys(marksData).length === 0}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 shadow-md"
                                    >
                                        <Save size={18} />
                                        {saving ? 'Saving...' : 'Save as Draft'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
