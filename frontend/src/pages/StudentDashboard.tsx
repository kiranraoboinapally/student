import React, { useEffect, useState } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

/**
 * StudentDashboard.tsx
 * - Tailwind + TypeScript
 * - Theme color: #650C08
 * - Requires AuthProvider (authFetch, logout) and apiBase
 *
 * Place in: src/pages/StudentDashboard.tsx
 */

type ProfileShape = {
  user?: any;
  master_student?: any;
  act_student?: {
    CandidateName?: string;
    EnrollmentNumber?: string;
    CourseName?: string;
    StreamName?: string;
    YearSem?: string;
    center_name?: string;
    candidate_address?: string;
    mother_name?: string;
    father_name?: string;
    ContactNumber?: string;
    EmailID?: string;
  };
};

type FeeItem = {
  fee_due_id?: number;
  fee_type?: string;
  fee_head?: string;
  due_date?: string;
  original_amount?: number;
  amount_paid?: number;
  status?: string;
  balance?: number;
  transaction_number?: string; // For history display
};

type AttendanceItem = {
  subject_name?: string;
  total_classes?: number;
  attended_classes?: number;
};

type SubjectItem = {
  subject_id?: number;
  subject_code?: string;
  subject_name?: string;
  subject_type?: string;
  credits?: number;
  semester?: number;
};

type MarkItem = {
  mark_id?: number;
  subject_code?: string;
  subject_name?: string;
  total_marks?: number;
  percentage?: number;
  grade?: string;
  status?: string;
};

