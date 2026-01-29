import { apiBase } from "../../auth/AuthProvider";

// ======================= CORE INTERFACES =======================
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PendingUser {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  status: string;
  created_at?: string;
}

export interface Institute {
  institute_id?: number;
  institute_code?: string;
  institute_name: string;
  institute_type?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_number?: string;
  status?: string;
  created_at?: string;
}

// Original Course interface (for future use when you have a real courses table)
export interface Course {
  course_id?: number;
  name: string;
  code?: string;
  duration_years?: number;
  institute_id?: number;
  status?: string;
}

// NEW: Interface matching the actual backend response from GetCoursesByInstitute
export interface CourseFromStudents {
  name: string;
  student_count: number;
  program_pattern?: string | null;
  duration_years?: number | null;
}

export interface Subject {
  subject_id?: number;
  subject_code: string;
  subject_name: string;
  subject_type?: string;
  credits?: number;
  semester?: number;
  course_id?: number;
  is_active?: boolean;
}

export interface Faculty {
  faculty_id?: number;
  user_id?: number;
  faculty_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
}

export interface Notice {
  notice_id?: number;
  title: string;
  description: string;
  created_at: string;
  priority?: "low" | "medium" | "high";
}

export interface Student {
  student_id?: number;
  enrollment_number: number;
  full_name: string;
  student_name?: string;
  father_name?: string;
  email?: string;
  student_email_id?: string;
  phone?: string;
  institute_id?: number;
  institute_name?: string;
  course_id?: number;
  course_name?: string;
  status?: string;
  student_status?: string;
  session?: string;
  batch?: string;
  program_pattern?: string;
  program_duration?: number;
  username?: string;
  user_id?: number;
}

export interface FeePayment {
  payment_id: number;
  enrollment_number?: number;
  student_name?: string;
  fee_amount?: number;
  transaction_number?: string;
  transaction_date?: string;
  status?: string;
  display_status: string;
  source: string;
  institute_name?: string;
  course_name?: string;
  semester?: number;
  program_pattern?: string;
}

export interface AdminStats {
  total_institutes: number;
  total_students: number;
  total_active_students: number;
  total_courses: number;
  passed_students_count: number;
  total_fees_paid: number;
  total_expected_fees: number;
  total_pending_fees: number;
}

// ======================= ADMIN SERVICE =======================
class AdminService {
  private authFetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(authFetch: (url: string, options?: RequestInit) => Promise<Response>) {
    this.authFetch = authFetch;
  }

  // ======================= PENDING REGISTRATIONS =======================
  async getPendingUsers(page: number = 1, limit: number = 10) {
    const res = await this.authFetch(
      `${apiBase}/admin/pending-registrations?page=${page}&limit=${limit}`
    );
    if (!res.ok) return { pending_registrations: [], pagination: { page, limit, total: 0, total_pages: 0 } };

    const data = await res.json();
    return {
      pending_registrations: data.pending_registrations || [],
      pagination: data.pagination,
    };
  }

  async approveRegistration(userId: number, action: "approve" | "reject") {
    const res = await this.authFetch(`${apiBase}/admin/approve-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to ${action} registration: ${error}`);
    }

