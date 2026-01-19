import { connectDatabase, prisma } from '@/config/database';
import { env } from '@/config/env';

async function run(table: string) {
  console.log(`Testing table: ${table}`);
  if ((env.databaseUrl || '').startsWith('postgres')) {
    const cols = await prisma.$queryRawUnsafe<any[]>(
      `SELECT column_name as name, data_type as type FROM information_schema.columns WHERE table_schema='public' AND table_name = $1 ORDER BY ordinal_position`,
      table
    );
    const count = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS count FROM "public"."${table}"`
    );
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "public"."${table}" OFFSET $1 LIMIT $2`,
      0,
      5
    );
    console.log({ columns: cols.map((c) => c.name), count: count?.[0]?.count, sample: rows });
  } else {
    const cols = await prisma.$queryRawUnsafe<any[]>(`PRAGMA table_info("${table}")`);
    const count = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) AS count FROM "${table}"`);
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "${table}" LIMIT 5 OFFSET 0`);
    console.log({ columns: cols.map((c: any) => c.name), count: count?.[0]?.count, sample: rows });
  }
}

async function main() {
  await connectDatabase();
  for (const t of [
    'Employee',
    'Skill',
    'SkillAssessment',
    'UserCapacity',
    'StrategicGoal',
    'StrategicGoalRating',
  ]) {
    try {
      await run(t);
    } catch (e) {
      console.error('error for', t, e);
    }
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
