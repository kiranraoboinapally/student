import { useState, useEffect, useCallback } from 'react';
import { useAuth, apiBase } from '../../../auth/AuthProvider';
import { Lock, Send, RefreshCw } from 'lucide-react';

interface InternalMark {
    internal_mark_id: number;
    enrollment_number: number;
    institute_id: number;
    semester: number;
    subject_code: string;
    subject_name: string;
    mark_type: string;
    marks_obtained: number;
    max_marks: number;
    status: string;
    entered_by: number;
    created_at: string;
}

interface StatusCount {
    status: string;
    count: number;
}

export default function MarksLockPanel() {
    const { authFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [marks, setMarks] = useState<InternalMark[]>([]);
    const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string>('submitted');
    const [selectedMarkIds, setSelectedMarkIds] = useState<number[]>([]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadMarks = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
                status: selectedStatus,
            });
            const res = await authFetch(`${apiBase}/admin/internal-marks?${params}`);
            if (res.ok) {
                const data = await res.json();
                setMarks(data.marks || []);
                setStatusCounts(data.status_counts || []);
                setTotalPages(data.pagination?.total_pages || 1);
            }
        } catch (e) {
            console.error('Failed to load marks:', e);
        } finally {
            setLoading(false);
        }
    }, [authFetch, page, selectedStatus]);

    useEffect(() => {
        loadMarks();
    }, [loadMarks]);

    useEffect(() => {
        setSelectedMarkIds([]);
    }, [selectedStatus]);

    const handleSelectAll = () => {
        if (selectedMarkIds.length === marks.length) {
            setSelectedMarkIds([]);
        } else {
            setSelectedMarkIds(marks.map(m => m.internal_mark_id));
        }
    };

    const handleSelectMark = (id: number) => {
        if (selectedMarkIds.includes(id)) {
            setSelectedMarkIds(selectedMarkIds.filter(mid => mid !== id));
        } else {
            setSelectedMarkIds([...selectedMarkIds, id]);
        }
    };

    const handleLockMarks = async () => {
        if (selectedMarkIds.length === 0) {
            alert('Please select marks to lock');
            return;
        }

        setActionLoading(true);
        try {
            const res = await authFetch(`${apiBase}/admin/marks/lock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_ids: selectedMarkIds }),
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Successfully locked ${data.locked_count} marks`);
                setSelectedMarkIds([]);
                await loadMarks();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to lock marks');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const handlePublishResults = async () => {
        if (selectedMarkIds.length === 0) {
            alert('Please select marks to publish');
            return;
        }

        if (!confirm('Are you sure you want to publish these results? Students will be able to view them.')) {
            return;
        }

        setActionLoading(true);
        try {
            const res = await authFetch(`${apiBase}/admin/marks/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mark_ids: selectedMarkIds }),
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Successfully published ${data.published_count} results`);
                setSelectedMarkIds([]);
                await loadMarks();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to publish results');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
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

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Marks Management</h2>
                <button
                    onClick={loadMarks}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {['submitted', 'locked', 'published', 'draft'].map((status) => (
                    <button
                        key={status}
                        onClick={() => { setSelectedStatus(status); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize flex items-center gap-2 ${selectedStatus === status
                            ? 'bg-[#650C08] text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {status}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${selectedStatus === status ? 'bg-white/20' : 'bg-gray-200'
                            }`}>
                            {getCount(status)}
                        </span>
                    </button>
                ))}
            </div>

            {/* Action Buttons */}
            {selectedMarkIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-blue-700 font-medium">
                        {selectedMarkIds.length} marks selected
                    </span>
                    <div className="flex gap-2">
                        {selectedStatus === 'submitted' && (
                            <button
                                onClick={handleLockMarks}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md"
                            >
                                <Lock size={16} />
                                {actionLoading ? 'Locking...' : 'Lock Selected Marks'}
                            </button>
                        )}
                        {selectedStatus === 'locked' && (
                            <button
                                onClick={handlePublishResults}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-md"
                            >
                                <Send size={16} />
                                {actionLoading ? 'Publishing...' : 'Publish Selected Results'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Marks Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading marks...</div>
                ) : marks.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No {selectedStatus} marks found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedMarkIds.length === marks.length && marks.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300"
                                        />
                                    </th>
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
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedMarkIds.includes(mark.internal_mark_id)}
                                                onChange={() => handleSelectMark(mark.internal_mark_id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
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

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t flex justify-between items-center">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
