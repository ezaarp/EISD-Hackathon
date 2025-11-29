# 🎮 LMS Laboratory - Management System

Gamified Laboratory Management System dengan UI Pixel Style ala Codedex untuk Praktikum Telkom University.

## 🚀 Features

### ✨ Highlight Fitur

- **10 Role System**: PRAKTIKAN, ASISTEN, KOORDINATOR, SEKRETARIS, KOMDIS, PUBLIKASI, MEDIA, LABORAN, DOSEN, AI_SYSTEM
- **Live RPS (Running Practical Session)**: Real-time stage management dengan timer, autosave, dan auto-submit
- **Auto-Grading**: AI-powered grading untuk code-based questions dengan rule-based fallback
- **RBAC (Role-Based Access Control)**: Permission system yang granular dengan audit log
- **Real-time Updates**: Menggunakan Supabase Realtime untuk notifikasi live session
- **Penalty System**: Automatic penalty untuk keterlambatan dengan override capability
- **Permission Requests**: System izin susulan dan perpindahan shift
- **Pixel UI**: Retro game-style interface dengan Press Start 2P font

### 📋 Fitur per Role

#### 1. PRAKTIKAN
- Login & enroll ke course dengan password
- Melihat jadwal, materi, dan pengumuman
- Mengerjakan TP (Tugas Pendahuluan) secara daring
- Join live session praktikum (RPS)
- Auto-submit dengan timer
- Melihat nilai real-time
- Mengajukan izin susulan/shift change
- Rating asisten & modul

#### 2. ASISTEN
- Monitoring praktikan per plotting
- Grading submission dengan AI assist
- Control live session (untuk publikasi)
- Memberikan feedback
- Melihat rating dari praktikan

#### 3. LABORAN
- Membuat course dan shift
- Set password enroll per course
- Manage lab resources

#### 4. SEKRETARIS
- Bulk create akun praktikan (NIM-based)
- Manage plotting asisten-praktikan
- Schedule management dengan auto-clash detection
- Export data (attendance, grades, berita acara)

#### 5. PUBLIKASI
- Upload materi (PDF, Video, PPT, ZIP)
- Setup modul mingguan dengan release schedule
- Create questions (MCQ, Code-based, Upload)
- Input answer key & rubric
- **Control Live Session**: Start/pause/next stage, broadcast messages
- Manage announcements

#### 6. KOMDIS
- Mark attendance saat live session
- Manage violations dengan upload bukti
- Approve/reject permission requests (makeup, shift change)
- Auto-warning untuk pelanggaran berulang

#### 7. KOORDINATOR
- View analytics & statistics
- Monitor assistant performance
- Audit log review
- Set global penalty rules

#### 8. DOSEN
- View analytics & grade distribution
- Approve final grades
- Review module effectiveness

#### 9. MEDIA
- Upload foto/video dokumentasi
- Gallery management per tahun/angkatan

#### 10. AI_SYSTEM (Service)
- Auto-grading code-based questions
- Generate recommended grades
- Analytics & predictions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS dengan custom pixel utilities
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma 5.x
- **Auth**: NextAuth.js v4 (Credentials Provider)
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime
- **Deployment**: Vercel-ready

## 📦 Setup Instructions

### Prerequisites

- Node.js 18.17+ (for Next.js 14)
- PostgreSQL database (recommended: Supabase free tier)
- npm or pnpm

### 1. Clone & Install

