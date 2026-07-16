import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FIRST_NAMES = [
  'Aarav',
  'Vivaan',
  'Aaditya',
  'Vihaan',
  'Arjun',
  'Sai',
  'Reyansh',
  'Ayaan',
  'Krishna',
  'Ishaan',
  'Rohan',
  'Kabir',
  'Rahul',
  'Aniket',
  'Dev',
  'Priya',
  'Ananya',
  'Diya',
  'Aanya',
];
const LAST_NAMES = [
  'Sharma',
  'Verma',
  'Gupta',
  'Mehta',
  'Patel',
  'Khan',
  'Singh',
  'Iyer',
  'Nair',
  'Rao',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomPastDate(): Date {
  const r = Math.random();
  const daysAgo =
    r < 0.4
      ? Math.random() * 30
      : r < 0.7
        ? 30 + Math.random() * 60
        : r < 0.9
          ? 90 + Math.random() * 90
          : 180 + Math.random() * 185;
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(daysAgo));
  d.setHours(
    Math.floor(Math.random() * 24),
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
    0,
  );
  return d;
}

async function main() {
  console.log('Clearing database tables...');
  await prisma.note.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding user accounts...');
  const adminPasswordHash = await bcrypt.hash('admin123!', 10);
  const devsPasswordHash = await bcrypt.hash('devs123!', 10);
  const aadityaPasswordHash = await bcrypt.hash('aaditya123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@tixora.local',
      passwordHash: adminPasswordHash,
      role: 'admin',
    },
  });

  const devs = await prisma.user.create({
    data: {
      name: 'Dev User',
      email: 'devs@tixora.local',
      passwordHash: devsPasswordHash,
      role: 'devs',
    },
  });

  const aaditya = await prisma.user.create({
    data: {
      name: 'Aaditya Gunjal',
      email: 'aadigunjal0975@gmail.com',
      passwordHash: aadityaPasswordHash,
      role: 'devs',
    },
  });

  console.log('Seeding support tickets...');
  const users = [admin, devs, aaditya];
  const ticketStatuses = ['Open', 'In Progress', 'Closed'];
  const issueSubjects = [
    'Billing issue with subscription renewal',
    'Cannot access API keys in settings',
    'Error 500 when saving dashboard filters',
    'UI layout broken on mobile viewport',
    'Request for custom features export',
    'Email verification code not received',
    'Unable to upload avatars in profile page',
    'SSO integration setup failing',
    'Documentation mismatch for webhooks',
    'Slow load time for analytics widgets',
  ];
  const issueDescriptions = [
    'The renewal failed yesterday and my account was downgraded to free plan. Please fix.',
    'I get a permission error even though I am logged in as administrator.',
    'Clicking save filter triggers server error. Attached screenshot.',
    'The sidebar overflows on mobile width below 375px.',
    'We need CSV or PDF exports of the logs immediately.',
    'I tried 3 times, checked spam folder, still no verification code received.',
    'Getting a file format invalid error when uploading png.',
    'Identity provider metadata fails to import correctly.',
    'The payload format returned does not match API doc schema.',
    'It takes about 10 seconds for the charts to fully render.',
  ];

  const channels = ['Portal', 'Social Media', 'Email'];

  for (let i = 1; i <= 25; i++) {
    const creator = pick(users);
    const status = pick(ticketStatuses);
    const channel = channels[i % channels.length]!;
    const createdAt = randomPastDate();
    const subjectIndex = Math.floor(Math.random() * issueSubjects.length);

    const ticket = await prisma.ticket.create({
      data: {
        ticket_id: `TIX-${1000 + i}`,
        customer_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        customer_email: `customer.${100 + i}@example.com`,
        subject: issueSubjects[subjectIndex]!,
        description: issueDescriptions[subjectIndex]!,
        status,
        channel,
        created_by_id: creator.id,
        created_at: createdAt,
        updated_at: createdAt,
      },
    });

    const noteOptions = [
      'Investigating this issue. Checking system logs.',
      'Customer has been updated. Awaiting reply.',
      'Escalated to Tier 2 support for further inspection.',
      'Verified account settings. Permissions look correct.',
      'Sent follow-up email to request additional diagnostic screenshots.',
      'Discussed with engineering team. Bug confirmed and ticket updated.',
      'Workaround provided to user. Awaiting confirmation of resolution.',
      'Initial logs analyzed. Connection timeouts detected.',
    ];

    await prisma.note.create({
      data: {
        ticket_id: ticket.ticket_id,
        note_text: pick(noteOptions),
        created_at: new Date(createdAt.getTime() + 2 * 3600 * 1000),
      },
    });

    if (Math.random() < 0.6) {
      await prisma.note.create({
        data: {
          ticket_id: ticket.ticket_id,
          note_text: pick(noteOptions),
          created_at: new Date(createdAt.getTime() + 4 * 3600 * 1000),
        },
      });
    }
  }

  console.log('Seeding activity logs...');
  const now = new Date();
  await prisma.activity.createMany({
    data: [
      {
        actor_id: admin.id,
        action: 'Released UI performance improvements to production.',
        created_at: new Date(now.getTime() - 5 * 60 * 1000),
      },
      {
        actor_id: devs.id,
        action: 'Updated status of ticket TIX-1002 to In Progress.',
        created_at: new Date(now.getTime() - 35 * 60 * 1000),
      },
      {
        actor_id: aaditya.id,
        action: 'Added an internal note to ticket TIX-1005.',
        created_at: new Date(now.getTime() - 2 * 3600 * 1000),
      },
      {
        actor_id: devs.id,
        action: 'Logged in from a new device.',
        created_at: new Date(now.getTime() - 6 * 3600 * 1000),
      },
      {
        actor_id: admin.id,
        action: 'Updated CRM system role configurations.',
        created_at: new Date(now.getTime() - 12 * 3600 * 1000),
      },
    ],
  });

  console.log('Seeding contacts list...');
  await prisma.contact.createMany({
    data: [
      { name: 'Admin User', linked_user_id: admin.id, avatar: 'https://i.pravatar.cc/150?u=admin' },
      { name: 'Dev User', linked_user_id: devs.id, avatar: 'https://i.pravatar.cc/150?u=devs' },
      {
        name: 'Aaditya Gunjal',
        linked_user_id: aaditya.id,
        avatar: 'https://i.pravatar.cc/150?u=aaditya',
      },
      {
        name: 'Natali Craig',
        email: 'natali.craig@example.com',
        avatar: 'https://i.pravatar.cc/150?u=natali',
      },
      {
        name: 'Drew Cano',
        email: 'drew.cano@example.com',
        avatar: 'https://i.pravatar.cc/150?u=drew',
      },
      {
        name: 'Orlando Diggs',
        email: 'orlando.d@example.com',
        avatar: 'https://i.pravatar.cc/150?u=orlando',
      },
    ],
  });

  console.log('Seeding notifications feed...');
  await prisma.notification.createMany({
    data: [],
  });

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
