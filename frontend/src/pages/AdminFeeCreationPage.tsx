import React, { useState, useEffect } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

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
  const { authFetch, logout } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-950/80 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Student Fees</h1>
            <p className="text-sm text-slate-400">Add or manage student fee entries</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setBulkMode(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    !bulkMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Single Entry
                </button>
                <button
                  onClick={() => setBulkMode(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    bulkMode 
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
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Fee Type *
                    </label>
                    <select
                      value={feeType}
                      onChange={(e) => setFeeType(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
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
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Semester *
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        {[1,2,3,4,5,6,7,8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-lg"
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
            <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 mt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-100">
                  <p className="font-semibold mb-2">📋 CSV Format for Bulk Import:</p>
                  <code className="block bg-black/30 p-2 rounded text-xs font-mono">
                    enrollment, feeType, amount, semester<br/>
                    220155197248, REGISTRATION, 5000, 1
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Recent Submissions
              </h3>

              {submissions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No submissions yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {submissions.slice().reverse().map(sub => (
                    <div key={sub.id} className={`p-3 rounded-lg border ${
                      sub.status === 'success' 
                        ? 'bg-green-900/30 border-green-700'
                        : sub.status === 'error'
                        ? 'bg-red-900/30 border-red-700'
                        : 'bg-slate-700 border-slate-600'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-mono text-xs">{sub.enrollment}</p>
                          <p className="text-slate-300 text-xs">{sub.feeType} - ₹{sub.amount}</p>
                        </div>
                        {sub.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                        {sub.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{sub.message}</p>
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