export default function StudentDashboard(): JSX.Element {
  const { authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileShape | null>(null);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [marks, setMarks] = useState<MarkItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingFees, setLoadingFees] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingMarks, setLoadingMarks] = useState(true);
  const [active, setActive] = useState<"profile" | "fees" | "subjects" | "marks" | "attendance">("profile");

  // Payment modal state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const theme = "#650C08";

  useEffect(() => {
    loadProfile();
    loadFees();
    loadAttendance();
    loadSubjects();
    loadMarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------- API LOADERS -------------------------
  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const res = await authFetch(`${apiBase}/profile/me`);
      if (!res.ok) {
        logout();
        navigate("/login");
        return;
      }
      const data = await res.json();
      setProfile(data);
    } finally {
      setLoadingProfile(false);
    }
  }

  // UPDATED loadFees – combines dues and history from the new API structure
  async function loadFees() {
    setLoadingFees(true);
    try {
      const res = await authFetch(`${apiBase}/student/fees/summary`);
      if (!res.ok) {
        setFees([]);
        return;
      }
      const data = await res.json();

      let list: FeeItem[] = [];

      // 1. Add DUE items first (so they appear at the top)
      if (data && Array.isArray(data.dues)) {
        list.push(...data.dues.map(mapApiFeeToFeeItem));
      }

      // 2. Add PAID HISTORY items
      if (data && Array.isArray(data.history)) {
        list.push(...data.history.map(mapApiFeeToFeeItem));
      }
      
      setFees(list);
    } finally {
      setLoadingFees(false);
    }
  }

  async function loadAttendance() {
    setLoadingAttendance(true);
    try {
      const res = await authFetch(`${apiBase}/student/attendance`);
      if (!res.ok) {
        setAttendance([]);
        return;
      }
      const data = await res.json();
      setAttendance(data.attendance || []);
    } finally {
      setLoadingAttendance(false);
    }
  }

  async function loadSubjects() {
    setLoadingSubjects(true);
    try {
      const res = await authFetch(`${apiBase}/student/subjects/current`);
      if (!res.ok) {
        setSubjects([]);
        return;
      }
      const data = await res.json();
      setSubjects(Array.isArray(data) ? data : []);
    } finally {
      setLoadingSubjects(false);
    }
  }

  async function loadMarks() {
    setLoadingMarks(true);
    try {
      const res = await authFetch(`${apiBase}/student/marks/current`);
      if (!res.ok) {
        setMarks([]);
        return;
      }
      const data = await res.json();

      const mapped: MarkItem[] = Array.isArray(data)
        ? data.map((m: any) => ({
            mark_id: m.MarkID,
            subject_code: m.SubjectCode,
            subject_name: m.SubjectName,
            total_marks: m.TotalMarks,
            percentage: m.Percentage,
            grade: m.Grade,
            status: m.Status?.toLowerCase(),
          }))
        : [];

      setMarks(mapped);
    } finally {
      setLoadingMarks(false);
    }
  }

  // ------------------------- HELPERS -------------------------
  // UPDATED mapApiFeeToFeeItem – simplified to handle both dues and history
  function mapApiFeeToFeeItem(apiFee: any): FeeItem {
    const originalAmount = apiFee.original_amount ?? 0;
    const amountPaid = apiFee.amount_paid ?? 0;
    
    // Case 1: Paid History Record (has a transaction number/no balance)
    if (apiFee.transaction_number || apiFee.TransactionNo) {
      return {
        fee_due_id: apiFee.id, 
        fee_type: apiFee.fee_type || apiFee.Type || 'N/A', 
        fee_head: apiFee.fee_head || apiFee.Head,
        due_date: apiFee.transaction_date, // Using transaction_date for history
        original_amount: originalAmount,
        amount_paid: amountPaid,
        balance: 0, // For history records, balance is 0
        status: apiFee.payment_status || "Paid", 
        transaction_number: apiFee.transaction_number || apiFee.TransactionNo,
      };
    }

    // Case 2: Pending/Partial Due Record (from the 'dues' array)
    return {
      fee_due_id: apiFee.fee_due_id,
      fee_type: apiFee.fee_type ?? 'Total Fee',
      fee_head: apiFee.fee_head ?? 'Total Due',
      due_date: apiFee.due_date,
      original_amount: originalAmount,
      amount_paid: amountPaid,
      balance: Math.max(0, originalAmount - amountPaid),
      status: apiFee.status?.toLowerCase() ?? 'pending',
      transaction_number: undefined,
    };
  }
  // ------------------------- END OF HELPERS -------------------------

  function openPayModal(fee: FeeItem) {
    setSelectedFee(fee);
    setPayAmount(fee.balance ?? Math.max((fee.original_amount ?? 0) - (fee.amount_paid ?? 0), 0));
    setPayError(null);
    setPayModalOpen(true);
  }

  async function submitPayment() {
    if (!selectedFee) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setPayError("Enter a valid amount");
      return;
    }
    setPayLoading(true);
    setPayError(null);

    try {
      const payload = {
        fee_due_id: selectedFee.fee_due_id,
        amount,
        payment_method: "online",
        payment_note: "Paid via portal",
      };
      const res = await authFetch(`${apiBase}/student/fees/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayError(json.error || json.message || "Payment failed");
        setPayLoading(false);
        return;
      }
      setPayModalOpen(false);
      setSelectedFee(null);
      setPayAmount("");
      await loadFees();
    } finally {
      setPayLoading(false);
    }
  }

  function handleSignOut() {
    logout();
    navigate("/login");
  }

  if (loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  const user = profile?.user ?? {};
  const master = profile?.master_student ?? {};
  const act = profile?.act_student ?? {};

  const tabs: { key: "profile" | "fees" | "subjects" | "marks" | "attendance"; label: string }[] = [
    { key: "profile", label: "Personal Details" },
    { key: "fees", label: "Fee Details" },
    { key: "subjects", label: "Subjects" },
    { key: "marks", label: "Marks" },
    { key: "attendance", label: "Attendance" },
  ];

  // ------------------------- RENDER -------------------------
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="flex-shrink-0 w-64 p-2 text-white" style={{ background: theme }}>
        <div className="flex items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow">
            <img src="/Logo.png" alt="logo" className="w-12 h-12 object-contain" />
          </div>
          <div className="ml-3">
            <div className="text-sm opacity-90">Welcome</div>
            <div className="font-semibold">
              {act.CandidateName || user.full_name || master.student_name || master.StudentName || "Student"}
            </div>
          </div>
        </div>

        <div className="text-sm mb-6 leading-relaxed">
          <div className="opacity-90">Enrollment</div>
          <div className="font-semibold mb-2">
            {act.EnrollmentNumber || user.username || master.enrollment_number || master.EnrollmentNumber || "-"}
          </div>
          <div className="opacity-90">Program</div>
          <div className="font-semibold">{act.CourseName || master.course_name || master.CourseName || "-"}</div>
          <div className="opacity-90 mt-3">Semester</div>
          <div className="font-semibold">{act.YearSem ?? "-"}</div>
        </div>

        <nav className="flex flex-col gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`text-left px-3 py-2 rounded-md font-semibold ${
                active === tab.key ? "bg-white text-[#650C08]" : "bg-[rgba(255,255,255,0.06)]"
              }`}
              style={active === tab.key ? { color: theme } : undefined}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={handleSignOut}
            className="mt-40 text-left px-3 py-2 rounded-md font-semibold bg-red-600 hover:bg-red-700"
          >
            Sign Out
          </button>
        </nav>

        <div className="mt-0.5 text-xs opacity-80 pt-3">
          <div>User: {user.full_name || act.CandidateName || "-"}</div>
          <div className="mt-0.5">ERP by SlashCurate Technologies</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-2">
        {/* PROFILE */}
        {active === "profile" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>
              Student Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <Field label="Student Name" value={act.CandidateName || master.student_name || master.StudentName || user.full_name} />
              <Field label="Enrollment Number" value={act.EnrollmentNumber || master.enrollment_number || master.EnrollmentNumber || user.username} />
              <Field label="Course" value={act.CourseName || master.course_name || master.CourseName} />
              <Field label="Branch / Stream" value={act.StreamName} />
              <Field
                label="Academic Year / Batch / Semester"
                value={`${master.session ?? master.Session ?? "-"} / ${master.batch ?? master.Batch ?? "-"} / ${act.YearSem ?? "-"}`}
              />
              <Field label="Institution" value={master.institute_name || master.InstituteName || act.center_name} />
              <Field label="DOB / Gender" value={`${(act as any).DOB ?? "-"} / ${(master as any).gender ?? "-"}`} />
              <Field label="Aadhar Number" value={(act as any).Aadhar_Number || (act as any).AadharNumber || "-"} />
              <Field label="Father / Mother" value={`${master.father_name || master.FatherName || act.father_name || "-"} / ${act.mother_name || "-"}`} />
              <Field
                label="Student Contact / Email"
                value={`${act.ContactNumber || master.student_phone_number || master.StudentPhoneNumber || user.Mobile || "-"} / ${act.EmailID || master.student_email_id || master.StudentEmailID || user.email || "-"}`}
              />
              <Field
                label="Admitted Date"
                value={(master as any).created_at || (master as any).CreatedAt ? new Date((master as any).created_at || (master as any).CreatedAt).toLocaleDateString() : "-"}
              />
              <Field label="Parent Contact" value={(master as any).parent_contact || "-"} />
              <Field label="Community / Nationality" value={`${(act as any).Community || "-"} / ${(act as any).Nationality || "-"}`} />
              <Field label="Residential Address" value={(act as any).candidate_address || "-"} />
              <Field label="District / State" value={`${(act as any).District || "-"} / ${(act as any).State || "-"}`} />
            </div>
          </div>
        )}

        {/* FEE DETAILS */}
        {active === "fees" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>
              Fee Details
            </h2>

            {loadingFees ? (
              <div className="text-center py-8 text-gray-500">Loading fee details...</div>
            ) : (
              <>
                {/* Pending Dues Section */}
                <h3 className="text-xl font-semibold mb-4" style={{ color: theme }}>
                  Pending Dues
                </h3>
                {fees.filter(f => (f.balance ?? 0) > 0).length === 0 ? (
                  <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg">
                    <div className="text-lg mb-2">No pending dues</div>
                    <div className="text-sm">All your fees are up to date.</div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-8">
                    {fees
                      .filter(f => (f.balance ?? 0) > 0)
                      .sort((a, b) => new Date(a.due_date || "").getTime() - new Date(b.due_date || "").getTime())
                      .map((f) => (
                        <div key={String(f.fee_due_id ?? Math.random())} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-semibold text-lg" style={{ color: theme }}>
                              {f.fee_head ?? f.fee_type}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Fee Type: {f.fee_type ?? "-"}</div>
                            <div className="text-sm text-gray-600 mt-1">Due Date: {fmtDate(f.due_date)}</div>
                          </div>

                          <div className="w-48 text-right">
                            <div className="text-sm text-gray-500">Due Amount</div>
                            <div className="font-bold text-xl text-red-600">
                              ₹ {fmtMoney(f.balance ?? ((f.original_amount ?? 0) - (f.amount_paid ?? 0)))}
                            </div>
                            <div className="mt-3">
                              <button onClick={() => openPayModal(f)} className="bg-[#650C08] text-white px-4 py-2 rounded-md hover:bg-[#4e0806]">
                                Pay Now
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Payment History Section */}
                <h3 className="text-xl font-semibold mb-4 mt-8" style={{ color: theme }}>
                  Payment History
                </h3>
                {fees.filter(f => (f.balance ?? 0) === 0).length === 0 ? (
                  <div className="text-center py-8 text-gray-600 bg-gray-50 rounded-lg">
                    <div className="text-lg mb-2">No payment records</div>
                    <div className="text-sm">Your payment history will appear here once payments are made.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fee Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount Paid
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction ID / Mode
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {fees
                          .filter(f => (f.balance ?? 0) === 0)
                          .sort((a, b) => new Date(b.due_date || "").getTime() - new Date(a.due_date || "").getTime())
                          .map((f) => (
                            <tr key={f.fee_due_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {fmtDate(f.due_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: theme }}>
                                {f.fee_head || f.fee_type || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₹ {fmtMoney(f.amount_paid || f.original_amount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs break-all">
                                {f.transaction_number || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {(f.status || "").toLowerCase().includes("success") || (f.status || "").toLowerCase() === "paid"
                                    ? "Paid"
                                    : f.status || "Paid"}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-6 p-4 bg-[#fff7f5] border rounded text-sm text-gray-700">
                  <strong>NOTE:</strong>
                  <ol className="list-decimal ml-5 mt-2">
                    <li>You must clear earlier dues before paying certain fees.</li>
                    <li>Ensure your details are correct before payment.</li>
                    <li>After payment, allow a few minutes for confirmation.</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        )}

        {/* SUBJECTS */}
        {active === "subjects" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>
              Current Semester Subjects
            </h2>

            {loadingSubjects ? (
              <div>Loading subjects...</div>
            ) : subjects.length === 0 ? (
              <div className="text-center text-gray-600 py-14">No subjects found for current semester</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-2">Code</th>
                      <th className="border px-4 py-2">Subject Name</th>
                      <th className="border px-4 py-2">Type</th>
                      <th className="border px-4 py-2">Credits</th>
                      <th className="border px-4 py-2">Semester</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub) => (
                      <tr key={sub.subject_id}>
                        <td className="border px-4 py-2">{sub.subject_code}</td>
                        <td className="border px-4 py-2">{sub.subject_name}</td>
                        <td className="border px-4 py-2">{sub.subject_type}</td>
                        <td className="border px-4 py-2">{sub.credits}</td>
                        <td className="border px-4 py-2">{sub.semester}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MARKS */}
        {active === "marks" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>
              Marks
            </h2>

            {loadingMarks ? (
              <div>Loading marks...</div>
            ) : marks.length === 0 ? (
              <div className="text-center text-gray-600 py-14">No marks found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-2">Subject Code</th>
                      <th className="border px-4 py-2">Subject Name</th>
                      <th className="border px-4 py-2">Total Marks</th>
                      <th className="border px-4 py-2">Percentage</th>
                      <th className="border px-4 py-2">Grade</th>
                      <th className="border px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m) => (
                      <tr key={m.mark_id}>
                        <td className="border px-4 py-2">{m.subject_code}</td>
                        <td className="border px-4 py-2">{m.subject_name}</td>
                        <td className="border px-4 py-2">{m.total_marks}</td>
                        <td className="border px-4 py-2">{m.percentage}</td>
                        <td className="border px-4 py-2">{m.grade}</td>
                        <td className="border px-4 py-2">{m.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE */}
        {active === "attendance" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>
              Attendance
            </h2>

            {loadingAttendance ? (
              <div>Loading attendance...</div>
            ) : attendance.length === 0 ? (
              <div className="text-center text-gray-600 py-14">No attendance records found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-2">Subject Name</th>
                      <th className="border px-4 py-2">Total Classes</th>
                      <th className="border px-4 py-2">Attended Classes</th>
                      <th className="border px-4 py-2">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, idx) => (
                      <tr key={idx}>
                        <td className="border px-4 py-2">{a.subject_name}</td>
                        <td className="border px-4 py-2">{a.total_classes}</td>
                        <td className="border px-4 py-2">{a.attended_classes}</td>
                        <td className="border px-4 py-2">
                          {a.total_classes && a.attended_classes
                            ? ((a.attended_classes / a.total_classes) * 100).toFixed(2) + "%"
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* PAYMENT MODAL */}
      {payModalOpen && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96 relative">
            <h3 className="text-lg font-bold mb-4" style={{ color: theme }}>
              Pay Fee: {selectedFee.fee_head}
            </h3>
            <div className="mb-4">
              <label className="block mb-1">Amount</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            {payError && <div className="text-red-600 mb-2">{payError}</div>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPayModalOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                className="px-4 py-2 bg-[#650C08] text-white rounded hover:bg-[#4e0806]"
                disabled={payLoading}
              >
                {payLoading ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------- UTILITY COMPONENTS -------------------------
function Field({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex flex-col">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="font-semibold">{value ?? "-"}</div>
    </div>
  );
}

function fmtMoney(num?: number) {
  if (num === undefined || num === null) return "0.00";
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(date?: string | null) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN");
}