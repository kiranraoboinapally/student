import React, { useState } from "react";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

const theme = "#650C08";

interface FeeSubmission {
  id: string;
  enrollment: string;
  feeType: string;
  amount: number;
  semester: number;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export default function AdminFeeCreationPage() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState("");
  const [feeType, setFeeType] = useState("REGISTRATION");
  const [amount, setAmount] = useState("");
  const [semester, setSemester] = useState("1");
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<FeeSubmission[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkData, setBulkData] = useState("");

  const feeTypes = [
    { value: "REGISTRATION", label: "Registration Fee" },
    { value: "EXAMINATION", label: "Examination Fee" },
    { value: "MISCELLANEOUS", label: "Miscellaneous Fee" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      enrollment_number: Number(enrollment),
      fee_type: feeType,
      fee_amount: Number(amount),
      semester: Number(semester),
    };

    const submissionId = `${Date.now()}`;
    setSubmissions(prev => [...prev, {
      id: submissionId,
      enrollment,
      feeType,
      amount: Number(amount),
      semester: Number(semester),
      status: 'pending',
      message: 'Processing...'
    }]);

    try {
      const res = await authFetch(`${apiBase}/admin/fees/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      setSubmissions(prev => prev.map(s =>
        s.id === submissionId
          ? { ...s, status: res.ok ? 'success' : 'error', message: data.message || data.error || (res.ok ? 'Fee created!' : 'Failed') }
          : s
      ));

      if (res.ok) {
        setEnrollment("");
        setAmount("");
      }
    } catch (err) {
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId
          ? { ...s, status: 'error', message: 'Network error' }
          : s
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    const lines = bulkData.trim().split('\n');
    let successCount = 0;

    for (const line of lines) {
      const [enr, type, amt, sem] = line.split(',').map(s => s.trim());
      if (!enr || !type || !amt || !sem) continue;

      const submissionId = `bulk-${Date.now()}-${Math.random()}`;
      setSubmissions(prev => [...prev, {
        id: submissionId,
        enrollment: enr,
        feeType: type,
        amount: Number(amt),
        semester: Number(sem),
        status: 'pending',
        message: 'Processing...'
      }]);

      try {
        const res = await authFetch(`${apiBase}/admin/fees/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollment_number: Number(enr),
            fee_type: type,
            fee_amount: Number(amt),
            semester: Number(sem),
          }),
        });

        if (res.ok) {
          successCount++;
          setSubmissions(prev => prev.map(s =>
            s.id === submissionId ? { ...s, status: 'success', message: 'Created' } : s
          ));
        } else {
          setSubmissions(prev => prev.map(s =>
            s.id === submissionId ? { ...s, status: 'error', message: 'Failed' } : s
          ));
        }
      } catch {
        setSubmissions(prev => prev.map(s =>
          s.id === submissionId ? { ...s, status: 'error', message: 'Error' } : s
        ));
      }
    }

    alert(`Bulk import complete! ${successCount} fees created successfully.`);
    setBulkData("");
    setBulkMode(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${theme} 0%, #8B1A1A 50%, #1a1a1a 100%)` }}>
      {/* Header */}
      <nav className="flex justify-between items-center px-6 py-4 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm bg-white">
            <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Student Fees</h1>
            <p className="text-sm text-white/80">Add or manage student fee entries</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchDashboardData?.()} className="px-3 py-2 bg-white/5 text-white rounded">Refresh</button>
          <button onClick={() => navigate('/admin/dashboard')} className="px-3 py-2 bg-white/5 text-white rounded">Back</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/95 rounded-xl border border-white/10 p-6 shadow-lg">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setBulkMode(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${!bulkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  Single Entry
                </button>
                <button
                  onClick={() => setBulkMode(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${bulkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  Bulk Import
                </button>
              </div>

              {!bulkMode ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Enrollment Number *
                    </label>
                    <input
                      type="text"
                      value={enrollment}
                      onChange={(e) => setEnrollment(e.target.value)}
                      placeholder="e.g., 220155197248"
                      required
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#650C08] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Fee Type *
                    </label>
                    <select
                      value={feeType}
                      onChange={(e) => setFeeType(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-[#650C08] focus:outline-none"
                    >
                      {feeTypes.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        step="0.01"
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#650C08] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Semester *
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-[#650C08] focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 px-6 py-3 bg-[#650C08] hover:bg-[#7a1d16] disabled:opacity-50 text-white font-bold rounded-lg transition shadow"
                  >
                    {loading ? 'Creating Fee...' : 'Create Fee'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Paste CSV Data (enrollment, feeType, amount, semester)
                    </label>
                    <textarea
                      value={bulkData}
                      onChange={(e) => setBulkData(e.target.value)}
                      placeholder="220155197248,REGISTRATION,5000,1&#10;220155197249,EXAMINATION,1500,1"
                      rows={8}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={handleBulkImport}
                    disabled={!bulkData.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-lg"
                  >
                    Import Bulk Data
                  </button>
                </div>
              )}
            </div>

            {/* Help Box */}
            <div className="bg-white/95 border border-white/10 rounded-xl p-4 mt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#650C08] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-800">
                  <p className="font-semibold mb-2">📋 CSV Format for Bulk Import:</p>
                  <code className="block bg-gray-100 p-2 rounded text-xs font-mono">
                    enrollment, feeType, amount, semester<br />
                    220155197248, REGISTRATION, 5000, 1
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 rounded-xl border border-white/10 p-6 shadow-lg sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#650C08]" />
                Recent Submissions
              </h3>

              {submissions.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No submissions yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {submissions.slice().reverse().map(sub => (
                    <div key={sub.id} className={`p-3 rounded-lg border ${sub.status === 'success'
                        ? 'bg-green-100 border-green-200'
                        : sub.status === 'error'
                          ? 'bg-red-100 border-red-200'
                          : 'bg-gray-50 border-gray-100'
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-mono text-xs">{sub.enrollment}</p>
                          <p className="text-gray-700 text-xs">{sub.feeType} - ₹{sub.amount}</p>
                        </div>
                        {sub.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                        {sub.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                      </div>
                      <p className="text-gray-600 text-xs mt-1">{sub.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
