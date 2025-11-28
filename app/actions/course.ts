'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function enrollCourse(courseId: string, password: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'PRAKTIKAN') {
    return { success: false, error: 'Unauthorized' };
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return { success: false, error: 'Course not found' };
  }

  const isValid = await bcrypt.compare(password, course.enrollPasswordHash);
  if (!isValid) {
    return { success: false, error: 'Invalid enrollment password' };
  }

  // Check if already enrolled (assigned to a shift)
  // Enrollment in this system implies being assigned to a shift.
  // Since the requirement says "Sekretaris set plotting", the student might just "Activate" their enrollment 
  // OR the enrollment process assigns them to a pending state?
  // Requirement 4: "Praktikan login dan enroll course sesuai kelas dan shift masing-masing menggunakan password yang sudah diberikan."
  // Requirement 5: "Sistem otomatis assign praktikan ke plotingan masing-masing sesuai pembagian asisten praktikum oleh sekretaris"
  
  // This implies the secretary ALREADY created the account and plotting?
  // Or maybe "enroll" just means linking the student to the course/shift.
  
  // Let's assume Secretary pre-assigns (StudentAssignment created), and enrollment just verifies/activates it?
  // OR Student chooses a shift?
  
  // "Sekretaris set plotting: assign ASISTEN ke shift, assign PRAKTIKAN ke asisten plotingan"
  // This suggests plotting happens BEFORE or independent of student action?
  // BUT "Praktikan login, enroll pakai password" suggests they initiate it.
  
  // Hybrid approach:
  // Secretary creates accounts.
  // Student logs in.
  // Student enters Course ID + Password.
  // SYSTEM checks if there is a plotting for this student?
  // Or maybe the password is specific to a SHIFT?
  // "enroll pakai password yang sudah diberikan (password setiap kelas berbeda beda)" -> implies Shift Password!
  
  // Let's assume the password provided matches a SHIFT password (not implemented in schema, only Course has password).
  // Wait, Schema has `enrollPasswordHash` on COURSE.
  // The user query says: "password setiap kelas berbeda beda".
  // Maybe I should check against some shift-specific logic?
  // OR just use the Course password for now as per schema.
  
  // Let's check if the student is already assigned to a shift in this course.
  const existingAssignment = await prisma.studentAssignment.findFirst({
    where: {
      studentId: session.user.id,
      shift: {
        courseId: courseId
      }
    }
  });

  if (existingAssignment) {
     return { success: true, message: 'Already enrolled' };
  }

  // If not assigned, maybe we need to find where they belong?
  // OR the system blindly enrolls them?
  // Requirement 3: "SEKRETARIS set plotting: assign ASISTEN ke shift, assign PRAKTIKAN ke asisten plotingan"
  // This strongly suggests the data is already there.
  // Maybe "Enroll" is just a UI formality to "Unlock" the course in the dashboard?
  // Let's treat it as: Verify password -> Redirect to Dashboard.
  
  return { success: true };
}

