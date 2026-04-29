import { useState } from "react";
import { useListCustomers, useCreateCustomer, getListCustomersQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Building, MapPin, Phone, Mail, FileText, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const customerSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  gstNo: z.string().min(15, "Valid GST No required"),
  address: z.string().min(1, "Address is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string().min(10, "Valid phone required"),
  email: z.string().email("Valid email required"),
  creditLimit: z.coerce.number().min(0),
  paymentTerms: z.string().min(1, "Payment terms required"),
});

export default function Customers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  const { data: customers, isLoading } = useListCustomers();
  const createMutation = useCreateCustomer();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "", gstNo: "", address: "", contactPerson: "", phone: "", email: "", creditLimit: 0, paymentTerms: "Advance"
    }
  });

  const onSubmit = async (values: z.infer<typeof customerSchema>) => {
    try {
      await createMutation.mutateAsync({ data: values });
      queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      toast({ title: "Customer created successfully" });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ title: "Failed to create customer", description: error.message, variant: "destructive" });
    }
  };

  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.gstNo.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Customer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({field}) => <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                  <FormField control={form.control} name="gstNo" render={({field}) => <FormItem><FormLabel>GST No.</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                  <FormField control={form.control} name="contactPerson" render={({field}) => <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                  <FormField control={form.control} name="phone" render={({field}) => <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                  <FormField control={form.control} name="email" render={({field}) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field}/></FormControl><FormMessage/></FormItem>} />
                  <FormField control={form.control} name="creditLimit" render={({field}) => <FormItem><FormLabel>Credit Limit (₹)</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage/></FormItem>} />
                  <FormField control={form.control} name="paymentTerms" render={({field}) => <FormItem><FormLabel>Payment Terms</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                </div>
                <FormField control={form.control} name="address" render={({field}) => <FormItem><FormLabel>Billing Address</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={createMutation.isPending}>Save Customer</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search customers..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>)}
          </div>
        ) : filteredCustomers?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No customers found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
            {filteredCustomers?.map(customer => (
              <div key={customer.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">GST: {customer.gstNo}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-400"/> {customer.contactPerson}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400"/> {customer.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400"/> <span className="truncate">{customer.email}</span></div>
                  <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5"/> <span className="line-clamp-2">{customer.address}</span></div>
                </div>
                <div className="pt-3 border-t flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-900">Limit: ₹{customer.creditLimit.toLocaleString('en-IN')}</span>
                  <span className="text-gray-500">{customer.paymentTerms}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