    return res.json();
  }

  // ======================= STUDENTS =======================
  async getStudents(params: {
    page?: number;
    limit?: number;
    institute_id?: number;
    course_id?: number;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));
    if (params.institute_id) query.append("institute_id", String(params.institute_id));
    if (params.course_id) query.append("course_id", String(params.course_id));
    if (params.search) query.append("search", params.search);

    const res = await this.authFetch(`${apiBase}/admin/students?${query.toString()}`);
    if (!res.ok) {
      return { students: [], pagination: { page: 1, limit: 50, total: 0, total_pages: 0 } };
    }
    return res.json();
  }

  // ======================= USERS =======================
  async getAllUsers(page: number = 1, limit: number = 20) {
    const res = await this.authFetch(`${apiBase}/admin/users?page=${page}&limit=${limit}`);
    if (!res.ok) return { data: [], pagination: { page, limit, total: 0, total_pages: 0 } };

    return res.json();
  }

  async createStudentLogin(data: {
    enrollment_number: string;
    email: string;
    temp_password: string;
  }) {
    const res = await this.authFetch(`${apiBase}/admin/users/create-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create student login");
    return res.json();
  }

  // ======================= INSTITUTES =======================
  async getInstitutes(page: number = 1, limit: number = 20) {
    const res = await this.authFetch(`${apiBase}/admin/institutes?page=${page}&limit=${limit}`);
    if (!res.ok) return { data: [], pagination: { page, limit, total: 0, total_pages: 0 } };
    return res.json();
  }

  async getInstituteDetail(id: number) {
    const res = await this.authFetch(`${apiBase}/admin/institutes/${id}/detail`);
    if (!res.ok) throw new Error("Failed to fetch institute details");
    return res.json();
  }

  // Updated to return derived courses from student data
  async getCoursesByInstitute(instituteId: number): Promise<{ courses: CourseFromStudents[] }> {
    const res = await this.authFetch(`${apiBase}/admin/institutes/${instituteId}/courses`);
    if (!res.ok) throw new Error("Failed to fetch courses for this institute");

    const data = await res.json();
    return { courses: data.courses || [] };
  }

  // ======================= FEE PAYMENTS =======================
  async getFeePayments(
    page: number = 1,
    limit: number = 20,
    filters?: {
      enrollment_number?: string;
      institute_name?: string;
      status?: string;
      source?: string;
    }
  ) {
    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("limit", String(limit));
    if (filters?.enrollment_number) query.set("enrollment_number", filters.enrollment_number);
    if (filters?.institute_name) query.set("institute_name", filters.institute_name);
    if (filters?.status) query.set("status", filters.status);
    if (filters?.source) query.set("source", filters.source);

    const res = await this.authFetch(
      `${apiBase}/admin/fees/payments?${query.toString()}`
    );

    if (!res.ok) {
      return {
        payments: [],
        total_records: 0,
        pagination: { page, limit, total: 0, total_pages: 0 },
      };
    }

    const data = await res.json();
    return {
      payments: data.payments || [],
      total_records: data.total_records || 0,
      pagination: data.pagination,
    };
  }

  async verifyPayment(
    paymentId: number,
    source: "registration" | "examination" | "miscellaneous",
    action: "verify" | "reject" = "verify"
  ) {
    const res = await this.authFetch(`${apiBase}/admin/fees/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payment_id: paymentId,
        source,
        action,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to ${action} payment: ${err}`);
    }

    return res.json();
  }


  // ======================= MARKS & ATTENDANCE =======================
  async uploadMarks(marks: Array<{
    enrollment_number: number;
    subject_code: string;
    semester: number;
    marks_obtained: number;
    grade?: string;
    status: "internal" | "external";
  }>) {
    const res = await this.authFetch(`${apiBase}/admin/marks/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marks }),
    });

    if (!res.ok) throw new Error("Failed to upload marks");
    return res.json();
  }

  async uploadAttendance(records: Array<{
    enrollment_number: number;
    date: string;
    present: boolean;
    subject_code?: string;
  }>) {
    const res = await this.authFetch(`${apiBase}/admin/attendance/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });

    if (!res.ok) throw new Error("Failed to upload attendance");
    return res.json();
  }

  async getAttendanceSummary(filters?: { institute_id?: string; institute_name?: string }) {
    const query = new URLSearchParams();
    if (filters?.institute_id) query.set("institute_id", filters.institute_id);
    if (filters?.institute_name) query.set("institute_name", filters.institute_name);

    const res = await this.authFetch(`${apiBase}/admin/attendance/summary?${query.toString()}`);
    if (!res.ok) return { total_records: 0, present: 0, absent: 0, attendance_percent: 0 };
    return res.json();
  }

  // ======================= FEE STRUCTURE & DUE =======================
  async createFeeStructure(data: {
    course_name?: string;
    session?: string;
    batch?: string;
    program_pattern?: string;
    fee_amount: number;
    effective_from?: string;
    effective_to?: string;
  }) {
    const res = await this.authFetch(`${apiBase}/admin/fee-structure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create fee structure");
    return res.json();
  }

  async createFeeDue(data: {
    enrollment_number: number;
    fee_head: string;
    original_amount: number;
    due_date?: string;
  }) {
    const res = await this.authFetch(`${apiBase}/admin/fees/due`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create fee due");
    return res.json();
  }

  // ======================= ADMIN STATS =======================
  async getAdminStats(): Promise<AdminStats> {
    const res = await this.authFetch(`${apiBase}/admin/stats`);
    if (!res.ok) return {
      total_institutes: 0,
      total_students: 0,
      total_active_students: 0,
      total_courses: 0,
      passed_students_count: 0,
      total_fees_paid: 0,
      total_expected_fees: 0,
      total_pending_fees: 0,
    };

    return res.json();
  }

  // ======================= GRADING SYSTEM =======================
  async getGradingRules() {
    const res = await this.authFetch(`${apiBase}/admin/grading-rules`);
    if (!res.ok) return [];
    return res.json();
  }

  async createGradingRule(data: {
    marks_percent: string;
    grade: string;
    grade_points: string;
    remarks?: string;
  }) {
    const res = await this.authFetch(`${apiBase}/admin/grading-rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create grading rule");
    return res.json();
  }

  async updateGradingRule(id: number, data: any) {
    const res = await this.authFetch(`${apiBase}/admin/grading-rules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update grading rule");
    return res.json();
  }

  async deleteGradingRule(id: number) {
    const res = await this.authFetch(`${apiBase}/admin/grading-rules/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete grading rule");
    return res.json();
  }

  // ======================= INSTITUTE CRUD =======================
  async createInstitute(data: Institute) {
    const res = await this.authFetch(`${apiBase}/admin/institutes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create institute");
    return res.json();
  }

  async updateInstitute(id: number, data: Institute) {
    const res = await this.authFetch(`${apiBase}/admin/institutes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update institute");
    return res.json();
  }

  async deleteInstitute(id: number) {
    const res = await this.authFetch(`${apiBase}/admin/institutes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete institute");
    return res.json();
  }

  // ======================= ACADEMIC RULES =======================
  async getAcademicRules() {
    const res = await this.authFetch(`${apiBase}/admin/academic-rules`);
    if (!res.ok) return { rules: "" };
    return res.json();
  }

  async updateAcademicRules(rules: string) {
    const res = await this.authFetch(`${apiBase}/admin/academic-rules`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    });
    if (!res.ok) throw new Error("Failed to update academic rules");
    return res.json();
  }

  // ======================= FEE MANAGEMENT =======================
  async bulkUpdateExpectedFees(data: {
    institute_id?: number;
    institute_name?: string;
    course_name?: string;
    batch?: string;
    session?: string;
    expected_exam_fee?: number;
    expected_registration_fee?: number;
    expected_misc_fee?: number;
  }) {
    const res = await this.authFetch(`${apiBase}/admin/fees/bulk-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to bulk update fees");
    return res.json();
  }

  async getFeeOverview(filters?: {
    page?: number;
    limit?: number;
    institute_id?: string;
    institute_name?: string;
    course_name?: string;
    session?: string;
    status?: string;
  }) {
    const query = new URLSearchParams();
    if (filters?.page) query.set("page", String(filters.page));
    if (filters?.limit) query.set("limit", String(filters.limit));
    if (filters?.institute_id) query.set("institute_id", filters.institute_id);
    if (filters?.institute_name) query.set("institute_name", filters.institute_name);
    if (filters?.course_name) query.set("course_name", filters.course_name);
    if (filters?.session) query.set("session", filters.session);
    if (filters?.status) query.set("status", filters.status);

    const res = await this.authFetch(`${apiBase}/admin/fees/overview?${query.toString()}`);
    if (!res.ok) return { data: [], pagination: { page: 1, limit: 50, total: 0, total_pages: 0 } };
    return res.json();
  }

  async getPaymentVerificationQueue(source: string = "registration", instituteFilter?: string) {
    const query = new URLSearchParams();
    query.set("source", source);
    if (instituteFilter) query.set("institute_name", instituteFilter);

    const res = await this.authFetch(`${apiBase}/admin/fees/verification-queue?${query.toString()}`);
    if (!res.ok) return { payments: [], pagination: { page: 1, limit: 50, total: 0, total_pages: 0 } };
    return res.json();
  }
}

export default AdminService;