import { connectDatabase, prisma } from '@/config/database';
import { getOverviewByYear } from '@/services/capacity.service';

async function main() {
  const year = Number(process.argv[2] || new Date().getFullYear());
  await connectDatabase();
  const t0 = Date.now();
  const data = await getOverviewByYear(year);
  const ms = Date.now() - t0;
  console.log(`overview rows=${data.length} in ${ms}ms`);
  // show first 2 users for sanity
  console.log(JSON.stringify(data.slice(0, 2), null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('smoke failed', e);
  process.exit(1);
});
