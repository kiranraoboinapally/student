import React, { useState } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { BookOpen, Upload, AlertCircle, CheckCircle, ArrowLeft, Download } from "lucide-react";

interface MarkSubmission {
  id: string;
  enrollment: string;
  subjectCode: string;
  marks: number;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export default function AdminMarksUploadPage() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [enrollment, setEnrollment] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [marks, setMarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<MarkSubmission[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkData, setBulkData] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submissionId = `${Date.now()}`;
    setSubmissions(prev => [...prev, {
      id: submissionId,
      enrollment,
      subjectCode,
      marks: Number(marks),
      status: 'pending',
      message: 'Processing...'
    }]);

    try {
      const res = await authFetch(`${apiBase}/admin/marks/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollment_number: Number(enrollment),
          subject_code: subjectCode,
          marks: Number(marks),
        }),
      });

      const data = await res.json();
      
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId 
          ? { ...s, status: res.ok ? 'success' : 'error', message: data.message || data.error || (res.ok ? 'Marks uploaded!' : 'Failed') }
          : s
      ));

      if (res.ok) {
        setEnrollment("");
        setSubjectCode("");
        setMarks("");
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
      const [enr, subCode, mrks] = line.split(',').map(s => s.trim());
      if (!enr || !subCode || !mrks) continue;

      const submissionId = `bulk-${Date.now()}-${Math.random()}`;
      setSubmissions(prev => [...prev, {
        id: submissionId,
        enrollment: enr,
        subjectCode: subCode,
        marks: Number(mrks),
        status: 'pending',
        message: 'Processing...'
      }]);

      try {
        const res = await authFetch(`${apiBase}/admin/marks/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollment_number: Number(enr),
            subject_code: subCode,
            marks: Number(mrks),
          }),
        });

        if (res.ok) {
          successCount++;
          setSubmissions(prev => prev.map(s => 
            s.id === submissionId ? { ...s, status: 'success', message: 'Uploaded' } : s
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

    alert(`Bulk upload complete! ${successCount} marks uploaded successfully.`);
    setBulkData("");
    setBulkMode(false);
  };

  const downloadTemplate = () => {
    const csv = "enrollment,subject_code,marks\n220155197248,CS101,85\n220155197249,CS101,92";
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", "marks_template.csv");
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
            <h1 className="text-2xl font-bold text-white">Upload Student Marks</h1>
            <p className="text-sm text-slate-400">Manage academic marks and grades</p>
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
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Single Entry
                </button>
                <button
                  onClick={() => setBulkMode(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    bulkMode 
                      ? 'bg-green-600 text-white' 
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
                      Enrollment Number *
                    </label>
                    <input
                      type="text"
                      value={enrollment}
                      onChange={(e) => setEnrollment(e.target.value)}
                      placeholder="e.g., 220155197248"
                      required
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Subject Code *
                    </label>
                    <input
                      type="text"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                      placeholder="e.g., CS101"
                      required
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Marks (0-100) *
                    </label>
                    <input
                      type="number"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      placeholder="0-100"
                      required
                      min="0"
                      max="100"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-lg"
                  >
                    {loading ? 'Uploading...' : 'Upload Marks'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Paste CSV Data (enrollment, subjectCode, marks)
                    </label>
                    <textarea
                      value={bulkData}
                      onChange={(e) => setBulkData(e.target.value)}
                      placeholder="220155197248,CS101,85&#10;220155197249,CS101,92"
                      rows={8}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:outline-none font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={handleBulkImport}
                    disabled={!bulkData.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-lg"
                  >
                    Upload Bulk Data
                  </button>
                </div>
              )}
            </div>

            {/* Grading Scale Info */}
            <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-4 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-purple-300 font-semibold">A</p>
                  <p className="text-purple-400">90-100</p>
                </div>
                <div>
                  <p className="text-purple-300 font-semibold">B</p>
                  <p className="text-purple-400">80-89</p>
                </div>
                <div>
                  <p className="text-purple-300 font-semibold">C</p>
                  <p className="text-purple-400">70-79</p>
                </div>
                <div>
                  <p className="text-purple-300 font-semibold">D</p>
                  <p className="text-purple-400">60-69</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Recent Uploads
              </h3>

              {submissions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No uploads yet</p>
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
                          <p className="text-slate-300 text-xs">{sub.subjectCode} - {sub.marks}/100</p>
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
