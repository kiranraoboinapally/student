import { apiBase } from "../../auth/AuthProvider";

// ==================== Types ====================

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
    student_name?: string;
    course_name?: string;
    session?: string;
    batch?: string;
    institute_name?: string;
    father_name?: string;
    mother_name?: string;
    student_phone_number?: string;
    student_email_id?: string;
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
  title: string;
  description: string;
  created_at: string;
  updated_at?: string;
}

// ==================== Leave Types ====================

export interface LeaveItem {
  leave_id?: number;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: string;
  created_at?: string;
}

export interface LeaveApplyData {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

// ==================== Other Types ====================

export interface TimetableItem {
  timetable_id?: number;
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

// ==================== Service ====================

class StudentService {
  private authFetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(authFetch: (url: string, options?: RequestInit) => Promise<Response>) {
    this.authFetch = authFetch;
  }

  // ---------------- Profile ----------------
  async getProfile(): Promise<StudentProfile> {
    const res = await this.authFetch(`${apiBase}/student/profile`);
    if (!res.ok) throw new Error("Failed to fetch profile");
    return res.json();
  }

  // ---------------- Fees ----------------
  async getFeeSummary(): Promise<{ dues: FeeItem[]; history: FeeItem[] }> {
    const res = await this.authFetch(`${apiBase}/student/fees`);
    if (!res.ok) return { dues: [], history: [] };
    const data = await res.json();

    const dues: FeeItem[] = (data.dues || []).map((d: any) => ({
      fee_due_id: d.fee_due_id || d.ID,
      fee_type: d.fee_type || d.FeeType,
      fee_head: d.fee_head || d.FeeHead,
      due_date: d.due_date || d.DueDate,
      original_amount: d.original_amount || d.OriginalAmount,
      amount_paid: d.amount_paid || d.AmountPaid,
      balance: (d.original_amount || d.OriginalAmount || 0) - (d.amount_paid || d.AmountPaid || 0),
      status: d.status || d.Status,
      transaction_number: d.transaction_number || d.TransactionNumber,
    }));

    const history: FeeItem[] = (data.payments || []).map((p: any) => ({
      fee_due_id: p.fee_due_id || p.ID,
      fee_type: p.fee_type || p.Type,
      fee_head: p.fee_head || p.Head,
      original_amount: p.original_amount || p.OriginalAmount,
      amount_paid: p.amount_paid || p.AmountPaid,
      balance: 0,
      status: p.payment_status || p.Status,
      transaction_number: p.transaction_number || p.TransactionNo,
      transaction_date: p.transaction_date || p.TransactionDate,
      created_at: p.created_at || p.CreatedAt,
    }));

    return { dues, history };
  }

  async getAllFees(): Promise<FeeItem[]> {
    const res = await this.authFetch(`${apiBase}/student/fees`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.fees || [];
  }

  // ---------------- Attendance ----------------
  async getAttendance(): Promise<AttendanceItem[]> {
    const res = await this.authFetch(`${apiBase}/student/attendance`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.attendance || [];
  }

  // ---------------- Subjects ----------------
  async getCurrentSemesterSubjects(): Promise<SubjectItem[]> {
    const res = await this.authFetch(`${apiBase}/student/subjects/current`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  // ---------------- Marks ----------------
  async getCurrentSemesterMarks(): Promise<MarkItem[]> {
    const res = await this.authFetch(`${apiBase}/student/marks/current`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data)
      ? data.map((m: any) => ({
          mark_id: m.mark_id || m.MarkID,
          subject_code: m.subject_code || m.SubjectCode,
          subject_name: m.subject_name || m.SubjectName,
          total_marks: m.total_marks || m.TotalMarks,
          percentage: m.percentage || m.Percentage,
          grade: m.grade || m.Grade,
          status: (m.status || m.Status || "").toLowerCase(),
        }))
      : [];
  }

  async getAllMarks(): Promise<MarkItem[]> {
    const res = await this.authFetch(`${apiBase}/student/marks/all`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data)
      ? data.map((m: any) => ({
          mark_id: m.mark_id || m.MarkID,
          subject_code: m.subject_code || m.SubjectCode,
          subject_name: m.subject_name || m.SubjectName,
          total_marks: m.total_marks || m.TotalMarks,
          percentage: m.percentage || m.Percentage,
          grade: m.grade || m.Grade,
          status: (m.status || m.Status || "").toLowerCase(),
        }))
      : [];
  }

  async getSemesterResults(): Promise<SemesterResult[]> {
    const res = await this.authFetch(`${apiBase}/student/results/semester`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }

  // ---------------- Notices ----------------
  async getNotices(): Promise<NoticeItem[]> {
    const res = await this.authFetch(`${apiBase}/student/notices`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  // ---------------- Leaves ----------------
  async applyLeave(leaveData: LeaveApplyData & { leave_type?: string }): Promise<{ success: boolean; message: string }> {
    const payload = {
      start_date: leaveData.start_date,
      end_date: leaveData.end_date,
      reason: leaveData.reason,
      leave_type: leaveData.leave_type || "Default", // optional for backend
    };
    const res = await this.authFetch(`${apiBase}/student/leaves/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Apply leave error:", errText);
      throw new Error("Failed to apply leave");
    }
    return res.json();
  }

  async getLeaves(): Promise<LeaveItem[]> {
    const res = await this.authFetch(`${apiBase}/student/leaves`);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data || []).map((leave: any) => ({
      leave_id: leave.leave_id,
      leave_type: leave.leave_type || "Default",
      from_date: leave.start_date,
      to_date: leave.end_date,
      reason: leave.reason,
      status: leave.status,
      created_at: leave.created_at,
    }));
  }

  // ---------------- Timetable ----------------
  async getTimetable(): Promise<TimetableItem[]> {
    const res = await this.authFetch(`${apiBase}/student/timetable`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  }

  // ---------------- Payment ----------------
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
