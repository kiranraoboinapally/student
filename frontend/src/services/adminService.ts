import { apiBase } from "../auth/AuthProvider";

export interface PendingUser {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Student {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
}

export interface Institute {
  institute_id?: number;
  id?: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  contact_number?: string;
  email?: string;
  established_year?: number;
}

export interface Course {
  course_id?: number;
  id?: number;
  course_name?: string;
  name?: string;
  course_code?: string;
  code?: string;
  duration_years?: number;
  institute_id?: number;
  description?: string;
}

export interface Subject {
  subject_id?: number;
  id?: number;
  subject_name?: string;
  name?: string;
  subject_code?: string;
  code?: string;
  credits?: number;
  course_id?: number;
  semester?: number;
}

export interface Faculty {
  faculty_id?: number;
  id?: number;
  faculty_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  qualification?: string;
  specialization?: string;
}

export interface Notice {
  notice_id?: number;
  id?: number;
  title: string;
  description: string;
  created_at: string;
  updated_at?: string;
}

export interface FeePayment {
  id?: number;
  student_id?: number;
  student_name?: string;
  amount_paid?: number;
  payment_date?: string;
  transaction_number?: string;
  fee_type?: string;
}

class AdminService {
  private authFetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(authFetch: (url: string, options?: RequestInit) => Promise<Response>) {
    this.authFetch = authFetch;
  }

  // Pending Users
  async getPendingUsers(): Promise<PendingUser[]> {
    const res = await this.authFetch(`${apiBase}/admin/pending-registrations`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.pending_registrations || [];
  }

  async approveUser(userId: number): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/approve-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: "approve" }),
    });
    if (!res.ok) throw new Error("Failed to approve user");
    return res.json();
  }

  async rejectUser(userId: number): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/approve-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action: "reject" }),
    });
    if (!res.ok) throw new Error("Failed to reject user");
    return res.json();
  }

  // Students
  async getStudents(page: number = 1, limit: number = 10): Promise<{ students: Student[]; total: number }> {
    const res = await this.authFetch(`${apiBase}/admin/students?page=${page}&limit=${limit}`);
    if (!res.ok) return { students: [], total: 0 };
    const data = await res.json();
    return {
      students: data.students || [],
      total: data.pagination?.total || 0,
    };
  }

  // Users
  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    const res = await this.authFetch(`${apiBase}/admin/users?page=${page}&limit=${limit}`);
    if (!res.ok) return { users: [], total: 0 };
    const data = await res.json();
    return {
      users: data.users || [],
      total: data.pagination?.total || 0,
    };
  }

  async createUser(userData: {
    username: string;
    email: string;
    full_name: string;
    role_id: number;
  }): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/users/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error("Failed to create user");
    return res.json();
  }

  // Institutes
  async getInstitutes(): Promise<Institute[]> {
    const res = await this.authFetch(`${apiBase}/admin/institutes`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.institutes || [];
  }

  async createInstitute(instituteData: Institute): Promise<{ success: boolean; message: string; id?: number }> {
    const res = await this.authFetch(`${apiBase}/admin/institutes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(instituteData),
    });
    if (!res.ok) throw new Error("Failed to create institute");
    return res.json();
  }

  async updateInstitute(id: number, instituteData: Institute): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/institutes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(instituteData),
    });
    if (!res.ok) throw new Error("Failed to update institute");
    return res.json();
  }

  async deleteInstitute(id: number): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/institutes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete institute");
    return res.json();
  }

  // Courses
  async getCourses(): Promise<Course[]> {
    const res = await this.authFetch(`${apiBase}/admin/courses`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.courses || [];
  }

  async createCourse(courseData: Course): Promise<{ success: boolean; message: string; id?: number }> {
    const res = await this.authFetch(`${apiBase}/admin/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData),
    });
    if (!res.ok) throw new Error("Failed to create course");
    return res.json();
  }

  async updateCourse(id: number, courseData: Course): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData),
    });
    if (!res.ok) throw new Error("Failed to update course");
    return res.json();
  }

  async deleteCourse(id: number): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/courses/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete course");
    return res.json();
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    const res = await this.authFetch(`${apiBase}/admin/subjects`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.subjects || [];
  }

  async createSubject(subjectData: Subject): Promise<{ success: boolean; message: string; id?: number }> {
    const res = await this.authFetch(`${apiBase}/admin/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subjectData),
    });
    if (!res.ok) throw new Error("Failed to create subject");
    return res.json();
  }

  async updateSubject(id: number, subjectData: Subject): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/subjects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subjectData),
    });
    if (!res.ok) throw new Error("Failed to update subject");
    return res.json();
  }

  async deleteSubject(id: number): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/subjects/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete subject");
    return res.json();
  }

  // Faculty
  async getFaculty(): Promise<Faculty[]> {
    const res = await this.authFetch(`${apiBase}/admin/faculty`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.faculty || [];
  }

  async createFaculty(facultyData: Faculty): Promise<{ success: boolean; message: string; id?: number }> {
    const res = await this.authFetch(`${apiBase}/admin/faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facultyData),
    });
    if (!res.ok) throw new Error("Failed to create faculty");
    return res.json();
  }

  async updateFaculty(id: number, facultyData: Faculty): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/faculty/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facultyData),
    });
    if (!res.ok) throw new Error("Failed to update faculty");
    return res.json();
  }

  async deleteFaculty(id: number): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/faculty/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete faculty");
    return res.json();
  }

  // Notices
  async getNotices(): Promise<Notice[]> {
    const res = await this.authFetch(`${apiBase}/admin/notices`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.notices || [];
  }

  async createNotice(noticeData: Notice): Promise<{ success: boolean; message: string; id?: number }> {
    const res = await this.authFetch(`${apiBase}/admin/notices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noticeData),
    });
    if (!res.ok) throw new Error("Failed to create notice");
    return res.json();
  }

  async updateNotice(id: number, noticeData: Notice): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/notices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(noticeData),
    });
    if (!res.ok) throw new Error("Failed to update notice");
    return res.json();
  }

  async deleteNotice(id: number): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/notices/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete notice");
    return res.json();
  }

  // Fee Payments
  async getFeePayments(): Promise<FeePayment[]> {
    const res = await this.authFetch(`${apiBase}/admin/fees/payments`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.payments || [];
  }

  // Admin aggregated stats
  async getAdminStats(): Promise<any> {
    const res = await this.authFetch(`${apiBase}/admin/stats`);
    if (!res.ok) return {};
    return res.json();
  }

  // Marks Upload
  async uploadMarks(marksData: any[]): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/admin/marks/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marks: marksData }),
    });
    if (!res.ok) throw new Error("Failed to upload marks");
    return res.json();
  }
}

export default AdminService;
