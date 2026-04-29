import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, customersTable } from "@workspace/db";
import {
  CreateCustomerBody,
  GetCustomerParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole, getUser } from "../lib/auth";
import { serializeCustomer } from "../lib/serialize";

const router: IRouter = Router();

router.get(
  "/customers",
  requireAuth,
  requireRole("sales", "accounts", "dispatch", "super_admin"),
  async (_req, res): Promise<void> => {
    const rows = await db
      .select()
      .from(customersTable)
      .orderBy(customersTable.name);
    res.json(rows.map(serializeCustomer));
  },
);

router.post(
  "/customers",
  requireAuth,
  requireRole("sales", "super_admin"),
  async (req, res): Promise<void> => {
    const parsed = CreateCustomerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(customersTable)
      .values({
        ...parsed.data,
        creditLimit: String(parsed.data.creditLimit),
      })
      .returning();
    res.json(serializeCustomer(row));
  },
);

router.get("/customers/:customerId", requireAuth, async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = getUser(req);
  // Customers can only see their own customer record
  if (
    user.role === "customer" &&
    user.customerId !== params.data.customerId
  ) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [row] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, params.data.customerId));
  if (!row) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(serializeCustomer(row));
});

export default router;
