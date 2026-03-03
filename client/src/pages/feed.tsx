import { Layout } from "@/components/layout";
import { PostCard } from "@/components/post-card";
import { EventCard } from "@/components/event-card";
import { usePublicPosts } from "@/hooks/use-posts";
import { useEvents } from "@/hooks/use-events";
import { Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { PostWithLikes } from "@shared/schema";
import type { EventWithAttendees } from "@shared/schema";

function HouseH() {
  return (
    <svg
      viewBox="0 0 20 22"
      height="1em"
      style={{ display: "inline", verticalAlign: "-0.08em" }}
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="10,0 0,10 20,10" />
      <rect x="0" y="9.5" width="4" height="12.5" />
      <rect x="16" y="9.5" width="4" height="12.5" />
      <rect x="4" y="14" width="12" height="3.5" />
    </svg>
  );
}

type FeedItem =
  | { kind: "post"; data: PostWithLikes; createdAt: Date }
  | { kind: "event"; data: EventWithAttendees; createdAt: Date };

export default function FeedPage() {
  const { data: posts, isLoading: postsLoading, error: postsError } = usePublicPosts();
  const { data: events, isLoading: eventsLoading, error: eventsError } = useEvents();

  const isLoading = postsLoading || eventsLoading;
  const error = postsError || eventsError;

  const feedItems: FeedItem[] = [
    ...(posts ?? []).map((p) => ({ kind: "post" as const, data: p, createdAt: new Date(p.createdAt) })),
    ...(events ?? []).map((e) => ({ kind: "event" as const, data: e, createdAt: new Date(e.createdAt) })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <Layout>
      <div className="mb-10 flex flex-col items-center text-center space-y-3 max-w-2xl mx-auto pt-4">
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-primary/10 text-primary font-bold text-lg tracking-wide">
          <HouseH />ost Family&nbsp;<HouseH />ub
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Share. Connect. Celebrate.
        </h1>
        <p className="text-base text-muted-foreground">
          From first dinners to lasting friendships, share your stories, events, as you welcome and love international students.
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
          <h3 className="font-bold text-lg mb-1">Could not load community feed</h3>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && feedItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-card rounded-2xl border border-border border-dashed"
        >
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Nothing here yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Be the first to share a story, picture, or create a community event!
          </p>
        </motion.div>
      )}

      {!isLoading && feedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
          {feedItems.map((item, i) =>
            item.kind === "post" ? (
              <PostCard key={`post-${item.data.id}`} post={item.data} index={i} />
            ) : (
              <EventCard key={`event-${item.data.id}`} event={item.data} index={i} />
            )
          )}
        </div>
      )}
    </Layout>
  );
}
