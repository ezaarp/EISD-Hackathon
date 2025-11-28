# 🚀 Quick Start Guide

## ✅ Yang Sudah Dikonfigurasi
- ✅ Project structure
- ✅ Environment variables (.env)
- ✅ Middleware fix (redirect loop solved!)

## 📝 Langkah Setup (Jalankan Berurutan)

### 1. Generate Prisma Client
```bash
npm run db:generate
```

### 2. Push Schema ke Database
```bash
npm run db:push
```
Ini akan membuat semua tabel di database Supabase Anda.

### 3. Seed Data Dummy
```bash
npm run db:seed
```
Ini akan membuat:
- 30 Praktikan (username: `1202204001` - `1202204030`, password: sama dengan username)
- 3 Asisten (username: `AST001-003`, password: `password123`)
- Admin users (LAB001, SEK001, PUB001, KOM001, dll - password: `password123`)
- 1 Course: WAD2025-SI4801
- 2 Shifts dengan plotting
- Module 1 dengan materials & questions

### 4. Start Development Server
```bash
npm run dev
```

### 5. Buka Browser
```
http://localhost:3000
```

### 6. Login Test

**Praktikan:**
- Username: `1202204001`
- Password: `1202204001`

**Laboran:**
- Username: `LAB001`
- Password: `password123`

**Publikasi:**
- Username: `PUB001`
- Password: `password123`

**Komdis:**
- Username: `KOM001`
- Password: `password123`

## 🎯 Flow Demo

1. **Login sebagai PRAKTIKAN** (`1202204001`)
   - Lihat dashboard dengan stats (HP/XP)
   - Lihat jadwal praktikum
   - Lihat announcements

2. **Login sebagai LABORAN** (`LAB001`)
   - Lihat course yang sudah dibuat
   - Manage courses & shifts

3. **Login sebagai PUBLIKASI** (`PUB001`)
   - Control panel untuk live session (masih under construction)

4. **Login sebagai KOMDIS** (`KOM001`)
   - Attendance marking (masih under construction)

## 🐛 Troubleshooting

### Error: Can't reach database server
- Pastikan internet connection aktif
- Pastikan DATABASE_URL di .env benar
- Pastikan Supabase project aktif

### Error: Module not found
```bash
npm install
```

### Error: Prisma Client not generated
```bash
npm run db:generate
```

### Error: Table doesn't exist
```bash
npm run db:push
```

## 📊 Database di Supabase

Untuk melihat database:
1. Buka https://supabase.com
2. Pilih project Anda
3. Klik "Table Editor"
4. Lihat semua tabel yang sudah dibuat (User, Course, Shift, dll)

Atau gunakan Prisma Studio:
```bash
npm run db:studio
```

## 🎨 UI Components Available

Semua komponen pixel style sudah siap dipakai:

```tsx
import { PixelButton, PixelCard, StatusBar, Timer } from '@/components/ui';

// Button
<PixelButton variant="primary">Click Me</PixelButton>

// Card
<PixelCard title="MY CARD">Content here</PixelCard>

// Status Bar (HP/XP)
<StatusBar
  label="HP"
  current={90}
  max={100}
  color="bg-rose-500"
/>

// Timer
<Timer endTime={new Date()} onComplete={() => {}} />
```

## 📚 Next Steps

Lihat **DEVELOPMENT_GUIDE.md** untuk:
- Implement fitur-fitur yang masih under construction
- API routes structure
- Live session implementation guide
- Best practices

## 🆘 Need Help?

- Check README.md untuk detailed setup
- Check DEVELOPMENT_GUIDE.md untuk architecture
- Check PROJECT_SUMMARY.md untuk progress overview

---

**Happy Coding! 🚀**

Jika semua langkah di atas berhasil, Anda siap untuk develop fitur-fitur selanjutnya!
