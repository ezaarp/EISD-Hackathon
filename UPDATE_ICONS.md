# Icon Update Guide

All dashboard pages need to change icon props from component references to strings.

## Before:
```typescript
import { Home, Users } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },  // ❌ Component
  { href: '/users', label: 'Users', icon: Users },        // ❌ Component
];
```

## After:
```typescript
// Remove lucide-react imports from navItems

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'Home' },  // ✅ String
  { href: '/users', label: 'Users', icon: 'Users' },        // ✅ String
];
```

## Icon Names Available:
- Home
- BookOpen
- Users
- Settings
- FileText
- Award
- ShieldAlert
- CheckSquare
- Radio
- Camera
- Image
- BarChart
- FileCheck
- FlaskConical
- GraduationCap
- Plus

## Files to Update:
- ✅ components/DashboardLayout.tsx (DONE)
- [ ] app/dashboard/asisten/page.tsx
- [ ] app/dashboard/laboran/page.tsx
- [ ] app/dashboard/praktikan/page.tsx
- [ ] app/dashboard/sekretaris/page.tsx
- [ ] app/dashboard/publikasi/page.tsx
- [ ] app/dashboard/komdis/page.tsx
- [ ] app/dashboard/koordinator/page.tsx
- [ ] app/dashboard/dosen/page.tsx
- [ ] app/dashboard/media/page.tsx
