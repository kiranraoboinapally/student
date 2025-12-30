import { apiBase } from "../../auth/AuthProvider";

// Student Profile Type
export interface StudentProfile {
  user?: {
    full_name?: string;
    username?: string;
    email?: string;
    Mobile?: string;
  };
  master_student?: {
    enrollment_number?: string;
    EnrollmentNumber?: string;
    student_name?: string;
    StudentName?: string;
    course_name?: string;
    CourseName?: string;
    session?: string;
    Session?: string;
    batch?: string;
    Batch?: string;
    institute_name?: string;
    InstituteName?: string;
    father_name?: string;
    FatherName?: string;
    mother_name?: string;
    student_phone_number?: string;
    StudentPhoneNumber?: string;
    student_email_id?: string;
    StudentEmailID?: string;
  };
  act_student?: {
    CandidateName?: string;
    EnrollmentNumber?: string;
    CourseName?: string;
    StreamName?: string;
    YearSem?: string;
    center_name?: string;
    candidate_address?: string;
    mother_name?: string;
    father_name?: string;
    ContactNumber?: string;
    EmailID?: string;
  };
}

// Fee Item Type
export interface FeeItem {
  fee_due_id?: number;
  fee_type?: string;
  fee_head?: string;
  due_date?: string;
  original_amount?: number;
  amount_paid?: number;
  status?: string;
  balance?: number;
  transaction_number?: string;
  payment_status?: string;
  transaction_date?: string;
  created_at?: string;
}

// Attendance Item Type
export interface AttendanceItem {
  subject_name?: string;
  total_classes?: number;
  attended_classes?: number;
  percentage?: number;
}

export interface SubjectItem {
  subject_id?: number;
  subject_code?: string;
  subject_name?: string;
  subject_type?: string;
  credits?: number;
  semester?: number;
}

export interface MarkItem {
  mark_id?: number;
  subject_code?: string;
  subject_name?: string;
  total_marks?: number;
  percentage?: number;
  grade?: string;
  status?: string;
}

export interface NoticeItem {
  notice_id?: number;
  id?: number;
  title: string;
  description: string;
  created_at: string;
  updated_at?: string;
}

export interface LeaveItem {
  leave_id?: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: string;
  created_at?: string;
}

export interface TimetableItem {
  timetable_id?: number;
  id?: number;
  day: string;
  time_slot: string;
  subject_name?: string;
  faculty_name?: string;
  room_number?: string;
  session?: string;
}

export interface SemesterResult {
  semester: number;
  sgpa?: number;
  cgpa?: number;
  total_credits?: number;
  earned_credits?: number;
}

class StudentService {
  private authFetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(authFetch: (url: string, options?: RequestInit) => Promise<Response>) {
    this.authFetch = authFetch;
  }

