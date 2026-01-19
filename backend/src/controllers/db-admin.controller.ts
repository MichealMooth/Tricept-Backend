import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { env } from '@/config/env';

function isPostgres() {
  return (env.databaseUrl || '').startsWith('postgres');
}

export async function listTables(_req: Request, res: Response) {
  try {
    if (isPostgres()) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT table_name AS name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`
      );
      res.json(rows.map((r) => r.name));
      return;
    } else {
      let rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
      );
      if (!rows || rows.length === 0) {
        rows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
        );
      }
      res.json(rows.map((r) => r.name));
      return;
    }
  } catch (err: any) {
    console.error('[db-admin] listTables error', err);
    res.status(500).json({ message: String(err?.message || 'Failed to list tables') });
  }
}

export async function getTableInfo(req: Request, res: Response): Promise<void> {
  const { table } = req.params;
  if (!table) {
    res.status(400).json({ message: 'table required' });
    return;
  }
  try {
    if (isPostgres()) {
      const columns = await prisma.$queryRawUnsafe<any[]>(
        `SELECT column_name as name, data_type as type FROM information_schema.columns WHERE table_schema='public' AND table_name = $1 ORDER BY ordinal_position`,
        table
      );
      let count = 0;
      try {
        const countRows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*)::int AS count FROM "public"."${table}"`
        );
        count = countRows?.[0]?.count ?? 0;
      } catch (err) {
        console.warn('[db-admin] getTableInfo postgres count failed for', table, err);
      }
      res.json({ columns, count });
      return;
    } else {
      const pragma = await prisma.$queryRawUnsafe<any[]>(`PRAGMA table_info("${table}")`);
      const cols = (pragma || []).map((c) => ({ name: c.name, type: c.type }));
      let count = 0;
      try {
        const countRows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(*) AS count FROM "${table}"`
        );
        count = Number(countRows?.[0]?.count ?? 0);
      } catch (err) {
        console.warn('[db-admin] getTableInfo sqlite count failed for', table, err);
      }
      res.json({ columns: cols, count });
      return;
    }
  } catch (err: any) {
    console.error('[db-admin] getTableInfo error', table, err);
    res.status(500).json({ message: String(err?.message || 'Failed to get table info') });
  }
}

export async function getTableRows(req: Request, res: Response): Promise<void> {
  const { table } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 100), 1000);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);
  if (!table) {
    res.status(400).json({ message: 'table required' });
    return;
  }
  try {
    if (isPostgres()) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "public"."${table}" OFFSET $1 LIMIT $2`,
        offset,
        limit
      );
      res.json({ rows, limit, offset });
      return;
    } else {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "${table}" LIMIT ${limit} OFFSET ${offset}`
      );
      res.json({ rows, limit, offset });
      return;
    }
  } catch (err: any) {
    console.error('[db-admin] getTableRows error', table, err);
    res.status(500).json({ message: String(err?.message || 'Failed to get table rows') });
  }
}
