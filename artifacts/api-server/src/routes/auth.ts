import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, customersTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
import { verifyPassword, requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email.toLowerCase()));

  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: user.customerId,
  };

  let customerName: string | null = null;
  if (user.customerId) {
    const [c] = await db
      .select({ name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, user.customerId));
    customerName = c?.name ?? null;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customerId,
      customerName,
    },
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("aum.sid");
    res.json({ success: true });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const u = req.session.user!;
  let customerName: string | null = null;
  if (u.customerId) {
    const [c] = await db
      .select({ name: customersTable.name })
      .from(customersTable)
      .where(eq(customersTable.id, u.customerId));
    customerName = c?.name ?? null;
  }
  res.json({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      customerId: u.customerId,
      customerName,
    },
  });
});

export default router;
