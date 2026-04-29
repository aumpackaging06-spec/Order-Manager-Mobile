import { db, notificationsTable, usersTable } from "@workspace/db";
import { eq, or, inArray } from "drizzle-orm";

const TEAM_ROLES = ["sales", "accounts", "dispatch", "super_admin"];

export async function notifyUsers(
  userIds: string[],
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  if (userIds.length === 0) return;
  await db.insert(notificationsTable).values(
    userIds.map((userId) => ({
      userId,
      title,
      body,
      link: link ?? null,
    })),
  );
}

export async function notifyCustomerOfOrder(
  customerId: string,
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  const users = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.customerId, customerId));
  await notifyUsers(
    users.map((u) => u.id),
    title,
    body,
    link,
  );
}

export async function notifyTeam(
  roles: string[],
  title: string,
  body: string,
  link?: string,
): Promise<void> {
  const targets = Array.from(new Set([...roles, "super_admin"])).filter((r) =>
    TEAM_ROLES.includes(r),
  );
  const users = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(inArray(usersTable.role, targets));
  await notifyUsers(
    users.map((u) => u.id),
    title,
    body,
    link,
  );
}
