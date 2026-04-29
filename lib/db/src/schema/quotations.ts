import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { usersTable } from "./users";

export const quotationsTable = pgTable("quotations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  revisionNo: integer("revision_no").notNull().default(1),
  rate: numeric("rate", { precision: 14, scale: 4 }).notNull(),
  gstPercent: numeric("gst_percent", { precision: 5, scale: 2 })
    .notNull()
    .default("18"),
  freight: numeric("freight", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  discount: numeric("discount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  paymentTerms: text("payment_terms").notNull(),
  expectedDispatchDate: date("expected_dispatch_date"),
  notes: text("notes"),
  status: text("status").notNull().default("sent"),
  responseReason: text("response_reason"),
  createdBy: uuid("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Quotation = typeof quotationsTable.$inferSelect;
