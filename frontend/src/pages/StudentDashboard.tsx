import { useEffect, useState, useCallback } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";

/**
 * StudentDashboard.tsx
 * - Fully updated with Razorpay Integration + Custom Amount Input
 * - Tailwind + TypeScript
 * - Theme color: #650C08
 */

declare global {
  interface Window {
    Razorpay: new (options: any) => RazorpayInstance;
  }
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: any) => void) => void;
}

interface RazorpayOptions {
  key: string;
  amount: number; // In paise
  currency: 'INR';
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes: {
    enrollment_number: string;
    fee_due_id: number;
    [key: string]: any;
  };
  theme: {
    color: string;
  };
}

type ProfileShape = {
  user?: {
    full_name?: string;
    username?: string;
    email?: string;
    Mobile?: string;
  };
  master_student?: {
    enrollment_number?: string;
    student_name?: string;
    StudentName?: string;
    course_name?: string;
    CourseName?: string;
    session?: string;
    batch?: string;
  };
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
  fee_due_id: number;
  fee_type: string;
  fee_head: string;
  due_date: string;
  original_amount: number;
  amount_paid: number;
  status: string;
  balance: number;
  transaction_number?: string;
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

function getEnrollmentNumber(profile: ProfileShape | null): string {
  if (!profile) return "";
  const masterEnr = profile.master_student?.enrollment_number;
  const actEnr = profile.act_student?.EnrollmentNumber;
  const userEnr = profile.user?.username;
  return (masterEnr || actEnr || userEnr || "").toString();
}

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
  // New states for custom amount modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeItem | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);

  const theme = "#650C08";

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    loadProfile();
    loadFees();
    loadAttendance();
    loadSubjects();
    loadMarks();
  }, []);

  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const res = await authFetch(`${apiBase}/student/profile`);
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

  const loadFees = useCallback(async () => {
    setLoadingFees(true);
    try {
      const res = await authFetch(`${apiBase}/student/fees/summary`);
      if (!res.ok) {
        setFees([]);
        return;
      }
      const data = await res.json();

      let list: FeeItem[] = [];

      if (data && Array.isArray(data.dues)) {
        list.push(...data.dues.map(mapApiFeeToFeeItem));
      }

      if (data && Array.isArray(data.history)) {
        list.push(...data.history.map(mapApiFeeToFeeItem));
      }

      setFees(list);
    } finally {
      setLoadingFees(false);
    }
  }, [authFetch]);

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

  function mapApiFeeToFeeItem(apiFee: any): FeeItem {
    const originalAmount = apiFee.original_amount ?? 0;
    const amountPaid = apiFee.amount_paid ?? 0;

    if (apiFee.transaction_number || apiFee.TransactionNo) {
      return {
        fee_due_id: apiFee.id || Date.now(),
        fee_type: apiFee.fee_type || apiFee.Type || 'N/A',
        fee_head: apiFee.fee_head || apiFee.Head,
        due_date: apiFee.transaction_date,
        original_amount: originalAmount,
        amount_paid: amountPaid,
        balance: 0,
        status: apiFee.payment_status || "Paid",
        transaction_number: apiFee.transaction_number || apiFee.TransactionNo,
      };
    }

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
    } as FeeItem;
  }

  // Updated handlePayment to accept custom amount
  const handlePayment = useCallback(async (fee: FeeItem, amountToPay: number = fee.balance) => {
    if (typeof window.Razorpay === 'undefined') {
      alert('Razorpay SDK not loaded. Please wait or refresh.');
      return;
    }

    const enrollmentNumber = getEnrollmentNumber(profile);

    if (!amountToPay || amountToPay <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (amountToPay > fee.balance) {
      alert("Amount cannot exceed the balance due.");
      return;
    }

    try {
      const orderResponse = await authFetch(`${apiBase}/student/fees/request-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fee_due_id: fee.fee_due_id,
          amount: amountToPay,
          fee_head: fee.fee_head,
          fee_type: fee.fee_type,
        }),
      });

      if (!orderResponse.ok) {
        const errorBody = await orderResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorBody.error || `Failed to create order: ${orderResponse.statusText}`);
      }

      const orderData = await orderResponse.json();

      const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: amountToPay * 100,
        currency: 'INR',
        name: orderData.name,
        description: orderData.description,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            const verificationResponse = await authFetch(`${apiBase}/student/fees/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                fee_due_id: fee.fee_due_id,
                amount: amountToPay,
                fee_head: fee.fee_head,
                fee_type: fee.fee_type,
                enrollment: Number(enrollmentNumber),
              }),
            });

            if (!verificationResponse.ok) {
              const errorBody = await verificationResponse.json().catch(() => ({ error: 'Unknown server error' }));
              throw new Error(errorBody.error || "Payment successful, but server verification failed.");
            }

            alert('Payment successful! Payment ID: ' + response.razorpay_payment_id);
            loadFees();
          } catch (error) {
            console.error('Verification Error:', error);
            alert('Payment recorded by Razorpay, but server update failed. Contact admin. Error: ' + (error as Error).message);
          }
        },
        prefill: {
          name: orderData.prefill.name || profile?.act_student?.CandidateName || profile?.user?.full_name,
          email: orderData.prefill.email || profile?.act_student?.EmailID || profile?.user?.email,
          contact: orderData.prefill.contact || profile?.act_student?.ContactNumber || profile?.user?.Mobile,
        },
        notes: {
          enrollment_number: enrollmentNumber,
          fee_due_id: fee.fee_due_id,
          fee_head: fee.fee_head
        },
        theme: {
          color: theme,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment failed. Reason: ${response.error.description || 'Transaction declined.'}`);
      });
      rzp.open();

    } catch (error) {
      console.error('Order Creation Error:', error);
      alert('Failed to initiate payment: ' + (error as Error).message);
    }
  }, [authFetch, profile, loadFees, theme]);

  // Modal handlers
  const openPaymentModal = (fee: FeeItem) => {
    setSelectedFeeForPayment(fee);
    setCustomAmount(fee.balance);
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedFeeForPayment(null);
    setCustomAmount(0);
  };

  const proceedWithPayment = () => {
    if (selectedFeeForPayment && customAmount > 0 && customAmount <= selectedFeeForPayment.balance) {
      handlePayment(selectedFeeForPayment, customAmount);
      closePaymentModal();
    }
  };

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
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>Student Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <Field label="Student Name" value={act.CandidateName || master.student_name || master.StudentName || user.full_name} />
              <Field label="Enrollment Number" value={act.EnrollmentNumber || master.enrollment_number || master.EnrollmentNumber || user.username} />
              <Field label="Course" value={act.CourseName || master.course_name || master.CourseName} />
              <Field label="Branch / Stream" value={act.StreamName} />
              <Field label="Academic Year / Batch / Semester" value={`${master.session ?? master.Session ?? "-"} / ${master.batch ?? master.Batch ?? "-"} / ${act.YearSem ?? "-"}`} />
              <Field label="Institution" value={master.institute_name || master.InstituteName || act.center_name} />
              <Field label="DOB / Gender" value={`${(act as any).DOB ?? "-"} / ${(master as any).gender ?? "-"}`} />
              <Field label="Aadhar Number" value={(act as any).Aadhar_Number || (act as any).AadharNumber || "-"} />
              <Field label="Father / Mother" value={`${master.father_name || master.FatherName || act.father_name || "-"} / ${act.mother_name || "-"}`} />
              <Field label="Student Contact / Email" value={`${act.ContactNumber || master.student_phone_number || master.StudentPhoneNumber || user.Mobile || "-"} / ${act.EmailID || master.student_email_id || master.StudentEmailID || user.email || "-"}`} />
              <Field label="Admitted Date" value={(master as any).created_at || (master as any).CreatedAt ? new Date((master as any).created_at || (master as any).CreatedAt).toLocaleDateString() : "-"} />
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
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>Fee Details</h2>
            {loadingFees ? (
              <div className="text-center py-8 text-gray-500">Loading fee details...</div>
            ) : (
              <>
                {/* Pending Dues */}
                <h3 className="text-xl font-semibold mb-4" style={{ color: theme }}>Pending Dues</h3>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8 border border-red-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Head</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Original Amount (₹)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid (₹)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-red-700 uppercase tracking-wider font-bold">Balance Due (₹)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fees.filter(f => f.balance > 0).length > 0 ? (
                        fees.filter(f => f.balance > 0).map((fee) => (
                          <tr key={fee.fee_due_id} className="hover:bg-red-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fee.fee_head}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.due_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{fmtMoney(fee.original_amount)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{fmtMoney(fee.amount_paid)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-red-700">{fmtMoney(fee.balance)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => openPaymentModal(fee)}
                                className="text-white bg-green-600 hover:bg-green-700 text-xs font-semibold py-1.5 px-3 rounded shadow-md transition duration-150"
                              >
                                Pay Now
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-md text-gray-600 bg-gray-50">
                            <div className="text-lg mb-1">No Pending Dues!</div>
                            <div className="text-sm">All your fees are up to date.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Payment History */}
                <h3 className="text-xl font-semibold mb-4 mt-8" style={{ color: theme }}>Payment History</h3>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Head</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid (₹)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction No.</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fees.filter(f => f.balance === 0 && f.transaction_number).length > 0 ? (
                        fees.filter(f => f.balance === 0 && f.transaction_number).map((fee) => (
                          <tr key={fee.transaction_number} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fee.fee_head}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700">{fmtMoney(fee.amount_paid)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.due_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.transaction_number}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No payment history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Custom Amount Payment Modal */}
            {paymentModalOpen && selectedFeeForPayment && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4" style={{ color: theme }}>
                    Pay for: {selectedFeeForPayment.fee_head}
                  </h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Balance Due: <span className="font-bold text-red-700">₹{fmtMoney(selectedFeeForPayment.balance)}</span>
                    </p>
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount to Pay (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedFeeForPayment.balance}
                      step="1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#650C08]"
                      placeholder="Enter amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Min: ₹1 | Max: ₹{fmtMoney(selectedFeeForPayment.balance)}
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={closePaymentModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={proceedWithPayment}
                      disabled={customAmount <= 0 || customAmount > selectedFeeForPayment.balance}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Proceed to Pay
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBJECTS */}
        {active === "subjects" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>Current Semester Subjects</h2>
            {loadingSubjects ? (
              <div className="text-center py-8 text-gray-500">Loading subjects...</div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.length > 0 ? subjects.map((sub) => (
                      <tr key={sub.subject_code} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.subject_code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.subject_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.subject_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{sub.credits}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{sub.semester}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No subjects found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MARKS */}
        {active === "marks" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>Current Semester Marks</h2>
            {loadingMarks ? (
              <div className="text-center py-8 text-gray-500">Loading marks...</div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Marks</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage (%)</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {marks.length > 0 ? marks.map((m) => (
                      <tr key={m.mark_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.subject_code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.subject_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{m.total_marks?.toFixed(2) ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{m.percentage?.toFixed(2) ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">{m.grade ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {m.status ?? '-'}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No marks recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE */}
        {active === "attendance" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme }}>Current Semester Attendance</h2>
            {loadingAttendance ? (
              <div className="text-center py-8 text-gray-500">Loading attendance...</div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Classes Attended</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Classes</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance (%)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.length > 0 ? attendance.map((item, index) => {
                      const total = item.total_classes || 0;
                      const attended = item.attended_classes || 0;
                      const percentage = total > 0 ? (attended / total) * 100 : 0;
                      const percentageColor = percentage >= 75 ? 'text-green-700 font-semibold' : percentage >= 60 ? 'text-yellow-700' : 'text-red-700 font-semibold';
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.subject_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{attended}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">{total}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${percentageColor}`}>
                            {percentage.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No attendance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

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
