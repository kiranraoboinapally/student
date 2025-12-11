import React, { useState, useEffect } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";

interface Student {
  student_id: number;
  student_name: string;
  father_name?: string | null;
  student_email_id?: string | null;
  enrollment_number?: number | null;
  temp_password?: string; // optional to display after activation
}

export default function AdminDashboard(): JSX.Element {
  const { authFetch } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_name: "",
    father_name: "",
    student_email_id: "",
  });
  const [dobInputs, setDobInputs] = useState<{ [key: number]: string }>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  // Fetch students (paginated)
  const loadStudents = async () => {
    setLoading(true);
    try {
      // Explicit pagination params - backend returns { data: [...], meta: {...} }
      const res = await authFetch(`${apiBase}/admin/students?page=${page}&page_size=${pageSize}`);
      
      // handle non-OK responses first to avoid JSON parse errors
      if (!res.ok) {
        const text = await res.text().catch(() => "<no-body>");
        console.error("Failed to load students:", res.status, res.statusText, text);
        // Optionally show a UI error here
        setStudents([]);
        setLoading(false);
        return;
      }

      // Parse JSON safely
      const data = await res.json().catch((err) => {
        console.error("Failed parsing students JSON:", err);
        return null;
      });
      if (!data) {
        setStudents([]);
        return;
      }

      // Backend returns { data: [...], meta: {...} }
      if (Array.isArray(data.data)) {
        setStudents(data.data as Student[]);
      } else if (Array.isArray(data)) {
        // fallback if API returns raw array
        setStudents(data as Student[]);
      } else {
        console.warn("Unexpected students payload shape:", data);
        setStudents([]);
      }
    } catch (err) {
      console.error("Network/load error while fetching students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]); // reload when page changes

  // Add new student
  const addStudent = async () => {
    try {
      const res = await authFetch(`${apiBase}/admin/students/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "<no-body>");
        console.error("Add student failed:", res.status, text);
        alert("Failed to add student. See console for details.");
        return;
      }
      setNewStudent({ student_name: "", father_name: "", student_email_id: "" });
      // reload first page after add
      setPage(1);
      loadStudents();
    } catch (err) {
      console.error(err);
      alert("Network error while adding student");
    }
  };

  // GENERATE ENROLLMENT: removed/disabled because you said enrollment already exists.
  // If you later want to enable, implement backend route and call it here.
  const generateEnrollment = async (_id: number) => {
    alert("Enrollment generation disabled (not required).");
    // TODO: call /admin/students/generate-enrollment/:id if you re-enable on server
  };

  // Activate login using DOB (ddmmyyyy -> YYYY-MM-DD)
  const activateLogin = async (id: number) => {
    let dob = dobInputs[id];
    if (!dob) return alert("Enter DOB in ddmmyyyy format");

    // Convert ddmmyyyy -> YYYY-MM-DD
    if (dob.length === 8) {
      const dd = dob.slice(0, 2);
      const mm = dob.slice(2, 4);
      const yyyy = dob.slice(4, 8);
      dob = `${yyyy}-${mm}-${dd}`;
    } else {
      return alert("Invalid DOB format, use ddmmyyyy");
    }

    try {
      const res = await authFetch(
        `${apiBase}/admin/students/activate-login/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dob }),
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => "<no-body>");
        console.error("Activate login failed:", res.status, text);
        alert("Failed to activate login. See console for details.");
        return;
      }

      const data = await res.json().catch((e) => {
        console.error("Failed parsing activate-login response:", e);
        return null;
      });
      if (!data) {
        alert("Unexpected response from server");
        return;
      }

      alert(`Login activated!\nEnrollment: ${data.enrollment}\nTemp Password: ${data.temp_password}`);

      // Update temp password in state to display in table
      setStudents(prev =>
        prev.map(s => (s.student_id === id ? { ...s, temp_password: data.temp_password } : s))
      );

      setDobInputs(prev => ({ ...prev, [id]: "" }));
      // reload list (keeps page)
      loadStudents();
    } catch (err) {
      console.error(err);
      alert("Network error while activating login");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Add Student Form */}
      <div className="mb-6 p-4 border rounded-md">
        <h2 className="font-semibold mb-2">Add New Student</h2>
        <input
          type="text"
          placeholder="Student Name"
          value={newStudent.student_name}
          onChange={(e) => setNewStudent({ ...newStudent, student_name: e.target.value })}
          className="border p-2 mr-2 rounded-md"
        />
        <input
          type="text"
          placeholder="Father Name"
          value={newStudent.father_name}
          onChange={(e) => setNewStudent({ ...newStudent, father_name: e.target.value })}
          className="border p-2 mr-2 rounded-md"
        />
        <input
          type="email"
          placeholder="Email"
          value={newStudent.student_email_id}
          onChange={(e) => setNewStudent({ ...newStudent, student_email_id: e.target.value })}
          className="border p-2 mr-2 rounded-md"
        />
        <button
          onClick={addStudent}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {/* Students Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Enrollment</th>
            <th className="border px-2 py-1">Temp Password</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && !loading ? (
            <tr><td colSpan={5} className="text-center p-4">No students found</td></tr>
          ) : (
            students.map((s) => (
              <tr key={s.student_id} className="odd:bg-gray-50">
                <td className="border px-2 py-1">{s.student_id}</td>
                <td className="border px-2 py-1">{s.student_name}</td>
                <td className="border px-2 py-1">{s.enrollment_number ?? "0"}</td>
                <td className="border px-2 py-1">{s.temp_password ?? "-"}</td>
                <td className="border px-2 py-1 space-x-2">
                  {s.enrollment_number === 0 && (
                    <button
                      onClick={() => generateEnrollment(s.student_id)}
                      className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Generate Enrollment
                    </button>
                  )}
                  {s.enrollment_number && s.enrollment_number > 0 && !s.temp_password && (
                    <>
                      <input
                        type="text"
                        placeholder="DOB ddmmyyyy"
                        value={dobInputs[s.student_id] || ""}
                        onChange={(e) =>
                          setDobInputs(prev => ({ ...prev, [s.student_id]: e.target.value }))
                        }
                        className="border px-1 py-0.5 rounded w-32"
                      />
                      <button
                        onClick={() => activateLogin(s.student_id)}
                        className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Activate Login
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="mr-2 px-3 py-1 border rounded">Prev</button>
          <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded">Next</button>
        </div>
        {loading && <p className="mt-2 text-gray-500">Loading...</p>}
      </div>
    </div>
  );
}
