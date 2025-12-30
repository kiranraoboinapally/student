import React, { useMemo } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import type { Institute, Course, Student, FeePayment } from "../../services/adminService";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
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
    // Institute-wise student distribution (would use real enrollment data)
    const instituteDistributionData = useMemo(() => {
        const instituteNames = institutes.slice(0, 10).map(i => i.name.substring(0, 20));
        const studentCounts = institutes.slice(0, 10).map(() => Math.floor(Math.random() * 500) + 50);

        return {
            labels: instituteNames,
            datasets: [
                {
                    label: "Students Enrolled",
                    data: studentCounts,
                    backgroundColor: [
                        "rgba(101, 12, 8, 0.8)",
                        "rgba(139, 26, 26, 0.8)",
                        "rgba(37, 99, 235, 0.8)",
                        "rgba(16, 185, 129, 0.8)",
                        "rgba(245, 158, 11, 0.8)",
                        "rgba(168, 85, 247, 0.8)",
                        "rgba(236, 72, 153, 0.8)",
                        "rgba(14, 165, 233, 0.8)",
                        "rgba(132, 204, 22, 0.8)",
                        "rgba(251, 146, 60, 0.8)",
                    ],
                },
            ],
        };
    }, [institutes]);

    // Branch-wise enrollment
    const branchEnrollmentData = useMemo(() => {
        const branches = courses.slice(0, 8).map(c => (c.name || c.course_name || 'Unknown').substring(0, 15));
        const enrollmentCounts = courses.slice(0, 8).map(() => Math.floor(Math.random() * 200) + 20);

        return {
            labels: branches,
            datasets: [
                {
                    label: "Enrolled Students",
                    data: enrollmentCounts,
                    backgroundColor: "rgba(101, 12, 8, 0.8)",
                    borderColor: "rgba(101, 12, 8, 1)",
                    borderWidth: 2,
                },
            ],
        };
    }, [courses]);

    // Semester-wise enrollment trends
    const semesterTrendsData = useMemo(() => {
        return {
            labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"],
            datasets: [
                {
                    label: "Active Students",
                    data: [450, 420, 380, 360, 340, 320, 280, 250],
                    borderColor: "rgba(101, 12, 8, 1)",
                    backgroundColor: "rgba(101, 12, 8, 0.1)",
                    tension: 0.4,
                    fill: true,
                },
            ],
        };
    }, []);

    // Fee payment statistics
    const feePaymentData = useMemo(() => {
        return {
            labels: ["Paid", "Pending", "Overdue"],
            datasets: [
                {
                    data: [65, 25, 10],
                    backgroundColor: [
                        "rgba(16, 185, 129, 0.8)",
                        "rgba(245, 158, 11, 0.8)",
                        "rgba(239, 68, 68, 0.8)",
                    ],
                    borderWidth: 2,
                    borderColor: "#fff",
                },
            ],
        };
    }, [feePayments]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
            },
        },
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Institute Distribution */}
                <div className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Institute-wise Student Distribution</h3>
                    <div className="h-80">
                        <Bar data={instituteDistributionData} options={chartOptions} />
                    </div>
                </div>

                {/* Fee Payment Status */}
                <div className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Fee Payment Status</h3>
                    <div className="h-80">
                        <Pie data={feePaymentData} options={chartOptions} />
                    </div>
                </div>

                {/* Branch Enrollment */}
                <div className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Branch-wise Enrollment</h3>
                    <div className="h-80">
                        <Bar data={branchEnrollmentData} options={chartOptions} />
                    </div>
                </div>

                {/* Semester Trends */}
                <div className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Semester-wise Enrollment Trends</h3>
                    <div className="h-80">
                        <Line data={semesterTrendsData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
