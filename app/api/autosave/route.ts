import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { taskId, questionId, code, liveSessionId } = body;

  if (!taskId || !code) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Find existing submission
  const existing = await prisma.submission.findFirst({
      where: {
          taskId,
          questionId: questionId || undefined, // Optional for some tasks
          studentId: session.user.id
      }
  });

  if (existing) {
      await prisma.submission.update({
          where: { id: existing.id },
          data: {
              contentText: code,
              lastAutosaveAt: new Date(),
              status: existing.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT'
          }
      });
  } else {
      await prisma.submission.create({
          data: {
              taskId,
              questionId,
              studentId: session.user.id,
              liveSessionId,
              contentText: code,
              status: 'DRAFT',
              lastAutosaveAt: new Date(),
          }
      });
  }

  return NextResponse.json({ success: true });
}

