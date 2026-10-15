import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getNormalizedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  if ((url.includes(":6543") || url.includes("pooler.supabase.com")) && !url.includes("pgbouncer=true")) {
    url = url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
  }
  if (url.includes("pooler.supabase.com") && !url.includes("connection_limit=")) {
    url = url + (url.includes("?") ? "&" : "?") + "connection_limit=5&pool_timeout=30";
  }
  return url;
}

const datasourceUrl = getNormalizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  });

// Reuse Prisma client instance across warm serverless/edge invocations
globalForPrisma.prisma = prisma;

export default prisma;
