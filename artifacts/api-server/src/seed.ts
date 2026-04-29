import {
  db,
  usersTable,
  customersTable,
  productsTable,
  ordersTable,
  orderStatusHistoryTable,
  quotationsTable,
  dispatchDocumentsTable,
  paymentsTable,
  notificationsTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "./lib/auth";
import { logger } from "./lib/logger";

async function seed(): Promise<void> {
  logger.info("Starting seed");

  const existing = await db.select().from(usersTable).limit(1);
  if (existing.length > 0) {
    logger.info("Users already exist, skipping seed");
    return;
  }

  // Customers
  const [bluewave, sparkle, riverside] = await db
    .insert(customersTable)
    .values([
      {
        name: "Bluewave Beverages Pvt Ltd",
        gstNo: "27ABCDE1234F1Z5",
        address: "Plot 14, MIDC Industrial Area, Pune, Maharashtra 411019",
        contactPerson: "Aarav Mehta",
        phone: "+91 98220 11223",
        email: "aarav@bluewave.in",
        creditLimit: "1500000",
        paymentTerms: "30 days net",
      },
      {
        name: "Sparkle Mineral Co.",
        gstNo: "29FGHIJ5678K1Z2",
        address: "No. 8, Hosur Road, Bengaluru, Karnataka 560100",
        contactPerson: "Neha Iyer",
        phone: "+91 99800 33445",
        email: "ops@sparklemineral.in",
        creditLimit: "800000",
        paymentTerms: "45 days net",
      },
      {
        name: "Riverside Bottling Works",
        gstNo: "07KLMNO9012L1Z8",
        address: "C-22, Okhla Phase II, New Delhi 110020",
        contactPerson: "Rohit Bansal",
        phone: "+91 98110 77889",
        email: "purchase@riverside.in",
        creditLimit: "500000",
        paymentTerms: "15 days net",
      },
    ])
    .returning();

  // Products
  const productSeed = [
    { category: "preform", name: "PET Preform 6.6g", neckType: "PCO 1881", gramWeight: "6.6", description: "Lightweight CSD preform" },
    { category: "preform", name: "PET Preform 9.6g", neckType: "PCO 1881", gramWeight: "9.6", description: "Standard 500ml water preform" },
    { category: "preform", name: "PET Preform 10.2g", neckType: "PCO 1881", gramWeight: "10.2", description: "1L water preform" },
    { category: "preform", name: "PET Preform 12g", neckType: "PCO 1881", gramWeight: "12", description: "Heavyweight CSD preform" },
    { category: "preform", name: "PET Preform 13g", neckType: "PCO 1810", gramWeight: "13", description: "Premium CSD preform" },
    { category: "cap", name: "Water Bottle Cap", neckType: "PCO 1881", gramWeight: "1.85", description: "Standard water bottle closure" },
    { category: "cap", name: "Bubble Top Cap", neckType: "55mm", gramWeight: "8.0", description: "20L bubble top closure" },
    { category: "bottle", name: "PET Bottle 750ml", neckType: "PCO 1881", gramWeight: "22", description: "Clear PET bottle" },
  ] as const;

  const products = await db
    .insert(productsTable)
    .values(
      productSeed.map((p) => ({
        category: p.category,
        name: p.name,
        neckType: p.neckType,
        gramWeight: p.gramWeight,
        description: p.description,
      })),
    )
    .returning();

  const byName = (n: string) => products.find((p) => p.name === n)!;

  // Users
  const password = await hashPassword("password123");
  const [customerUser, salesUser, accountsUser, dispatchUser, adminUser, customer2User] =
    await db
      .insert(usersTable)
      .values([
        {
          email: "aarav@bluewave.in",
          passwordHash: password,
          name: "Aarav Mehta",
          role: "customer",
          customerId: bluewave.id,
        },
        {
          email: "sales@aumpackaging.in",
          passwordHash: password,
          name: "Priya Shah",
          role: "sales",
        },
        {
          email: "accounts@aumpackaging.in",
          passwordHash: password,
          name: "Vikram Joshi",
          role: "accounts",
        },
        {
          email: "dispatch@aumpackaging.in",
          passwordHash: password,
          name: "Sandeep Rao",
          role: "dispatch",
        },
        {
          email: "admin@aumpackaging.in",
          passwordHash: password,
          name: "Anjali Verma",
          role: "super_admin",
        },
        {
          email: "neha@sparklemineral.in",
          passwordHash: password,
          name: "Neha Iyer",
          role: "customer",
          customerId: sparkle.id,
        },
      ])
      .returning();

  // Orders + history + quotations + dispatch + payments to populate dashboards
  type SeedOrder = {
    customerId: string;
    productName: string;
    qty: number;
    color: string | null;
    location: string;
    daysAgo: number;
    targetStatus:
      | "requirement_received"
      | "quotation_sent"
      | "order_confirmed"
      | "in_production"
      | "fully_dispatched"
      | "payment_pending"
      | "payment_received";
  };

  const orderSeed: SeedOrder[] = [
    {
      customerId: bluewave.id,
      productName: "PET Preform 9.6g",
      qty: 50000,
      color: "Crystal Clear",
      location: "Pune Plant 1",
      daysAgo: 1,
      targetStatus: "requirement_received",
    },
    {
      customerId: bluewave.id,
      productName: "PET Preform 12g",
      qty: 80000,
      color: "Light Blue",
      location: "Pune Plant 2",
      daysAgo: 4,
      targetStatus: "quotation_sent",
    },
    {
      customerId: bluewave.id,
      productName: "Water Bottle Cap",
      qty: 250000,
      color: "White",
      location: "Pune Plant 1",
      daysAgo: 9,
      targetStatus: "in_production",
    },
    {
      customerId: bluewave.id,
      productName: "PET Bottle 750ml",
      qty: 12000,
      color: "Crystal Clear",
      location: "Pune Plant 2",
      daysAgo: 18,
      targetStatus: "fully_dispatched",
    },
    {
      customerId: bluewave.id,
      productName: "PET Preform 6.6g",
      qty: 100000,
      color: "Tinted Green",
      location: "Pune Plant 1",
      daysAgo: 28,
      targetStatus: "payment_pending",
    },
    {
      customerId: sparkle.id,
      productName: "PET Preform 10.2g",
      qty: 60000,
      color: "Crystal Clear",
      location: "Bengaluru DC",
      daysAgo: 2,
      targetStatus: "order_confirmed",
    },
    {
      customerId: sparkle.id,
      productName: "Bubble Top Cap",
      qty: 20000,
      color: "Sky Blue",
      location: "Bengaluru DC",
      daysAgo: 35,
      targetStatus: "payment_received",
    },
    {
      customerId: riverside.id,
      productName: "PET Preform 13g",
      qty: 40000,
      color: "Amber",
      location: "Delhi Hub",
      daysAgo: 6,
      targetStatus: "quotation_sent",
    },
  ];

  const statusFlow: Record<SeedOrder["targetStatus"], string[]> = {
    requirement_received: ["requirement_received"],
    quotation_sent: ["requirement_received", "quotation_sent"],
    order_confirmed: ["requirement_received", "quotation_sent", "quote_accepted", "order_confirmed"],
    in_production: [
      "requirement_received",
      "quotation_sent",
      "quote_accepted",
      "order_confirmed",
      "in_production",
    ],
    fully_dispatched: [
      "requirement_received",
      "quotation_sent",
      "quote_accepted",
      "order_confirmed",
      "in_production",
      "ready_for_dispatch",
      "fully_dispatched",
    ],
    payment_pending: [
      "requirement_received",
      "quotation_sent",
      "quote_accepted",
      "order_confirmed",
      "in_production",
      "ready_for_dispatch",
      "fully_dispatched",
      "invoice_generated",
      "payment_pending",
    ],
    payment_received: [
      "requirement_received",
      "quotation_sent",
      "quote_accepted",
      "order_confirmed",
      "in_production",
      "ready_for_dispatch",
      "fully_dispatched",
      "invoice_generated",
      "payment_pending",
      "payment_received",
    ],
  };

  for (let i = 0; i < orderSeed.length; i++) {
    const so = orderSeed[i];
    const product = byName(so.productName);
    const seq = i + 1;
    const orderNumber = `AUM-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
    const createdAt = new Date(Date.now() - so.daysAgo * 86400000);

    const [order] = await db
      .insert(ordersTable)
      .values({
        orderNumber,
        customerId: so.customerId,
        productId: product.id,
        productName: product.name,
        category: product.category,
        neckType: product.neckType,
        gramWeight: product.gramWeight,
        color: so.color,
        quantity: so.qty,
        requiredDeliveryDate: new Date(Date.now() + 14 * 86400000)
          .toISOString()
          .slice(0, 10),
        deliveryLocation: so.location,
        remarks: "Standard packaging requirement.",
        status: so.targetStatus,
        createdBy:
          so.customerId === bluewave.id
            ? customerUser.id
            : so.customerId === sparkle.id
              ? customer2User.id
              : null,
        createdAt,
      })
      .returning();

    // History
    const flow = statusFlow[so.targetStatus];
    for (let h = 0; h < flow.length; h++) {
      const ts = new Date(createdAt.getTime() + h * 12 * 3600000);
      await db.insert(orderStatusHistoryTable).values({
        orderId: order.id,
        status: flow[h],
        remarks: stageRemark(flow[h]),
        updatedBy: stageUser(flow[h], {
          customer:
            so.customerId === bluewave.id ? customerUser.id : customer2User.id,
          sales: salesUser.id,
          accounts: accountsUser.id,
          dispatch: dispatchUser.id,
          admin: adminUser.id,
        }),
        createdAt: ts,
      });
    }

    // Quotation if past quotation_sent
    if (so.targetStatus !== "requirement_received") {
      const rate = product.category === "preform" ? 2.4 : product.category === "cap" ? 0.9 : 7.5;
      const quotedRate = (rate + (i % 3) * 0.1).toFixed(3);
      const subtotal = Number(quotedRate) * so.qty;
      const freight = Math.round(subtotal * 0.02);
      const discount = i % 2 === 0 ? 1500 : 0;
      const accepted = so.targetStatus !== "quotation_sent";
      await db.insert(quotationsTable).values({
        orderId: order.id,
        revisionNo: 1,
        rate: quotedRate,
        gstPercent: "18",
        freight: String(freight),
        discount: String(discount),
        paymentTerms: "30 days from invoice",
        expectedDispatchDate: new Date(Date.now() + 12 * 86400000)
          .toISOString()
          .slice(0, 10),
        notes: "Pricing valid for 14 days. FOB factory.",
        status: accepted ? "accepted" : "sent",
        createdBy: salesUser.id,
        createdAt: new Date(createdAt.getTime() + 6 * 3600000),
      });
    }

    // Dispatch + payment if past dispatch
    if (
      so.targetStatus === "fully_dispatched" ||
      so.targetStatus === "payment_pending" ||
      so.targetStatus === "payment_received"
    ) {
      await db.insert(dispatchDocumentsTable).values({
        orderId: order.id,
        docType: "invoice",
        fileName: `INV-${order.orderNumber}.pdf`,
        fileUrl: null,
        transportDetails: "VRL Logistics",
        vehicleNumber: "MH 12 AB 3456",
        dispatchDate: new Date(createdAt.getTime() + 7 * 86400000)
          .toISOString()
          .slice(0, 10),
        quantityDispatched: so.qty,
        uploadedBy: dispatchUser.id,
      });
      await db.insert(dispatchDocumentsTable).values({
        orderId: order.id,
        docType: "eway_bill",
        fileName: `EWB-${order.orderNumber}.pdf`,
        fileUrl: null,
        transportDetails: "VRL Logistics",
        vehicleNumber: "MH 12 AB 3456",
        dispatchDate: new Date(createdAt.getTime() + 7 * 86400000)
          .toISOString()
          .slice(0, 10),
        quantityDispatched: so.qty,
        uploadedBy: dispatchUser.id,
      });
    }
    if (
      so.targetStatus === "payment_pending" ||
      so.targetStatus === "payment_received"
    ) {
      const rate = product.category === "preform" ? 2.5 : product.category === "cap" ? 1 : 7.6;
      const invoiceAmount = Math.round(rate * so.qty * 1.18);
      const received = so.targetStatus === "payment_received" ? invoiceAmount : Math.round(invoiceAmount * 0.4);
      const balance = invoiceAmount - received;
      const dueDate = new Date(createdAt.getTime() + 30 * 86400000)
        .toISOString()
        .slice(0, 10);
      const overdue =
        so.targetStatus === "payment_pending" &&
        new Date(dueDate).getTime() < Date.now() &&
        balance > 0;
      await db.insert(paymentsTable).values({
        orderId: order.id,
        invoiceNumber: `INV-${order.orderNumber}`,
        invoiceAmount: String(invoiceAmount),
        paymentReceived: String(received),
        balanceOutstanding: String(balance),
        dueDate,
        status:
          so.targetStatus === "payment_received"
            ? "paid"
            : overdue
              ? "overdue"
              : received > 0
                ? "part_paid"
                : "pending",
        remarks:
          so.targetStatus === "payment_received"
            ? "Payment fully received"
            : "Awaiting balance",
        updatedBy: accountsUser.id,
      });
    }
  }

  // Reset order_seq sequence to past last seed value
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('orders', 'order_seq'), (SELECT MAX(order_seq) FROM orders))`,
  );

  // Notifications
  await db.insert(notificationsTable).values([
    {
      userId: customerUser.id,
      title: "Welcome to AUM Packaging",
      body: "Your customer portal is ready. Submit a new requirement anytime.",
      link: "/",
      read: false,
    },
    {
      userId: customerUser.id,
      title: "New quotation received",
      body: "A quotation for AUM-2026-0002 (PET Preform 12g) is ready for review.",
      link: "/orders",
      read: false,
    },
    {
      userId: salesUser.id,
      title: "New requirement received",
      body: "Bluewave Beverages submitted a fresh requirement for PET Preform 9.6g.",
      link: "/orders",
      read: false,
    },
    {
      userId: accountsUser.id,
      title: "Outstanding watch",
      body: "1 invoice is approaching its due date.",
      link: "/outstanding",
      read: false,
    },
    {
      userId: adminUser.id,
      title: "AUM Packaging operations",
      body: "8 active orders across 3 customers.",
      link: "/",
      read: true,
    },
  ]);

  logger.info("Seed complete");
}

function stageRemark(status: string): string {
  switch (status) {
    case "requirement_received":
      return "Requirement submitted by customer";
    case "quotation_sent":
      return "Quotation sent to customer";
    case "quote_accepted":
      return "Customer accepted quotation";
    case "order_confirmed":
      return "Order confirmed and queued for production";
    case "in_production":
      return "Production started on shop floor";
    case "ready_for_dispatch":
      return "Stock packed and ready";
    case "fully_dispatched":
      return "All cartons handed over to transporter";
    case "invoice_generated":
      return "Invoice generated";
    case "payment_pending":
      return "Awaiting customer payment";
    case "payment_received":
      return "Payment received in full";
    default:
      return "";
  }
}

function stageUser(
  status: string,
  ids: { customer: string; sales: string; accounts: string; dispatch: string; admin: string },
): string {
  if (status === "requirement_received" || status === "quote_accepted") return ids.customer;
  if (status === "quotation_sent" || status === "order_confirmed") return ids.sales;
  if (status === "in_production" || status === "ready_for_dispatch") return ids.admin;
  if (status === "fully_dispatched") return ids.dispatch;
  if (status === "invoice_generated" || status === "payment_pending" || status === "payment_received")
    return ids.accounts;
  return ids.admin;
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, "Seed failed");
    process.exit(1);
  });
