import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  ordersTable,
  customersTable,
  quotationsTable,
  orderStatusHistoryTable,
  usersTable,
} from "@workspace/db";
import {
  CreateQuotationBody,
  CreateQuotationParams,
  RespondToQuotationBody,
  RespondToQuotationParams,
} from "@workspace/api-zod";
import { requireAuth, getUser, requireRole } from "../lib/auth";
import { serializeQuotation } from "../lib/serialize";
import { notifyCustomerOfOrder, notifyTeam } from "../lib/notify";

const router: IRouter = Router();

router.post(
  "/orders/:orderId/quotation",
  requireAuth,
  requireRole("sales", "super_admin"),
  async (req, res): Promise<void> => {
    const params = CreateQuotationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = CreateQuotationBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const user = getUser(req);

    const [orderRow] = await db
      .select({ order: ordersTable, customerName: customersTable.name })
      .from(ordersTable)
      .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(eq(ordersTable.id, params.data.orderId));
    if (!orderRow) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const [latest] = await db
      .select()
      .from(quotationsTable)
      .where(eq(quotationsTable.orderId, orderRow.order.id))
      .orderBy(desc(quotationsTable.revisionNo))
      .limit(1);

    const nextRev = latest ? latest.revisionNo + 1 : 1;

    const [q] = await db
      .insert(quotationsTable)
      .values({
        orderId: orderRow.order.id,
        revisionNo: nextRev,
        rate: String(body.data.rate),
        gstPercent: String(body.data.gstPercent),
        freight: String(body.data.freight),
        discount: String(body.data.discount),
        paymentTerms: body.data.paymentTerms,
        expectedDispatchDate: body.data.expectedDispatchDate
          ? new Date(body.data.expectedDispatchDate).toISOString().slice(0, 10)
          : null,
        notes: body.data.notes ?? null,
        status: "sent",
        createdBy: user.id,
      })
      .returning();

    await db
      .update(ordersTable)
      .set({ status: "quotation_sent" })
      .where(eq(ordersTable.id, orderRow.order.id));

    await db.insert(orderStatusHistoryTable).values({
      orderId: orderRow.order.id,
      status: "quotation_sent",
      remarks: `Quotation #${nextRev} sent`,
      updatedBy: user.id,
    });

    await notifyCustomerOfOrder(
      orderRow.order.customerId,
      "New quotation received",
      `A quotation for order ${orderRow.order.orderNumber} is ready for your review.`,
      `/orders/${orderRow.order.id}`,
    );

    const [createdByUser] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    res.json(
      serializeQuotation(q, orderRow.order.quantity, createdByUser?.name ?? null),
    );
  },
);

router.post(
  "/orders/:orderId/quotation/respond",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = RespondToQuotationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = RespondToQuotationBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const user = getUser(req);

    const [orderRow] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, params.data.orderId));
    if (!orderRow) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (user.role === "customer" && orderRow.customerId !== user.customerId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [latest] = await db
      .select()
      .from(quotationsTable)
      .where(eq(quotationsTable.orderId, orderRow.id))
      .orderBy(desc(quotationsTable.revisionNo))
      .limit(1);

    if (!latest) {
      res.status(400).json({ error: "No quotation to respond to" });
      return;
    }

    let nextStatus = latest.status;
    let orderStatus = orderRow.status;
    let historyRemark = "";
    if (body.data.action === "accept") {
      nextStatus = "accepted";
      orderStatus = "order_confirmed";
      historyRemark = `Quotation accepted by ${user.name}`;
    } else if (body.data.action === "reject") {
      nextStatus = "rejected";
      orderStatus = orderRow.status;
      historyRemark = `Quotation rejected: ${body.data.reason ?? "no reason provided"}`;
    } else {
      nextStatus = "revision_requested";
      orderStatus = "quote_revision_requested";
      historyRemark = `Revision requested: ${body.data.reason ?? "no reason provided"}`;
    }

    const [updatedQ] = await db
      .update(quotationsTable)
      .set({
        status: nextStatus,
        responseReason: body.data.reason ?? null,
      })
      .where(eq(quotationsTable.id, latest.id))
      .returning();

    if (orderStatus !== orderRow.status) {
      await db
        .update(ordersTable)
        .set({ status: orderStatus })
        .where(eq(ordersTable.id, orderRow.id));
      await db.insert(orderStatusHistoryTable).values({
        orderId: orderRow.id,
        status: orderStatus,
        remarks: historyRemark,
        updatedBy: user.id,
      });
    } else {
      await db.insert(orderStatusHistoryTable).values({
        orderId: orderRow.id,
        status: orderRow.status,
        remarks: historyRemark,
        updatedBy: user.id,
      });
    }

    await notifyTeam(
      ["sales"],
      `Quotation ${body.data.action.replace("_", " ")}`,
      `${user.name} ${body.data.action === "accept" ? "accepted" : body.data.action === "reject" ? "rejected" : "requested revision for"} the quotation on order ${orderRow.orderNumber}.`,
      `/orders/${orderRow.id}`,
    );

    res.json(serializeQuotation(updatedQ, orderRow.quantity, null));
  },
);

export default router;
