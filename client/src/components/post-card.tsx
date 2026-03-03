import { formatDistanceToNow } from "date-fns";
import { Heart, Camera, BookOpen, HelpCircle, MessageCircle } from "lucide-react";
import { type Post } from "@shared/schema";
import { motion } from "framer-motion";

const TYPE_CONFIG = {
  story: { icon: BookOpen, label: "Story", color: "text-primary", bg: "bg-primary/10" },
  picture: { icon: Camera, label: "Picture", color: "text-accent", bg: "bg-accent/10" },
  prayer: { icon: Heart, label: "Prayer Request", color: "text-rose-500", bg: "bg-rose-500/10" },
  question: { icon: MessageCircle, label: "Question", color: "text-blue-500", bg: "bg-blue-500/10" },
  help: { icon: HelpCircle, label: "Needs Help", color: "text-amber-500", bg: "bg-amber-500/10" },
} as const;

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  const config = TYPE_CONFIG[post.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.story;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden hover-elevate group flex flex-col"
    >
      {post.type === "picture" && post.imageUrl && (
        <div className="w-full aspect-[4/3] bg-muted relative overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt={`Shared by ${post.authorName}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      )}
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
          </div>
          
          {!post.isPublic && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md">
              Private
            </span>
          )}
        </div>

        <p className="text-foreground leading-relaxed whitespace-pre-wrap flex-1 mb-6 text-[15px]">
          {post.content}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-display font-bold text-sm">
              {post.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">{post.authorName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
