import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Define categories (stored as strings in Job model)
  const categories = [
    'Cleaning', 'Gardening', 'Tutoring', 'Handyman', 'Delivery',
    'Pet Care', 'Moving', 'Tech Support', 'Beauty', 'Fitness',
    'Photography', 'Catering', 'Automotive', 'Childcare', 'Writing'
  ];

  console.log('📂 Categories defined for jobs...');

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@tasklinksa.co.za' },
    update: {},
    create: {
      email: 'admin@tasklinksa.co.za',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8JZwHdQGQK', // admin123456
      firstName: 'TaskLink',
      lastName: 'Admin',
      role: 'ADMIN',
      isVerified: true,
      location: 'Johannesburg, South Africa',
    },
  });

  // Create sample users
  console.log('👥 Creating sample users...');
  const sampleUsers = [];
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8JZwHdQGQK', // password123
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        bio: faker.lorem.sentence(),
        location: faker.location.city() + ', South Africa',
        skills: faker.helpers.arrayElements([
          'Cleaning', 'Gardening', 'Tutoring', 'Handyman', 'Delivery',
          'Pet Care', 'Moving', 'Tech Support', 'Beauty', 'Fitness'
        ], faker.number.int({ min: 1, max: 3 })),
        rating: faker.number.float({ min: 3.5, max: 5, precision: 0.1 }),
        reviewCount: faker.number.int({ min: 0, max: 20 }),
        isVerified: faker.datatype.boolean(),
        isWorker: faker.datatype.boolean(),
        isClient: true,
        phone: faker.phone.number(),
      },
    });
    sampleUsers.push(user);
  }

  // Create sample jobs
  console.log('💼 Creating sample jobs...');
  const workerUsers = sampleUsers.filter(u => u.isWorker);

  for (let i = 0; i < 20; i++) {
    const poster = faker.helpers.arrayElement(sampleUsers);
    const category = faker.helpers.arrayElement(categories);
    const worker = faker.helpers.maybe(() => faker.helpers.arrayElement(workerUsers), { probability: 0.7 });

    await prisma.job.create({
      data: {
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        description: faker.lorem.paragraphs(2),
        category: category,
        location: faker.location.city() + ', South Africa',
        coordinates: {
          lat: faker.location.latitude(),
          lng: faker.location.longitude()
        },
        budget: faker.number.float({ min: 100, max: 2000, precision: 0.01 }),
        budgetType: faker.helpers.arrayElement(['fixed', 'hourly']),
        status: faker.helpers.arrayElement(['DRAFT', 'OPEN', 'ASSIGNED', 'COMPLETED']),
        priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH']),
        requirements: faker.helpers.arrayElements([
          'Valid ID', 'References', 'Experience required', 'Tools provided', 'Transport needed'
        ], faker.number.int({ min: 0, max: 3 })),
        images: faker.helpers.arrayElements([
          faker.image.url(), faker.image.url(), faker.image.url()
        ], faker.number.int({ min: 0, max: 3 })),
        posterId: poster.id,
        workerId: worker?.id,
      },
    });
  }

  // Create sample applications
  console.log('📝 Creating sample applications...');
  const jobs = await prisma.job.findMany({ where: { status: 'OPEN' } });
  const applicants = sampleUsers.filter(u => u.isWorker);

  for (const job of jobs.slice(0, 10)) {
    const numApplications = faker.number.int({ min: 1, max: 5 });
    const jobApplicants = faker.helpers.arrayElements(applicants, numApplications);

    for (const applicant of jobApplicants) {
      await prisma.application.create({
        data: {
          message: faker.lorem.paragraph(),
          proposedRate: faker.number.float({ min: job.budget * 0.8, max: job.budget * 1.2, precision: 0.01 }),
          status: faker.helpers.arrayElement(['PENDING', 'ACCEPTED', 'REJECTED']),
          jobId: job.id,
          applicantId: applicant.id,
        },
      });
    }
  }

  // Create sample reviews
  console.log('⭐ Creating sample reviews...');
  const completedJobs = await prisma.job.findMany({ where: { status: 'COMPLETED' } });

  for (const job of completedJobs) {
    if (job.workerId) {
      await prisma.review.create({
        data: {
          rating: faker.number.int({ min: 3, max: 5 }),
          comment: faker.lorem.paragraph(),
          isPublic: true,
          jobId: job.id,
          reviewerId: job.posterId,
          revieweeId: job.workerId,
        },
      });
    }
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${categories.length} categories`);
  console.log(`   - 1 admin user`);
  console.log(`   - ${sampleUsers.length} sample users`);
  console.log(`   - 20 sample jobs`);
  console.log(`   - Applications for jobs`);
  console.log(`   - Reviews for completed jobs`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });