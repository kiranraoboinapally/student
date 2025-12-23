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

    if (data) {
      // If API returns array directly
      if (Array.isArray(data)) {
        list = data.map(mapApiFeeToFeeItem);
      }
      // If API returns object with fees or registration_fees array
      else if (Array.isArray(data.fees)) {
        list = data.fees.map(mapApiFeeToFeeItem);
      } else if (Array.isArray(data.registration_fees)) {
        list = data.registration_fees.map(mapApiFeeToFeeItem);
      }
      // If API returns a single object (wrap it in array)
      else if (typeof data === "object") {
        list = [mapApiFeeToFeeItem(data)];
      }
    }

    setFees(list);
  } finally {
    setLoadingFees(false);
  }
}

// Helper to map API fields to your FeeItem structure
function mapApiFeeToFeeItem(apiFee: any): FeeItem {
  const examFee = apiFee.ExpectedExamFee ?? 0;
  const regFee = apiFee.ExpectedRegFee ?? 0;
  const examPaid = apiFee.ExamFeePaid ?? 0;
  const regPaid = apiFee.RegistrationFeePaid ?? 0;

  return {
    fee_due_id: apiFee.ExpectedFeeID,
    fee_type: "Exam & Registration",
    fee_head: "Total Fee",
    original_amount: examFee + regFee,
    amount_paid: examPaid + regPaid,
    balance: examFee + regFee - (examPaid + regPaid),
    status: (apiFee.OverallStatus ?? "Pending").toLowerCase(),
    due_date: apiFee.DueDate ?? undefined,
  };
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

      // Map API fields (PascalCase) to frontend fields
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
    { key: "fees", label: "Fee Due Details" },
    { key: "subjects", label: "Subjects" },
    { key: "marks", label: "Marks" },
    { key: "attendance", label: "Attendance" },
  ];

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
                active === tab.key ? "bg-white text-[650C08]" : "bg-[rgba(255,255,255,0.06)]"
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

        {/* FEES */}
        {active === "fees" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: theme }}>
                Fee Due Details
              </h2>
              <div className="flex items-center gap-3">
                <div className="text-sm">Payment Type:</div>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="paytype" defaultChecked className="form-radio" />
                    Full Payment
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="paytype" className="form-radio" />
                    Partial Payment
                  </label>
                </div>
              </div>
            </div>

            {loadingFees ? (
              <div>Loading fees...</div>
            ) : fees.length === 0 ? (
              <div className="text-center text-gray-600 py-14">No fee dues found</div>
            ) : (
              <div className="space-y-4">
                {fees.map((f) => (
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
                      <div className="font-bold text-xl">
                        ₹ {fmtMoney(f.balance ?? ((f.original_amount ?? 0) - (f.amount_paid ?? 0)))}
                      </div>
                      {(f.status ?? "").toLowerCase() !== "paid" && (
                        <div className="mt-3">
                          <button onClick={() => openPayModal(f)} className="bg-[#650C08] text-white px-4 py-2 rounded-md">
                            Pay
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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
                      <th className="border px-4 py-3 text-left font-semibold">Subject Code</th>
                      <th className="border px-4 py-3 text-left font-semibold">Subject Name</th>
                      <th className="border px-4 py-3 text-left font-semibold">Type</th>
                      <th className="border px-4 py-3 text-left font-semibold">Credits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((sub, idx) => (
                      <tr key={sub.subject_id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border px-4 py-3">{sub.subject_code || "-"}</td>
                        <td className="border px-4 py-3 font-medium">{sub.subject_name || "-"}</td>
                        <td className="border px-4 py-3">{sub.subject_type || "-"}</td>
                        <td className="border px-4 py-3 text-center">{sub.credits ?? "-"}</td>
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
              <div className="text-center text-gray-600 py-14">No marks found for current semester</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-3 text-left font-semibold">Subject Code</th>
                      <th className="border px-4 py-3 text-left font-semibold">Subject Name</th>
                      <th className="border px-4 py-3 text-left font-semibold">Total Marks</th>
                      <th className="border px-4 py-3 text-left font-semibold">Percentage</th>
                      <th className="border px-4 py-3 text-left font-semibold">Grade</th>
                      <th className="border px-4 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m, idx) => (
                      <tr key={m.mark_id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border px-4 py-3">{m.subject_code || "-"}</td>
                        <td className="border px-4 py-3 font-medium">{m.subject_name || "-"}</td>
                        <td className="border px-4 py-3 text-center">{m.total_marks ?? "-"}</td>
                        <td className="border px-4 py-3 text-center">{m.percentage ?? "-"}</td>
                        <td className="border px-4 py-3 text-center">{m.grade || "-"}</td>
                        <td
                          className={`border px-4 py-3 text-center font-semibold ${
                            m.status === "pass" ? "text-green-600" : m.status === "fail" ? "text-red-600" : "text-gray-600"
                          }`}
                        >
                          {m.status?.toUpperCase() ?? "-"}
                        </td>
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
                      <th className="border px-4 py-3 text-left font-semibold">Subject Name</th>
                      <th className="border px-4 py-3 text-left font-semibold">Total Classes</th>
                      <th className="border px-4 py-3 text-left font-semibold">Attended</th>
                      <th className="border px-4 py-3 text-left font-semibold">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border px-4 py-3 font-medium">{a.subject_name ?? "-"}</td>
                        <td className="border px-4 py-3 text-center">{a.total_classes ?? "-"}</td>
                        <td className="border px-4 py-3 text-center">{a.attended_classes ?? "-"}</td>
                        <td className="border px-4 py-3 text-center">
                          {a.total_classes && a.attended_classes
                            ? Math.round((a.attended_classes / a.total_classes) * 100)
                            : "-"}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {payModalOpen && selectedFee && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg w-96 p-6">
              <h2 className="text-lg font-bold mb-4">Pay Fee: {selectedFee.fee_head ?? selectedFee.fee_type}</h2>
              <div className="mb-4">
                <label className="block mb-1 font-semibold">Amount</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full border px-3 py-2 rounded"
                  min={0}
                  max={selectedFee.balance ?? 0}
                />
              </div>
              {payError && <div className="text-red-600 mb-3">{payError}</div>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setPayModalOpen(false)} className="px-4 py-2 rounded border">
                  Cancel
                </button>
                <button
                  onClick={submitPayment}
                  disabled={payLoading}
                  className="px-4 py-2 rounded bg-[#650C08] text-white"
                >
                  {payLoading ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper components
function Field({ label, value }: { label: string; value?: any }) {
  return (
    <div>
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="font-medium">{value ?? "-"}</div>
    </div>
  );
}

function fmtMoney(val: number) {
  return val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(val?: string) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}
