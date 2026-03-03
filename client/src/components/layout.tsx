import { Link, useLocation } from "wouter";
import { Home, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import hcLogo from "@assets/hc-logo_1772557784017.png";
import usahLogo from "@assets/USAH-Logo_1772557803462.jpg";

function getInitial(name: string): string {
  const n = name.startsWith("The ") ? name.slice(4) : name;
  return n.charAt(0).toUpperCase();
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useAuth();
  const logout = useLogout();
  const { toast } = useToast();

  const isCoordinator = user?.role === "coordinator";

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => toast({ title: "Signed out successfully" }),
    });
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

          {/* Dual branding logos */}
          <Link href="/" className="flex items-center gap-3 shrink-0" data-testid="link-home">
            <img src={hcLogo} alt="The Hospitality Center" className="h-8 w-auto object-contain" />
            <div className="w-px h-7 bg-border" />
            <img src={usahLogo} alt="USA Homestays" className="h-7 w-auto object-contain" />
          </Link>

          <nav className="flex items-center gap-1.5">
            <Link
              href="/"
              data-testid="link-feed"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location === "/"
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:block">Community</span>
            </Link>

            {isCoordinator && (
              <Link
                href="/dashboard"
                data-testid="link-dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location === "/dashboard"
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:block">Coordinator</span>
              </Link>
            )}

            {user && (
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {getInitial(user.name)}
                </div>
                <span className="text-sm font-medium text-foreground hidden md:block max-w-[100px] truncate" data-testid="text-username">
                  {user.name}
                </span>
                <button
                  data-testid="button-logout"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
