import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  numeric,
  date,
  serial,
} from "drizzle-orm/pg-core";
import { customersTable, usersTable } from "./users";
import { productsTable } from "./products";

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  orderSeq: serial("order_seq").notNull(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => productsTable.id),
  productName: text("product_name").notNull(),
  category: text("category").notNull(),
  neckType: text("neck_type"),
  gramWeight: numeric("gram_weight", { precision: 10, scale: 2 }),
  color: text("color"),
  quantity: integer("quantity").notNull(),
  requiredDeliveryDate: date("required_delivery_date"),
  deliveryLocation: text("delivery_location"),
  remarks: text("remarks"),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  status: text("status").notNull().default("requirement_received"),
  createdBy: uuid("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Order = typeof ordersTable.$inferSelect;

export const orderStatusHistoryTable = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  remarks: text("remarks"),
  updatedBy: uuid("updated_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type OrderStatusHistory = typeof orderStatusHistoryTable.$inferSelect;
