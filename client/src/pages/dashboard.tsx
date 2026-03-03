import { Layout } from "@/components/layout";
import { PostCard } from "@/components/post-card";
import { usePrivatePosts } from "@/hooks/use-posts";
import { ShieldCheck, Loader2, SearchX } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { data: posts, isLoading, error } = usePrivatePosts();

  return (
    <Layout>
      <div className="mb-10 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Private View
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground tracking-tight">
              Coordinator Dashboard
            </h1>
            <p className="text-muted-foreground">
              Review and manage private requests, questions, and needs from host families.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-card px-5 py-3 rounded-2xl border border-border shadow-sm">
              <p className="text-sm text-muted-foreground font-medium mb-1">Total Requests</p>
              <p className="text-3xl font-display font-bold text-foreground">{posts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-3xl border border-border border-dashed">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="font-medium">Loading secure dashboard...</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive p-8 rounded-3xl text-center max-w-lg mx-auto">
          <h3 className="font-bold text-xl mb-2">Access Error</h3>
          <p>{error.message}</p>
        </div>
      )}

      {posts && posts.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 bg-card rounded-3xl border border-border border-dashed"
        >
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchX className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-3">All caught up!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            There are no pending private requests, questions, or prayer needs from families right now.
          </p>
        </motion.div>
      )}

      {posts && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </Layout>
  );
}
