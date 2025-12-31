import React from 'react';
import {
    Building2,
    Users,
    GraduationCap,
    DollarSign,
    AlertCircle,
    Bell,
    CheckCircle,
    ArrowRight,
    TrendingUp,
    Activity
} from 'lucide-react';
import type { Notice, PendingUser } from '../../services/adminService';

interface UniversityOverviewProps {
    stats: any;
    pendingUsers: PendingUser[];
    notices: Notice[];
    onNavigate: (tab: string) => void;
}

export default function UniversityOverview({ stats, pendingUsers, notices, onNavigate }: UniversityOverviewProps) {
    if (!stats) return <div className="text-white">Loading Overview...</div>;

    const totalRevenue = stats.total_fees_paid || 0;
    const expectedRevenue = stats.total_expected_fees || 0;
    const pendingRevenue = stats.total_pending_fees || 0;
    const collectionRate = expectedRevenue > 0 ? (totalRevenue / expectedRevenue) * 100 : 0;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Institutes */}
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#650C08]">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Institutes</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.total_institutes || 0}</h3>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg">
                            <Building2 className="text-[#650C08]" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-600">
                        <TrendingUp size={16} className="mr-1 text-green-600" />
                        <span className="text-green-600 font-medium">+2 New</span>
                        <span className="ml-1">this month</span>
                    </div>
                </div>

                {/* Total Students */}
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-600">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Students</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.total_students || 0}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <GraduationCap className="text-blue-600" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-600">
                        <span className="text-gray-500">Across {stats.students_per_branch?.length || 0} Branches</span>
                    </div>
                </div>

                {/* Financial Health */}
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Fee Collection</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">₹{(totalRevenue / 10000000).toFixed(2)}Cr</h3>
                            <p className="text-xs text-gray-400">Target: ₹{(expectedRevenue / 10000000).toFixed(2)}Cr</p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <DollarSign className="text-emerald-600" size={24} />
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${collectionRate}%` }}></div>
                    </div>
                </div>

                {/* System Status / Pending */}
                <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Action Items</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{pendingUsers.length}</h3>
                            <p className="text-xs text-gray-400">Pending Registrations</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                            <AlertCircle className="text-orange-500" size={24} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={() => onNavigate('students')}
                            className="text-sm text-orange-600 font-medium hover:underline flex items-center gap-1"
                        >
                            Review All <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Recent Activity / Notices */}
                <div className="bg-white/95 rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Bell className="text-[#650C08]" size={20} />
                            Recent Notices
                        </h3>
                        <button onClick={() => onNavigate('notices')} className="text-sm text-blue-600 hover:text-blue-800">View All</button>
                    </div>
                    <div className="space-y-4">
                        {notices.slice(0, 4).map((notice, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-900 line-clamp-1">{notice.title}</h4>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                        {new Date(notice.created_at || '').toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notice.description}</p>
                            </div>
                        ))}
                        {notices.length === 0 && <p className="text-gray-500 text-center py-4">No recent notices posted.</p>}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/95 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                        <Activity className="text-[#650C08]" size={20} />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onNavigate('institutes')} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 text-left transition-colors group">
                            <Building2 className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                            <div className="font-semibold text-gray-900">Add Institute</div>
                            <div className="text-xs text-gray-500">Register new campus</div>
                        </button>
                        <button onClick={() => onNavigate('notices')} className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-100 text-left transition-colors group">
                            <Bell className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                            <div className="font-semibold text-gray-900">Post Notice</div>
                            <div className="text-xs text-gray-500">Announce to all</div>
                        </button>
                        <button onClick={() => onNavigate('fees')} className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-100 text-left transition-colors group">
                            <DollarSign className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                            <div className="font-semibold text-gray-900">Verify Fees</div>
                            <div className="text-xs text-gray-500">Check payments</div>
                        </button>
                        <button onClick={() => onNavigate('overview')} className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-100 text-left transition-colors group">
                            <Users className="text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                            <div className="font-semibold text-gray-900">Approve Users</div>
                            <div className="text-xs text-gray-500">Review signups</div>
                        </button>
                    </div>
                </div>

                {/* Pending Registrations (Mini-View) */}
                <div className="bg-white/95 rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Users className="text-[#650C08]" size={20} />
                            Pending Approvals
                        </h3>
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{pendingUsers.length}</span>
                    </div>
                    <div className="space-y-3">
                        {pendingUsers.slice(0, 5).map(user => (
                            <div key={user.user_id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                        {user.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{user.full_name}</div>
                                        <div className="text-xs text-gray-500">{user.username}</div>
                                    </div>
                                </div>
                                <button onClick={() => onNavigate('overview')} className="text-xs bg-[#650C08] text-white px-3 py-1.5 rounded hover:bg-[#8B1A1A]">
                                    Review
                                </button>
                            </div>
                        ))}
                        {pendingUsers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                <CheckCircle size={32} className="mb-2 text-green-500" />
                                <p>All caught up!</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
