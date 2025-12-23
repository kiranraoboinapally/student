import React, { useState, useEffect } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

interface PendingUser {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
}

export default function AdminDashboard(): JSX.Element {
  const { authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadPendingRegistrations();
  }, []);

  async function loadPendingRegistrations() {
    setLoading(true);
    try {
      const res = await authFetch(`${apiBase}/admin/pending-registrations`);
      if (!res.ok) {
        console.error("Failed to load pending registrations");
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      setPendingUsers(data.pending_registrations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(userId: number, action: "approve" | "reject") {
    setActionLoading(userId);
    try {
      const res = await authFetch(`${apiBase}/admin/approve-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action }),
      });

      if (!res.ok) {
        alert("Failed to " + action + " registration");
        setActionLoading(null);
        return;
      }

      alert("Registration " + action + "d successfully!");
      await loadPendingRegistrations();
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  function handleSignOut() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#650C08] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-rose-100 mt-1">ABCD University ERP</p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-white text-[#650C08] px-6 py-2 rounded-lg font-semibold hover:bg-rose-100 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* --- NEW FUNCTIONALITY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <DashboardCard 
            title="Create Fees" 
            description="Set up new Registration or Exam Fee Dues for students."
            onClick={() => navigate("/admin/create-fees")}
          />
          <DashboardCard 
            title="Record Attendance" 
            description="Mark students as present or absent for a specific class/date."
            onClick={() => navigate("/admin/record-attendance")}
          />
          <DashboardCard 
            title="Upload Marks" 
            description="Enter subject marks and grades for students."
            onClick={() => navigate("/admin/upload-marks")}
          />
        </div>

        {/* --- Pending Registrations Section --- */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Pending Student Registrations</h2>
            <button
              onClick={loadPendingRegistrations}
              disabled={loading}
              className="bg-[#650C08] text-white px-4 py-2 rounded-lg hover:bg-[#7a1d16] transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading && pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-600">Loading...</div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-600 bg-gray-50 rounded-lg">
              <p className="text-lg">No pending registrations</p>
              <p className="text-sm mt-2">All registrations have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Enrollment No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Full Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Requested On</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user, idx) => (
                    <tr
                      key={user.user_id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {user.full_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => handleAction(user.user_id, "approve")}
                            disabled={actionLoading === user.user_id}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-semibold"
                          >
                            {actionLoading === user.user_id ? "..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleAction(user.user_id, "reject")}
                            disabled={actionLoading === user.user_id}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-sm font-semibold"
                          >
                            {actionLoading === user.user_id ? "..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Admin Instructions</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>1. Review pending student registrations above</p>
            <p>2. Verify enrollment numbers against master student records</p>
            <p>3. Approve legitimate registrations to grant portal access</p>
            <p>4. Reject suspicious or invalid registrations</p>
            <p className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-600 text-blue-900">
              <strong>Note:</strong> Students can only login after admin approval. They will see "account pending admin approval" message until approved.
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 text-center text-sm text-gray-600">
        <p>ERP System • Powered by SlashCurate Technologies Pvt Ltd</p>
        <p className="mt-1">© 2025 ABCD University</p>
      </footer>
    </div>
  );
}

// Utility component for admin functionality cards
function DashboardCard({ title, description, onClick }: { title: string, description: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#650C08] text-white p-6 rounded-xl shadow-lg cursor-pointer transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl"
    >
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
}
