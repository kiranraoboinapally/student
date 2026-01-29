import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Plus, Edit, Trash2, Save } from "lucide-react";
import { useAuth } from "../../../auth/AuthProvider";

export default function SystemSettings() {
    const { authFetch } = useAuth();

    const [gradingRules, setGradingRules] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ marks_percent: "", grade: "", grade_points: "", remarks: "" });
    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Academic Rules
    const [academicRules, setAcademicRules] = useState("");
    const [savingRules, setSavingRules] = useState(false);

    // Load grading rules on mount
    useEffect(() => {
        loadGradingRules();
        loadAcademicRules();
    }, []);

    const loadGradingRules = async () => {
        try {
            const res = await authFetch("/api/admin/grading-rules");
            if (res.ok) {
                const data = await res.json();
                setGradingRules(data);
            }
        } catch (err) {
            console.error("Failed to load grading rules:", err);
        }
    };

    const loadAcademicRules = async () => {
        try {
            const res = await authFetch("/api/admin/academic-rules");
            if (res.ok) {
                const data = await res.json();
                setAcademicRules(data.rules || "");
            }
        } catch (err) {
            console.error("Failed to load academic rules:", err);
        }
    };

    const handleEdit = (rule: any) => {
        setEditingId(rule.id);
        setForm({
            marks_percent: rule.marks_percent,
            grade: rule.grade,
            grade_points: rule.grade_points,
            remarks: rule.remarks || ""
        });
    };

    const handleSave = async () => {
        if (!form.marks_percent || !form.grade || !form.grade_points) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                // Update existing
                const res = await authFetch(`/api/admin/grading-rules/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form)
                });

                if (res.ok) {
                    alert("Grading rule updated successfully");
                    await loadGradingRules();
                    setEditingId(null);
                } else {
                    const error = await res.text();
                    alert(`Failed to update: ${error}`);
                }
            } else {
                // Create new
                const res = await authFetch("/api/admin/grading-rules", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form)
                });

                if (res.ok) {
                    alert("Grading rule created successfully");
                    await loadGradingRules();
                    setShowAddModal(false);
                } else {
                    const error = await res.text();
                    alert(`Failed to create: ${error}`);
                }
            }
            setForm({ marks_percent: "", grade: "", grade_points: "", remarks: "" });
        } catch (err) {
            console.error("Failed to save grading rule:", err);
            alert("Failed to save grading rule");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this grading rule?")) return;

        setLoading(true);
        try {
            const res = await authFetch(`/api/admin/grading-rules/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                alert("Grading rule deleted successfully");
                await loadGradingRules();
            } else {
                alert("Failed to delete grading rule");
            }
        } catch (err) {
            console.error("Failed to delete grading rule:", err);
            alert("Failed to delete grading rule");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAcademicRules = async () => {
        setSavingRules(true);
        try {
            const res = await authFetch("/api/admin/academic-rules", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rules: academicRules })
            });

            if (res.ok) {
                alert("Academic rules updated successfully");
            } else {
                alert("Failed to update academic rules");
            }
        } catch (err) {
            console.error("Failed to save academic rules:", err);
            alert("Failed to save academic rules");
        } finally {
            setSavingRules(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#650C08]/10 flex items-center justify-center">
                        <SettingsIcon className="text-[#650C08]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
                        <p className="text-sm text-gray-500">Configure university-wide settings and policies</p>
                    </div>
                </div>
            </div>

            {/* Grading System */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Grading System</h3>
                        <p className="text-sm text-gray-500">Manage grade mappings and criteria</p>
                    </div>
                    <button
                        onClick={() => { setForm({ marks_percent: "", grade: "", grade_points: "", remarks: "" }); setShowAddModal(true); }}
                        className="bg-[#650C08] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#8B1A1A] shadow-sm transition-all"
                        disabled={loading}
                    >
                        <Plus size={18} /> Add Grade
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="py-3 px-6">Marks Range</th>
                                <th className="py-3 px-6">Grade</th>
                                <th className="py-3 px-6">Grade Points</th>
                                <th className="py-3 px-6">Remarks</th>
                                <th className="py-3 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {gradingRules.map(rule => (
                                <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-6 font-medium text-gray-900">{rule.marks_percent}</td>
                                    <td className="py-4 px-6">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                            {rule.grade}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600">{rule.grade_points}</td>
                                    <td className="py-4 px-6 text-gray-600">{rule.remarks || "-"}</td>
                                    <td className="py-4 px-6 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(rule)}
                                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                                            disabled={loading}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                                            disabled={loading}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Academic Rules */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Academic Rules & Policies</h3>
                <textarea
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#650C08] focus:border-transparent resize-none"
                    rows={6}
                    placeholder="Enter university academic rules and policies..."
                    value={academicRules}
                    onChange={(e) => setAcademicRules(e.target.value)}
                />
                <div className="flex justify-end mt-3">
                    <button
                        className="bg-[#650C08] text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-[#8B1A1A] transition-all"
                        onClick={handleSaveAcademicRules}
                        disabled={savingRules}
                    >
                        <Save size={18} /> {savingRules ? "Saving..." : "Save Rules"}
                    </button>
                </div>
            </div>

            {/* Quick Modal for Add/Edit */}
            {(showAddModal || editingId) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editingId ? "Edit Grade" : "Add Grade"}
                        </h3>
                        <div className="space-y-3">
                            <input
                                className="w-full p-2 border border-gray-200 rounded-lg"
                                placeholder="Marks Range (e.g., 90-100)"
                                value={form.marks_percent}
                                onChange={e => setForm({ ...form, marks_percent: e.target.value })}
                            />
                            <input
                                className="w-full p-2 border border-gray-200 rounded-lg"
                                placeholder="Grade (e.g., A+)"
                                value={form.grade}
                                onChange={e => setForm({ ...form, grade: e.target.value })}
                            />
                            <input
                                className="w-full p-2 border border-gray-200 rounded-lg"
                                placeholder="Grade Points (e.g., 10)"
                                value={form.grade_points}
                                onChange={e => setForm({ ...form, grade_points: e.target.value })}
                            />
                            <input
                                className="w-full p-2 border border-gray-200 rounded-lg"
                                placeholder="Remarks (optional)"
                                value={form.remarks}
                                onChange={e => setForm({ ...form, remarks: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setShowAddModal(false); setEditingId(null); setForm({ marks_percent: "", grade: "", grade_points: "", remarks: "" }); }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-[#650C08] text-white rounded-lg hover:bg-[#8B1A1A]"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
