import { useParams } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  useGetOrder, 
  useUpdateOrderStatus, 
  useCreateQuotation, 
  useRespondToQuotation,
  useAddDispatchDocument,
  useCreatePayment,
  useSubmitPaymentProof,
  useReviewPaymentProof,
  getGetOrderQueryKey
} from "@workspace/api-client-react";
import { UserRole, OrderStatus, QuotationStatus, DispatchDocType, QuotationResponseRequestAction, ReviewPaymentProofRequestAction } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusMeta } from "@/lib/constants";
import { format } from "date-fns";
import { Package, Clock, FileText, Truck, IndianRupee, CheckCircle2, XCircle, ArrowRight, Upload, MapPin, Building, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const orderId = id || "";
  const { data, isLoading } = useGetOrder(orderId, { query: { enabled: !!id, queryKey: getGetOrderQueryKey(orderId) } });
  
  if (isLoading) {
    return <div className="p-4 md:p-6 space-y-4 animate-pulse">
      <div className="h-20 bg-gray-200 rounded-xl"></div>
      <div className="h-10 bg-gray-200 rounded w-1/2"></div>
      <div className="h-64 bg-gray-200 rounded-xl"></div>
    </div>;
  }

  if (!data) return <div className="p-6 text-center text-gray-500">Order not found</div>;

  const { order, history, quotations, dispatchDocuments, payments } = data;
  const meta = getStatusMeta(order.status);
  const latestQuotation = quotations.length > 0 ? quotations[quotations.length - 1] : null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6 flex flex-col h-[calc(100vh-4rem)] md:h-auto overflow-y-auto">
      <div className="bg-white p-4 md:p-6 rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-gray-500 uppercase tracking-wider">{order.orderNumber}</span>
              <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-bold border-0 bg-opacity-20 ${meta.color}`}>
                {meta.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{order.productName}</h1>
            {user?.role !== UserRole.customer && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <Building className="h-3 w-3" /> {order.customerName}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <RoleActions order={order} user={user} latestQuotation={latestQuotation} />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-transparent border-b rounded-none h-auto p-0 mb-4 overflow-x-auto hide-scrollbar">
          <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="quotation" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 text-xs sm:text-sm">Quotes</TabsTrigger>
          <TabsTrigger value="dispatch" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 text-xs sm:text-sm">Dispatch</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 text-xs sm:text-sm">Payments</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 text-xs sm:text-sm">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Requirement Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500 font-medium uppercase tracking-wider text-xs mb-1">Category</dt>
                  <dd className="font-medium text-gray-900">{order.category || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium uppercase tracking-wider text-xs mb-1">Quantity</dt>
                  <dd className="font-medium text-gray-900">{order.quantity.toLocaleString()} pcs</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium uppercase tracking-wider text-xs mb-1">Color</dt>
                  <dd className="font-medium text-gray-900">{order.color || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium uppercase tracking-wider text-xs mb-1">Neck Type</dt>
                  <dd className="font-medium text-gray-900">{order.neckType || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium uppercase tracking-wider text-xs mb-1">Gram Weight</dt>
                  <dd className="font-medium text-gray-900">{order.gramWeight ? `${order.gramWeight}g` : 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium uppercase tracking-wider text-xs mb-1">Req. Delivery Date</dt>
                  <dd className="font-medium text-gray-900">{order.requiredDeliveryDate ? format(new Date(order.requiredDeliveryDate), 'PP') : 'N/A'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 font-medium uppercase tracking-wider text-xs mb-1">Delivery Location</dt>
                  <dd className="font-medium text-gray-900 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" /> {order.deliveryLocation || 'N/A'}
                  </dd>
                </div>
                {order.remarks && (
                  <div className="sm:col-span-2">
                    <dt className="text-gray-500 font-medium uppercase tracking-wider text-xs mb-1">Remarks</dt>
                    <dd className="text-gray-900 bg-gray-50 p-3 rounded-md">{order.remarks}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotation" className="space-y-4">
          {quotations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-sm font-medium text-gray-900">No quotation yet</h3>
              <p className="text-sm text-gray-500 mt-1">Our sales team is preparing a quotation for this requirement.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {latestQuotation && (
                <Card className="border-primary shadow-sm border-2 overflow-hidden">
                  <div className="bg-primary text-primary-foreground px-4 py-2 flex justify-between items-center text-sm">
                    <span className="font-medium">Active Quotation (Rev {latestQuotation.revisionNo})</span>
                    <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                      {latestQuotation.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Rate</p>
                        <p className="text-lg font-bold">₹{latestQuotation.rate.toFixed(2)}<span className="text-xs text-gray-500 font-normal">/pc</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Quantity</p>
                        <p className="text-lg font-bold">{order.quantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">GST</p>
                        <p className="text-lg font-bold">{latestQuotation.gstPercent}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-primary uppercase tracking-wider font-medium mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-primary">₹{latestQuotation.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Payment Terms</p>
                        <p className="font-medium">{latestQuotation.paymentTerms}</p>
                      </div>
                      {latestQuotation.expectedDispatchDate && (
                        <div>
                          <p className="text-gray-500 font-medium mb-1">Expected Dispatch</p>
                          <p className="font-medium">{format(new Date(latestQuotation.expectedDispatchDate), 'PP')}</p>
                        </div>
                      )}
                      {latestQuotation.notes && (
                        <div className="sm:col-span-2 mt-2">
                          <p className="text-gray-500 font-medium mb-1">Notes</p>
                          <p className="bg-gray-50 p-3 rounded text-gray-700">{latestQuotation.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {quotations.length > 1 && (
                <div className="pt-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Previous Revisions</h4>
                  <div className="space-y-2">
                    {quotations.slice(0, -1).reverse().map((q) => (
                      <div key={q.id} className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center text-sm">
                        <div>
                          <span className="font-medium">Rev {q.revisionNo}</span>
                          <span className="text-gray-500 ml-2">₹{q.rate}/pc &bull; Total: ₹{q.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <Badge variant="outline" className="text-gray-500">{q.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dispatch" className="space-y-4">
          {dispatchDocuments.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-xl border border-dashed">
             <Truck className="mx-auto h-12 w-12 text-gray-300 mb-3" />
             <h3 className="text-sm font-medium text-gray-900">No dispatches yet</h3>
             <p className="text-sm text-gray-500 mt-1">Dispatch details will appear here once production is complete.</p>
           </div>
          ) : (
            <div className="space-y-4">
              {dispatchDocuments.map((doc) => (
                <Card key={doc.id} className="border-border shadow-sm">
                  <CardHeader className="py-3 px-4 bg-gray-50 border-b flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <CardTitle className="text-sm font-semibold">{doc.docType.replace('_', ' ').toUpperCase()}</CardTitle>
                    </div>
                    <span className="text-xs font-medium text-gray-500">{format(new Date(doc.dispatchDate), 'PP')}</span>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Ref / File</p>
                        <p className="font-medium">{doc.fileName}</p>
                      </div>
                      {doc.quantityDispatched && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Quantity</p>
                          <p className="font-medium">{doc.quantityDispatched.toLocaleString()} pcs</p>
                        </div>
                      )}
                      {doc.vehicleNumber && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Vehicle</p>
                          <p className="font-medium">{doc.vehicleNumber}</p>
                        </div>
                      )}
                      {doc.transportDetails && (
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Transport</p>
                          <p className="font-medium truncate">{doc.transportDetails}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {payments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <IndianRupee className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-sm font-medium text-gray-900">No invoices yet</h3>
              <p className="text-sm text-gray-500 mt-1">Payment records will appear here once an invoice is generated.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map(({ payment, proofs }) => (
                <Card key={payment.id} className="border-border shadow-sm overflow-hidden">
                  <div className={`px-4 py-2 border-b flex justify-between items-center ${payment.status === 'paid' ? 'bg-emerald-50 border-emerald-100' : payment.status === 'overdue' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                      Invoice: {payment.invoiceNumber || 'Pending'}
                      <Badge variant="outline" className={`text-[10px] uppercase border-0 ${payment.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : payment.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                        {payment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {payment.dueDate && (
                      <span className="text-xs text-gray-500">Due: {format(new Date(payment.dueDate), 'PP')}</span>
                    )}
                  </div>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Invoice Amt</p>
                        <p className="text-lg font-bold">₹{payment.invoiceAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600 uppercase tracking-wider font-medium mb-1">Received</p>
                        <p className="text-lg font-bold text-emerald-600">₹{payment.paymentReceived.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-orange-600 uppercase tracking-wider font-medium mb-1">Balance</p>
                        <p className="text-lg font-bold text-orange-600">₹{payment.balanceOutstanding.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold text-gray-900">Payment Proofs</h4>
                        {user?.role === UserRole.customer && payment.balanceOutstanding > 0 && (
                          <SubmitProofDialog paymentId={payment.id} />
                        )}
                      </div>
                      
                      {proofs.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No proofs submitted.</p>
                      ) : (
                        <div className="space-y-2">
                          {proofs.map((proof) => (
                            <div key={proof.id} className="bg-gray-50 p-3 rounded border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <span className="font-medium text-gray-900">{proof.fileName}</span>
                                {proof.amountClaimed && <span className="ml-2 text-gray-500">Claimed: ₹{proof.amountClaimed.toLocaleString('en-IN')}</span>}
                                <div className="text-xs text-gray-400 mt-1">{format(new Date(proof.createdAt), 'PP p')}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-[10px] uppercase ${proof.status === 'approved' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : proof.status === 'rejected' ? 'border-red-200 text-red-700 bg-red-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>
                                  {proof.status}
                                </Badge>
                                {user?.role === UserRole.accounts && proof.status === 'submitted' && (
                                  <ReviewProofDialog proofId={proof.id} orderId={order.id} />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="border-border shadow-sm">
            <CardContent className="p-6">
              <div className="relative border-l-2 border-gray-100 ml-3 md:ml-4 space-y-8">
                {history.map((event, i) => {
                  const m = getStatusMeta(event.status);
                  const isLatest = i === 0;
                  return (
                    <div key={event.id} className="relative pl-6 md:pl-8">
                      <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${isLatest ? 'bg-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]' : 'bg-gray-300'}`}></div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
                        <h4 className={`text-sm font-bold ${isLatest ? 'text-gray-900' : 'text-gray-600'}`}>{m.label}</h4>
                        <time className="text-xs text-gray-500 font-medium">{format(new Date(event.createdAt), 'PP p')}</time>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">by {event.updatedByName}</p>
                      {event.remarks && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded inline-block mt-1">{event.remarks}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Dialogs and Action Components

function RoleActions({ order, user, latestQuotation }: any) {
  if (!user || !order) return null;

  const isCustomer = user.role === UserRole.customer;
  const isSales = user.role === UserRole.sales;
  const isDispatch = user.role === UserRole.dispatch;
  const isAccounts = user.role === UserRole.accounts;
  const isAdmin = user.role === UserRole.super_admin;

  return (
    <>
      {isCustomer && order.status === OrderStatus.quotation_sent && latestQuotation && (
        <CustomerQuoteActions orderId={order.id} quotationId={latestQuotation.id} />
      )}
      
      {(isSales || isAdmin) && order.status === OrderStatus.requirement_received && (
        <SendQuotationDialog orderId={order.id} orderQuantity={order.quantity} />
      )}
      
      {(isSales || isAdmin) && (
        <UpdateStatusDialog order={order} />
      )}

      {(isDispatch || isAdmin) && [OrderStatus.in_production, OrderStatus.ready_for_dispatch, OrderStatus.partially_dispatched].includes(order.status) && (
        <AddDispatchDialog orderId={order.id} />
      )}

      {(isAccounts || isAdmin) && (
        <AddPaymentDialog orderId={order.id} />
      )}
    </>
  );
}

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  remarks: z.string().optional(),
});

function UpdateStatusDialog({ order }: { order: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutate = useUpdateOrderStatus();
  
  const form = useForm({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: { status: order.status, remarks: "" }
  });

  const onSubmit = async (values: any) => {
    try {
      await mutate.mutateAsync({ orderId: order.id, data: values });
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(order.id) });
      toast({ title: "Status updated" });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Update Status</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Update Order Status</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                      {Object.values(OrderStatus).map((s) => (
                        <SelectItem key={s} value={s}>{getStatusMeta(s).label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem><FormLabel>Remarks</FormLabel><FormControl><Textarea {...field}/></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutate.isPending}>Update Status</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const quoteSchema = z.object({
  rate: z.coerce.number().min(0.01),
  gstPercent: z.coerce.number().min(0),
  freight: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  paymentTerms: z.string().min(1),
  notes: z.string().optional(),
});

function SendQuotationDialog({ orderId, orderQuantity }: { orderId: string, orderQuantity: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutate = useCreateQuotation();
  
  const form = useForm({
    resolver: zodResolver(quoteSchema),
    defaultValues: { rate: 0, gstPercent: 18, freight: 0, discount: 0, paymentTerms: "50% Advance, 50% against PI", notes: "" }
  });

  const rate = form.watch("rate") || 0;
  const gst = form.watch("gstPercent") || 0;
  const fr = form.watch("freight") || 0;
  const disc = form.watch("discount") || 0;
  const subtotal = rate * orderQuantity;
  const gstAmt = subtotal * (gst / 100);
  const total = subtotal + gstAmt + fr - disc;

  const onSubmit = async (values: any) => {
    try {
      await mutate.mutateAsync({ orderId, data: values });
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      toast({ title: "Quotation sent" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">Send Quote</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Quotation</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="rate" render={({ field }) => (
                <FormItem><FormLabel>Rate / pc (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field}/></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="gstPercent" render={({ field }) => (
                <FormItem><FormLabel>GST (%)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="freight" render={({ field }) => (
                <FormItem><FormLabel>Freight (₹)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="discount" render={({ field }) => (
                <FormItem><FormLabel>Discount (₹)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>
              )} />
            </div>
            
            <div className="bg-gray-50 p-3 rounded border text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal ({orderQuantity.toLocaleString()} pcs):</span> <span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>GST ({gst}%):</span> <span>₹{gstAmt.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Total:</span> <span className="text-primary">₹{total.toFixed(2)}</span></div>
            </div>

            <FormField control={form.control} name="paymentTerms" render={({ field }) => (
              <FormItem><FormLabel>Payment Terms</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes (Optional)</FormLabel><FormControl><Textarea className="h-16" {...field}/></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutate.isPending}>Send Quotation</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CustomerQuoteActions({ orderId, quotationId }: { orderId: string, quotationId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mutate = useRespondToQuotation();

  const handleAction = async (action: QuotationResponseRequestAction) => {
    try {
      await mutate.mutateAsync({ orderId, data: { action } });
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      toast({ title: `Quotation ${action}ed successfully` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => handleAction('reject')} disabled={mutate.isPending}>Reject</Button>
      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction('accept')} disabled={mutate.isPending}>Accept Quote</Button>
    </div>
  );
}

const dispatchSchema = z.object({
  docType: z.nativeEnum(DispatchDocType),
  fileName: z.string().min(1),
  quantityDispatched: z.coerce.number().optional(),
  vehicleNumber: z.string().optional(),
  transportDetails: z.string().optional(),
});

function AddDispatchDialog({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutate = useAddDispatchDocument();
  
  const form = useForm({
    resolver: zodResolver(dispatchSchema),
    defaultValues: { docType: DispatchDocType.eway_bill, fileName: "", quantityDispatched: undefined, vehicleNumber: "", transportDetails: "" }
  });

  const onSubmit = async (values: any) => {
    try {
      await mutate.mutateAsync({ orderId, data: { ...values, dispatchDate: new Date().toISOString() } });
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      toast({ title: "Dispatch document added" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Truck className="w-4 h-4 mr-2"/>Add Dispatch</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Dispatch Details</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="docType" render={({ field }) => (
              <FormItem>
                <FormLabel>Document Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                  <SelectContent>
                    {Object.values(DispatchDocType).map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="fileName" render={({ field }) => (
              <FormItem><FormLabel>Doc Ref / Number</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="quantityDispatched" render={({ field }) => (
                <FormItem><FormLabel>Qty Dispatched</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="vehicleNumber" render={({ field }) => (
                <FormItem><FormLabel>Vehicle No.</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="transportDetails" render={({ field }) => (
              <FormItem><FormLabel>Transporter Name</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutate.isPending}>Add Dispatch</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const paymentSchema = z.object({
  invoiceNumber: z.string().min(1),
  invoiceAmount: z.coerce.number().min(1),
  paymentReceived: z.coerce.number().min(0),
  remarks: z.string().optional(),
});

function AddPaymentDialog({ orderId }: { orderId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutate = useCreatePayment();
  
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { invoiceNumber: "", invoiceAmount: 0, paymentReceived: 0, remarks: "" }
  });

  const onSubmit = async (values: any) => {
    try {
      await mutate.mutateAsync({ orderId, data: values });
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      toast({ title: "Invoice/Payment recorded" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><IndianRupee className="w-4 h-4 mr-2"/>Record Invoice</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record Invoice / Payment</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
              <FormItem><FormLabel>Invoice Number</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="invoiceAmount" render={({ field }) => (
                <FormItem><FormLabel>Invoice Amount (₹)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="paymentReceived" render={({ field }) => (
                <FormItem><FormLabel>Received (₹)</FormLabel><FormControl><Input type="number" {...field}/></FormControl></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem><FormLabel>Remarks</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutate.isPending}>Save Record</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitProofDialog({ paymentId }: { paymentId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutate = useSubmitPaymentProof();
  
  const form = useForm({
    defaultValues: { fileName: "", amountClaimed: 0, payerRemarks: "" }
  });

  const onSubmit = async (values: any) => {
    try {
      await mutate.mutateAsync({ paymentId, data: { ...values, amountClaimed: Number(values.amountClaimed) } });
      toast({ title: "Proof submitted" });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="secondary"><Upload className="w-3 h-3 mr-1"/>Submit Proof</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit Payment Proof</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="fileName" render={({ field }) => (
              <FormItem><FormLabel>Reference No / UTR</FormLabel><FormControl><Input required {...field}/></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="amountClaimed" render={({ field }) => (
              <FormItem><FormLabel>Amount Paid (₹)</FormLabel><FormControl><Input type="number" required {...field}/></FormControl></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutate.isPending}>Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ReviewProofDialog({ proofId, orderId }: { proofId: string, orderId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mutate = useReviewPaymentProof();

  const handleAction = async (action: ReviewPaymentProofRequestAction) => {
    try {
      await mutate.mutateAsync({ proofId, data: { action } });
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      toast({ title: `Proof ${action}d` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex gap-1 ml-2">
      <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => handleAction('approve')}><CheckCircle2 className="h-4 w-4"/></Button>
      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction('reject')}><XCircle className="h-4 w-4"/></Button>
    </div>
  );
}
