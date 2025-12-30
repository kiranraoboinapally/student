import { useState } from 'react';
import { Upload, Calendar, BookOpen, UserCheck, AlertCircle, FileText } from 'lucide-react';
import AdminService from '../../services/adminService';
import { useAuth } from '../../../auth/AuthProvider';
import type { Institute, Course, Subject, Student } from '../../services/adminService';

interface AcademicUploadsProps {
    institutes: Institute[];
    courses: Course[];
    subjects: Subject[];
    students: Student[];
}

export default function AcademicUploads({ institutes, courses, subjects, students }: AcademicUploadsProps) {
    const { authFetch } = useAuth();
    const service = new AdminService(authFetch);

    const [activeTab, setActiveTab] = useState<'marks' | 'attendance'>('marks');
    const [loading, setLoading] = useState(false);

    // Common Selection State
    const [selectedInstitute, setSelectedInstitute] = useState<number>(0);
    const [selectedCourse, setSelectedCourse] = useState<number>(0);
    const [selectedSemester, setSelectedSemester] = useState<number>(1);
    const [selectedSubject, setSelectedSubject] = useState<number>(0);

    // Attendance Specifi
    const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Filtered Options
    const filteredCourses = courses.filter(c => !selectedInstitute || c.institute_id === selectedInstitute);
    const filteredSubjects = subjects.filter(s =>
        (!selectedCourse || s.course_id === selectedCourse) &&
        (!selectedSemester || s.semester === selectedSemester)
    );

    const handleUploadMarks = async () => {
        if (!selectedSubject) { alert("Please select a subject"); return; }
        setLoading(true);
        try {
            // In a real app, parse `entryData` (CSV) here
            // Mocking data for demonstration
            const mockData = students
                .filter(s => s.course_id === selectedCourse) // Filter students by course if linked
                .map(s => ({
                    student_id: s.user_id,
                    subject_id: selectedSubject,
                    marks_obtained: Math.floor(Math.random() * 100), // Placeholder logic
                    total_marks: 100
                }));

            if (mockData.length === 0) {
                alert("No students found for this course selection to map marks to.");
                setLoading(false);
                return;
            }

            await service.uploadMarks(mockData);
            alert("Marks uploaded successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to upload marks");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAttendance = async () => {
        if (!selectedSubject || !attendanceDate) { alert("Select subject and date"); return; }
        setLoading(true);
        try {
            const mockData = students
                .filter(s => s.course_id === selectedCourse)
                .map(s => ({
                    student_id: s.user_id,
                    subject_id: selectedSubject,
                    date: attendanceDate,
                    status: 'present' // Defaulting to present for bulk
                }));

            if (mockData.length === 0) {
                alert("No students found for this course selection.");
                setLoading(false);
                return;
            }

            await service.uploadAttendance(mockData);
            alert("Attendance marked successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to upload attendance");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Tab Switcher */}
            <div className="bg-white p-1 rounded-xl inline-flex shadow-sm border border-gray-100">
                <button
                    onClick={() => setActiveTab('marks')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'marks' ? 'bg-[#650C08] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <BookOpen size={18} />
                    Upload Marks
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'attendance' ? 'bg-[#650C08] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <UserCheck size={18} />
                    Mark Attendance
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FilterIcon className="text-[#650C08]" />
                            Context Selection
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Institute</label>
                                <select
                                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-[#650C08]"
                                    value={selectedInstitute}
                                    onChange={e => setSelectedInstitute(Number(e.target.value))}
                                >
                                    <option value={0}>Select Institute</option>
                                    {institutes.map(i => <option key={i.institute_id || i.id} value={i.institute_id || i.id}>{i.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Course</label>
                                <select
                                    className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-[#650C08]"
                                    value={selectedCourse}
                                    onChange={e => setSelectedCourse(Number(e.target.value))}
                                >
                                    <option value={0}>Select Course</option>
                                    {filteredCourses.map(c => <option key={c.course_id || c.id} value={c.course_id || c.id}>{c.name || c.course_name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Semester</label>
                                    <input
                                        type="number"
                                        min={1} max={8}
                                        className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-[#650C08]"
                                        value={selectedSemester}
                                        onChange={e => setSelectedSemester(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Subject</label>
                                    <select
                                        className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-[#650C08]"
                                        value={selectedSubject}
                                        onChange={e => setSelectedSubject(Number(e.target.value))}
                                    >
                                        <option value={0}>Select Subject</option>
                                        {filteredSubjects.map(s => <option key={s.subject_id || s.id} value={s.subject_id || s.id}>{s.name || s.subject_name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {activeTab === 'attendance' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                        <input
                                            type="date"
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-[#650C08]"
                                            value={attendanceDate}
                                            onChange={e => setAttendanceDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Area */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {activeTab === 'marks' ? 'Marks Entry' : 'Daily Attendance'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {activeTab === 'marks' ? 'Enter marks or upload CSV' : 'Mark student presence for the session'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 flex items-center gap-2">
                                    <FileText size={16} /> Template
                                </button>
                                <button
                                    onClick={activeTab === 'marks' ? handleUploadMarks : handleUploadAttendance}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-[#650C08] rounded-lg hover:bg-[#8B1A1A] flex items-center gap-2 shadow-lg shadow-red-900/20"
                                >
                                    {loading ? 'Processing...' : (
                                        <>
                                            <Upload size={16} />
                                            {activeTab === 'marks' ? 'Publish Marks' : 'Save Attendance'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Placeholder Entry Area */}
                        <div className="flex-1 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-12 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="text-gray-400 group-hover:text-[#650C08]" size={32} />
                            </div>
                            <h4 className="text-gray-900 font-medium mb-1">
                                {activeTab === 'marks' ? 'Drag and drop Marks CSV' : 'Upload Attendance Sheet'}
                            </h4>
                            <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
                                Or manually enter data for selected {students.filter(s => s.course_id === selectedCourse).length} students below.
                            </p>

                            {/* Hint about manual entry */}
                            <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-1">
                                <AlertCircle size={12} />
                                <span>Manual Entry Grid Coming Soon</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon helper
function FilterIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
    )
}
