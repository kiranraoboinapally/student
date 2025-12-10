import React, { useEffect, useState } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

/**
 * StudentDashboard.tsx
 * - Tailwind + TypeScript
 * - Theme color: #650C08 (same as login)
 * - Requires AuthProvider (authFetch, logout) and apiBase
 *
 * Place in: src/pages/StudentDashboard.tsx
 */

type ProfileShape = {
  user?: any;
  master_student?: any;
  act_student?: any;
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

export default function StudentDashboard(): JSX.Element {
  const { authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileShape | null>(null);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingFees, setLoadingFees] = useState(true);
  const [active, setActive] = useState<"profile" | "fees">("profile");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const res = await authFetch(`${apiBase}/profile/me`);
      if (!res.ok) {
        // unauthorized or error -> logout
        logout();
        navigate("/login");
        return;
      }
      const data = await res.json();
      setProfile(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadFees() {
    setLoadingFees(true);
    try {
      const res = await authFetch(`${apiBase}/students/fees`);
      if (!res.ok) {
        setFees([]);
        return;
      }
      const data = await res.json();
      // backend may return { fees: [...] } or custom key — accomodate common shapes
      const list: FeeItem[] = data.fees || data.registration_fees || data || [];
      setFees(list);
    } catch (e) {
      console.error(e);
      setFees([]);
    } finally {
      setLoadingFees(false);
    }
  }

  function openPayModal(fee: FeeItem) {
    setSelectedFee(fee);
    // default pay full balance
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
      const res = await authFetch(`${apiBase}/students/fees/pay`, {
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
      // success
      setPayModalOpen(false);
      setSelectedFee(null);
      setPayAmount("");
      // refresh fees
      await loadFees();
    } catch (err) {
      setPayError("Network error");
    } finally {
      setPayLoading(false);
    }
  }

  function handleSignOut() {
    logout();
    navigate("/login");
  }

  // small helper to format money & dates
  const fmtMoney = (v?: number) =>
    typeof v === "number" ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-";

  const fmtDate = (d?: string) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString();
  };

  if (loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  const user = profile?.user ?? {};
  const master = profile?.master_student ?? {};
  const act = profile?.act_student ?? {};

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 w-64 p-2 text-white"
        style={{ background: theme }}
      >
        {/* Logo top */}
        <div className="flex items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow">
            <img src="/Logo.png" alt="logo" className="w-12 h-12 object-contain" />
          </div>
          <div className="ml-3">
            <div className="text-sm opacity-90">Welcome</div>
            <div className="font-semibold">{user.full_name || master.student_name || act.Candidate_Name || "Student"}</div>
          </div>
        </div>

        {/* Student info */}
        <div className="text-sm mb-6 leading-relaxed">
          <div className="opacity-90">Enrollment</div>
          <div className="font-semibold mb-2">{user.username || master.enrollment_number || act.Enrollment_Number || "-"}</div>

          <div className="opacity-90">Program</div>
          <div className="font-semibold">{(master.course_name || act.Course_Name) ?? "-"}</div>

          <div className="opacity-90 mt-3">Semester</div>
          <div className="font-semibold">{act.Year_Sem ?? "-"}</div>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-1.5">
          <button
            onClick={() => setActive("profile")}
            className={`text-left px-3 py-2 rounded-md font-semibold ${active === "profile" ? "bg-white text-[650C08]" : "bg-[rgba(255,255,255,0.06)]"}`}
            style={active === "profile" ? { color: theme } : undefined}
          >
            Personal Details
          </button>

          <button
            onClick={() => setActive("fees")}
            className={`text-left px-3 py-2 rounded-md font-semibold ${active === "fees" ? "bg-white text-[650C08]" : "bg-[rgba(255,255,255,0.06)]"}`}
            style={active === "fees" ? { color: theme } : undefined}
          >
            Fee Due Details
          </button>

          <button
            onClick={handleSignOut}
            className="mt-56 text-left px-3 py-2 rounded-md font-semibold bg-red-600 hover:bg-red-700"
          >
            Sign Out
          </button>
        </nav>

        {/* Footer small */}
        <div className="mt-0.5 text-xs opacity-80 pt-3">
          <div>User: {user.full_name || "-"}</div>
          <div className="mt-0.5">eVarsity ERP</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-2">
        {active === "profile" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold" style={{ color: theme }}>Student Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <Field label="Student Name" value={master.student_name || act.Candidate_Name || user.full_name} />
              <Field label="Enrollment Number" value={master.enrollment_number || act.Enrollment_Number || user.username} />
              <Field label="Course" value={master.course_name || act.Course_Name} />
              <Field label="Branch / Stream" value={act.Stream_Name} />
              <Field label="Academic Year / Batch / Semester" value={`${master.session ?? "-"} / ${master.batch ?? "-"} / ${act.Year_Sem ?? "-"}`} />
              <Field label="Institution" value={master.institute_name || act.center_name} />
              <Field label="DOB / Gender" value={`${(act as any).DOB ?? "-"} / ${ (master as any).gender ?? "-" }`} />
              <Field label="Aadhar Number" value={(act as any).Aadhar_Number || "-" } />
              <Field label="Father / Mother" value={`${master.father_name || act.father_name || "-"} / ${act.mother_name || "-"}`} />
              <Field label="Student Contact / Email" value={`${master.student_phone_number || "-" } / ${master.student_email_id || user.email || "-"}`} />
              <Field label="Admitted Date" value={(master as any).created_at ? new Date(master.created_at).toLocaleDateString() : "-"} />
              <Field label="Parent Contact" value={(master as any).parent_contact || "-"} />
              <Field label="Community / Nationality" value={`${(act as any).Community || "-"} / ${(act as any).Nationality || "-"}`} />
              <Field label="Residential Address" value={(act as any).address || (act as any).Residential_Address || "-"} />
              <Field label="District / State" value={`${(act as any).District || "-"} / ${(act as any).State || "-"}`} />
            </div>
          </div>
        )}

        {active === "fees" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: theme }}>Fee Due Details</h2>
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
                  <div key={String(f.fee_due_id ?? f.fee_due_id ?? Math.random())} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold text-lg" style={{ color: theme }}>{f.fee_head ?? f.fee_head ?? f.fee_type}</div>
                      <div className="text-sm text-gray-600 mt-1">Fee Type: {f.fee_type ?? "-"}</div>
                      <div className="text-sm text-gray-600 mt-1">Due Date: {fmtDate(f.due_date)}</div>
                    </div>

                    <div className="w-48 text-right">
                      <div className="text-sm text-gray-500">Due Amount</div>
                      <div className="font-bold text-xl">₹ {fmtMoney(f.balance ?? ((f.original_amount ?? 0) - (f.amount_paid ?? 0)))}</div>

                      { (f.status ?? "").toLowerCase() !== "paid" && (
                        <div className="mt-3">
                          <button
                            onClick={() => openPayModal(f)}
                            className="bg-[#650C08] text-white px-4 py-2 rounded-md"
                          >
                            Pay
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes area (like in screenshot) */}
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
      </main>

      {/* Payment Modal */}
      {payModalOpen && selectedFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Pay Fee</h3>

            <div className="mb-3">
              <div className="text-sm text-gray-600">Fee</div>
              <div className="font-semibold text-lg">{selectedFee.fee_head ?? selectedFee.fee_type}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm text-gray-600">Due Amount</div>
                <div className="font-semibold">₹ {fmtMoney(selectedFee.balance ?? ((selectedFee.original_amount ?? 0) - (selectedFee.amount_paid ?? 0)))}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Amount to Pay</div>
                <input
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {payError && <div className="text-sm text-red-600 mb-2">{payError}</div>}

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setPayModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button
                onClick={submitPayment}
                className="px-4 py-2 rounded bg-[#650C08] text-white"
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

/* small presentational components */
function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-medium">{value ?? "-"}</div>
    </div>
  );
}

/* helpers */
function fmtMoney(n?: number) {
  if (n == null) return "-";
  return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
function fmtDate(d?: string) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
}
