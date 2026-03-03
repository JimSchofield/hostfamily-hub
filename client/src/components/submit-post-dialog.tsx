import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema, type InsertPost } from "@shared/schema";
import { useCreatePost } from "@/hooks/use-posts";
import { useToast } from "@/hooks/use-toast";
import { Camera, BookOpen, Heart, MessageCircle, HelpCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const POST_TYPES = [
  { id: "story", label: "Share Story", icon: BookOpen, public: true, desc: "Inspire others with your experience" },
  { id: "picture", label: "Share Picture", icon: Camera, public: true, desc: "Post a photo with the community" },
  { id: "question", label: "Ask Question", icon: MessageCircle, public: false, desc: "Privately ask the coordinator" },
  { id: "prayer", label: "Prayer Request", icon: Heart, public: false, desc: "Submit a private prayer need" },
  { id: "help", label: "Get Help", icon: HelpCircle, public: false, desc: "Reach out for urgent support" },
] as const;

export function SubmitPostDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const createPost = useCreatePost();
  const [selectedType, setSelectedType] = useState<typeof POST_TYPES[number]>(POST_TYPES[0]);

  const form = useForm<InsertPost>({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      type: "story",
      authorName: "",
      content: "",
      imageUrl: "",
      isPublic: true,
    },
  });

  const watchType = form.watch("type");

  // Keep selected type object in sync for UI rendering
  useEffect(() => {
    const typeObj = POST_TYPES.find(t => t.id === watchType);
    if (typeObj) setSelectedType(typeObj);
  }, [watchType]);

  const onSubmit = (data: InsertPost) => {
    createPost.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Successfully submitted! 🎉",
          description: data.isPublic 
            ? "Your post is now visible to the community." 
            : "Your private submission has been sent to the coordinator.",
        });
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Something went wrong",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-background border-border/50 shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 md:p-8 pb-0">
          <DialogTitle className="text-2xl font-display font-bold">How can we support you?</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground mt-2">
            Share with the community or privately contact your coordinator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 pt-6 flex flex-col gap-6">
          
          {/* Type Selector */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {POST_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = form.watch("type") === type.id;
              
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    form.setValue("type", type.id);
                    form.setValue("isPublic", type.public);
                    form.clearErrors("type");
                  }}
                  className={`
                    flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 text-center gap-2
                    ${isSelected 
                      ? 'border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]' 
                      : 'border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5 text-muted-foreground'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'stroke-[2.5]' : ''}`} />
                  <div>
                    <div className="text-sm font-bold leading-tight">{type.label}</div>
                    <div className="text-[10px] opacity-70 mt-1 hidden sm:block">{type.public ? "Public" : "Private"}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="popLayout">
            <motion.div
              key="form-fields"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-5 space-y-1"
            >
              {/* Common Fields */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Your Name</label>
                <input
                  {...form.register("authorName")}
                  className="w-full px-4 py-3 rounded-xl bg-card border-2 border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                  placeholder="e.g. The Smith Family"
                />
                {form.formState.errors.authorName && (
                  <p className="text-xs font-semibold text-destructive">{form.formState.errors.authorName.message}</p>
                )}
              </div>

              {selectedType.id === 'picture' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-bold text-foreground">Image URL</label>
                  <input
                    {...form.register("imageUrl")}
                    className="w-full px-4 py-3 rounded-xl bg-card border-2 border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                    placeholder="https://example.com/image.jpg"
                  />
                  {form.formState.errors.imageUrl && (
                    <p className="text-xs font-semibold text-destructive">{form.formState.errors.imageUrl.message}</p>
                  )}
                </motion.div>
              )}

              <div className="space-y-2 flex-1">
                <label className="text-sm font-bold text-foreground">
                  {selectedType.id === 'picture' ? 'Caption' : 'Message'}
                </label>
                <textarea
                  {...form.register("content")}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-card border-2 border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none"
                  placeholder={`Write your ${selectedType.id} here...`}
                />
                {form.formState.errors.content && (
                  <p className="text-xs font-semibold text-destructive">{form.formState.errors.content.message}</p>
                )}
              </div>

            </motion.div>
          </AnimatePresence>

          {/* Footer Actions */}
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-6">
            <div className="text-sm font-medium flex items-center gap-2">
              {selectedType.public ? (
                <span className="text-primary bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> Public Post
                </span>
              ) : (
                <span className="text-muted-foreground bg-muted px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Heart className="w-4 h-4" /> Private to Coordinator
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-muted-foreground hover:bg-muted transition-colors"
                disabled={createPost.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createPost.isPending}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 ease-out flex items-center gap-2"
              >
                {createPost.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {createPost.isPending ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
