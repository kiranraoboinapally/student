import React, { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Users, DollarSign, BookOpen, Building2 } from "lucide-react";
import type { Institute, Course, Student, FeePayment } from "../../services/adminService";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface StatisticsChartsProps {
    institutes: Institute[];
    courses: Course[];
    students: Student[];
    feePayments: FeePayment[];
}

export default function StatisticsCharts({ institutes, courses, students, feePayments }: StatisticsChartsProps) {
    // 1. Course Distribution per Institute (REAL DATA)
    const instituteCourseData = useMemo(() => {
        // Sort institutes by number of courses usually descending
        const data = institutes.map(inst => {
            const courseCount = courses.filter(c => c.institute_id === (inst.institute_id || inst.id)).length;
            return { name: inst.name, count: courseCount };
        }).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10

        return {
            labels: data.map(d => d.name),
            datasets: [
                {
                    label: "Courses Offered",
                    data: data.map(d => d.count),
                    backgroundColor: "rgba(101, 12, 8, 0.8)",
                    borderRadius: 4,
                    barThickness: 20,
                },
            ],
        };
    }, [institutes, courses]);

    // 2. Revenue by Fee Type (REAL DATA)
    const revenueByTypeData = useMemo(() => {
        const typeMap: Record<string, number> = {};
        feePayments.forEach(payment => {
            const type = payment.fee_type || 'Tuition';
            const amount = Number(payment.amount_paid) || 0;
            typeMap[type] = (typeMap[type] || 0) + amount;
        });

        const labels = Object.keys(typeMap);
        const values = Object.values(typeMap);

        return {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: [
                        "rgba(16, 185, 129, 0.8)", // Green
                        "rgba(59, 130, 246, 0.8)", // Blue
                        "rgba(245, 158, 11, 0.8)", // Orange
                        "rgba(239, 68, 68, 0.8)",  // Red
                        "rgba(139, 92, 246, 0.8)", // Purple
                    ],
                    borderColor: "#ffffff",
                    borderWidth: 2,
                },
            ],
        };
    }, [feePayments]);

    // 3. Student Enrollment linking check (REAL DATA Attempt)
    // If students have institute_id, we graph it. If not, we show "Unassigned" vs "Assigned" or similar real stats.
    const studentAllocationData = useMemo(() => {
        // Try to find if ANY student has institute_id from some join
        const withInstitute = students.filter(s => s.institute_id).length;
        const withoutInstitute = students.length - withInstitute;

        // If no one is assigned (likely current state), let's show Course Duration distribution instead as it's real data from courses
        if (withInstitute === 0) {
            const durationMap: Record<string, number> = {};
            courses.forEach(c => {
                const key = `${c.duration_years} Years`;
                durationMap[key] = (durationMap[key] || 0) + 1;
            });

            return {
                labels: Object.keys(durationMap),
                datasets: [{
                    label: 'Courses by Duration',
                    data: Object.values(durationMap),
                    backgroundColor: [
                        "rgba(59, 130, 246, 0.6)",
                        "rgba(16, 185, 129, 0.6)",
                        "rgba(249, 115, 22, 0.6)"
                    ],
                }]
            };
        }

        return {
            labels: ["Assigned to Institute", "Pending Assignment"],
            datasets: [{
                data: [withInstitute, withoutInstitute],
                backgroundColor: ["#10B981", "#EF4444"],
            }]
        };
    }, [students, courses]);

    // 4. Calculate Total Revenue
    const totalRevenue = useMemo(() => {
        return feePayments.reduce((acc, curr) => acc + (Number(curr.amount_paid) || 0), 0);
    }, [feePayments]);

    const commonOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                cornerRadius: 8,
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { border: { display: false }, grid: { borderDash: [4, 4] } }
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Real Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Total Revenue Collected", value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Active Student Records", value: students.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Total Courses Registered", value: courses.length, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Partner Institutes", value: institutes.length, icon: Building2, color: "text-orange-600", bg: "bg-orange-50" },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <h4 className="text-gray-500 text-sm font-medium">{stat.label}</h4>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Institute Course Volume */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Academic Volume</h3>
                        <p className="text-sm text-gray-500">Number of courses offered by top institutes</p>
                    </div>
                    <div className="h-[300px]">
                        <Bar
                            data={instituteCourseData}
                            options={{
                                ...commonOptions,
                                indexAxis: 'y' as const, // Horizontal bar simpler to read for names
                            }}
                        />
                    </div>
                </div>

                {/* Chart 2: Revenue Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Revenue Distribution</h3>
                        <p className="text-sm text-gray-500">Breakdown of collected fees by type</p>
                    </div>
                    <div className="h-[300px] flex justify-center">
                        <div className="w-full max-w-md">
                            <Doughnut
                                data={revenueByTypeData}
                                options={{
                                    ...commonOptions,
                                    cutout: '60%',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart 3: Course Durations (Data Availability Fallback) */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Program Duration Insights</h3>
                    <p className="text-sm text-gray-500">Distribution of courses by year duration</p>
                </div>
                <div className="h-[250px]">
                    <Bar
                        data={studentAllocationData}
                        options={commonOptions}
                    />
                </div>
            </div>
        </div>
    );
}
