import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Home, List, Bell, User, LayoutDashboard, Users, CreditCard, Package } from "lucide-react";
import { UserRole } from "@workspace/api-client-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const isCustomer = user.role === UserRole.customer;

  const customerLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/orders", label: "Orders", icon: List },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const adminLinks: { href: string; label: string; icon: typeof LayoutDashboard; roles?: UserRole[] }[] = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orders", label: "Orders", icon: List },
    { href: "/customers", label: "Customers", icon: Users, roles: [UserRole.super_admin, UserRole.sales] },
    { href: "/outstanding", label: "Outstanding", icon: CreditCard, roles: [UserRole.super_admin, UserRole.accounts] },
    { href: "/products", label: "Products", icon: Package, roles: [UserRole.super_admin] },
    { href: "/notifications", label: "Alerts", icon: Bell },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const links = isCustomer 
    ? customerLinks 
    : adminLinks.filter(l => !l.roles || l.roles.includes(user.role));

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50">
      {/* Top App Bar */}
      <header className="flex-none h-16 bg-white border-b flex items-center px-4 md:px-6 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <Link href="/">
            <div className="font-serif font-bold text-2xl text-primary tracking-tight cursor-pointer flex items-center">
              AUM
            </div>
          </Link>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider hidden sm:block ml-2 border-l pl-2 border-border">
            Packaging
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm font-medium text-right hidden sm:block">
            <div className="text-foreground">{user.name}</div>
            <div className="text-muted-foreground text-xs">{isCustomer ? user.customerName : user.role}</div>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            {user.name.charAt(0)}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Admin) */}
        {!isCustomer && (
          <aside className="hidden md:flex flex-col w-64 bg-white border-r overflow-y-auto">
            <nav className="flex-1 px-3 py-4 space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href || (link.href !== '/' && location.startsWith(link.href));
                return (
                  <Link key={link.href} href={link.href}>
                    <div className={`flex items-center px-3 py-2 rounded-md transition-colors cursor-pointer ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                      {link.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav (Customer & Admin) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex justify-around items-center px-2 z-30 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {links.slice(0, 5).map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || (link.href !== '/' && location.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href}>
              <div className={`flex flex-col items-center justify-center w-full h-full cursor-pointer ${isActive ? 'text-accent' : 'text-gray-400 hover:text-gray-600'}`}>
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-accent' : ''}`} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
