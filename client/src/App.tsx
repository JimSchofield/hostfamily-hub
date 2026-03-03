import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import FeedPage from "@/pages/feed";
import DashboardPage from "@/pages/dashboard";
import AuthPage from "@/pages/auth";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function AuthGuard({ children, requireCoordinator = false }: { children: React.ReactNode; requireCoordinator?: boolean }) {
  const { data: user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (user.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Pending Approval</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Your account is awaiting coordinator approval. You'll receive access once approved.
          </p>
          <p className="text-xs text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{user.email}</span></p>
          <button
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST", credentials: "include" }).then(() => {
                queryClient.clear();
                setLocation("/");
              });
            }}
            className="mt-4 text-xs text-primary hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (user.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your registration was not approved. Please contact the coordinator for more information.
          </p>
        </div>
      </div>
    );
  }

  if (requireCoordinator && user.role !== "coordinator") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground text-sm">This page is only accessible to coordinators.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AuthGuard><FeedPage /></AuthGuard>} />
      <Route path="/dashboard" component={() => <AuthGuard requireCoordinator><DashboardPage /></AuthGuard>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
