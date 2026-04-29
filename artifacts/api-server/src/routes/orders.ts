import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  customersTable,
  productsTable,
  orderStatusHistoryTable,
  quotationsTable,
  dispatchDocumentsTable,
  paymentsTable,
  paymentProofsTable,
  usersTable,
} from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
  ListOrdersQueryParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
} from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";
import {
  serializeOrder,
  serializeStatusEvent,
  serializeQuotation,
  serializeDispatchDocument,
  serializePayment,
  serializeProof,
  num,
} from "../lib/serialize";
import { notifyCustomerOfOrder, notifyTeam } from "../lib/notify";

const router: IRouter = Router();

router.get("/orders", requireAuth, async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const user = getUser(req);
  const conditions = [];
  if (query.data.status) conditions.push(eq(ordersTable.status, query.data.status));
  if (query.data.customerId)
    conditions.push(eq(ordersTable.customerId, query.data.customerId));
  if (user.role === "customer") {
    if (!user.customerId) {
      res.json([]);
      return;
    }
    conditions.push(eq(ordersTable.customerId, user.customerId));
  }

  const rows = await db
    .select({
      order: ordersTable,
      customerName: customersTable.name,
      latestQuotedRate: sql<string | null>`(
        SELECT q.rate FROM quotations q
        WHERE q.order_id = ${ordersTable.id}
        ORDER BY q.revision_no DESC LIMIT 1
      )`,
      outstanding: sql<string | null>`(
        SELECT COALESCE(SUM(p.balance_outstanding), 0) FROM payments p
        WHERE p.order_id = ${ordersTable.id}
      )`,
    })
    .from(ordersTable)
    .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt));

  res.json(
    rows.map((r) => ({
      id: r.order.id,
      orderNumber: r.order.orderNumber,
      customerId: r.order.customerId,
      customerName: r.customerName,
      productName: r.order.productName,
      quantity: r.order.quantity,
      color: r.order.color,
      requiredDeliveryDate: r.order.requiredDeliveryDate
        ? typeof r.order.requiredDeliveryDate === "string"
          ? r.order.requiredDeliveryDate
          : (r.order.requiredDeliveryDate as Date).toISOString().slice(0, 10)
        : null,
      status: r.order.status,
      createdAt: r.order.createdAt.toISOString(),
      latestQuotedRate: r.latestQuotedRate == null ? null : num(r.latestQuotedRate),
      outstandingAmount:
        r.outstanding == null ? null : num(r.outstanding),
    })),
  );
});

router.post("/orders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = getUser(req);

  // Customer creates for self; staff must specify customerId
  let customerId = parsed.data.customerId ?? null;
  if (user.role === "customer") {
    if (!user.customerId) {
      res.status(400).json({ error: "Customer profile missing" });
      return;
    }
    customerId = user.customerId;
  }
  if (!customerId) {
    res.status(400).json({ error: "customerId is required" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, parsed.data.productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, customerId));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const seqResult = await db.execute<{ nextSeq: number }>(
    sql`SELECT COALESCE(MAX(order_seq), 0) + 1 AS "nextSeq" FROM orders`,
  );
  const nextSeqVal = Number((seqResult.rows[0] as { nextSeq: number } | undefined)?.nextSeq ?? 1);
  const year = new Date().getFullYear();
  const orderNumber = `AUM-${year}-${String(nextSeqVal).padStart(4, "0")}`;

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      customerId,
      productId: product.id,
      productName: parsed.data.productName ?? product.name,
      category: product.category,
      neckType: parsed.data.neckType ?? product.neckType,
      gramWeight:
        parsed.data.gramWeight != null
          ? String(parsed.data.gramWeight)
          : product.gramWeight,
      color: parsed.data.color ?? null,
      quantity: parsed.data.quantity,
      requiredDeliveryDate: parsed.data.requiredDeliveryDate
        ? new Date(parsed.data.requiredDeliveryDate).toISOString().slice(0, 10)
        : null,
      deliveryLocation: parsed.data.deliveryLocation ?? null,
      remarks: parsed.data.remarks ?? null,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
      attachmentName: parsed.data.attachmentName ?? null,
      status: "requirement_received",
      createdBy: user.id,
    })
    .returning();

  await db.insert(orderStatusHistoryTable).values({
    orderId: order.id,
    status: "requirement_received",
    remarks: "Requirement submitted",
    updatedBy: user.id,
  });

  await notifyTeam(
    ["sales"],
    "New requirement received",
    `${customer.name} submitted a requirement for ${order.productName} (qty ${order.quantity}).`,
    `/orders/${order.id}`,
  );

  res.json(serializeOrder(order, customer.name));
});

