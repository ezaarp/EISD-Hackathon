# 🚀 LMS Praktikum - Development Guide

## 📋 What's Been Built

### ✅ Completed Core Infrastructure

1. **Project Setup**
   - ✅ Next.js 14 with App Router
   - ✅ TypeScript configuration
   - ✅ TailwindCSS with custom pixel theme
   - ✅ ESLint & PostCSS setup

2. **Database & ORM**
   - ✅ Complete Prisma schema with all 20+ models
   - ✅ All relationships defined (User, Course, Shift, Plotting, ModuleWeek, Task, Question, LiveSession, LiveStage, Attendance, Submission, Grade, Penalty, Violation, PermissionRequest, Announcement, Ticket, Rating, Media, AuditLog, SystemSetting)
   - ✅ Enum definitions for all types
   - ✅ Seed script with dummy data

3. **Authentication & Authorization**
   - ✅ NextAuth.js v4 setup with Credentials provider
   - ✅ Bcrypt password hashing
   - ✅ Session management with JWT
   - ✅ Type-safe auth with TypeScript
   - ✅ Protected routes with middleware

4. **RBAC (Role-Based Access Control)**
   - ✅ Permission system untuk 10 roles
   - ✅ Helper functions: `can()`, `canAny()`, `canAll()`, `hasRole()`
   - ✅ Route protection middleware
   - ✅ Fine-grained permissions per action

5. **Audit Logging**
   - ✅ `createAuditLog()` helper
   - ✅ Query functions untuk audit history
   - ✅ JSON storage untuk before/after state

6. **Supabase Integration**
   - ✅ Client setup (client + admin)
   - ✅ File upload/delete helpers
   - ✅ Public URL generation
   - ⚠️ **Need**: Actual Supabase project connection

7. **UI Components (Pixel Style)**
   - ✅ PixelButton with variants
   - ✅ PixelCard with title labels
   - ✅ StatusBar (HP/XP style)
   - ✅ Timer component with auto-countdown
   - ✅ Loading component
   - ✅ Global CSS with pixel utilities

8. **Layouts**
   - ✅ Root layout with Press Start 2P font
   - ✅ DashboardLayout with sidebar navigation
   - ✅ Responsive mobile menu

9. **Pages**
   - ✅ Landing page
   - ✅ Login page with role icons
   - ✅ Dashboard router (redirect by role)
   - ⚠️ **Need**: Individual dashboard pages for each role

## 🏗️ What Needs to Be Built

### Priority 1: Core Dashboards (MUST HAVE for Demo)

#### 1. LABORAN Dashboard
**Path**: `app/dashboard/laboran/page.tsx`

Features needed:
- [ ] View all courses (table/grid)
- [ ] Create new course form
- [ ] Create shifts for course
- [ ] Set enroll password per course
- [ ] View course statistics

API Routes needed:
- [ ] `POST /api/courses` - Create course
- [ ] `GET /api/courses` - List courses
- [ ] `POST /api/shifts` - Create shift
- [ ] `PUT /api/courses/[id]` - Update course

#### 2. SEKRETARIS Dashboard
**Path**: `app/dashboard/sekretaris/page.tsx`

Features needed:
- [ ] Bulk create praktikan (textarea input with NIM list)
- [ ] View all users (filterable by role)
- [ ] Create plotting (assign asisten to shift)
- [ ] Assign students to plotting
- [ ] Export attendance/grades (CSV)

API Routes needed:
- [ ] `POST /api/users/bulk` - Bulk create users
- [ ] `GET /api/users` - List users
- [ ] `POST /api/plotting` - Create plotting
- [ ] `POST /api/student-assignments` - Assign students
- [ ] `GET /api/export/attendance` - Export data

#### 3. PUBLIKASI Dashboard
**Path**: `app/dashboard/publikasi/page.tsx`

Features needed:
- [ ] View modules per course
- [ ] Upload materials (PDF, Video, PPT, ZIP)
- [ ] Create tasks (TP, Pretest, Jurnal, Posttest)
- [ ] Create questions (MCQ, Code-based)
- [ ] Input answer keys & rubrics
- [ ] **Live Session Control Panel** (most important!)
  - [ ] Start/Pause/End session
  - [ ] Change stage (OPENING → ABSEN → PRETEST → JURNAL → POSTTEST → FEEDBACK)
  - [ ] Override timer
  - [ ] Broadcast messages
  - [ ] Monitor student status
