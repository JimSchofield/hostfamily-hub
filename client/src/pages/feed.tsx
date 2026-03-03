import { Layout } from "@/components/layout";
import { PostCard } from "@/components/post-card";
import { usePublicPosts } from "@/hooks/use-posts";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function FeedPage() {
  const { data: posts, isLoading, error } = usePublicPosts();

  return (
    <Layout>
      <div className="mb-10 flex flex-col items-center text-center space-y-3 max-w-2xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5" />
          Community Highlights
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Host Family Stories
        </h1>
        <p className="text-base text-muted-foreground">
          See what other families are experiencing, share your own journey, and celebrate the impact of hosting.
        </p>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="font-medium">Loading community posts...</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-2xl text-center max-w-lg mx-auto">
          <h3 className="font-bold text-lg mb-1">Could not load posts</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {posts && posts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-card rounded-2xl border border-border border-dashed"
        >
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No stories yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Be the first to share a moment or picture from your hosting experience!
          </p>
        </motion.div>
      )}

      {posts && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </Layout>
  );
}
