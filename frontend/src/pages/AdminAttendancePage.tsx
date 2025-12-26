import React, { useState } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Users, Upload, AlertCircle, CheckCircle, ArrowLeft, Download, Calendar } from "lucide-react";

interface AttendanceSubmission {
  id: string;
  date: string;
  enrollment: string;
  subject: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export default function AdminAttendancePage() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [enrollment, setEnrollment] = useState("");
  const [subject, setSubject] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("present");
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<AttendanceSubmission[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkData, setBulkData] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submissionId = `${Date.now()}`;
    setSubmissions(prev => [...prev, {
      id: submissionId,
      date,
      enrollment,
      subject,
      status: 'pending',
      message: 'Processing...'
    }]);

    try {
      const res = await authFetch(`${apiBase}/admin/record-attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollment_number: Number(enrollment),
          date,
          subject_code: subject,
          status: attendanceStatus.toUpperCase(),
        }),
      });

      const data = await res.json();
      
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId 
          ? { ...s, status: res.ok ? 'success' : 'error', message: data.message || data.error || (res.ok ? 'Recorded!' : 'Failed') }
          : s
      ));

      if (res.ok) {
        setEnrollment("");
        setSubject("");
        setAttendanceStatus("present");
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
      const [enr, subj, status] = line.split(',').map(s => s.trim());
      if (!enr || !subj || !status) continue;

      const submissionId = `bulk-${Date.now()}-${Math.random()}`;
      setSubmissions(prev => [...prev, {
        id: submissionId,
        date,
        enrollment: enr,
        subject: subj,
        status: 'pending',
        message: 'Processing...'
      }]);

      try {
        const res = await authFetch(`${apiBase}/admin/record-attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollment_number: Number(enr),
            date,
            subject_code: subj,
            status: status.toUpperCase(),
          }),
        });

        if (res.ok) {
          successCount++;
          setSubmissions(prev => prev.map(s => 
            s.id === submissionId ? { ...s, status: 'success', message: 'Recorded' } : s
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

    alert(`Bulk recording complete! ${successCount} attendance records created.`);
    setBulkData("");
    setBulkMode(false);
  };

  const downloadTemplate = () => {
    const csv = "enrollment,subject_code,status\n220155197248,CS101,present\n220155197249,CS101,absent";
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", "attendance_template.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
            <h1 className="text-2xl font-bold text-white">Record Attendance</h1>
            <p className="text-sm text-slate-400">Manage student attendance records</p>
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
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Single Entry
                </button>
                <button
                  onClick={() => setBulkMode(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    bulkMode 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Bulk Upload
                </button>
              </div>

              {!bulkMode ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Date *
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

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
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Subject Code *
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value.toUpperCase())}
                      placeholder="e.g., CS101"
                      required
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Status *
                    </label>
                    <select
                      value={attendanceStatus}
                      onChange={(e) => setAttendanceStatus(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="leave">Leave</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-lg"
                  >
                    {loading ? 'Recording...' : 'Record Attendance'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Attendance Date *
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition text-sm h-fit"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Paste CSV Data (enrollment, subjectCode, status)
                    </label>
                    <textarea
                      value={bulkData}
                      onChange={(e) => setBulkData(e.target.value)}
                      placeholder="220155197248,CS101,present&#10;220155197249,CS101,absent"
                      rows={8}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={handleBulkImport}
                    disabled={!bulkData.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-lg"
                  >
                    Record Bulk Attendance
                  </button>
                </div>
              )}
            </div>

            {/* Status Legend */}
            <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 mt-6">
              <h4 className="text-amber-300 font-semibold mb-3">Attendance Status Guide</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-green-400 font-semibold">Present</p>
                  <p className="text-amber-300 text-xs">P</p>
                </div>
                <div className="text-center">
                  <p className="text-red-400 font-semibold">Absent</p>
                  <p className="text-amber-300 text-xs">A</p>
                </div>
                <div className="text-center">
                  <p className="text-yellow-400 font-semibold">Leave</p>
                  <p className="text-amber-300 text-xs">L</p>
                </div>
              </div>
            </div>
          </div>

          {/* Records List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Today's Records
              </h3>

              {submissions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No records yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {submissions.slice().reverse().map(sub => (
                    <div key={sub.id} className={`p-3 rounded-lg border ${
                      sub.status === 'success' 
                        ? 'bg-cyan-900/30 border-cyan-700'
                        : sub.status === 'error'
                        ? 'bg-red-900/30 border-red-700'
                        : 'bg-slate-700 border-slate-600'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-mono text-xs">{sub.enrollment}</p>
                          <p className="text-slate-300 text-xs">{sub.subject} • {sub.date}</p>
                        </div>
                        {sub.status === 'success' && <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
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