- [ ] Create announcements

API Routes needed:
- [ ] `POST /api/modules` - Create module
- [ ] `POST /api/contents` - Upload material
- [ ] `POST /api/tasks` - Create task
- [ ] `POST /api/questions` - Create question
- [ ] `POST /api/live-sessions` - Start session
- [ ] `PUT /api/live-sessions/[id]/stage` - Change stage
- [ ] `POST /api/announcements` - Create announcement

#### 4. PRAKTIKAN Dashboard
**Path**: `app/dashboard/praktikan/page.tsx`

Features needed:
- [ ] View enrolled courses
- [ ] Enroll to course (with password)
- [ ] View schedule & announcements
- [ ] Download materials
- [ ] **Submit TP** (code editor or upload)
- [ ] **Live Session View** (join when active)
  - [ ] Countdown timer (synced with server)
  - [ ] Stage-specific UI:
    - PRETEST: MCQ form
    - JURNAL: Code editor with autosave
    - POSTTEST: MCQ form
    - FEEDBACK: Rating form
- [ ] View grades
- [ ] Submit permission requests
- [ ] Rate asisten/praktikum/modul

API Routes needed:
- [ ] `POST /api/enrollments` - Enroll course
- [ ] `GET /api/my-courses` - Get enrolled courses
- [ ] `POST /api/submissions` - Submit assignment
- [ ] `GET /api/live-sessions/active` - Check active session
- [ ] `POST /api/ratings` - Submit rating

#### 5. ASISTEN Dashboard
**Path**: `app/dashboard/asisten/page.tsx`

Features needed:
- [ ] View assigned students (by plotting)
- [ ] View submissions per student
- [ ] Grade submissions (manual or approve AI)
- [ ] Give feedback
- [ ] View ratings from students
- [ ] Monitor live session (assistant view)

API Routes needed:
- [ ] `GET /api/my-students` - Get assigned students
- [ ] `GET /api/submissions/pending` - Pending grades
- [ ] `PUT /api/grades/[id]` - Approve/modify grade
- [ ] `POST /api/feedback` - Give feedback

#### 6. KOMDIS Dashboard
**Path**: `app/dashboard/komdis/page.tsx`

Features needed:
- [ ] **Attendance marking UI** (during live session)
- [ ] View violations
- [ ] Create violation report (with evidence upload)
- [ ] Approve/reject permission requests
- [ ] View penalty history
- [ ] Override penalties

API Routes needed:
- [ ] `POST /api/attendance` - Mark attendance
- [ ] `POST /api/violations` - Create violation
- [ ] `PUT /api/permission-requests/[id]` - Approve/reject
- [ ] `POST /api/penalties/override` - Override penalty

### Priority 2: Real-time Features

#### Supabase Realtime Integration
**File**: `lib/realtime.ts`

Features needed:
- [ ] Subscribe to live session changes
- [ ] Broadcast stage changes to all clients
- [ ] Sync timer across all users
- [ ] Notify students when stage changes

Example implementation:
```typescript
// Subscribe to session changes
const channel = supabase
  .channel(`live-session-${sessionId}`)
  .on('broadcast', { event: 'stage_change' }, (payload) => {
    // Update UI with new stage
  })
  .subscribe();
```

### Priority 3: Auto-Grading System

#### AI Grader Interface
**File**: `lib/grader/index.ts`

Features needed:
- [ ] Rule-based grader for code (string matching, regex)
- [ ] MCQ grader (simple comparison)
- [ ] Interface for future AI integration (OpenAI/Gemini)
- [ ] Rubric scoring system

Example:
```typescript
interface Grader {
  grade(submission: Submission, answerKey: AnswerKey): Promise<GradeResult>;
}

class RuleBasedGrader implements Grader {
  async grade(submission, answerKey) {
    // Compare submission with answer key
    // Apply rubric
    // Return score + breakdown
  }
}
```

### Priority 4: File Upload System

#### Upload to Supabase Storage
**File**: `app/api/upload/route.ts`

Features needed:
- [ ] Handle multipart/form-data
- [ ] Validate file types (PDF, ZIP, JPG, PNG, MP4)
- [ ] Upload to appropriate bucket
- [ ] Return public URL
- [ ] Store metadata in database

### Priority 5: Export System

#### CSV/PDF Export
**Files**: `app/api/export/...`

Features needed:
- [ ] Export attendance as CSV
- [ ] Export grades as CSV
- [ ] Generate Berita Acara PDF (template)
- [ ] Export violation reports

