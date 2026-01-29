import { useState, useEffect } from "react";
import { DollarSign, Plus, Check, X } from "lucide-react";
import { useAuth } from "../../../auth/AuthProvider";

export default function FeeManagement() {
    const { authFetch } = useAuth();

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);

    // State for institutes and courses
    const [institutes, setInstitutes] = useState<any[]>([]);
    const [selectedInstitute, setSelectedInstitute] = useState("");
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState("");

    // Fee form state
    const [feeForm, setFeeForm] = useState({
        fee_type: "all",
        expected_exam_fee: "",
        expected_registration_fee: "",
        expected_misc_fee: ""
    });

    const [loading, setLoading] = useState(false);

    // Load institutes on mount
    useEffect(() => {
        loadInstitutes();
    }, []);

    // Load courses when institute is selected
    useEffect(() => {
        if (selectedInstitute) {
            loadActiveCourses(selectedInstitute);
        } else {
            setCourses([]);
            setSelectedCourse("");
        }
    }, [selectedInstitute]);

    const loadInstitutes = async () => {
        try {
            const res = await authFetch("/api/admin/institutes");
            if (res.ok) {
                const data = await res.json();
                setInstitutes(data.data || []);
            }
        } catch (err) {
            console.error("Failed to load institutes:", err);
        }
    };

    const loadActiveCourses = async (instituteId: string) => {
        try {
            const res = await authFetch(`/api/admin/fees/active-courses?institute_id=${instituteId}`);
            if (res.ok) {
                const data = await res.json();
                setCourses(data || []);
            }
        } catch (err) {
            console.error("Failed to load courses:", err);
            setCourses([]);
        }
    };

    const handleCreateFees = async () => {
        if (!selectedInstitute || !selectedCourse) {
            alert("Please select both Institute and Course");
            return;
        }

        if (!feeForm.expected_exam_fee && !feeForm.expected_registration_fee && !feeForm.expected_misc_fee) {
            alert("Please enter at least one fee amount");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                institute_id: parseInt(selectedInstitute),
                course_name: selectedCourse,
                fee_type: feeForm.fee_type,
                expected_exam_fee: parseFloat(feeForm.expected_exam_fee || "0"),
                expected_registration_fee: parseFloat(feeForm.expected_registration_fee || "0"),
                expected_misc_fee: parseFloat(feeForm.expected_misc_fee || "0")
            };

            const res = await authFetch("/api/admin/fees/create-for-active", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                alert(`✅ Success! Fees created for ${data.students_count} active students`);

                // Reset form and close modal
                setFeeForm({
                    fee_type: "all",
                    expected_exam_fee: "",
                    expected_registration_fee: "",
                    expected_misc_fee: ""
                });
                setSelectedInstitute("");
                setSelectedCourse("");
                setShowCreateModal(false);
            } else {
                const error = await res.json();
                alert(`❌ Failed: ${error.error || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Failed to create fees:", err);
            alert("Failed to create fees");
        } finally {
            setLoading(false);
        }
    };

    const selectedInstituteData = institutes.find(i => i.institute_id === parseInt(selectedInstitute));
    const selectedCourseData = courses.find(c => c.course_name === selectedCourse);

    return (
        <div className="space-y-6 relative">
            {/* Floating Create Fee Button */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-8 right-8 z-40 w-16 h-16 bg-[#650C08] text-white rounded-full shadow-2xl hover:bg-[#8B1A1A] transition-all hover:scale-110 flex items-center justify-center group"
                title="Create Fee"
            >
                <Plus size={28} />
                <span className="absolute right-full mr-3 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Create Fee
                </span>
            </button>

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Fee Management</h2>
                            <p className="text-sm text-gray-500">Manage student fees for active students</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Fee Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Plus size={20} className="text-[#650C08]" />
                                Create Fees for Active Students
                            </h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Step 1: Select Institute */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Step 1: Select College/Institute *
                                </label>
                                <select
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent text-base"
                                    value={selectedInstitute}
                                    onChange={(e) => {
                                        setSelectedInstitute(e.target.value);
                                        setSelectedCourse("");
                                    }}
                                >
                                    <option value="">-- Choose College --</option>
                                    {institutes.map(inst => (
                                        <option key={inst.institute_id} value={inst.institute_id}>
                                            {inst.institute_name} ({inst.institute_code || "N/A"})
                                        </option>
                                    ))}
                                </select>
                                {selectedInstituteData && (
                                    <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                        <Check size={16} /> Selected: {selectedInstituteData.institute_name}
                                    </p>
                                )}
                            </div>

                            {/* Step 2: Select Course */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Step 2: Select Course/Branch *
                                </label>
                                <select
                                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent text-base disabled:bg-gray-100"
                                    value={selectedCourse}
                                    onChange={(e) => {
                                        setSelectedCourse(e.target.value);
                                    }}
                                    disabled={!selectedInstitute}
                                >
                                    <option value="">-- Choose Course --</option>
                                    {courses.map(course => (
                                        <option key={course.course_name} value={course.course_name}>
                                            {course.course_name} ({course.student_count} active students)
                                        </option>
                                    ))}
                                </select>
                                {!selectedInstitute && (
                                    <p className="mt-2 text-sm text-gray-500">Select an institute first</p>
                                )}
                                {selectedInstitute && courses.length === 0 && (
                                    <p className="mt-2 text-sm text-yellow-600">No active students in this institute</p>
                                )}
                                {selectedCourseData && (
                                    <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                        <Check size={16} /> Selected: {selectedCourseData.course_name} - {selectedCourseData.student_count} active students
                                    </p>
                                )}
                            </div>

                            {/* Step 3: Enter Fee Amounts */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-4">
                                    Step 3: Enter Fee Amounts
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Examination Fee (₹)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent"
                                            placeholder="e.g., 1500"
                                            value={feeForm.expected_exam_fee}
                                            onChange={(e) => setFeeForm({ ...feeForm, expected_exam_fee: e.target.value })}
                                            min="0"
                                            step="100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Registration Fee (₹)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent"
                                            placeholder="e.g., 5000"
                                            value={feeForm.expected_registration_fee}
                                            onChange={(e) => setFeeForm({ ...feeForm, expected_registration_fee: e.target.value })}
                                            min="0"
                                            step="100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-2">
                                            Miscellaneous Fee (₹)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent"
                                            placeholder="e.g., 500"
                                            value={feeForm.expected_misc_fee}
                                            onChange={(e) => setFeeForm({ ...feeForm, expected_misc_fee: e.target.value })}
                                            min="0"
                                            step="100"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm font-semibold text-blue-900">
                                        Total Fee: ₹{(
                                            (parseFloat(feeForm.expected_exam_fee) || 0) +
                                            (parseFloat(feeForm.expected_registration_fee) || 0) +
                                            (parseFloat(feeForm.expected_misc_fee) || 0)
                                        ).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Info Note */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-sm text-amber-800">
                                    <strong>ℹ️ Note:</strong> Fees will be created only for students with <code className="bg-amber-100 px-2 py-1 rounded">student_status = 'active'</code> in the master_students table.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFees}
                                disabled={loading || !selectedInstitute || !selectedCourse}
                                className="bg-[#650C08] text-white px-8 py-3 rounded-lg hover:bg-[#8B1A1A] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center gap-2 shadow-md"
                            >
                                {loading ? "Creating Fees..." : "Create Fees"}
                                {!loading && <DollarSign size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
