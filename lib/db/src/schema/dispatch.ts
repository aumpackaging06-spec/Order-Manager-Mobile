import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { usersTable } from "./users";

export const dispatchDocumentsTable = pgTable("dispatch_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  docType: text("doc_type").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  transportDetails: text("transport_details"),
  vehicleNumber: text("vehicle_number"),
  dispatchDate: date("dispatch_date").notNull(),
  quantityDispatched: integer("quantity_dispatched"),
  uploadedBy: uuid("uploaded_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type DispatchDocument = typeof dispatchDocumentsTable.$inferSelect;