## 🧪 Testing Checklist

Before demo, test this flow:

1. **Setup** (do once)
   ```bash
   # Setup database
   npm run db:push
   npm run db:seed

   # Start dev server
   npm run dev
   ```

2. **LABORAN** flow:
   - [ ] Login as LAB001
   - [ ] View existing course "WAD2025-SI4801"
   - [ ] (Optional) Create new course

3. **SEKRETARIS** flow:
   - [ ] Login as SEK001
   - [ ] View existing 30 praktikan users
   - [ ] View plotting assignments
   - [ ] (Optional) Add more users

4. **PUBLIKASI** flow:
   - [ ] Login as PUB001
   - [ ] View Module 1
   - [ ] View materials
   - [ ] **Start live session** (most critical!)
   - [ ] Control stages
   - [ ] Monitor students

5. **PRAKTIKAN** flow:
   - [ ] Login as 1202204001
   - [ ] View enrolled course
   - [ ] Join live session (when started by publikasi)
   - [ ] Complete pretest
   - [ ] Complete jurnal with autosave
   - [ ] Complete posttest
   - [ ] Submit feedback

6. **KOMDIS** flow:
   - [ ] Login as KOM001
   - [ ] Mark attendance during ABSEN stage
   - [ ] View violations

7. **ASISTEN** flow:
   - [ ] Login as AST001
   - [ ] View assigned students
   - [ ] Grade submissions
   - [ ] View ratings

## 🚧 Known Limitations & TODOs

### Security
- [ ] Add rate limiting (use upstash/redis)
- [ ] Add CSRF protection (NextAuth handles basic)
- [ ] Add input sanitization (use Zod schemas)
- [ ] Add file size limits
- [ ] Add virus scanning for uploads

### Performance
- [ ] Add caching (React Query or SWR)
- [ ] Optimize database queries (add indexes)
- [ ] Implement pagination for large lists
- [ ] Add loading states everywhere

### UX
- [ ] Add toast notifications (react-hot-toast)
- [ ] Add confirmation modals for destructive actions
- [ ] Add keyboard shortcuts
- [ ] Add mobile optimization
- [ ] Add dark mode toggle (optional)

### Features
- [ ] Implement ticketing system
- [ ] Add email notifications
- [ ] Add advanced analytics
- [ ] Add batch operations
- [ ] Add search functionality

## 📝 Quick Development Tips

### Adding a New Page

1. Create page file: `app/dashboard/[role]/[feature]/page.tsx`
2. Add to navigation in `DashboardLayout.tsx`
3. Protect with RBAC in `middleware.ts`
4. Create API routes in `app/api/[feature]/route.ts`

### Adding a New API Route

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { can } from '@/lib/rbac';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !can(session.user.role, 'create:example')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Validate with Zod
  // Process request
  // Create audit log

  return NextResponse.json({ success: true });
}
```

### Using Supabase Storage

```typescript
import { uploadFile, getFileUrl } from '@/lib/supabase';

// Upload
const { path, publicUrl } = await uploadFile(
  'materials',
  `modules/${moduleId}/file.pdf`,
  file
);

// Get URL
const url = getFileUrl('materials', path);
```

### Creating Audit Log

```typescript
import { createAuditLog } from '@/lib/audit';

await createAuditLog({
  actorId: session.user.id,
  actorRole: session.user.role,
  action: 'CREATE',
  entity: 'Course',
  entityId: course.id,
  afterJson: course,
});
```

## 🎯 Prioritization for Hackathon

Focus on these for working demo:

**Day 1**:
- ✅ Setup project (DONE)
- ✅ Database schema (DONE)
- ✅ Auth system (DONE)
- ✅ Seed data (DONE)

**Day 2**:
- [ ] PUBLIKASI dashboard with live session control
- [ ] PRAKTIKAN live session view
- [ ] Real-time stage sync

**Day 3**:
- [ ] Auto-grading (simple rule-based)
- [ ] KOMDIS attendance marking
- [ ] ASISTEN grading view
- [ ] Polish UI

**Day 4**:
- [ ] Bug fixes
- [ ] Testing
- [ ] Deploy to Vercel
- [ ] Prepare demo

## 🌐 Environment Setup Reminder

Don't forget to:
1. Create Supabase project
2. Setup storage buckets
3. Fill `.env` file
4. Run migrations
5. Run seed

Good luck! 🚀
