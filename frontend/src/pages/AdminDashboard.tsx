import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { BarChart3, Users, GraduationCap, FileText, AlertCircle, CheckCircle, LogOut, RefreshCw } from "lucide-react";

interface PendingUser {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface DashboardStats {
  totalStudents: number;
  totalUsers: number;
  pendingUsers: number;
  activeUsers: number;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const { authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalUsers: 0,
    pendingUsers: 0,
    activeUsers: 0,
  });
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // 🔹 Pending registrations
      const pendingRes = await authFetch(`${apiBase}/admin/pending-registrations`);
      const pendingData = await pendingRes.json();
      if (pendingRes.ok) {
        const users = pendingData.pending_registrations || [];
        setPendingUsers(users);
        
        if (users.length > 0) {
          setSystemAlerts(prev => {
            const exists = prev.some(a => a.id === 'pending-users');
            if (!exists) {
              return [...prev, {
                id: 'pending-users',
                type: 'warning',
                title: 'Pending Registrations',
                message: `${users.length} student(s) awaiting approval`,
                timestamp: new Date().toLocaleTimeString()
              }];
            }
            return prev;
          });
        }
      }

      // 🔹 Total students
      const studentsRes = await authFetch(`${apiBase}/admin/students?page=1&limit=1`);
      const studentsData = await studentsRes.json();
      if (studentsRes.ok) {
        const totalStudents = studentsData.pagination?.total || 0;
        setStats(prev => ({...prev, totalStudents, activeUsers: totalStudents - (pendingData.pending_registrations?.length || 0)}));
      }

      // 🔹 Total users
      const usersRes = await authFetch(`${apiBase}/admin/users?page=1&limit=1`);
      const usersData = await usersRes.json();
      if (usersRes.ok) {
        setStats(prev => ({...prev, totalUsers: usersData.pagination?.total || 0}));
      }

      setLoadingStats(false);
      setLoadingPending(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
      setLoadingStats(false);
      setLoadingPending(false);
    } finally {
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveUser = async (user: PendingUser) => {
    try {
      const res = await authFetch(`${apiBase}/admin/approve-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, action: "approve" }),
      });

      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.user_id !== user.user_id));
        setSystemAlerts(prev => [...prev, {
          id: `approve-${user.user_id}`,
          type: 'success',
          title: 'Registration Approved',
          message: `${user.full_name} has been approved`,
          timestamp: new Date().toLocaleTimeString()
        }]);
        setShowActionModal(false);
      } else {
        const err = await res.json();
        alert(err.error || "Approval failed");
      }
    } catch (err) {
      alert("Server error during approval");
    }
  };

  const handleRejectUser = async (user: PendingUser) => {
    try {
      const res = await authFetch(`${apiBase}/admin/approve-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, action: "reject" }),
      });

      if (res.ok) {
        setPendingUsers(prev => prev.filter(u => u.user_id !== user.user_id));
        setSystemAlerts(prev => [...prev, {
          id: `reject-${user.user_id}`,
          type: 'error',
          title: 'Registration Rejected',
          message: `${user.full_name} has been rejected`,
          timestamp: new Date().toLocaleTimeString()
        }]);
        setShowActionModal(false);
      }
    } catch (err) {
      alert("Server error during rejection");
    }
  };

  const filteredUsers = pendingUsers.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.includes(searchTerm)
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-950/80 backdrop-blur border-b border-slate-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">ERP Management System</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
          <div className="max-w-7xl mx-auto space-y-2">
            {systemAlerts.slice(-3).map(alert => (
              <div key={alert.id} className={`p-3 rounded-lg flex items-start gap-3 ${
                alert.type === 'warning' ? 'bg-amber-900/30 text-amber-100 border border-amber-700' :
                alert.type === 'success' ? 'bg-green-900/30 text-green-100 border border-green-700' :
                'bg-red-900/30 text-red-100 border border-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-xs opacity-90">{alert.message}</p>
                </div>
                <span className="text-xs opacity-70">{alert.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={<Users className="w-8 h-8" />}
            title="Total Users"
            value={stats.totalUsers}
            color="from-blue-600 to-blue-400"
          />
          <StatCard 
            icon={<GraduationCap className="w-8 h-8" />}
            title="Total Students"
            value={stats.totalStudents}
            color="from-green-600 to-green-400"
          />
          <StatCard 
            icon={<AlertCircle className="w-8 h-8" />}
            title="Pending Approvals"
            value={pendingUsers.length}
            color="from-amber-600 to-amber-400"
          />
          <StatCard 
            icon={<FileText className="w-8 h-8" />}
            title="Active Students"
            value={stats.activeUsers}
            color="from-purple-600 to-purple-400"
          />
        </div>

        {/* Pending Registrations Section */}
        <div className="bg-slate-800/50 rounded-xl shadow-2xl border border-slate-700 overflow-hidden backdrop-blur">
          <div className="px-6 py-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Pending Registrations</h2>
              <p className="text-slate-400 text-sm">{filteredUsers.length} of {pendingUsers.length} student(s) awaiting approval</p>
            </div>
            <button
              onClick={() => fetchDashboardData()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Search Bar */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-b border-slate-700 bg-slate-700/30">
              <input
                type="text"
                placeholder="Search by name, email, or enrollment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          )}

          {/* Pending Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-300 text-lg font-semibold">All Caught Up! ✅</p>
              <p className="text-slate-400 text-sm mt-1">No pending student registrations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Enrollment</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Requested</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredUsers.map(user => (
                    <tr key={user.user_id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">{user.email}</td>
                      <td className="px-6 py-4 text-slate-300 text-sm font-mono bg-slate-700/20 rounded">{user.username}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{new Date(user.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowActionModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <ActionCard
            title="Create Fees"
            description="Add new fee entries for students"
            color="from-blue-600 to-blue-400"
            onClick={() => navigate('/admin/create-fees')}
          />
          <ActionCard
            title="Upload Marks"
            description="Manage student academic marks"
            color="from-green-600 to-green-400"
            onClick={() => navigate('/admin/upload-marks')}
          />
          <ActionCard
            title="Record Attendance"
            description="Track student attendance"
            color="from-purple-600 to-purple-400"
            onClick={() => navigate('/admin/record-attendance')}
          />
        </div>
      </div>

      {/* User Action Modal */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Review Registration</h3>
            <div className="space-y-4 mb-6 pb-6 border-b border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                  {selectedUser.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Full Name</p>
                  <p className="text-white font-semibold">{selectedUser.full_name}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Email</p>
                <p className="text-white text-sm">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Enrollment Number</p>
                <p className="text-white font-mono text-sm bg-slate-700/50 px-3 py-2 rounded">{selectedUser.username}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Requested On</p>
                <p className="text-white text-sm">{new Date(selectedUser.created_at).toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectUser(selectedUser)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
              >
                Reject
              </button>
              <button
                onClick={() => handleApproveUser(selectedUser)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: number; color: string }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
        </div>
        <div className="opacity-30">{icon}</div>
      </div>
    </div>
  );
}

function ActionCard({ title, description, color, onClick }: { title: string; description: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 text-left group`}
    >
      <h3 className="text-lg font-bold mb-2 group-hover:translate-x-1 transition">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </button>
  );
}
