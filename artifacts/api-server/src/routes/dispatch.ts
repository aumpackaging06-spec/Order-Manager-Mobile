import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  ordersTable,
  dispatchDocumentsTable,
  orderStatusHistoryTable,
  usersTable,
} from "@workspace/db";
import {
  AddDispatchDocumentBody,
  AddDispatchDocumentParams,
  ListDispatchDocumentsParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole, getUser } from "../lib/auth";
import { serializeDispatchDocument } from "../lib/serialize";
import { notifyCustomerOfOrder } from "../lib/notify";

const router: IRouter = Router();

router.get(
  "/orders/:orderId/documents",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListDispatchDocumentsParams.safeParse(req.params);
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
    const docs = await db
      .select({ d: dispatchDocumentsTable, userName: usersTable.name })
      .from(dispatchDocumentsTable)
      .leftJoin(usersTable, eq(dispatchDocumentsTable.uploadedBy, usersTable.id))
      .where(eq(dispatchDocumentsTable.orderId, orderRow.id))
      .orderBy(desc(dispatchDocumentsTable.createdAt));
    res.json(
      docs.map((row) =>
        serializeDispatchDocument(row.d, row.userName ?? null),
      ),
    );
  },
);

router.post(
  "/orders/:orderId/documents",
  requireAuth,
  requireRole("dispatch", "super_admin", "sales"),
  async (req, res): Promise<void> => {
    const params = AddDispatchDocumentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = AddDispatchDocumentBody.safeParse(req.body);
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

    const [doc] = await db
      .insert(dispatchDocumentsTable)
      .values({
        orderId: orderRow.id,
        docType: body.data.docType,
        fileName: body.data.fileName,
        fileUrl: body.data.fileUrl ?? null,
        transportDetails: body.data.transportDetails ?? null,
        vehicleNumber: body.data.vehicleNumber ?? null,
        dispatchDate: new Date(body.data.dispatchDate)
          .toISOString()
          .slice(0, 10),
        quantityDispatched: body.data.quantityDispatched ?? null,
        uploadedBy: user.id,
      })
      .returning();

    // Auto-advance status
    let newStatus = orderRow.status;
    if (
      orderRow.status === "order_confirmed" ||
      orderRow.status === "in_production" ||
      orderRow.status === "ready_for_dispatch"
    ) {
      newStatus = "partially_dispatched";
    } else if (
      orderRow.status === "partially_dispatched" &&
      body.data.docType === "invoice"
    ) {
      newStatus = "fully_dispatched";
    }
    if (newStatus !== orderRow.status) {
      await db
        .update(ordersTable)
        .set({ status: newStatus })
        .where(eq(ordersTable.id, orderRow.id));
      await db.insert(orderStatusHistoryTable).values({
        orderId: orderRow.id,
        status: newStatus,
        remarks: `${body.data.docType.replace("_", " ")} uploaded`,
        updatedBy: user.id,
      });
    }

    await notifyCustomerOfOrder(
      orderRow.customerId,
      "Dispatch document uploaded",
      `A new ${body.data.docType.replace("_", " ")} is available for order ${orderRow.orderNumber}.`,
      `/orders/${orderRow.id}`,
    );

    res.json(serializeDispatchDocument(doc, user.name));
  },
);

export default router;
