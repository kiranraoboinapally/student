I'm building a **university ERP system** with the following stack:
- **Frontend**: React.js (functional components, hooks, React Router)
- **Backend**: Golang (using Gin or Echo — flexible)
- **Database**: MySQL
- **Models**: Defined in `models.go` using GORM
- **Authentication**: JWT-based, role-based access
- **Roles**: University Admin, Institute (College) Admin, Faculty, Student

🎯 My goal:
I want to **preserve the exact same UI design, layout, components, and landing page** — no redesign.  
But I need to **correct the workflow logic** to match real-world university operations.

Currently, the **University Admin** can:
- Upload marks
- Mark attendance

❌ This is wrong.

✅ In reality:
- Only **Faculty (at affiliated college level)** should:
   - Mark attendance
   - Upload internal marks (MSEs, assignments)
- The **University Admin** should only:
   - Approve, lock, and publish marks
   - Create master fee types (Registration, Exam, Miscellaneous)
   - Define course-streams (from courses_streams table)
   - Approve which colleges can offer which course-streams
   - Approve faculty accounts created by colleges
   - Publish final results
   - View real-time dashboards (enrollments, fees, performance)

- **Institute Admin** should:
   - Add students (university-format roll number)
   - Request to offer new course-streams
   - Add faculty (pending university approval)
   - Collect fees (but not define them)
   - Monitor attendance & internals



📌 UI Rule:
- Do **NOT change the look, style, or structure** of the dashboard
- Reuse existing components: `DashboardCard`, `DataTable`, `Sidebar`, `Navbar`
- Only change **what is shown based on role**
- Same landing page: "Login as University | Institute | Faculty | Student"

👉 Ask me for:
1. The `models.go` file (I’ll provide)
2. Current Golang routes (I’ll share)
3. Auth middleware logic

Then, give me:
1. ✅ **Updated GORM models (if needed)** — especially for linking:  
   - `course_streams` → `college` → `faculty` → `student`
   - `fees` (master list vs. student instance)
   - `internal_marks` with status (draft, submitted, locked)

2. ✅ **Role-Protected API Routes** (method, path, required role):  
   - e.g., `POST /api/faculty/attendance` → allowed only for `faculty`
   - `POST /api/university/lock-marks` → only `university`
   - `GET /api/student/marks` → visible to `student`, `faculty`, `institute`, `university` (with filters)

3. ✅ **Golang Middleware** example:  
   - `middleware.RequireRole("university")`
   - `middleware.CollegeBelongsToUser()` for security

4. ✅ **React Conditional Rendering** guide:  
   - How to keep same `<DashboardCard>` but show:
     - Marks form → only for `faculty`
     - Lock button → only for `university`
     - Approval queue → for `university`
   - Using `useAuth()` context

5. ✅ **Workflow Logic** (no code, just flow):
   - From faculty marking attendance → student sees it
   - From internal marks entry → college submits → university locks
   - Student OTP-based activation → set password → dashboard
   - Fee creation (university) → applied to students → payment → status sync

6. ✅ Optional:  
   - How to display "Pending Approvals" count on university dashboard
   - Real-time toast/alert when marks are locked

Keep everything practical, clean, and production-ready.  
Preserve my UI style **100%** — only the behavior and access control should evolve.







----


University ERP Role-Based Workflow Correction
Objective
Correct the workflow logic to match real-world university operations while preserving the exact same UI design, layout, components, and landing page.

Tasks
1. Database Models Enhancement
Analyze existing models in 
models.go
 Add InternalMark model with status (draft, submitted, locked)
 Add CollegeCourseApproval model for college-course-stream approvals
 Add FacultyApproval model for faculty account approvals
 Add MasterFeeType model for university-defined fee types
 Link Faculty to Institute properly
2. Backend Route Restructuring
 Move attendance/marks upload from /admin to /faculty routes
 Add university-only routes for locking/publishing marks
 Add approval workflow routes (faculty approval, course-stream approval)
 Add institute routes for adding students/faculty with pending status
 Update middleware to enforce role-based access
3. Frontend Conditional Rendering
 Move AcademicUploads component from Admin to Faculty dashboard
 Add approval queue section to Admin dashboard
 Add "Lock Marks" / "Publish Results" buttons in Admin dashboard
 Update Institute dashboard with faculty/student management
 Ensure existing UI components remain unchanged visually
4. Workflow Logic Implementation
 Faculty marks attendance → Student sees it flow
 Internal marks entry → College submits → University locks flow
 Faculty approval workflow (Institute creates → University approves)
 Fee creation and application workflow
5. Testing & Verification
 Test role-based access control
 Verify workflow transitions
 Ensure UI remains visually identical

 ---