import { PrismaClient } from '@prisma/client';

// Create a PrismaClient that uses DATABASE_URL from process.env (loaded from jest.setup.ts -> .env.test)
export const prismaTest = new PrismaClient();

export async function disconnect() {
  await prismaTest.$disconnect();
}
