import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  const hashedAdminPassword = bcrypt.hashSync('password123', 10);
  const hashedTeacherPassword = bcrypt.hashSync('teacher123', 10);

  // Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: { password: hashedAdminPassword },
    create: {
      email: 'admin@school.com',
      password: hashedAdminPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
    },
  });

  // Create Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: { password: hashedTeacherPassword },
    create: {
      email: 'teacher@school.com',
      password: hashedTeacherPassword,
      name: 'Prof. Michael Fernandez',
      role: UserRole.TEACHER,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id },
  });

  // Create Section (for grouping / class adviser)
  const section = await prisma.section.upsert({
    where: { name: 'BSCS 3rd Year' },
    update: { teacherId: teacher.id },
    create: {
      name: 'BSCS 3rd Year',
      teacherId: teacher.id,
    },
  });

  // Create 3 Subjects — all taught by the seeded teacher
  const subjectsData = [
    { code: 'OS101', name: 'Operating Systems', units: 3, scheduleDay: 'Mon,Wed,Fri', scheduleTime: '08:00-09:30' },
    { code: 'SE102', name: 'Software Engineering', units: 3, scheduleDay: 'Tue,Thu', scheduleTime: '10:00-11:30' },
    { code: 'DB103', name: 'Database Management', units: 3, scheduleDay: 'Mon,Wed,Fri', scheduleTime: '13:00-14:30' },
  ];

  const subjects = [];
  for (const sub of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: sub.code },
      update: { name: sub.name, teacherId: teacher.id, scheduleDay: sub.scheduleDay, scheduleTime: sub.scheduleTime },
      create: {
        code: sub.code,
        name: sub.name,
        units: sub.units,
        scheduleDay: sub.scheduleDay,
        scheduleTime: sub.scheduleTime,
        teacherId: teacher.id,
      },
    });
    subjects.push(subject);
  }

  // Create 5 Students enrolled in all 3 subjects
  const studentsData = [
    { id: '2022-0001', name: 'John Doe',       email: 'john@student.com'    },
    { id: '2022-0002', name: 'Jane Smith',      email: 'jane@student.com'    },
    { id: '2022-0003', name: 'Bob Johnson',     email: 'bob@student.com'     },
    { id: '2022-0004', name: 'Alice Williams',  email: 'alice@student.com'   },
    { id: '2022-0005', name: 'Charlie Brown',   email: 'charlie@student.com' },
  ];

  for (const stu of studentsData) {
    const hashedStudentPassword = bcrypt.hashSync(stu.id, 10);

    const user = await prisma.user.upsert({
      where: { email: stu.email },
      update: {},
      create: {
        email: stu.email,
        password: hashedStudentPassword,
        name: stu.name,
        role: UserRole.STUDENT,
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: { studentId: stu.id, sectionId: section.id },
      create: {
        userId: user.id,
        studentId: stu.id,
        sectionId: section.id,
        qrToken: crypto.randomUUID(),
      },
    });

    // Enroll student in all subjects
    for (const subject of subjects) {
      await prisma.studentSubject.upsert({
        where: { studentId_subjectId: { studentId: student.id, subjectId: subject.id } },
        update: {},
        create: { studentId: student.id, subjectId: subject.id },
      });
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
