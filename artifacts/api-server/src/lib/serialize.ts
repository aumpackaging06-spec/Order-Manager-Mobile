import type {
  Customer,
  Order,
  OrderStatusHistory,
  Product,
  Quotation,
  DispatchDocument,
  Payment,
  PaymentProof,
  Notification,
} from "@workspace/db";

export function num(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function dateStr(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
}

export function serializeCustomer(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    gstNo: c.gstNo,
    address: c.address,
    contactPerson: c.contactPerson,
    phone: c.phone,
    email: c.email,
    creditLimit: num(c.creditLimit),
    paymentTerms: c.paymentTerms,
  };
}

export function serializeProduct(p: Product) {
  return {
    id: p.id,
    category: p.category,
    name: p.name,
    neckType: p.neckType,
    gramWeight: p.gramWeight == null ? null : num(p.gramWeight),
    description: p.description,
  };
}

export function serializeOrder(
  o: Order,
  customerName: string,
) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerId: o.customerId,
    customerName,
    productId: o.productId,
    productName: o.productName,
    category: o.category,
    neckType: o.neckType,
    gramWeight: o.gramWeight == null ? null : num(o.gramWeight),
    color: o.color,
    quantity: o.quantity,
    requiredDeliveryDate: dateStr(o.requiredDeliveryDate),
    deliveryLocation: o.deliveryLocation,
    remarks: o.remarks,
    attachmentUrl: o.attachmentUrl,
    attachmentName: o.attachmentName,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  };
}

export function serializeStatusEvent(
  e: OrderStatusHistory,
  updatedByName: string,
) {
  return {
    id: e.id,
    orderId: e.orderId,
    status: e.status,
    remarks: e.remarks,
    updatedByName,
    createdAt: e.createdAt.toISOString(),
  };
}

export function quotationTotal(q: Quotation, quantity: number): number {
  const rate = num(q.rate);
  const gst = num(q.gstPercent);
  const freight = num(q.freight);
  const discount = num(q.discount);
  const subtotal = rate * quantity;
  const gstAmount = (subtotal * gst) / 100;
  return subtotal + gstAmount + freight - discount;
}

export function serializeQuotation(
  q: Quotation,
  quantity: number,
  createdByName: string | null,
) {
  return {
    id: q.id,
    orderId: q.orderId,
    revisionNo: q.revisionNo,
    rate: num(q.rate),
    gstPercent: num(q.gstPercent),
    freight: num(q.freight),
    discount: num(q.discount),
    paymentTerms: q.paymentTerms,
    expectedDispatchDate: dateStr(q.expectedDispatchDate),
    notes: q.notes,
    status: q.status,
    responseReason: q.responseReason,
    totalAmount: quotationTotal(q, quantity),
    createdByName,
    createdAt: q.createdAt.toISOString(),
  };
}

export function serializeDispatchDocument(
  d: DispatchDocument,
  uploadedByName: string | null,
) {
  return {
    id: d.id,
    orderId: d.orderId,
    docType: d.docType,
    fileName: d.fileName,
    fileUrl: d.fileUrl,
    transportDetails: d.transportDetails,
    vehicleNumber: d.vehicleNumber,
    dispatchDate: dateStr(d.dispatchDate) ?? "",
    quantityDispatched: d.quantityDispatched,
    uploadedByName,
    createdAt: d.createdAt.toISOString(),
  };
}

export function serializePayment(p: Payment) {
  return {
    id: p.id,
    orderId: p.orderId,
    invoiceNumber: p.invoiceNumber,
    invoiceAmount: num(p.invoiceAmount),
    paymentReceived: num(p.paymentReceived),
    balanceOutstanding: num(p.balanceOutstanding),
    dueDate: dateStr(p.dueDate),
    status: p.status,
    remarks: p.remarks,
    createdAt: p.createdAt.toISOString(),
  };
}

export function serializeProof(p: PaymentProof) {
  return {
    id: p.id,
    paymentId: p.paymentId,
    fileName: p.fileName,
    fileUrl: p.fileUrl,
    amountClaimed: p.amountClaimed == null ? null : num(p.amountClaimed),
    payerRemarks: p.payerRemarks,
    status: p.status,
    reviewRemarks: p.reviewRemarks,
    createdAt: p.createdAt.toISOString(),
  };
}

export function serializeNotification(n: Notification) {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

export function derivePaymentStatus(
  invoiceAmount: number,
  received: number,
  dueDate: string | null,
): string {
  if (received >= invoiceAmount && invoiceAmount > 0) return "paid";
  if (received > 0 && received < invoiceAmount) return "part_paid";
  if (dueDate) {
    const due = new Date(dueDate);
    if (due.getTime() < Date.now() && received < invoiceAmount) return "overdue";
  }
  return "pending";
}
