import { pgTable, text, uuid, numeric } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  neckType: text("neck_type"),
  gramWeight: numeric("gram_weight", { precision: 10, scale: 2 }),
  description: text("description"),
});

export type Product = typeof productsTable.$inferSelect;
