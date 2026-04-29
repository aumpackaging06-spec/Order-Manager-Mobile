import { useGetCustomerOutstanding } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Outstanding() {
  const { data, isLoading } = useGetCustomerOutstanding();
  const [search, setSearch] = useState("");

  const filtered = data?.filter(row => row.customerName.toLowerCase().includes(search.toLowerCase()));
  
  const totalInvoiced = filtered?.reduce((acc, r) => acc + r.totalInvoiced, 0) || 0;
  const totalReceived = filtered?.reduce((acc, r) => acc + r.totalReceived, 0) || 0;
  const totalOutstanding = filtered?.reduce((acc, r) => acc + r.outstanding, 0) || 0;
  const totalOverdue = filtered?.reduce((acc, r) => acc + r.overdueAmount, 0) || 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Outstanding</h1>
          <p className="text-sm text-gray-500">Track customer payments and overdues</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Invoiced</p>
            <p className="text-xl font-bold">₹{(totalInvoiced/100000).toFixed(2)}L</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Received</p>
            <p className="text-xl font-bold text-emerald-600">₹{(totalReceived/100000).toFixed(2)}L</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Outstanding</p>
            <p className="text-xl font-bold text-orange-600">₹{(totalOutstanding/100000).toFixed(2)}L</p>
          </CardContent>
        </Card>
        <Card className="border-destructive shadow-sm bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-destructive uppercase tracking-wider mb-1">Overdue</p>
            <p className="text-xl font-bold text-destructive">₹{(totalOverdue/100000).toFixed(2)}L</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search customers..." className="pl-9 bg-white" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total Invoiced</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right text-destructive">Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No records found</TableCell></TableRow>
              ) : (
                filtered?.map((row) => (
                  <TableRow key={row.customerId}>
                    <TableCell className="font-medium">{row.customerName}</TableCell>
                    <TableCell className="text-right">₹{row.totalInvoiced.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-emerald-600">₹{row.totalReceived.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-semibold">₹{row.outstanding.toLocaleString('en-IN')}</TableCell>
                    <TableCell className={`text-right font-bold ${row.overdueAmount > 0 ? 'text-destructive' : 'text-gray-400'}`}>
                      ₹{row.overdueAmount.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
