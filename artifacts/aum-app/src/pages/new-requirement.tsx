import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useListProducts, useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const requirementSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  neckType: z.string().optional(),
  gramWeight: z.coerce.number().optional(),
  color: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  requiredDeliveryDate: z.date().optional(),
  deliveryLocation: z.string().optional(),
  remarks: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
});

export default function NewRequirement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: products, isLoading: isLoadingProducts } = useListProducts();
  const createOrderMutation = useCreateOrder();

  const form = useForm<z.infer<typeof requirementSchema>>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      productId: "",
      neckType: "",
      gramWeight: undefined,
      color: "",
      quantity: 1000,
      deliveryLocation: "",
      remarks: "",
      attachmentUrl: "",
      attachmentName: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof requirementSchema>) => {
    try {
      const payload = {
        ...values,
        requiredDeliveryDate: values.requiredDeliveryDate ? values.requiredDeliveryDate.toISOString() : undefined,
      };
      
      const result = await createOrderMutation.mutateAsync({ data: payload });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      
      toast({
        title: "Requirement submitted",
        description: "Your requirement has been successfully submitted.",
      });
      
      setLocation(`/orders/${result.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to submit requirement",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const selectedProductId = form.watch("productId");
  const selectedProduct = products?.find(p => p.id === selectedProductId);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Requirement</h1>
        <p className="text-sm text-gray-500">Submit a new requirement to get a quotation.</p>
      </div>

      <div className="bg-white rounded-xl border p-4 md:p-6 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Product Details</h2>
              
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={isLoadingProducts ? "Loading..." : "Select a product"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="neckType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Neck Type</FormLabel>
                      <FormControl>
                        <Input placeholder={selectedProduct?.neckType || "e.g. 28mm PCO"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gramWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gram Weight (g)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder={selectedProduct?.gramWeight?.toString() || "e.g. 14.5"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Clear, Blue, Green" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter quantity" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Delivery & Remarks</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requiredDeliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Required Delivery Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-white",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks / Special Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any specific requirements..." 
                        className="resize-none h-24 bg-white" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setLocation("/")} disabled={createOrderMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Requirement
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
