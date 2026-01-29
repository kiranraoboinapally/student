import { useState, useEffect } from "react";
import { Users, Edit, Trash2, UserPlus, RefreshCw } from "lucide-react";
import { useAuth } from "../../../auth/AuthProvider";

export default function InstituteUserManagement() {
    const { authFetch } = useAuth();

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        total_pages: 0
    });

    useEffect(() => {
        loadUsers();
    }, [pagination.page]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/api/admin/users/all?page=${pagination.page}&limit=${pagination.limit}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                if (data.pagination) {
                    setPagination(prev => ({ ...prev, ...data.pagination }));
                }
            }
        } catch (err) {
            console.error("Failed to load users:", err);
        } finally {
            setLoading(false);
        }
    };

    const getRoleName = (roleId: number) => {
        const roles: { [key: number]: string } = {
            1: "University Admin",
            2: "Faculty",
            3: "Institute Admin",
            4: "Accountant",
            5: "Student"
        };
        return roles[roleId] || "Unknown";
    };

    const getStatusBadge = (status: string) => {
        const statusMap: { [key: string]: { bg: string; text: string } } = {
            approved: { bg: "bg-green-100", text: "text-green-700" },
            pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
            rejected: { bg: "bg-red-100", text: "text-red-700" }
        };
        const style = statusMap[status?.toLowerCase()] || { bg: "bg-gray-100", text: "text-gray-700" };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} capitalize`}>
                {status || "Pending"}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                            <p className="text-sm text-gray-500">View and manage all system users</p>
                        </div>
                    </div>
                    <button
                        onClick={loadUsers}
                        disabled={loading}
                        className="p-2 text-gray-500 hover:text-[#650C08] hover:bg-gray-50 rounded-full transition-all"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Mobile
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                                        <p className="text-gray-500">Loading users...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No users found</p>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            #{user.user_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#650C08] text-white flex items-center justify-center font-bold text-sm">
                                                    {user.name?.charAt(0).toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{user.name || "N/A"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.email || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {user.mobile || "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                                {getRoleName(user.role_id)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(user.approval_status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                        <p className="text-sm text-gray-600">
                            Showing page {pagination.page} of {pagination.total_pages} ({pagination.total} total users)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page >= pagination.total_pages}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
