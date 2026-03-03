import { Link, useLocation } from "wouter";
import { Heart, Home, LayoutDashboard, Plus } from "lucide-react";
import { SubmitPostDialog } from "./submit-post-dialog";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full glass-card border-b-0 border-t-0 border-x-0 rounded-none rounded-b-3xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <span className="font-display font-bold text-xl text-foreground hidden sm:block tracking-wide">
              HostFamily <span className="text-primary font-light">Hub</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/" 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                location === '/' 
                  ? 'bg-secondary text-primary shadow-sm' 
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:block">Community Feed</span>
            </Link>
            
            <Link 
              href="/dashboard" 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                location === '/dashboard' 
                  ? 'bg-secondary text-primary shadow-sm' 
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:block">Coordinator</span>
            </Link>

            <div className="w-px h-8 bg-border mx-1 sm:mx-2" />

            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Share / Ask
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {children}
      </main>

      <SubmitPostDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
