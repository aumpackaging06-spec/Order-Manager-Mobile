import { useAuth } from "@/lib/auth";
import { UserRole } from "@workspace/api-client-react";
import { useGetCustomer, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Building, Phone, Mail, MapPin, FileText, IndianRupee } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Profile() {
  const { user, logout } = useAuth();
  const isCustomer = user?.role === UserRole.customer;

  // We only fetch customer details if the user is a customer and has a customerId
  const customerId = user?.customerId || "";
  const { data: customerDetails, isLoading } = useGetCustomer(customerId, {
    query: {
      enabled: isCustomer && !!user?.customerId,
      queryKey: getGetCustomerQueryKey(customerId),
    }
  });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile</h1>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/80 to-primary"></div>
        <CardContent className="px-6 pb-6 relative pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 mb-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
              <AvatarFallback className="text-2xl font-bold bg-gray-100 text-primary">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left mb-2 sm:mb-0">
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{user?.role.replace('_', ' ')}</p>
            </div>
            <Button variant="outline" className="sm:ml-auto" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-900">{user?.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-900">ID: {user?.id}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isCustomer && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-4 bg-gray-100 rounded w-full"></div>
                ))}
              </div>
            ) : customerDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start text-sm">
                    <Building className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-0.5">Company Name</p>
                      <p className="text-gray-900 font-medium">{customerDetails.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start text-sm">
                    <FileText className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-0.5">GST No.</p>
                      <p className="text-gray-900 font-mono">{customerDetails.gstNo}</p>
                    </div>
                  </div>
                  <div className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-0.5">Address</p>
                      <p className="text-gray-900">{customerDetails.address}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start text-sm">
                    <User className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-0.5">Contact Person</p>
                      <p className="text-gray-900">{customerDetails.contactPerson}</p>
                    </div>
                  </div>
                  <div className="flex items-start text-sm">
                    <Phone className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-0.5">Phone</p>
                      <p className="text-gray-900">{customerDetails.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start text-sm">
                    <IndianRupee className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-500 text-xs uppercase tracking-wider mb-0.5">Credit & Terms</p>
                      <p className="text-gray-900">₹{customerDetails.creditLimit.toLocaleString('en-IN')} Limit &bull; {customerDetails.paymentTerms}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Could not load company details.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
