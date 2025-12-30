import React, { useState } from "react";
import { useAuth, apiBase } from "../../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { BookOpen, AlertCircle, CheckCircle, ArrowLeft, Download } from "lucide-react";

const theme = "#650C08";

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
        body: JSON.stringify({ marks: [{ enrollment_number: Number(enrollment), subject_code: subjectCode, semester: 1, marks_obtained: Number(marks), status: "internal" }] }),
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
          body: JSON.stringify({ marks: [{ enrollment_number: Number(enr), subject_code: subCode, semester: 1, marks_obtained: Number(mrks), status: "internal" }] }),
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
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${theme} 0%, #8B1A1A 50%, #1a1a1a 100%)` }}>
      <nav className="flex justify-between items-center px-6 py-4 bg-white/5 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm bg-white">
            <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Upload Student Marks</h1>
            <p className="text-sm text-white/80">Manage academic marks and grades</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  Single Entry
                </button>
                <button
                  onClick={() => setBulkMode(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${bulkMode
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
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#650C08] focus:outline-none"
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
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#650C08] focus:outline-none"
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
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-[#650C08] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 px-6 py-3 bg-[#650C08] hover:bg-[#7a1d16] disabled:opacity-50 text-white font-bold rounded-lg transition shadow"
                  >
                    {loading ? 'Uploading...' : 'Upload Marks'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-white/95 hover:bg-gray-100 text-gray-800 rounded-lg transition text-sm border"
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
            <div className="bg-white/95 border border-white/10 rounded-xl p-4 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-900 font-semibold">A</p>
                  <p className="text-gray-700">90-100</p>
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">B</p>
                  <p className="text-gray-700">80-89</p>
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">C</p>
                  <p className="text-gray-700">70-79</p>
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">D</p>
                  <p className="text-gray-700">60-69</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 rounded-xl border border-white/10 p-6 shadow-lg sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#650C08]" />
                Recent Uploads
              </h3>

              {submissions.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No uploads yet</p>
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
                          <p className="text-gray-700 text-xs">{sub.subjectCode} - {sub.marks}/100</p>
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
