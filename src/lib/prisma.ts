import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Vercel's DATABASE_URL might be outdated (pointing to wrong aws-0 host).
// DIRECT_URL was working, so we derive the correct Transaction Pooler URL (6543) from it!
let connectionString = process.env.DATABASE_URL || "";
if (process.env.DIRECT_URL) {
  // Replace port 5432 with 6543 and add pgbouncer=true
  connectionString = process.env.DIRECT_URL.replace(':5432', ':6543');
  if (!connectionString.includes('pgbouncer=true')) {
    connectionString += (connectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }
}

const pool = connectionString ? new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}) : null;
const adapter = pool ? new PrismaPg(pool) : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Always cache in globalThis to prevent connection pool exhaustion across hot reloads (dev) and serverless invocations (prod)
globalForPrisma.prisma = prisma;
