import {
  pgTable,
  text,
  uuid,
  timestamp,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";
import { usersTable } from "./users";

export const paymentsTable = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  invoiceNumber: text("invoice_number"),
  invoiceAmount: numeric("invoice_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  paymentReceived: numeric("payment_received", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  balanceOutstanding: numeric("balance_outstanding", {
    precision: 14,
    scale: 2,
  })
    .notNull()
    .default("0"),
  dueDate: date("due_date"),
  status: text("status").notNull().default("pending"),
  remarks: text("remarks"),
  updatedBy: uuid("updated_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Payment = typeof paymentsTable.$inferSelect;

export const paymentProofsTable = pgTable("payment_proofs", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => paymentsTable.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  amountClaimed: numeric("amount_claimed", { precision: 14, scale: 2 }),
  payerRemarks: text("payer_remarks"),
  status: text("status").notNull().default("submitted"),
  reviewRemarks: text("review_remarks"),
  reviewedBy: uuid("reviewed_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PaymentProof = typeof paymentProofsTable.$inferSelect;