router.get("/orders/:orderId", requireAuth, async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const user = getUser(req);

  const [orderRow] = await db
    .select({
      order: ordersTable,
      customerName: customersTable.name,
    })
    .from(ordersTable)
    .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .where(eq(ordersTable.id, params.data.orderId));
  if (!orderRow) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (
    user.role === "customer" &&
    orderRow.order.customerId !== user.customerId
  ) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const history = await db
    .select({
      event: orderStatusHistoryTable,
      userName: usersTable.name,
    })
    .from(orderStatusHistoryTable)
    .leftJoin(usersTable, eq(orderStatusHistoryTable.updatedBy, usersTable.id))
    .where(eq(orderStatusHistoryTable.orderId, orderRow.order.id))
    .orderBy(desc(orderStatusHistoryTable.createdAt));

  const quotations = await db
    .select({
      q: quotationsTable,
      userName: usersTable.name,
    })
    .from(quotationsTable)
    .leftJoin(usersTable, eq(quotationsTable.createdBy, usersTable.id))
    .where(eq(quotationsTable.orderId, orderRow.order.id))
    .orderBy(desc(quotationsTable.revisionNo));

  const documents = await db
    .select({
      d: dispatchDocumentsTable,
      userName: usersTable.name,
    })
    .from(dispatchDocumentsTable)
    .leftJoin(usersTable, eq(dispatchDocumentsTable.uploadedBy, usersTable.id))
    .where(eq(dispatchDocumentsTable.orderId, orderRow.order.id))
    .orderBy(desc(dispatchDocumentsTable.createdAt));

  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, orderRow.order.id))
    .orderBy(desc(paymentsTable.createdAt));

  const paymentDetails = await Promise.all(
    payments.map(async (p) => {
      const proofs = await db
        .select()
        .from(paymentProofsTable)
        .where(eq(paymentProofsTable.paymentId, p.id))
        .orderBy(desc(paymentProofsTable.createdAt));
      return {
        payment: serializePayment(p),
        proofs: proofs.map(serializeProof),
      };
    }),
  );

  res.json({
    order: serializeOrder(orderRow.order, orderRow.customerName),
    history: history.map((h) =>
      serializeStatusEvent(h.event, h.userName ?? "System"),
    ),
    quotations: quotations.map((q) =>
      serializeQuotation(q.q, orderRow.order.quantity, q.userName ?? null),
    ),
    dispatchDocuments: documents.map((d) =>
      serializeDispatchDocument(d.d, d.userName ?? null),
    ),
    payments: paymentDetails,
  });
});

router.post("/orders/:orderId/status", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateOrderStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const user = getUser(req);
  if (user.role === "customer") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [orderRow] = await db
    .select({ order: ordersTable, customerName: customersTable.name })
    .from(ordersTable)
    .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .where(eq(ordersTable.id, params.data.orderId));
  if (!orderRow) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: body.data.status })
    .where(eq(ordersTable.id, orderRow.order.id))
    .returning();

  await db.insert(orderStatusHistoryTable).values({
    orderId: orderRow.order.id,
    status: body.data.status,
    remarks: body.data.remarks ?? null,
    updatedBy: user.id,
  });

  await notifyCustomerOfOrder(
    orderRow.order.customerId,
    "Order status updated",
    `Order ${orderRow.order.orderNumber} is now: ${labelStatus(body.data.status)}`,
    `/orders/${orderRow.order.id}`,
  );

  res.json(serializeOrder(updated, orderRow.customerName));
});

function labelStatus(status: string): string {
  return status
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default router;
