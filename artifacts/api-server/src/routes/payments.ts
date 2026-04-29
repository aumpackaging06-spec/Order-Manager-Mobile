import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  ordersTable,
  paymentsTable,
  paymentProofsTable,
  orderStatusHistoryTable,
} from "@workspace/db";
import {
  CreatePaymentBody,
  CreatePaymentParams,
  ListOrderPaymentsParams,
  SubmitPaymentProofBody,
  SubmitPaymentProofParams,
  ReviewPaymentProofBody,
  ReviewPaymentProofParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole, getUser } from "../lib/auth";
import {
  serializePayment,
  serializeProof,
  derivePaymentStatus,
  num,
} from "../lib/serialize";
import { notifyCustomerOfOrder, notifyTeam } from "../lib/notify";

const router: IRouter = Router();

router.get(
  "/orders/:orderId/payments",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListOrderPaymentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
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
    const payments = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.orderId, orderRow.id))
      .orderBy(desc(paymentsTable.createdAt));
    res.json(payments.map(serializePayment));
  },
);

router.post(
  "/orders/:orderId/payments",
  requireAuth,
  requireRole("accounts", "super_admin"),
  async (req, res): Promise<void> => {
    const params = CreatePaymentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = CreatePaymentBody.safeParse(req.body);
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
    const invoice = body.data.invoiceAmount;
    const received = body.data.paymentReceived;
    const balance = invoice - received;
    const dueDate = body.data.dueDate
      ? new Date(body.data.dueDate).toISOString().slice(0, 10)
      : null;
    const status = derivePaymentStatus(invoice, received, dueDate);

    const [p] = await db
      .insert(paymentsTable)
      .values({
        orderId: orderRow.id,
        invoiceNumber: body.data.invoiceNumber ?? null,
        invoiceAmount: String(invoice),
        paymentReceived: String(received),
        balanceOutstanding: String(balance),
        dueDate,
        status,
        remarks: body.data.remarks ?? null,
        updatedBy: user.id,
      })
      .returning();

    // Update order status
    let orderStatus = orderRow.status;
    if (status === "paid") {
      orderStatus = "payment_received";
    } else if (orderRow.status === "fully_dispatched") {
      orderStatus = "invoice_generated";
    } else if (
      orderRow.status === "invoice_generated" ||
      orderRow.status === "payment_pending"
    ) {
      orderStatus = "payment_pending";
    }
    if (orderStatus !== orderRow.status) {
      await db
        .update(ordersTable)
        .set({ status: orderStatus })
        .where(eq(ordersTable.id, orderRow.id));
      await db.insert(orderStatusHistoryTable).values({
        orderId: orderRow.id,
        status: orderStatus,
        remarks: `Invoice ${body.data.invoiceNumber ?? ""} updated`,
        updatedBy: user.id,
      });
    }

    await notifyCustomerOfOrder(
      orderRow.customerId,
      status === "paid" ? "Payment confirmed" : "Invoice updated",
      `Order ${orderRow.orderNumber}: ₹${received.toFixed(2)} received of ₹${invoice.toFixed(2)} (balance ₹${balance.toFixed(2)}).`,
      `/orders/${orderRow.id}`,
    );

    res.json(serializePayment(p));
  },
);

router.post(
  "/payments/:paymentId/proofs",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = SubmitPaymentProofParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = SubmitPaymentProofBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const user = getUser(req);

    const [payment] = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, params.data.paymentId));
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, payment.orderId));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (user.role === "customer" && order.customerId !== user.customerId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [proof] = await db
      .insert(paymentProofsTable)
      .values({
        paymentId: payment.id,
        fileName: body.data.fileName,
        fileUrl: body.data.fileUrl ?? null,
        amountClaimed:
          body.data.amountClaimed != null
            ? String(body.data.amountClaimed)
            : null,
        payerRemarks: body.data.payerRemarks ?? null,
        status: "submitted",
      })
      .returning();

    await notifyTeam(
      ["accounts"],
      "Payment proof submitted",
      `${user.name} uploaded a payment proof for order ${order.orderNumber}.`,
      `/orders/${order.id}`,
    );

    res.json(serializeProof(proof));
  },
);

router.post(
  "/payment-proofs/:proofId/review",
  requireAuth,
  requireRole("accounts", "super_admin"),
  async (req, res): Promise<void> => {
    const params = ReviewPaymentProofParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = ReviewPaymentProofBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const user = getUser(req);
    const [proof] = await db
      .select()
      .from(paymentProofsTable)
      .where(eq(paymentProofsTable.id, params.data.proofId));
    if (!proof) {
      res.status(404).json({ error: "Proof not found" });
      return;
    }
    const newStatus = body.data.action === "approve" ? "approved" : "rejected";
    const [updated] = await db
      .update(paymentProofsTable)
      .set({
        status: newStatus,
        reviewRemarks: body.data.reviewRemarks ?? null,
        reviewedBy: user.id,
      })
      .where(eq(paymentProofsTable.id, proof.id))
      .returning();

    // If approved, increase paymentReceived
    if (body.data.action === "approve") {
      const [payment] = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.id, proof.paymentId));
      if (payment && proof.amountClaimed) {
        const newReceived = num(payment.paymentReceived) + num(proof.amountClaimed);
        const invoice = num(payment.invoiceAmount);
        const balance = invoice - newReceived;
        const status = derivePaymentStatus(
          invoice,
          newReceived,
          payment.dueDate as string | null,
        );
        await db
          .update(paymentsTable)
          .set({
            paymentReceived: String(newReceived),
            balanceOutstanding: String(balance),
            status,
          })
          .where(eq(paymentsTable.id, payment.id));

        const [order] = await db
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.id, payment.orderId));
        if (order && status === "paid") {
          await db
            .update(ordersTable)
            .set({ status: "payment_received" })
            .where(eq(ordersTable.id, order.id));
          await db.insert(orderStatusHistoryTable).values({
            orderId: order.id,
            status: "payment_received",
            remarks: "Payment fully received",
            updatedBy: user.id,
          });
        }
        await notifyCustomerOfOrder(
          order!.customerId,
          "Payment proof approved",
          `Your payment proof for order ${order!.orderNumber} has been approved.`,
          `/orders/${order!.id}`,
        );
      }
    } else {
      const [payment] = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.id, proof.paymentId));
      if (payment) {
        const [order] = await db
          .select()
          .from(ordersTable)
          .where(eq(ordersTable.id, payment.orderId));
        if (order) {
          await notifyCustomerOfOrder(
            order.customerId,
            "Payment proof rejected",
            `Your payment proof for order ${order.orderNumber} was rejected. ${body.data.reviewRemarks ?? ""}`,
            `/orders/${order.id}`,
          );
        }
      }
    }

    res.json(serializeProof(updated));
  },
);

export default router;
