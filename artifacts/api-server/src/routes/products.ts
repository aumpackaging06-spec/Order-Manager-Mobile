import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { serializeProduct } from "../lib/serialize";

const router: IRouter = Router();

router.get("/products", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .orderBy(productsTable.category, productsTable.name);
  res.json(rows.map(serializeProduct));
});

export default router;
