import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { MarkNotificationReadParams } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";
import { serializeNotification } from "../lib/serialize";

const router: IRouter = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const user = getUser(req);
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);
  res.json(rows.map(serializeNotification));
});

router.post(
  "/notifications/:notificationId/read",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = MarkNotificationReadParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const user = getUser(req);
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(
        and(
          eq(notificationsTable.id, params.data.notificationId),
          eq(notificationsTable.userId, user.id),
        ),
      );
    res.json({ success: true });
  },
);

router.post(
  "/notifications/read-all",
  requireAuth,
  async (req, res): Promise<void> => {
    const user = getUser(req);
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.userId, user.id));
    res.json({ success: true });
  },
);

export default router;
