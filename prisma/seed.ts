import { PrismaClient, UserRole, AttendanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  const hashedPassword = bcrypt.hashSync('password123', 10);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@school.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
    },
  });

  // Create Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: { password: hashedPassword },
    create: {
      email: 'teacher@school.com',
      password: hashedPassword,
      name: 'Prof. Michael Fernandez',
      role: UserRole.TEACHER,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
    },
  });

  // Create Section
  const section = await prisma.section.upsert({
    where: { name: 'STEM-A' },
    update: { teacherId: teacher.id },
    create: {
      name: 'STEM-A',
      teacherId: teacher.id,
    },
  });

  // Create 5 Students
  const studentsData = [
    { id: '2022-0001', name: 'John Doe', email: 'john@student.com' },
    { id: '2022-0002', name: 'Jane Smith', email: 'jane@student.com' },
    { id: '2022-0003', name: 'Bob Johnson', email: 'bob@student.com' },
    { id: '2022-0004', name: 'Alice Williams', email: 'alice@student.com' },
    { id: '2022-0005', name: 'Charlie Brown', email: 'charlie@student.com' },
  ];

  for (const stu of studentsData) {
    const user = await prisma.user.upsert({
      where: { email: stu.email },
      update: { password: hashedPassword },
      create: {
        email: stu.email,
        password: hashedPassword,
        name: stu.name,
        role: UserRole.STUDENT,
      },
    });

    await prisma.student.upsert({
      where: { userId: user.id },
      update: { studentId: stu.id, sectionId: section.id },
      create: {
        userId: user.id,
        studentId: stu.id,
        sectionId: section.id,
      },
    });
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
