import { useListOrders } from "@workspace/api-client-react";
import { OrderStatus, UserRole } from "@workspace/api-client-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Package } from "lucide-react";
import { getStatusMeta } from "@/lib/constants";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListCustomers, getListCustomersQueryKey } from "@workspace/api-client-react";

export default function Orders() {
  const { user } = useAuth();
  const isCustomer = user?.role === UserRole.customer;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  const { data: orders, isLoading } = useListOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
    customerId: customerFilter !== "all" ? customerFilter : undefined,
  });

  const { data: customers } = useListCustomers({
    query: {
      enabled: !isCustomer,
      queryKey: getListCustomersQueryKey(),
    }
  });

  const filteredOrders = orders?.filter(o => 
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
    o.productName.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6 flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
        <p className="text-sm text-gray-500">Track and manage requirements</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search order no. or product..." 
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(OrderStatus).map(([key, val]) => (
                <SelectItem key={key} value={val}>{getStatusMeta(val as OrderStatus).label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {!isCustomer && customers && (
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isCustomer && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <Badge 
            variant="outline" 
            className={`cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-full border-2 ${statusFilter === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50 border-transparent shadow-sm'}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </Badge>
          {['requirement_received', 'in_production', 'dispatched', 'payment_pending'].map(status => {
            const meta = getStatusMeta(status as OrderStatus);
            return (
              <Badge 
                key={status}
                variant="outline" 
                className={`cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-full border-2 ${statusFilter === status ? `bg-white ${meta.color.split(' ')[1]} border-current` : 'bg-white text-gray-600 hover:bg-gray-50 border-transparent shadow-sm'}`}
                onClick={() => setStatusFilter(status)}
              >
                {meta.label}
              </Badge>
            )
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 md:mx-0 md:px-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl"></div>)}
          </div>
        ) : filteredOrders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center text-gray-500">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900 mb-1">No orders found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {filteredOrders?.map((order) => {
              const meta = getStatusMeta(order.status);
              return (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider">{order.orderNumber}</div>
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${meta.color} font-bold border-0 bg-opacity-20`}>
                        {meta.label}
                      </Badge>
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">{order.productName}</div>
                    {!isCustomer && <div className="text-sm text-gray-600 mb-3">{order.customerName}</div>}
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t text-sm">
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium text-gray-900 mr-1">{order.quantity.toLocaleString()}</span> pcs
                      </div>
                      {order.color && (
                        <div className="flex items-center text-gray-600">
                          <div className="w-2 h-2 rounded-full bg-gray-300 mr-1.5" style={{ backgroundColor: order.color.toLowerCase() === 'clear' ? '#f0f0f0' : order.color }}></div>
                          {order.color}
                        </div>
                      )}
                      <div className="text-gray-400 text-xs ml-auto">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
