import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'NIM atau Kode Asprak' },
        password: { label: 'Password', type: 'password' },
        roleGate: { label: 'Role Gate', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username dan password harus diisi');
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username,
          },
        });

        if (!user || !user.isActive) {
          throw new Error('Username atau password salah');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error('Username atau password salah');
        }

        // Enforce button-role mapping when provided
        if (credentials.roleGate) {
          const gate = credentials.roleGate as 'praktikan' | 'asisten' | 'dosen';
          const role = user.role as UserRole;

          const allowedRoles: Record<typeof gate, UserRole[]> = {
            praktikan: [UserRole.PRAKTIKAN],
            asisten: [
              UserRole.ASISTEN,
              UserRole.MEDIA,
              UserRole.KOORDINATOR,
              UserRole.SEKRETARIS,
              UserRole.PUBLIKASI,
              UserRole.KOMDIS,
            ],
            dosen: [UserRole.DOSEN, UserRole.LABORAN],
          };

          const allowed = allowedRoles[gate];
          if (allowed && !allowed.includes(role)) {
            throw new Error('Silakan login melalui tombol yang sesuai dengan peran Anda');
          }
        }

        return {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
