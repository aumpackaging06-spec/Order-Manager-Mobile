import { OrderStatus } from "@workspace/api-client-react";

export const DEMO_CREDENTIALS = [
  { role: "Customer", email: "aarav@bluewave.in", password: "password123" },
  { role: "Sales", email: "sales@aumpackaging.in", password: "password123" },
  { role: "Accounts", email: "accounts@aumpackaging.in", password: "password123" },
  { role: "Dispatch", email: "dispatch@aumpackaging.in", password: "password123" },
  { role: "Super Admin", email: "admin@aumpackaging.in", password: "password123" },
];

export const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.requirement_received]: { label: "Requirement Received", color: "bg-blue-100 text-blue-800 border-blue-200" },
  [OrderStatus.quotation_sent]: { label: "Quotation Sent", color: "bg-purple-100 text-purple-800 border-purple-200" },
  [OrderStatus.quote_revision_requested]: { label: "Revision Requested", color: "bg-orange-100 text-orange-800 border-orange-200" },
  [OrderStatus.quote_accepted]: { label: "Quote Accepted", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  [OrderStatus.order_confirmed]: { label: "Order Confirmed", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  [OrderStatus.in_production]: { label: "In Production", color: "bg-blue-100 text-blue-800 border-blue-200" },
  [OrderStatus.ready_for_dispatch]: { label: "Ready for Dispatch", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  [OrderStatus.partially_dispatched]: { label: "Partially Dispatched", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  [OrderStatus.fully_dispatched]: { label: "Fully Dispatched", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  [OrderStatus.invoice_generated]: { label: "Invoice Generated", color: "bg-gray-100 text-gray-800 border-gray-200" },
  [OrderStatus.payment_pending]: { label: "Payment Pending", color: "bg-amber-100 text-amber-800 border-amber-200" },
  [OrderStatus.payment_received]: { label: "Payment Received", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  [OrderStatus.order_closed]: { label: "Order Closed", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

export const getStatusMeta = (status: OrderStatus) => STATUS_META[status] || { label: status, color: "bg-gray-100 text-gray-800 border-gray-200" };