  // Profile
  async getProfile(): Promise<StudentProfile> {
    const res = await this.authFetch(`${apiBase}/student/profile`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  }

  // Fees
  async getFeeSummary(): Promise<{ dues: FeeItem[]; history: FeeItem[] }> {
    const res = await this.authFetch(`${apiBase}/student/fees`);
    if (!res.ok) return { dues: [], history: [] };

    const data = await res.json();

    // Transform dues
    const dues: FeeItem[] = (data.dues || []).map((due: any) => ({
      fee_due_id: 0,
      fee_type: due.fee_type || due.FeeType,
      fee_head: due.fee_head || due.FeeHead,
      due_date: due.due_date || due.DueDate,
      original_amount: due.original_amount || due.OriginalAmount,
      amount_paid: due.amount_paid || due.AmountPaid,
      balance: (due.original_amount || due.OriginalAmount || 0) - (due.amount_paid || due.AmountPaid || 0),
      status: due.status || due.Status,
      transaction_number: due.transaction_number || due.TransactionNumber
    }));

    // Transform payments/history
    const history: FeeItem[] = (data.payments || []).map((payment: any) => ({
      fee_due_id: payment.id || payment.ID,
      fee_type: payment.fee_type || payment.Type,
      fee_head: payment.fee_head || payment.Head,
      original_amount: payment.original_amount || payment.OriginalAmount,
      amount_paid: payment.amount_paid || payment.AmountPaid,
      balance: 0,
      status: payment.payment_status || payment.Status,
      transaction_number: payment.transaction_number || payment.TransactionNo,
      transaction_date: payment.transaction_date || payment.TransactionDate,
      created_at: payment.created_at || payment.CreatedAt
    }));

    return { dues, history };
  }

  async getAllFees(): Promise<FeeItem[]> {
    const res = await this.authFetch(`${apiBase}/student/fees`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.fees || [];
  }

  // Attendance
  async getAttendance(): Promise<AttendanceItem[]> {
    const res = await this.authFetch(`${apiBase}/student/attendance`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.attendance || [];
  }

  // Subjects
  async getCurrentSemesterSubjects(): Promise<SubjectItem[]> {
    const res = await this.authFetch(`${apiBase}/student/subjects/current`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  // Marks
  async getCurrentSemesterMarks(): Promise<MarkItem[]> {
    const res = await this.authFetch(`${apiBase}/student/marks/current`);
    if (!res.ok) return [];
    const data = await res.json();

    return Array.isArray(data)
      ? data.map((m: any) => ({
        mark_id: m.MarkID || m.mark_id,
        subject_code: m.SubjectCode || m.subject_code,
        subject_name: m.SubjectName || m.subject_name,
        total_marks: m.TotalMarks || m.total_marks,
        percentage: m.Percentage || m.percentage,
        grade: m.Grade || m.grade,
        status: (m.Status || m.status || "").toLowerCase(),
      }))
      : [];
  }

  async getAllMarks(): Promise<MarkItem[]> {
    const res = await this.authFetch(`${apiBase}/student/marks/all`);
    if (!res.ok) return [];
    const data = await res.json();

    return Array.isArray(data)
      ? data.map((m: any) => ({
        mark_id: m.MarkID || m.mark_id,
        subject_code: m.SubjectCode || m.subject_code,
        subject_name: m.SubjectName || m.subject_name,
        total_marks: m.TotalMarks || m.total_marks,
        percentage: m.Percentage || m.percentage,
        grade: m.Grade || m.grade,
        status: (m.Status || m.status || "").toLowerCase(),
      }))
      : [];
  }

  async getSemesterResults(): Promise<SemesterResult[]> {
    const res = await this.authFetch(`${apiBase}/student/results/semester`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  // Notices
  async getNotices(): Promise<NoticeItem[]> {
    const res = await this.authFetch(`${apiBase}/student/notices`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.notices || [];
  }

  // Leaves
  async applyLeave(leaveData: {
    leave_type: string;
    from_date: string;
    to_date: string;
    reason: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/student/leaves/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leaveData),
    });
    if (!res.ok) throw new Error("Failed to apply leave");
    return res.json();
  }

  async getLeaves(): Promise<LeaveItem[]> {
    const res = await this.authFetch(`${apiBase}/student/leaves`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.leaves || [];
  }

  // Timetable
  async getTimetable(): Promise<TimetableItem[]> {
    const res = await this.authFetch(`${apiBase}/student/timetable`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.timetable || [];
  }

  // Payment
  async requestPayment(feeId: number, amount: number): Promise<{ order_id: string; amount: number }> {
    const res = await this.authFetch(`${apiBase}/student/fees/request-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fee_due_id: feeId, amount }),
    });
    if (!res.ok) throw new Error("Failed to create payment order");
    return res.json();
  }

  async verifyPayment(paymentData: {
    order_id: string;
    payment_id: string;
    signature: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await this.authFetch(`${apiBase}/student/fees/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) throw new Error("Failed to verify payment");
    return res.json();
  }
}

export default StudentService;
