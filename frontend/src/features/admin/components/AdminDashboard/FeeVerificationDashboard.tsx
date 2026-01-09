import { useMemo, useState, useEffect } from "react";
import {
    CheckCircle,
    XCircle,
    Filter,
    Search,
    AlertCircle,
    DollarSign,
    Building2,
    BookOpen,
    TrendingUp
} from "lucide-react";
import type { FeePayment, Institute, Course, Student } from "../../services/adminService";
import AdminService from "../../services/adminService";
import { useAuth } from "../../../auth/AuthProvider";

interface FeeVerificationDashboardProps {
    payments: FeePayment[];
    institutes: Institute[];
    courses: Course[];
    students: Student[];
    onRefresh: () => void;
    adminStats?: any;
}

export default function FeeVerificationDashboard({
    payments,
    institutes,
    courses,
    students,
    onRefresh,
    adminStats
}: FeeVerificationDashboardProps) {
    const { authFetch } = useAuth();
    const service = new AdminService(authFetch);

    // Local copy of payments so we can refetch/filter from this component
    const [localPayments, setLocalPayments] = useState<FeePayment[]>(payments || []);

    // Filters
    const [selectedInstitute, setSelectedInstitute] = useState<number | "all">("all");
    const [selectedCourse, setSelectedCourse] = useState<number | "all">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Processing State
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Filter Logic
    const filteredData = useMemo(() => {
        return localPayments.filter(payment => {
            if (statusFilter !== "all") {
                const st = (payment.status || 'pending').toLowerCase();
                if (statusFilter === 'pending') {
                    if (!(st === 'pending' || st === 'needs_verification')) return false;
                } else if (statusFilter === 'verified') {
                    if (st !== 'verified') return false;
                } else if (statusFilter === 'rejected') {
                    if (st !== 'rejected') return false;
                } else {
                    if (st !== statusFilter) return false;
                }
            }

            const student = students.find(s =>
                s.enrollment_number == (payment.student_id as any)
                || s.user_id == (payment.student_id as any)
                || s.enrollment_number == (payment as any).enrollment_number
                || s.user_id == (payment as any).enrollment_number
            );

            if (selectedInstitute !== "all") {
                // If we have a student record, use its institute_id
                if (student && student.institute_id !== undefined) {
                    if (student.institute_id !== selectedInstitute) return false;
                } else {
                    // fall back to matching payment.institute_name against selected institute name
                    const inst = institutes.find(i => i.institute_id === selectedInstitute);
                    const selName = (inst?.institute_name ?? inst?.name ?? '').trim().toLowerCase();
                    const payName = (payment.institute_name ?? '').toString().trim().toLowerCase();
                    if (!selName || !payName || selName !== payName) return false;
                }
            }

            if (selectedCourse !== "all") {
                if (!student || student.course_id !== selectedCourse) return false;
            }

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesName = (student?.full_name || payment.student_name || '').toLowerCase().includes(term);
                const matchesTrans = ((payment.transaction_number || payment.transactionNumber || '') as string).toLowerCase().includes(term);
                const matchesEnroll = String(payment.enrollment_number ?? payment.student_id ?? '').toLowerCase().includes(term);
                return matchesName || matchesTrans || matchesEnroll;
            }

            return true;
        });
    }, [localPayments, students, institutes, courses, selectedInstitute, selectedCourse, statusFilter, searchTerm]);

    // Keep localPayments in sync with incoming prop updates
    useEffect(() => {
        setLocalPayments(payments || []);
    }, [payments]);

    // Fetch from backend when institute or status changes so server-side mapping is used
    useEffect(() => {
        const run = async () => {
            try {
                // if no filters selected, just use provided payments
                if (selectedInstitute === 'all' && statusFilter === 'all') {
                    setLocalPayments(payments || []);
                    return;
                }

                const filters: any = {};
                if (selectedInstitute !== 'all') {
                    const inst = institutes.find(i => i.institute_id === selectedInstitute);
                    if (inst) filters.institute_name = inst.institute_name ?? inst.name ?? '';
                }
                if (statusFilter !== 'all') {
                    // backend uses display_status like 'verified' or 'needs_verification'
                    filters.status = statusFilter === 'pending' ? 'needs_verification' : statusFilter;
                }

                const res = await service.getFeePayments(1, 100, filters);
                setLocalPayments(res.payments || []);
            } catch (err) {
                console.error('Failed fetching filtered payments', err);
            }
        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedInstitute, statusFilter]);

    // Derived Stats
    const stats = useMemo(() => {
        const total = filteredData.reduce(
  (acc, curr) => acc + (Number(curr.fee_amount) || 0),
  0
);
        const pendingCount = filteredData.filter(p => {
            const s = (p.status || 'pending').toLowerCase();
            return s === 'pending' || s === 'needs_verification' || s === 'needs-verification';
        }).length;
        const verifiedCount = filteredData.filter(p => (p.status || '').toLowerCase() === 'verified').length;
        return { total, pendingCount, verifiedCount };
    }, [filteredData]);

    // Handlers
    const handleVerify = async (id: number, source?: string) => {
        if (!window.confirm("Verify this payment?")) return;
        setProcessingId(id);
        try {
            await service.verifyPayment(id, source || 'registration', 'verify');
            onRefresh();
        } catch (err) {
            console.error(err);
            alert("Failed to verify payment");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number, source?: string) => {
        if (!window.confirm("Reject this payment?")) return;
        setProcessingId(id);
        try {
            await service.verifyPayment(id, source || 'registration', 'reject');
            onRefresh();
        } catch (err) {
            console.error(err);
            alert("Failed to reject payment");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Collected */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 bg-gradient-to-br from-emerald-50 to-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-emerald-700 mb-1 uppercase tracking-wider">Total Collected</p>
                            <h3 className="text-2xl font-bold text-emerald-600">₹{(adminStats?.total_fees_paid || stats.total).toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-lg shadow-sm">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>

                {/* Revenue Goal */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 bg-gradient-to-br from-blue-50 to-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-blue-700 mb-1 uppercase tracking-wider">Revenue Goal</p>
                            <h3 className="text-2xl font-bold text-blue-600">₹{(adminStats?.total_expected_fees || 0).toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg shadow-sm">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Pending/Due */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 bg-gradient-to-br from-red-50 to-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-red-700 mb-1 uppercase tracking-wider">Pending/Due</p>
                            <h3 className="text-2xl font-bold text-red-600">₹{(adminStats?.total_pending_fees || 0).toLocaleString()}</h3>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg shadow-sm">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* To Verify */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 bg-gradient-to-br from-orange-50 to-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-orange-700 mb-1 uppercase tracking-wider">To Verify</p>
                            <h3 className="text-2xl font-bold text-orange-600">{stats.pendingCount}</h3>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg shadow-sm">
                            <CheckCircle className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                    <Filter size={20} />
                    <span>Filters:</span>
                </div>

                {/* Institute Filter */}
                <div className="relative">
                    <select
                        className="pl-9 pr-4 py-2 border rounded-lg appearance-none bg-gray-50 hover:bg-white transition-colors focus:ring-2 focus:ring-[#650C08] focus:border-transparent min-w-[200px]"
                        value={selectedInstitute}
                        onChange={e => {
                            setSelectedInstitute(e.target.value === "all" ? "all" : Number(e.target.value));
                            setSelectedCourse("all");
                        }}
                    >
                        <option value="all">All Institutes</option>
                        {institutes
                            .sort((a, b) => (a.institute_name ?? a.name ?? '').localeCompare(b.institute_name ?? b.name ?? ''))
                            .map(inst => {
                                const id = inst.institute_id ?? inst.id;
                                const name = inst.institute_name ?? inst.name;
                                return (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                );
                            })}
                    </select>
                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>

                {/* Course Filter */}
                <div className="relative">
                    <select
                        className="pl-9 pr-4 py-2 border rounded-lg appearance-none bg-gray-50 hover:bg-white transition-colors focus:ring-2 focus:ring-[#650C08] focus:border-transparent min-w-[200px]"
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value === "all" ? "all" : Number(e.target.value))}
                        disabled={selectedInstitute === "all"}
                    >
                        <option value="all">All Courses</option>
                        {courses
                            .filter(c => selectedInstitute === "all" || c.institute_id === selectedInstitute)
                            .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
                            .map(course => (
                                <option key={course.course_id} value={course.course_id}>
                                    {course.name}
                                </option>
                            ))}
                    </select>
                    <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>

                {/* Status Filter */}
                <select
                    className="px-4 py-2 border rounded-lg bg-gray-50 hover:bg-white focus:ring-2 focus:ring-[#650C08]"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                </select>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search student or transaction ID..."
                        className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-900">Student Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Institute / Course</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Fee Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Amount</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Date</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-4 text-right font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredData.length > 0 ? filteredData.map(payment => {
                                const student = students.find(s => s.enrollment_number == (payment.student_id as any) || s.user_id == (payment.student_id as any));
                                const status = (payment.status || 'pending').toLowerCase();
                                const isPending = status === 'pending';

                                return (
                                    <tr key={payment.payment_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{payment.student_name || student?.full_name || 'Unknown Student'}</div>
                                            <div className="text-xs text-gray-500 font-mono">{payment.transaction_number || 'NO-REF'}</div>
                                            <div className="text-xs text-gray-500">Enroll: {payment.enrollment_number ?? payment.student_id ?? student?.enrollment_number ?? '—'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                                    {student?.institute_id || payment.institute_name ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-900 font-medium">
                                                                {student?.institute_id ? (institutes.find(i => i.institute_id === student.institute_id)?.institute_name) : (payment.institute_name || 'Unknown Institute')}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {student?.course_id ? (courses.find(c => c.course_id === student.course_id)?.name) : (payment.course_name || 'Unknown Course')}
                                                            </span>
                                                            {payment.semester !== undefined && payment.semester !== null && (
                                                                <span className="text-xs text-gray-400">Sem: {payment.semester}</span>
                                                            )}
                                                            {payment.program_pattern && (
                                                                <span className="text-xs text-gray-400">Pattern: {payment.program_pattern}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">No academic data</span>
                                                    )}
                                                </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                                                {payment.source ? (payment.source.charAt(0).toUpperCase() + payment.source.slice(1)) : (payment.payment_method || 'Online')}
                                            </span>
                                            {payment.payment_note && (
                                                <div className="text-xs text-gray-400 mt-1">{payment.payment_note}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                           ₹{(payment.fee_amount ?? 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                                                ${status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                                                    status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-amber-100 text-amber-800'}`}>
                                                {status === 'verified' && <CheckCircle size={14} />}
                                                {status === 'rejected' && <XCircle size={14} />}
                                                {status === 'pending' && <AlertCircle size={14} />}
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isPending && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleVerify(payment.payment_id!, (payment as any).source)}
                                                        disabled={processingId === payment.payment_id}
                                                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                        title="Verify Payment"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(payment.payment_id!, (payment as any).source)}
                                                        disabled={processingId === payment.payment_id}
                                                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Reject Payment"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                <Filter className="text-gray-400" size={24} />
                                            </div>
                                            <p className="font-medium">No payments found</p>
                                            <p className="text-sm">Try adjusting your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
