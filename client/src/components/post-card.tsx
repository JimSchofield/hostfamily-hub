import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, Camera, BookOpen, HelpCircle, MessageCircle, ChevronDown, ChevronUp, Send, Loader2 } from "lucide-react";
import { type Post } from "@shared/schema";
import { motion } from "framer-motion";
import { useReplies, useCreateReply } from "@/hooks/use-posts";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const TYPE_CONFIG = {
  story:    { icon: BookOpen,       label: "Story",          color: "text-primary",   bg: "bg-primary/10" },
  picture:  { icon: Camera,         label: "Picture",        color: "text-violet-500", bg: "bg-violet-500/10" },
  prayer:   { icon: Heart,          label: "Prayer Request", color: "text-rose-500",  bg: "bg-rose-500/10" },
  question: { icon: MessageCircle,  label: "Question",       color: "text-blue-500",  bg: "bg-blue-500/10" },
  help:     { icon: HelpCircle,     label: "Needs Help",     color: "text-amber-500", bg: "bg-amber-500/10" },
} as const;

function ReplySection({ postId }: { postId: number }) {
  const { data: replies, isLoading } = useReplies(postId);
  const createReply = useCreateReply(postId);
  const { toast } = useToast();
  const [replyText, setReplyText] = useState("");

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    createReply.mutate(replyText.trim(), {
      onSuccess: () => setReplyText(""),
      onError: (err) => toast({ title: "Failed to send reply", description: err.message, variant: "destructive" }),
    });
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
      {isLoading ? (
        <div className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading replies...</div>
      ) : replies && replies.length > 0 ? (
        <div className="space-y-2">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-muted/50 rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                  {reply.authorName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-foreground">{reply.authorName}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{reply.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No replies yet.</p>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write a reply..."
          data-testid={`input-reply-${postId}`}
          className="flex-1 px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <button
          type="submit"
          data-testid={`button-send-reply-${postId}`}
          disabled={createReply.isPending || !replyText.trim()}
          className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-40 flex items-center justify-center transition-opacity"
        >
          {createReply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

export function PostCard({
  post,
  index = 0,
  showReply = false,
}: {
  post: Post;
  index?: number;
  showReply?: boolean;
}) {
  const config = TYPE_CONFIG[post.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.story;
  const Icon = config.icon;
  const [repliesOpen, setRepliesOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      data-testid={`card-post-${post.id}`}
      className="bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col"
    >
      {post.type === "picture" && post.imageUrl && (
        <div className="w-full aspect-[4/3] bg-muted rounded-t-2xl overflow-hidden">
          <img
            src={post.imageUrl}
            alt={`Shared by ${post.authorName}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </div>
          {!post.isPublic && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              Private
            </span>
          )}
        </div>

        <p className="text-foreground leading-relaxed whitespace-pre-wrap flex-1 mb-4 text-sm">
          {post.content}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs shrink-0">
              {post.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-none" data-testid={`text-author-${post.id}`}>{post.authorName}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {showReply && (
            <button
              type="button"
              data-testid={`button-toggle-reply-${post.id}`}
              onClick={() => setRepliesOpen((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Reply
              {repliesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {showReply && repliesOpen && <ReplySection postId={post.id} />}
      </div>
    </motion.div>
  );
}
