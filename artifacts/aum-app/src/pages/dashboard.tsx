import { useAuth } from "@/lib/auth";
import { UserRole } from "@workspace/api-client-react";
import { useGetCustomerDashboard, useGetAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, Clock, CheckCircle, Truck, AlertCircle, CreditCard, Activity, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { getStatusMeta } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useAuth();
  const isCustomer = user?.role === UserRole.customer;

  if (isCustomer) {
    return <CustomerDashboard />;
  }

  return <AdminDashboard />;
}

function CustomerDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useGetCustomerDashboard();

  if (isLoading) {
    return <div className="p-4 md:p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}
      </div>
    </div>;
  }

  if (!data) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, {user?.name}</h1>
          <p className="text-gray-500 mt-1">{user?.customerName}</p>
        </div>
        <Link href="/requirements/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2 shadow-md">
            <PlusCircle className="h-4 w-4" />
            New Requirement
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Requirements" value={data.totalRequirements} icon={Package} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Pending Quotes" value={data.pendingQuotations} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="In Production" value={data.inProduction} icon={Activity} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Dispatched" value={data.dispatched} icon={Truck} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="Payment Pending" value={data.paymentPending} icon={AlertCircle} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Outstanding" value={`₹${data.totalOutstanding.toLocaleString('en-IN')}`} icon={CreditCard} color="text-red-600" bg="bg-red-50" className="col-span-2 md:col-span-3" />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Recent Updates</h2>
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {data.recentTimeline.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No recent updates</div>
          ) : (
            <div className="divide-y">
              {data.recentTimeline.map((item, i) => {
                const meta = getStatusMeta(item.status);
                return (
                  <div key={i} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Link href={`/orders/${item.orderId}`} className="font-medium text-gray-900 hover:text-primary truncate">
                          {item.productName} ({item.orderNumber})
                        </Link>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${meta.color}`}>
                          {meta.label}
                        </Badge>
                        {item.remarks && <span className="text-sm text-gray-500 truncate">{item.remarks}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { data, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return <div className="p-4 md:p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-24 bg-gray-200 rounded"></div>)}
      </div>
    </div>;
  }

  if (!data) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Operations Overview</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="New Reqs" value={data.newRequirements} icon={Package} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Pending Quotes" value={data.pendingQuotations} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="Awaiting Conf." value={data.awaitingConfirmation} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard title="In Production" value={data.inProduction} icon={Activity} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Dispatch Pending" value={data.dispatchPending} icon={Truck} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard title="Payment Pending" value={data.paymentPending} icon={AlertCircle} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Overdue Cust." value={data.overdueCustomers} icon={AlertCircle} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Outstanding" value={`₹${(data.totalOutstanding/100000).toFixed(1)}L`} icon={TrendingUp} color="text-red-600" bg="bg-red-50" />
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Order Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.statusBreakdown.map((stat, i) => {
              const meta = getStatusMeta(stat.status);
              return (
                <div key={stat.status} className="flex items-center">
                  <div className="w-48 text-sm font-medium text-gray-600 truncate">{meta.label}</div>
                  <div className="flex-1 ml-4">
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex items-center">
                      <div 
                        className={`h-full ${meta.color.split(' ')[0]} border-r border-white/20 transition-all`} 
                        style={{ width: `${Math.max(1, (stat.count / Math.max(...data.statusBreakdown.map(s => s.count))) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-bold text-gray-900">{stat.count}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, className = "" }: any) {
  return (
    <Card className={`border-border shadow-sm ${className}`}>
      <CardContent className="p-4 md:p-6 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className={`p-2 rounded-lg ${bg} ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
