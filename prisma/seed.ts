import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (in development only!)
  console.log('🗑️  Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.permissionRequest.deleteMany();
  await prisma.violation.deleteMany();
  await prisma.penalty.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.liveStage.deleteMany();
  await prisma.liveSession.deleteMany();
  await prisma.answerKey.deleteMany();
  await prisma.question.deleteMany();
  await prisma.task.deleteMany();
  await prisma.content.deleteMany();
  await prisma.moduleWeek.deleteMany();
  await prisma.studentAssignment.deleteMany();
  await prisma.plotting.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.media.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 1. Create Users
  console.log('👥 Creating users...');

  const defaultPassword = await bcrypt.hash('password123', 10);
  const nimPassword1 = await bcrypt.hash('1202204001', 10);

  // LABORAN
  const laboran = await prisma.user.create({
    data: {
      username: 'LAB001',
      name: 'Budi Laboran',
      role: UserRole.LABORAN,
      passwordHash: defaultPassword,
      email: 'laboran@telkomuniversity.ac.id',
    },
  });

  // SEKRETARIS
  const sekretaris = await prisma.user.create({
    data: {
      username: 'SEK001',
      name: 'Siti Sekretaris',
      role: UserRole.SEKRETARIS,
      passwordHash: defaultPassword,
      email: 'sekretaris@telkomuniversity.ac.id',
    },
  });

  // PUBLIKASI
  const publikasi = await prisma.user.create({
    data: {
      username: 'PUB001',
      name: 'Andi Publikasi',
      role: UserRole.PUBLIKASI,
      passwordHash: defaultPassword,
      email: 'publikasi@telkomuniversity.ac.id',
    },
  });

  // KOMDIS
  const komdis = await prisma.user.create({
    data: {
      username: 'KOM001',
      name: 'Dedi Komdis',
      role: UserRole.KOMDIS,
      passwordHash: defaultPassword,
      email: 'komdis@telkomuniversity.ac.id',
    },
  });

  // KOORDINATOR
  const koordinator = await prisma.user.create({
    data: {
      username: 'KOOR001',
      name: 'Dr. Rina Koordinator',
      role: UserRole.KOORDINATOR,
      passwordHash: defaultPassword,
      email: 'koordinator@telkomuniversity.ac.id',
    },
  });

  // DOSEN
  const dosen = await prisma.user.create({
    data: {
      username: 'DOS001',
      name: 'Prof. Agus Dosen',
      role: UserRole.DOSEN,
      passwordHash: defaultPassword,
      email: 'dosen@telkomuniversity.ac.id',
    },
  });

  // MEDIA
  const media = await prisma.user.create({
    data: {
      username: 'MED001',
      name: 'Rini Media',
      role: UserRole.MEDIA,
      passwordHash: defaultPassword,
      email: 'media@telkomuniversity.ac.id',
    },
  });

  // ASISTEN (3 orang)
  const asisten1 = await prisma.user.create({
    data: {
      username: 'AST001',
      name: 'Eko Asisten 1',
      role: UserRole.ASISTEN,
      passwordHash: defaultPassword,
      email: 'ast001@telkomuniversity.ac.id',
      nim: '1202200001',
    },
  });

  const asisten2 = await prisma.user.create({
    data: {
      username: 'AST002',
      name: 'Fitri Asisten 2',
      role: UserRole.ASISTEN,
      passwordHash: defaultPassword,
      email: 'ast002@telkomuniversity.ac.id',
      nim: '1202200002',
    },
  });

  const asisten3 = await prisma.user.create({
    data: {
      username: 'AST003',
      name: 'Galih Asisten 3',
      role: UserRole.ASISTEN,
      passwordHash: defaultPassword,
      email: 'ast003@telkomuniversity.ac.id',
      nim: '1202200003',
    },
  });

  // PRAKTIKAN (30 orang)
  const praktikanList = [];
  for (let i = 1; i <= 30; i++) {
    const nim = `120220400${i.toString().padStart(1, '0')}`;
    const praktikan = await prisma.user.create({
      data: {
        username: nim,
        name: `Praktikan ${i}`,
        role: UserRole.PRAKTIKAN,
        passwordHash: await bcrypt.hash(nim, 10), // Password = NIM
        email: `${nim}@student.telkomuniversity.ac.id`,
        nim: nim,
      },
    });
    praktikanList.push(praktikan);
  }

  console.log(`✅ Created ${praktikanList.length} praktikan users`);

  // 2. Create Course
  console.log('📚 Creating course...');

  const coursePassword = await bcrypt.hash('WAD2025', 10);
  const course = await prisma.course.create({
    data: {
      code: 'WAD2025-SI4801',
      title: 'Web Application Design 2025',
      description: 'Practical course on modern web development with React and Next.js',
      enrollPasswordHash: coursePassword,
      enrollPasswordPlain: 'WAD2025',
      semester: '2024/2025 Genap',
      academicYear: '2024/2025',
      createdById: laboran.id,
    },
  });

  // 3. Create Shifts
  console.log('🕐 Creating shifts...');

  const shift1 = await prisma.shift.create({
    data: {
      courseId: course.id,
      shiftNo: 1,
      name: 'Shift 1 - Senin Pagi',
      day: 'SENIN',
      startTime: '08:00',
      endTime: '11:00',
      room: 'Lab A203',
      maxCapacity: 30,
    },
  });

  const shift2 = await prisma.shift.create({
    data: {
      courseId: course.id,
      shiftNo: 2,
      name: 'Shift 2 - Rabu Siang',
      day: 'RABU',
      startTime: '13:00',
      endTime: '16:00',
      room: 'Lab B105',
      maxCapacity: 30,
    },
  });

  // 4. Create Plotting (Asisten assignment)
  console.log('👨‍🏫 Creating plotting...');

  const plotting1_1 = await prisma.plotting.create({
    data: {
      shiftId: shift1.id,
      assistantId: asisten1.id,
      plotNo: 1,
    },
  });

  const plotting1_2 = await prisma.plotting.create({
    data: {
      shiftId: shift1.id,
      assistantId: asisten2.id,
      plotNo: 2,
    },
  });

  const plotting1_3 = await prisma.plotting.create({
    data: {
      shiftId: shift1.id,
      assistantId: asisten3.id,
      plotNo: 3,
    },
  });

  // 5. Assign Students to Shift 1
  console.log('🎓 Assigning students to shifts...');

  const plottings = [plotting1_1, plotting1_2, plotting1_3];

  for (let i = 0; i < 15; i++) {
    const plottingIndex = i % 3;
    await prisma.studentAssignment.create({
      data: {
        shiftId: shift1.id,
        studentId: praktikanList[i].id,
        plottingId: plottings[plottingIndex].id,
      },
    });
  }

  console.log('✅ Assigned 15 students to Shift 1');

  // 6. Create Module Week
  console.log('📖 Creating modules...');

  const module1 = await prisma.moduleWeek.create({
    data: {
      courseId: course.id,
      weekNo: 1,
      title: 'Introduction to React Hooks',
      description: 'Learn useState, useEffect, and custom hooks',
      releaseAt: new Date('2025-01-06'),
      deadlineTP: new Date('2025-01-12'),
      hasCodeBased: true,
      hasMCQ: true,
    },
  });

  // 7. Create Content/Materials
  console.log('📄 Creating materials...');

  await prisma.content.create({
    data: {
      moduleWeekId: module1.id,
      title: 'Slide Materi - React Hooks',
      type: 'PPT_PDF',
      storagePath: 'materials/week1-slides.pdf',
      visibility: 'PUBLIC',
      sortOrder: 1,
    },
  });

  await prisma.content.create({
    data: {
      moduleWeekId: module1.id,
      title: 'Template Code TP',
      type: 'ZIP',
      storagePath: 'materials/week1-template.zip',
      visibility: 'PUBLIC',
      sortOrder: 2,
    },
  });

  // 8. Create Tasks
  console.log('✏️ Creating tasks...');

  // TP (Tugas Pendahuluan)
  const taskTP = await prisma.task.create({
    data: {
      moduleWeekId: module1.id,
      type: 'TP',
      title: 'Tugas Pendahuluan: useState & useEffect',
      instructions: 'Buat komponen counter dengan useState dan cleanup dengan useEffect',
      templatePath: 'materials/week1-template.zip',
      allowCopyPaste: false,
    },
  });

  // PRETEST
  const taskPretest = await prisma.task.create({
    data: {
      moduleWeekId: module1.id,
      type: 'PRETEST',
      title: 'Pre-Test: Fundamental React',
      instructions: 'Jawab 5 soal pilihan ganda tentang React fundamentals',
    },
  });

  // JURNAL
  const taskJurnal = await prisma.task.create({
    data: {
      moduleWeekId: module1.id,
      type: 'JURNAL',
      title: 'Jurnal: Implementasi Custom Hook',
      instructions: 'Buat custom hook useFetch dan useLocalStorage',
      allowCopyPaste: true,
    },
  });

  // POSTTEST
  const taskPosttest = await prisma.task.create({
    data: {
      moduleWeekId: module1.id,
      type: 'POSTTEST',
      title: 'Post-Test: React Hooks',
      instructions: 'Jawab 5 soal pilihan ganda tentang Hooks',
    },
  });

  // 9. Create Questions
  console.log('❓ Creating questions...');

  // PRETEST Questions (MCQ)
  const pretestQ1 = await prisma.question.create({
    data: {
      taskId: taskPretest.id,
      type: 'MCQ',
      questionNo: 1,
      prompt: 'Apa hook yang digunakan untuk menyimpan state?',
      optionsJson: JSON.stringify(['useEffect', 'useState', 'useContext', 'useReducer']),
      points: 20,
    },
  });

  await prisma.answerKey.create({
    data: {
      questionId: pretestQ1.id,
      correctAnswer: '1', // Index 1 = useState
      explanation: 'useState adalah hook untuk state management di functional components',
    },
  });

  // JURNAL Question (CODE)
  const jurnalQ1 = await prisma.question.create({
    data: {
      taskId: taskJurnal.id,
      type: 'CODE',
      questionNo: 1,
      prompt: 'Buat custom hook useFetch yang menerima URL dan return { data, loading, error }',
      constraints: JSON.stringify({
        maxLines: 50,
        timeout: 5000,
      }),
      points: 50,
    },
  });

  await prisma.answerKey.create({
    data: {
      questionId: jurnalQ1.id,
      correctAnswer: 'function useFetch(url)',
      rubricJson: JSON.stringify({
        criteria: [
          { name: 'Menggunakan useState', weight: 0.2 },
          { name: 'Menggunakan useEffect', weight: 0.3 },
          { name: 'Handle loading state', weight: 0.2 },
          { name: 'Handle error', weight: 0.3 },
        ],
      }),
    },
  });

  // 10. Create Announcement
  console.log('📢 Creating announcements...');

  await prisma.announcement.create({
    data: {
      courseId: course.id,
      title: '🎉 Selamat Datang di WAD 2025!',
      body: 'Selamat mengikuti praktikum Web Application Design. Jangan lupa download materi dan template code!',
      isPinned: true,
      createdById: publikasi.id,
    },
  });

  // 11. Create System Settings
  console.log('⚙️ Creating system settings...');

  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'PENALTY_LATE_ATTENDANCE_PERCENT',
        value: '10',
        dataType: 'NUMBER',
      },
      {
        key: 'PENALTY_LATE_SUBMIT_PERCENT',
        value: '10',
        dataType: 'NUMBER',
      },
      {
        key: 'AUTOSAVE_INTERVAL_SECONDS',
        value: '30',
        dataType: 'NUMBER',
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('LABORAN - Username: LAB001, Password: password123');
  console.log('SEKRETARIS - Username: SEK001, Password: password123');
  console.log('PUBLIKASI - Username: PUB001, Password: password123');
  console.log('ASISTEN - Username: AST001, Password: password123');
  console.log('KOMDIS - Username: KOM001, Password: password123');
  console.log('PRAKTIKAN - Username: 1202204001, Password: 1202204001');
  console.log('\n🎓 Course: WAD2025-SI4801');
  console.log('Enroll Password: WAD2025');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
