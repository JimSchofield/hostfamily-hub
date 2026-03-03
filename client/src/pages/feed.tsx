import { Layout } from "@/components/layout";
import { PostCard } from "@/components/post-card";
import { usePublicPosts } from "@/hooks/use-posts";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedPage() {
  const { data: posts, isLoading, error } = usePublicPosts();

  return (
    <Layout>
      <div className="mb-10 flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          Community Highlights
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-foreground tracking-tight">
          Host Family Stories
        </h1>
        <p className="text-lg text-muted-foreground">
          See what other families are experiencing, share your own journey, and celebrate the impact of hosting international students.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="font-medium text-lg">Loading community posts...</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive p-8 rounded-3xl text-center max-w-lg mx-auto">
          <h3 className="font-bold text-xl mb-2">Could not load posts</h3>
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
            <Sparkles className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-3">No stories yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Be the first to share a moment or picture from your hosting experience! Click the "Share / Ask" button above to get started.
          </p>
        </motion.div>
      )}

      {posts && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </Layout>
  );
}
