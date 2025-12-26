import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, apiBase } from "../auth/AuthProvider";
import {
  BarChart3,
  Users,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  LogOut,
  RefreshCw,
  File,
  DollarSign,
  BookOpen,
  Calendar
} from "lucide-react";

const theme = "#650C08";

/* ================= TYPES ================= */

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
  activeUsers: number;
}

interface SystemAlert {
  id: string;
  type: "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
}

/* ================= COMPONENT ================= */

export default function AdminDashboard() {
  const { authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  /* ================= DATA ================= */

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);

      const pendingRes = await authFetch(`${apiBase}/admin/pending-registrations`);
      const pendingData = await pendingRes.json();
      const pending = pendingData.pending_registrations || [];
      setPendingUsers(pending);

      const studentsRes = await authFetch(`${apiBase}/admin/students?page=1&limit=1`);
      const studentsData = await studentsRes.json();
      const totalStudents = studentsData.pagination?.total || 0;

      const usersRes = await authFetch(`${apiBase}/admin/users?page=1&limit=1`);
      const usersData = await usersRes.json();
      const totalUsers = usersData.pagination?.total || 0;

      setStats({
        totalStudents,
        totalUsers,
        activeUsers: totalStudents - pending.length,
      });

      if (pending.length > 0) {
        setSystemAlerts([
          {
            id: "pending",
            type: "warning",
            title: "Pending Registrations",
            message: `${pending.length} student(s) awaiting approval`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* ================= ACTIONS ================= */

  const handleApproveUser = async (user: PendingUser) => {
    await authFetch(`${apiBase}/admin/approve-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, action: "approve" }),
    });

    setPendingUsers(prev => prev.filter(u => u.user_id !== user.user_id));
    setShowActionModal(false);
  };

  const handleRejectUser = async (user: PendingUser) => {
    await authFetch(`${apiBase}/admin/approve-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, action: "reject" }),
    });

    setPendingUsers(prev => prev.filter(u => u.user_id !== user.user_id));
    setShowActionModal(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredUsers = pendingUsers.filter(u =>
    `${u.full_name} ${u.email} ${u.username}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme} 0%, #8B1A1A 50%, #1a1a1a 100%)` }}>
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${theme} 0%, #8B1A1A 50%, #1a1a1a 100%)` }}>
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-6 py-4 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm bg-white">
            <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs text-white/80">ERP Management System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white/5 text-white px-3 py-2 rounded"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      {/* CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="text-[#650C08]" />} />
          <StatCard title="Total Students" value={stats.totalStudents} icon={<GraduationCap className="text-[#650C08]" />} />
          <StatCard title="Pending Approvals" value={pendingUsers.length} icon={<AlertCircle className="text-[#650C08]" />} />
          <StatCard title="Active Students" value={stats.activeUsers} icon={<File className="text-[#650C08]" />} />
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <ActionCard
            title="Create Fees"
            description="Add or update fee entries"
            icon={<DollarSign className="w-5 h-5 text-white" />}
            onClick={() => navigate('/admin/create-fees')}
          />
          <ActionCard
            title="Upload Marks"
            description="Upload student marks quickly"
            icon={<BookOpen className="w-5 h-5 text-white" />}
            onClick={() => navigate('/admin/upload-marks')}
          />
          <ActionCard
            title="Record Attendance"
            description="Mark student attendance"
            icon={<Calendar className="w-5 h-5 text-white" />}
            onClick={() => navigate('/admin/record-attendance')}
          />
        </div>

        {/* PENDING USERS */}
        <div className="bg-white/95 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pending Registrations</h2>
              <p className="text-sm text-gray-600">{filteredUsers.length} of {pendingUsers.length} awaiting review</p>
            </div>
            <div>
              <input
                className="px-3 py-2 rounded border w-72"
                placeholder="Search by name, email or enrollment..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={48} />
              <p className="text-gray-900 font-semibold">All Caught Up!</p>
              <p className="text-gray-600">No pending student registrations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-600 border-b">
                    <th className="py-3">Name</th>
                    <th className="py-3">Email</th>
                    <th className="py-3">Enrollment</th>
                    <th className="py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.user_id} className="border-b">
                      <td className="py-3 text-gray-900">{user.full_name}</td>
                      <td className="py-3 text-gray-700">{user.email}</td>
                      <td className="py-3 text-gray-700 font-mono">{user.username}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => { setSelectedUser(user); setShowActionModal(true); }}
                          className="bg-[#650C08] text-white px-3 py-1 rounded"
                        >Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#650C08] flex items-center justify-center text-white text-lg font-bold">{selectedUser.full_name.charAt(0).toUpperCase()}</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{selectedUser.full_name}</h3>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-xs text-gray-500 mt-1">Requested: {new Date(selectedUser.created_at).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="flex-1 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg border"
              >Cancel</button>
              <button
                onClick={() => handleRejectUser(selectedUser)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg"
              >Reject</button>
              <button
                onClick={() => handleApproveUser(selectedUser)}
                className="flex-1 bg-[#650C08] text-white px-4 py-2 rounded-lg"
              >Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/95 p-4 rounded-xl flex justify-between items-center shadow-lg">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  );
}

function ActionCard({ title, description, icon, onClick }: { title: string; description: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-xl p-5 bg-white/95 shadow hover:shadow-xl transition transform hover:-translate-y-1 text-left">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#650C08] to-[#8B1A1A] flex items-center justify-center text-white">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}
