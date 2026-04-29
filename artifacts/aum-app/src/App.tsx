import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { UserRole } from "@workspace/api-client-react";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import Notifications from "@/pages/notifications";
import Profile from "@/pages/profile";
import NewRequirement from "@/pages/new-requirement";
import Customers from "@/pages/customers";
import Outstanding from "@/pages/outstanding";
import Products from "@/pages/products";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, path, allowedRoles }: { component: any, path: string, allowedRoles?: UserRole[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-[100dvh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/" />;
  }

  return <Route path={path} component={Component} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="*">
        <AppShell>
          <Switch>
            <ProtectedRoute path="/" component={Dashboard} />
            <ProtectedRoute path="/orders" component={Orders} />
            <ProtectedRoute path="/orders/:id" component={OrderDetail} />
            <ProtectedRoute path="/notifications" component={Notifications} />
            <ProtectedRoute path="/profile" component={Profile} />
            
            {/* Customer specific */}
            <ProtectedRoute path="/requirements/new" component={NewRequirement} allowedRoles={[UserRole.customer]} />
            
            {/* Admin specific */}
            <ProtectedRoute path="/customers" component={Customers} allowedRoles={[UserRole.super_admin, UserRole.sales]} />
            <ProtectedRoute path="/outstanding" component={Outstanding} allowedRoles={[UserRole.super_admin, UserRole.accounts]} />
            <ProtectedRoute path="/products" component={Products} allowedRoles={[UserRole.super_admin]} />
            
            <Route component={NotFound} />
          </Switch>
        </AppShell>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