\`\`\`bash
git clone <repository-url>
cd lms-praktikum
npm install
\`\`\`

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy the following:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Go to Project Settings > Database
5. Copy `DATABASE_URL` (Connection Pooling - Session Mode)
6. Copy `DIRECT_URL` (Connection String)

### 3. Setup Storage Buckets

Create the following buckets in Supabase Storage:

- `materials` (public) - For PDF, video, PPT materials
- `evidence` (private) - For student submission PDFs
- `media` (public) - For documentation photos/videos
- `violations` (private) - For violation evidence
- `permissions` (private) - For permission request evidence

Set bucket policies:
- Public buckets: Allow read access
- Private buckets: Authenticated users only

### 4. Environment Variables

Copy `.env.example` to `.env`:

\`\`\`bash
cp .env.example .env
\`\`\`

Fill in the values:

\`\`\`env
# Database (from Supabase)
DATABASE_URL="postgresql://..."  # Connection pooling URL
DIRECT_URL="postgresql://..."    # Direct connection URL

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with: openssl rand -base64 32>"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

### 5. Database Setup

\`\`\`bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed dummy data
npm run db:seed
\`\`\`

### 6. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### 7. Login Credentials (from seed)

After seeding, you can login with:

**LABORAN:**
- Username: `LAB001`
- Password: `password123`

**SEKRETARIS:**
- Username: `SEK001`
- Password: `password123`

**PUBLIKASI:**
- Username: `PUB001`
- Password: `password123`

**ASISTEN:**
- Username: `AST001`
- Password: `password123`

**KOMDIS:**
- Username: `KOM001`
- Password: `password123`

**PRAKTIKAN (Example):**
- Username: `1202204001` (NIM)
- Password: `1202204001` (same as NIM)

## 🔄 Flow End-to-End Demo

### Setup Phase
1. **LABORAN** login → Create course "WAD2025-SI4801" → Create 2 shifts
2. **SEKRETARIS** login → Bulk create 30 praktikan accounts → Create plotting (3 asisten x 10 praktikan per shift)
3. **PUBLIKASI** login → Upload module 1 materials → Create questions (Pretest MCQ + Jurnal code-based + Posttest MCQ) → Set answer keys

### Student Enrollment
4. **PRAKTIKAN** login → Enroll with password → View schedule & materials → Download template → Submit TP (auto-graded by AI)

### Live Session
5. **PUBLIKASI** start live session → Stage: OPENING
6. **KOMDIS** mark attendance (only attended students proceed)
7. **PUBLIKASI** next stage: PRETEST → Timer starts → Auto-submit when time ends
8. **PUBLIKASI** next stage: JURNAL → Students code → Autosave every 30s → Auto-submit when time ends → AI grades
9. **PUBLIKASI** next stage: POSTTEST → Timer → Auto-submit
10. **PUBLIKASI** next stage: FEEDBACK → Students rate asisten/modul/praktikum
11. **PUBLIKASI** end session

### Post-Session
12. **ASISTEN** view grades → Finalize grades → Give feedback
13. **KOMDIS** review violations → Approve/reject makeup requests
14. **KOORDINATOR** view analytics → Review audit logs
15. **DOSEN** approve final grades

## 📁 Project Structure

\`\`\`
lms-praktikum/
├── app/
│   ├── api/
│   │   └── auth/[...nextauth]/    # NextAuth API routes
│   ├── dashboard/
│   │   ├── praktikan/             # Student dashboard
│   │   ├── asisten/               # Assistant dashboard
│   │   ├── laboran/               # Lab manager dashboard
│   │   ├── sekretaris/            # Secretary dashboard
│   │   ├── publikasi/             # Publication dashboard
│   │   ├── komdis/                # Discipline dashboard
│   │   └── ...
│   ├── login/                     # Login page
│   ├── globals.css                # Global styles + pixel utilities
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── components/
│   ├── ui/
│   │   ├── PixelButton.tsx        # Pixel-styled button
│   │   ├── PixelCard.tsx          # Pixel-styled card
│   │   ├── StatusBar.tsx          # HP/XP bar
│   │   ├── Timer.tsx              # Countdown timer
│   │   └── Loading.tsx            # Loading indicator
│   └── DashboardLayout.tsx        # Shared dashboard layout
├── lib/
│   ├── prisma.ts                  # Prisma client
│   ├── supabase.ts                # Supabase client + helpers
│   ├── auth.ts                    # NextAuth configuration
│   ├── rbac.ts                    # RBAC helpers
│   └── audit.ts                   # Audit log helpers
├── prisma/
│   ├── schema.prisma              # Complete database schema
│   └── seed.ts                    # Seed script
├── types/
│   └── next-auth.d.ts             # NextAuth type definitions
├── middleware.ts                  # Auth + RBAC middleware
├── tailwind.config.ts             # Tailwind config with pixel theme
├── next.config.js                 # Next.js config
├── tsconfig.json                  # TypeScript config
└── package.json                   # Dependencies
\`\`\`

## 🎨 Pixel UI Design System

### Colors
- Background: `slate-900`
- Primary: `indigo-600`
- Accent: `emerald-400`
- Danger: `rose-500`
- Warning: `amber-400`

### Typography
- Heading: `Press Start 2P` (font-pixel)
- Body: `monospace` (font-mono)

### Components
- `.pixel-border` - 4px solid black border
- `.pixel-shadow` - Hard shadow (8px 8px 0px 0px rgba(0,0,0,0.5))
- `.pixel-btn` - Retro button with border-bottom/right effect
- `.pixel-card` - Card with title label at top

## 🚢 Deployment to Vercel

### 1. Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
\`\`\`

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings (auto-detected for Next.js)
4. Add environment variables from `.env`
5. Deploy!

### 3. Post-Deployment

1. Update `NEXTAUTH_URL` to your Vercel URL
2. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
3. Redeploy

## 🔒 Security Considerations

- ✅ Passwords hashed with bcrypt
- ✅ Server-side authentication checks
- ✅ RBAC middleware untuk route protection
- ✅ Input validation dengan Zod
- ✅ File type validation untuk uploads
- ✅ Audit logs untuk semua critical actions
- ⚠️ **TODO**: Rate limiting (implement dengan upstash/redis)
- ⚠️ **TODO**: CSRF protection (NextAuth handles this)

## 📊 Database Schema

Lihat [prisma/schema.prisma](prisma/schema.prisma) untuk detail lengkap. Highlights:

- **User**: 10 role types dengan RBAC
- **Course & Shift**: Multi-shift per course
- **Plotting**: Asisten-student assignment
- **ModuleWeek**: Weekly modules
- **Task & Question**: TP/Jurnal/Pretest/Posttest
- **LiveSession & LiveStage**: Real-time session management
- **Submission & Grade**: Auto-grading support
- **Penalty & Violation**: Discipline tracking
- **PermissionRequest**: Makeup/shift change approval flow
- **AuditLog**: Complete action history

## 🧪 Testing

**Manual Testing Checklist:**

- [ ] Login dengan semua 10 roles
- [ ] LABORAN create course & shifts
- [ ] SEKRETARIS bulk create users & plotting
- [ ] PUBLIKASI upload materials & questions
- [ ] PRAKTIKAN enroll & submit TP
- [ ] Live session flow (all stages)
- [ ] Auto-submit when timer ends
- [ ] Autosave functionality
- [ ] AI grading (recommended grades)
- [ ] Penalty application
- [ ] Permission request approval
- [ ] Audit log creation
- [ ] Export functionality

## 🛣️ Roadmap / Future Enhancements

- [ ] Real AI integration (OpenAI/Gemini API untuk grading)
- [ ] Video streaming untuk live PPT presentation
- [ ] Mobile app (React Native)
- [ ] Notification system (email/push)
- [ ] Advanced analytics dashboard
- [ ] Automated testing (Jest/Playwright)
- [ ] Performance optimization (caching, CDN)

## 📝 License

MIT License - Free to use for educational purposes

## 👥 Contributors

- **Your Name** - Fullstack Engineer & Architect

## 🙏 Acknowledgments

- UI inspiration: [Codedex.io](https://codedex.io)
- Icons: [Lucide React](https://lucide.dev)
- Font: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)

---

**Built with ❤️ for EISD Hackathon - Telkom University**

For questions or support, contact: [your-email@example.com]
