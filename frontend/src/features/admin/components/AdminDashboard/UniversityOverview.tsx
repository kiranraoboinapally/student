import {
    Users,
    GraduationCap,
    BookOpen,
    Building2,
    Clock,
    ArrowUpRight,
    DollarSign,
    RefreshCw
} from "lucide-react";
import type { Notice, PendingUser } from '../../services/adminService';

interface UniversityOverviewProps {
    stats: any;
    pendingUsers: PendingUser[];
    notices: Notice[];
    onNavigate: (tab: any) => void;
    onReviewUser: (user: PendingUser) => void;
    onRefresh: () => void; // Added for refresh button
}

export default function UniversityOverview({ stats, pendingUsers, notices, onReviewUser, onNavigate, onRefresh }: UniversityOverviewProps) {
    if (!stats) return <div className="text-white">Loading Overview...</div>;

    // Fallbacks
    const totalInstitutes = stats.total_institutes || 0;
    const totalCourses = stats.total_courses || 0;
    const totalStudents = stats.total_students || 0;
    const totalActiveStudents = stats.total_active_students || 0;
    const totalFaculty = stats.total_faculty || 0;

    return (
        <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                {/* Colleges Card */}
                <div
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-br from-blue-50/50 to-white hover:shadow-md transition-all group"

                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                            <Building2 size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-gray-400 group-hover:text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Colleges</p>
                        <h3 className="text-2xl font-black text-gray-900">{totalInstitutes}</h3>
                    </div>
                </div>

                {/* Courses Card */}
                <div
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-br from-purple-50/50 to-white hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-100 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                            <BookOpen size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-gray-400 group-hover:text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Courses</p>
                        <h3 className="text-2xl font-black text-gray-900">{totalCourses}</h3>
                    </div>
                </div>

                {/* Students Card */}
                <div
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-br from-emerald-50/50 to-white hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-gray-400 group-hover:text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Students</p>
                        <h3 className="text-2xl font-black text-gray-900">{totalStudents}</h3>
                    </div>
                </div>

                {/* Active Students Card */}
                <div
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-br from-teal-50/50 to-white hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-teal-100 rounded-xl text-teal-600 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-gray-400 group-hover:text-teal-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Active Students</p>
                        <h3 className="text-2xl font-black text-gray-900">{totalActiveStudents}</h3>
                    </div>
                </div>

                {/* Faculty Card */}
                <div
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-br from-orange-50/50 to-white hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-100 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
                            <GraduationCap size={24} />
                        </div>
                        <ArrowUpRight size={16} className="text-gray-400 group-hover:text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Faculty</p>
                        <h3 className="text-2xl font-black text-gray-900">{totalFaculty}</h3>
                    </div>
                </div>
            </div>

            {/* Quick Actions Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => onNavigate('institutes')}
                        className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 text-blue-900 font-medium flex items-center gap-2"
                    >
                        <Building2 size={20} /> Manage Institutes
                    </button>
                    <button
                        onClick={() => onNavigate('fees')}
                        className="p-4 bg-green-50 rounded-lg hover:bg-green-100 text-green-900 font-medium flex items-center gap-2"
                    >
                        <DollarSign size={20} /> Verify Fees
                    </button>
                    <button
                        onClick={onRefresh}
                        className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 text-purple-900 font-medium flex items-center gap-2"
                    >
                        <RefreshCw size={20} /> Refresh Data
                    </button>
                </div>
            </div>

            {/* Pending Users and Notices Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Registrations */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            Pending Registrations
                            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                                {pendingUsers.length}
                            </span>
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {pendingUsers.length > 0 ? (
                            pendingUsers.map((user) => (
                                <div key={user.user_id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold uppercase">
                                            {user.full_name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                                            <p className="text-xs text-gray-500">{user.email} • {user.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <Clock size={12} />
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </div>
                                        <button
                                            onClick={() => onReviewUser(user)}
                                            className="text-xs bg-[#650C08] text-white px-3 py-1.5 rounded hover:bg-[#8B1A1A] transition-colors"
                                        >
                                            Review
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                <p className="font-medium">All caught up!</p>
                                <p className="text-sm">No pending registrations at the moment.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Notices Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Recent Notices</h3>
                    </div>
                    <div className="p-4 space-y-4">
                        {notices.slice(0, 5).map((notice) => (
                            <div key={notice.notice_id} className="group cursor-pointer">
                                <p className="text-xs text-[#650C08] font-bold uppercase tracking-wider mb-1">
                                    {new Date(notice.created_at).toLocaleDateString()}
                                </p>
                                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#650C08] transition-colors line-clamp-1">
                                    {notice.title}
                                </h4>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                    {notice.description}
                                </p>
                            </div>
                        ))}
                        {notices.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <p>No notices available.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
