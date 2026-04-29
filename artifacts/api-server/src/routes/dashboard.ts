import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  customersTable,
  productsTable,
  paymentsTable,
  orderStatusHistoryTable,
} from "@workspace/db";
import { requireAuth, getUser } from "../lib/auth";
import { num } from "../lib/serialize";

const router: IRouter = Router();

router.get(
  "/dashboard/customer",
  requireAuth,
  async (req, res): Promise<void> => {
    const user = getUser(req);
    if (user.role !== "customer" || !user.customerId) {
      res.status(403).json({ error: "Customer access only" });
      return;
    }
    const customerId = user.customerId;

    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.customerId, customerId));
    const total = orders.length;
    const pendingQuotations = orders.filter(
      (o) => o.status === "requirement_received",
    ).length;
    const confirmedOrders = orders.filter((o) =>
      ["quote_accepted", "order_confirmed", "in_production"].includes(o.status),
    ).length;
    const inProduction = orders.filter((o) => o.status === "in_production").length;
    const dispatched = orders.filter((o) =>
      ["partially_dispatched", "fully_dispatched", "invoice_generated", "payment_pending", "payment_received", "order_closed"].includes(
        o.status,
      ),
    ).length;
    const paymentPending = orders.filter((o) =>
      ["payment_pending", "invoice_generated"].includes(o.status),
    ).length;

    const outstandingRows = await db
      .select({
        sum: sql<string>`COALESCE(SUM(${paymentsTable.balanceOutstanding}), 0)`,
      })
      .from(paymentsTable)
      .innerJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
      .where(eq(ordersTable.customerId, customerId));
    const totalOutstanding = num(outstandingRows[0]?.sum);

    const timeline = await db
      .select({
        e: orderStatusHistoryTable,
        orderNumber: ordersTable.orderNumber,
        productName: ordersTable.productName,
        orderId: ordersTable.id,
      })
      .from(orderStatusHistoryTable)
      .innerJoin(ordersTable, eq(orderStatusHistoryTable.orderId, ordersTable.id))
      .where(eq(ordersTable.customerId, customerId))
      .orderBy(desc(orderStatusHistoryTable.createdAt))
      .limit(10);

    res.json({
      totalRequirements: total,
      pendingQuotations,
      confirmedOrders,
      inProduction,
      dispatched,
      paymentPending,
      totalOutstanding,
      recentTimeline: timeline.map((t) => ({
        orderId: t.orderId,
        orderNumber: t.orderNumber,
        productName: t.productName,
        status: t.e.status,
        remarks: t.e.remarks,
        createdAt: t.e.createdAt.toISOString(),
      })),
    });
  },
);

router.get(
  "/dashboard/admin",
  requireAuth,
  async (req, res): Promise<void> => {
    const user = getUser(req);
    if (user.role === "customer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const orders = await db.select().from(ordersTable);
    const newRequirements = orders.filter(
      (o) => o.status === "requirement_received",
    ).length;
    const pendingQuotations = orders.filter(
      (o) => o.status === "quote_revision_requested",
    ).length;
    const awaitingConfirmation = orders.filter(
      (o) => o.status === "quotation_sent",
    ).length;
    const inProduction = orders.filter((o) => o.status === "in_production").length;
    const dispatchPending = orders.filter((o) =>
      ["order_confirmed", "in_production", "ready_for_dispatch", "partially_dispatched"].includes(o.status),
    ).length;
    const paymentPending = orders.filter((o) =>
      ["fully_dispatched", "invoice_generated", "payment_pending"].includes(o.status),
    ).length;

    const overdueRows = await db
      .select({
        customerId: ordersTable.customerId,
      })
      .from(paymentsTable)
      .innerJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
      .where(eq(paymentsTable.status, "overdue"));
    const overdueCustomers = new Set(overdueRows.map((r) => r.customerId)).size;

    const outstandingRows = await db
      .select({
        sum: sql<string>`COALESCE(SUM(${paymentsTable.balanceOutstanding}), 0)`,
      })
      .from(paymentsTable);
    const totalOutstanding = num(outstandingRows[0]?.sum);

    const breakdownRows = await db
      .select({
        status: ordersTable.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(ordersTable)
      .groupBy(ordersTable.status);

    res.json({
      newRequirements,
      pendingQuotations,
      awaitingConfirmation,
      inProduction,
      dispatchPending,
      paymentPending,
      overdueCustomers,
      totalOutstanding,
      statusBreakdown: breakdownRows.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
    });
  },
);

router.get(
  "/dashboard/admin/outstanding",
  requireAuth,
  async (req, res): Promise<void> => {
    const user = getUser(req);
    if (user.role === "customer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const rows = await db
      .select({
        customerId: customersTable.id,
        customerName: customersTable.name,
        totalInvoiced: sql<string>`COALESCE(SUM(${paymentsTable.invoiceAmount}), 0)`,
        totalReceived: sql<string>`COALESCE(SUM(${paymentsTable.paymentReceived}), 0)`,
        outstanding: sql<string>`COALESCE(SUM(${paymentsTable.balanceOutstanding}), 0)`,
        overdueAmount: sql<string>`COALESCE(SUM(CASE WHEN ${paymentsTable.status} = 'overdue' THEN ${paymentsTable.balanceOutstanding} ELSE 0 END), 0)`,
      })
      .from(customersTable)
      .leftJoin(ordersTable, eq(ordersTable.customerId, customersTable.id))
      .leftJoin(paymentsTable, eq(paymentsTable.orderId, ordersTable.id))
      .groupBy(customersTable.id, customersTable.name)
      .orderBy(
        sql`COALESCE(SUM(${paymentsTable.balanceOutstanding}), 0) DESC`,
      );
    res.json(
      rows.map((r) => ({
        customerId: r.customerId,
        customerName: r.customerName,
        totalInvoiced: num(r.totalInvoiced),
        totalReceived: num(r.totalReceived),
        outstanding: num(r.outstanding),
        overdueAmount: num(r.overdueAmount),
      })),
    );
  },
);

router.get(
  "/dashboard/admin/product-summary",
  requireAuth,
  async (req, res): Promise<void> => {
    const user = getUser(req);
    if (user.role === "customer") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const rows = await db
      .select({
        productId: productsTable.id,
        productName: productsTable.name,
        category: productsTable.category,
        totalQuantity: sql<number>`COALESCE(SUM(${ordersTable.quantity}), 0)::int`,
        orderCount: sql<number>`COUNT(${ordersTable.id})::int`,
      })
      .from(productsTable)
      .leftJoin(ordersTable, eq(ordersTable.productId, productsTable.id))
      .groupBy(productsTable.id, productsTable.name, productsTable.category)
      .orderBy(
        sql`COALESCE(SUM(${ordersTable.quantity}), 0) DESC`,
      );
    res.json(
      rows.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        category: r.category,
        totalQuantity: Number(r.totalQuantity),
        orderCount: Number(r.orderCount),
      })),
    );
  },
);

export default router;
