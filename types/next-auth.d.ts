import { UserRole } from '@prisma/client';
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    username: string;
    role: UserRole;
    email?: string | null;
    name: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    role: UserRole;
  }
}
