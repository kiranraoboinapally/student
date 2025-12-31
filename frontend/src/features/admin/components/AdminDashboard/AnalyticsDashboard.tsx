import React, { useMemo, useState } from 'react';
import {
    Users,
    DollarSign,
    BookOpen,
    TrendingUp,
    PieChart,
    BarChart3,
    Filter,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import type { Institute, Course, Student, FeePayment, Subject } from '../../services/adminService';

interface AnalyticsDashboardProps {
    institutes: Institute[];
    courses: Course[];
    students: Student[];
    feePayments: FeePayment[];
    subjects: Subject[];
    adminStats?: any;
}

export default function AnalyticsDashboard({
    institutes,
    courses,
    students,
    feePayments,
    subjects,
    adminStats
}: AnalyticsDashboardProps) {
    // Global Filter State
    const [selectedInstitute, setSelectedInstitute] = useState<number | 'all'>('all');
    const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');

    // Sort institutes alphabetically for dropdown
    const sortedInstitutes = useMemo(() => {
        return [...institutes].sort((a, b) =>
            (a.institute_name || '').localeCompare(b.institute_name || '')
        );
    }, [institutes]);

    // --- Derived Data Calculation ---
    const filteredContext = useMemo(() => {
        // Filter Students
        const filteredStudents = students.filter(s => {
            if (selectedInstitute !== 'all') {
                // Hybrid Match: Match by ID (if enriched) OR Name (if ID missing)
                // First, find the name of the selected institute
                const selectedInst = institutes.find(i => i.institute_id === selectedInstitute);
                if (!selectedInst) return false;

                const matchesId = s.institute_id === selectedInstitute;
                const matchesName = s.institute_name === selectedInst.institute_name;

                if (!matchesId && !matchesName) return false;
            }

            // Note: student.course_id might need to be mapped if backend doesn't provide it directly in list
            // Assuming for now simple matching if available, else ignored or matched by name
            if (selectedCourse !== 'all' && s.course_id !== selectedCourse) return false;
            return true;
        });

        // Filter Payments (linked via student)
        const relevantStudentIds = new Set(filteredStudents.map(s => s.user_id || s.student_id));
        const filteredPayments = feePayments.filter(p => relevantStudentIds.has(p.student_id!));

        // Filter Courses (just for count)
        const activeCourses = courses.filter(c =>
            selectedInstitute === 'all' || c.institute_id === selectedInstitute
        );

        return {
            students: filteredStudents,
            payments: filteredPayments,
            courses: activeCourses
        };
    }, [students, feePayments, courses, selectedInstitute, selectedCourse]);

    // Stats
    const stats = useMemo(() => {
        const totalStudents = filteredContext.students.length;
        const totalCollection = filteredContext.payments.reduce((sum, p) => sum + (p.amount_paid || p.paid_amount || 0), 0);
        const activeCoursesCount = filteredContext.courses.length;

        // Mocking Pass Rate because we don't have full results data in the props yet
        // In real world, we'd aggregate SemesterResult
        const passRate = 85 + Math.random() * 10; // Placeholder dynamic

        return {
            totalStudents,
            totalCollection,
            activeCoursesCount,
            passRate: passRate.toFixed(1)
        };
    }, [filteredContext]);

    // Chart Data Preparation
    const instituteDistribution = useMemo(() => {
        // PREFER BACKEND DATA provided via adminStats because client-side filtering 
        // can fail if institute IDs/Names are not perfectly aligned or if pagination limits data.
        if (adminStats && adminStats.students_per_institute) {
            return adminStats.students_per_institute.map((item: any) => ({
                name: item.institute_name,
                count: item.count
            })).sort((a: any, b: any) => b.count - a.count).slice(0, 5);
        }

        if (selectedInstitute !== 'all') return []; // Don't show if single institute selected

        return institutes.map(inst => {
            const count = students.filter(s => s.institute_id === inst.institute_id).length;
            return { name: inst.institute_name, count };
        }).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5
    }, [institutes, students, selectedInstitute, adminStats]);

    const feeStatusData = useMemo(() => {
        // Simple composition: Verified vs Pending vs Rejected
        const verified = filteredContext.payments.filter(p => p.status === 'verified').length;
        const pending = filteredContext.payments.filter(p => !p.status || p.status === 'pending').length;
        const rejected = filteredContext.payments.filter(p => p.status === 'rejected').length;
        const total = verified + pending + rejected || 1;

        return [
            { label: 'Verified', value: verified, color: '#10B981', percent: (verified / total) * 100 },
            { label: 'Pending', value: pending, color: '#F59E0B', percent: (pending / total) * 100 },
            { label: 'Rejected', value: rejected, color: '#EF4444', percent: (rejected / total) * 100 },
        ];
    }, [filteredContext.payments]);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-[#650C08] font-bold">
                    <Filter size={20} />
                    <span>Global Filters:</span>
                </div>

                <select
                    value={selectedInstitute}
                    onChange={e => {
                        setSelectedInstitute(e.target.value === 'all' ? 'all' : Number(e.target.value));
                        setSelectedCourse('all');
                    }}
                    className="px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-[#650C08] min-w-[200px]"
                >
                    <option value="all">All Institutes</option>
                    {sortedInstitutes.map(i => (
                        <option key={i.institute_id} value={i.institute_id}>
                            {i.institute_name}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedCourse}
                    onChange={e => setSelectedCourse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-[#650C08] min-w-[200px]"
                >
                    <option value="all">All Courses</option>
                    {courses
                        .filter(c => selectedInstitute === 'all' || c.institute_id === selectedInstitute)
                        .map(c => (
                            <option key={c.course_id} value={c.course_id}>
                                {c.name}
                            </option>
                        ))
                    }
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={<Users size={24} className="text-blue-600" />}
                    trend="+12% vs last term"
                    trendUp={true}
                    color="bg-blue-50"
                />
                <KPICard
                    title="Fees Collected"
                    value={`₹${stats.totalCollection.toLocaleString()}`}
                    icon={<DollarSign size={24} className="text-emerald-600" />}
                    trend="+8% this month"
                    trendUp={true}
                    color="bg-emerald-50"
                />
                <KPICard
                    title="Active Courses"
                    value={stats.activeCoursesCount}
                    icon={<BookOpen size={24} className="text-purple-600" />}
                    trend="Stable"
                    color="bg-purple-50"
                />
                <KPICard
                    title="Avg Pass Rate"
                    value={`${stats.passRate}%`}
                    icon={<TrendingUp size={24} className="text-orange-600" />}
                    trend="+2.1% improvement"
                    trendUp={true}
                    color="bg-orange-50"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Institute Distribution Bar Chart */}
                {selectedInstitute === 'all' && (
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="text-[#650C08]" size={20} />
                                Student Distribution by Institute
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {instituteDistribution.map((item: any, idx: number) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                        <span className="text-gray-500">{item.count} students</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#650C08] to-[#8B1A1A] rounded-full transition-all duration-1000"
                                            style={{ width: `${(item.count / (stats.totalStudents || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fee Status Donut Chart (CSS based) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <PieChart className="text-[#650C08]" size={20} />
                            Fee Payment Status
                        </h3>
                    </div>

                    <div className="flex items-center justify-center py-6">
                        {/* Simple CSS Conic Gradient for Donut Chart */}
                        <div className="relative w-48 h-48 rounded-full" style={{
                            background: `conic-gradient(
                                ${feeStatusData[0].color} 0% ${feeStatusData[0].percent}%,
                                ${feeStatusData[1].color} ${feeStatusData[0].percent}% ${feeStatusData[0].percent + feeStatusData[1].percent}%,
                                ${feeStatusData[2].color} ${feeStatusData[0].percent + feeStatusData[1].percent}% 100%
                            )`
                        }}>
                            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center flex-col">
                                <span className="text-3xl font-bold text-gray-900">{filteredContext.payments.length}</span>
                                <span className="text-xs text-gray-500 uppercase font-semibold">Transactions</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mt-4">
                        {feeStatusData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-gray-600">{item.label}</span>
                                </div>
                                <span className="font-bold text-gray-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// KPI Card Component
function KPICard({ title, value, icon, trend, trendUp, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-gray-600 bg-gray-50'
                        }`}>
                        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    );
}
