import React, { useState, useEffect } from "react";
import { useAuth, apiBase } from "../auth/AuthProvider";

interface Student {
  student_id: number;
  student_name: string;
  father_name: string;
  student_email_id: string;
  enrollment_number: number;
  // add other fields as needed
}

export default function AdminDashboard(): JSX.Element {
  const { authFetch } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_name: "",
    father_name: "",
    student_email_id: "",
    // ... other fields
  });
  const [dobInputs, setDobInputs] = useState<{ [key: number]: string }>({});

  // Fetch students
  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${apiBase}/admin/students`);
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Add new student
  const addStudent = async () => {
    try {
      await authFetch(`${apiBase}/admin/students/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      setNewStudent({ student_name: "", father_name: "", student_email_id: "" });
      loadStudents();
    } catch (err) {
      console.error(err);
    }
  };

  // Generate enrollment number
  const generateEnrollment = async (id: number) => {
    try {
      await authFetch(`${apiBase}/admin/students/generate-enrollment/${id}`, {
        method: "PUT",
      });
      loadStudents();
    } catch (err) {
      console.error(err);
    }
  };

  // Activate login using DOB
  const activateLogin = async (id: number) => {
    const dob = dobInputs[id];
    if (!dob) return alert("Enter DOB in ddmmyyyy format");
    try {
      await authFetch(`${apiBase}/admin/students/activate-login/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dob }),
      });
      setDobInputs(prev => ({ ...prev, [id]: "" }));
      loadStudents();
    } catch (err) {
      console.error(err);
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
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.student_id} className="odd:bg-gray-50">
              <td className="border px-2 py-1">{s.student_id}</td>
              <td className="border px-2 py-1">{s.student_name}</td>
              <td className="border px-2 py-1">{s.enrollment_number || "0"}</td>
              <td className="border px-2 py-1 space-x-2">
                {s.enrollment_number === 0 && (
                  <button
                    onClick={() => generateEnrollment(s.student_id)}
                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  >
                    Generate Enrollment
                  </button>
                )}
                {s.enrollment_number > 0 && (
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
          ))}
        </tbody>
      </table>

      {loading && <p className="mt-2 text-gray-500">Loading...</p>}
    </div>
  );
}
