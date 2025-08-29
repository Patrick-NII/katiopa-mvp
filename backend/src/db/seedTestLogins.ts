import { PrismaClient, SubscriptionType, UserType, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertAccountWithSession(params: {
  email: string;
  subscriptionType: SubscriptionType;
  maxSessions: number;
  sessionId: string;
  firstName: string;
  lastName: string;
  userType?: UserType;
  password: string;
}) {
  const { email, subscriptionType, maxSessions, sessionId, firstName, lastName, userType = 'PARENT', password } = params;

  // Upsert account
  const account = await prisma.account.upsert({
    where: { email },
    update: { subscriptionType, maxSessions },
    create: { email, subscriptionType, maxSessions, totalAccountConnectionDurationMs: BigInt(0) }
  });

  const hashed = await bcrypt.hash(password, 12);

  // Upsert user session by sessionId
  const userSession = await prisma.userSession.upsert({
    where: { sessionId },
    update: {
      accountId: account.id,
      password: hashed,
      firstName,
      lastName,
      userType,
      gender: Gender.UNKNOWN,
      isActive: true
    },
    create: {
      accountId: account.id,
      sessionId,
      password: hashed,
      firstName,
      lastName,
      userType,
      gender: Gender.UNKNOWN,
      isActive: true,
      totalConnectionDurationMs: BigInt(0)
    }
  });

  // Ensure plan seat exists
  await prisma.planSeat.upsert({
    where: { accountId: account.id },
    update: { maxChildren: subscriptionType === 'FREE' ? 1 : subscriptionType === 'PRO' ? 2 : subscriptionType === 'PRO_PLUS' ? 4 : 10 },
    create: { accountId: account.id, maxChildren: subscriptionType === 'FREE' ? 1 : subscriptionType === 'PRO' ? 2 : subscriptionType === 'PRO_PLUS' ? 4 : 10 }
  });

  return { account, userSession };
}

async function main() {
  console.log('🌱 Seeding des comptes de test (MARIE_DUPONT, PATRICK_MARTIN, SOPHIE_BERNARD)');

  await upsertAccountWithSession({
    email: 'marie.dupont@example.com',
    subscriptionType: 'FREE',
    maxSessions: 1,
    sessionId: 'MARIE_DUPONT',
    firstName: 'Marie',
    lastName: 'Dupont',
    password: 'password123',
    userType: 'PARENT'
  });

  await upsertAccountWithSession({
    email: 'patrick.martin@example.com',
    subscriptionType: 'PRO',
    maxSessions: 2,
    sessionId: 'PATRICK_MARTIN',
    firstName: 'Patrick',
    lastName: 'Martin',
    password: 'password123',
    userType: 'PARENT'
  });

  await upsertAccountWithSession({
    email: 'sophie.bernard@example.com',
    subscriptionType: 'PRO_PLUS',
    maxSessions: 4,
    sessionId: 'SOPHIE_BERNARD',
    firstName: 'Sophie',
    lastName: 'Bernard',
    password: 'password123',
    userType: 'PARENT'
  });

  console.log('✅ Comptes de test prêts.');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed des comptes de test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

