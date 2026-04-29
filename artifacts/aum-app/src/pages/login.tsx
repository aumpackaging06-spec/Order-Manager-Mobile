import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { DEMO_CREDENTIALS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      await login(values);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (creds: typeof DEMO_CREDENTIALS[0]) => {
    form.setValue("email", creds.email);
    form.setValue("password", creds.password);
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      <div className="w-full max-w-md z-10 relative">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-primary tracking-tight">AUM</h1>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">Packaging</p>
          <p className="text-xs text-muted-foreground mt-2 italic">"Where Quality Meets Excellence"</p>
        </div>

        <Card className="border-border shadow-xl shadow-primary/5">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 pt-6 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-4 text-center uppercase tracking-wider">Demo Access</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {DEMO_CREDENTIALS.map((creds) => (
                  <Button 
                    key={creds.role} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDemoLogin(creds)}
                    className="text-xs border-dashed"
                    disabled={isLoading}
                  >
                    {creds.role}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
