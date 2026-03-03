import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { insertPostSchema, type InsertPost } from "@shared/schema";
import { useCreatePost, useUploadImage } from "@/hooks/use-posts";
import { useCreateEvent } from "@/hooks/use-events";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Camera, BookOpen, Heart, MessageCircle, HelpCircle,
  Loader2, Upload, Link as LinkIcon, X, CalendarDays,
  Clock, MapPin, DollarSign, Info,
} from "lucide-react";
import { motion } from "framer-motion";

const POST_TYPES = [
  { id: "story",   label: "Share Story",   icon: BookOpen,     public: true,  desc: "Inspire others" },
  { id: "picture", label: "Share Picture", icon: Camera,       public: true,  desc: "Post a photo" },
  { id: "event",   label: "Create Event",  icon: CalendarDays, public: true,  desc: "Invite families" },
  { id: "question",label: "Ask Question",  icon: MessageCircle,public: false, desc: "Ask coordinator" },
  { id: "prayer",  label: "Prayer Request",icon: Heart,         public: false, desc: "Private prayer" },
  { id: "help",    label: "Get Help",      icon: HelpCircle,   public: false, desc: "Contact support" },
] as const;

type PostTypeId = typeof POST_TYPES[number]["id"];
type ImageMode = "url" | "file";

interface EventForm {
  title: string;
  eventDate: string;
  eventTime: string;
  location: string;
  estimatedCost: string;
  description: string;
}

const EMPTY_EVENT: EventForm = {
  title: "", eventDate: "", eventTime: "", location: "", estimatedCost: "", description: "",
};

export function SubmitPostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const { data: user } = useAuth();
  const createPost = useCreatePost();
  const uploadImage = useUploadImage();
  const createEvent = useCreateEvent();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedType, setSelectedType] = useState<PostTypeId>("story");
  const [imageMode, setImageMode] = useState<ImageMode>("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [eventForm, setEventForm] = useState<EventForm>(EMPTY_EVENT);

  const currentType = POST_TYPES.find(t => t.id === selectedType)!;

  function handleSelectType(type: PostTypeId) {
    setSelectedType(type);
    setImageUrl("");
    setImageFile(null);
    setImagePreview(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    setContent("");
    setImageUrl("");
    setImageFile(null);
    setImagePreview(null);
    setSelectedType("story");
    setImageMode("url");
    setEventForm(EMPTY_EVENT);
    onOpenChange(false);
  }

  function handleEventChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEventForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (selectedType === "event") {
      if (!eventForm.title || !eventForm.eventDate || !eventForm.eventTime || !eventForm.location) {
        toast({ title: "Please fill in all required fields", variant: "destructive" });
        return;
      }
      createEvent.mutate(
        { ...eventForm, estimatedCost: eventForm.estimatedCost || "Free" },
        {
          onSuccess: () => {
            toast({ title: "Event created!", description: "Your event is now visible to all host families." });
            handleClose();
          },
          onError: (err) => {
            toast({ title: "Failed to create event", description: err.message, variant: "destructive" });
          },
        }
      );
      return;
    }

    let finalImageUrl: string | undefined = undefined;

    if (selectedType === "picture") {
      if (imageMode === "file" && imageFile) {
        try {
          const result = await uploadImage.mutateAsync(imageFile);
          finalImageUrl = result.imageUrl;
        } catch (err: any) {
          toast({ title: "Image upload failed", description: err.message, variant: "destructive" });
          return;
        }
      } else if (imageMode === "url" && imageUrl) {
        finalImageUrl = imageUrl;
      }
    }

    const postData: InsertPost = {
      type: selectedType,
      authorName: user.name,
      userId: user.id,
      content,
      imageUrl: finalImageUrl ?? null,
      isPublic: currentType.public,
    };

    const parsed = insertPostSchema.safeParse(postData);
    if (!parsed.success) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    createPost.mutate(parsed.data, {
      onSuccess: () => {
        toast({
          title: "Submitted!",
          description: currentType.public
            ? "Your post is now visible to the community."
            : "Your private submission has been sent to the coordinator.",
        });
        handleClose();
      },
      onError: (err) => {
        toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
      },
    });
  }

  const isSubmitting = createPost.isPending || uploadImage.isPending || createEvent.isPending;
  const inputClass = "w-full px-3 py-2.5 rounded-xl bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">How can we support you?</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Share with the community, create an event, or privately contact your coordinator.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            {POST_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              const isEvent = type.id === "event";
              return (
                <button
                  key={type.id}
                  type="button"
                  data-testid={`button-type-${type.id}`}
                  onClick={() => handleSelectType(type.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center text-xs font-semibold
                    ${isSelected
                      ? isEvent
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-primary bg-primary/5 text-primary"
                      : "border-border/50 bg-card text-muted-foreground hover:border-primary/30"
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "stroke-[2.5]" : ""}`} />
                  <span className="leading-tight">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* EVENT FORM */}
          {selectedType === "event" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Reminder note */}
              <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Only post events open and appropriate for <strong>any host family and international student</strong> to attend together.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Event Title <span className="text-destructive">*</span></label>
                <input
                  data-testid="input-event-title"
                  name="title"
                  value={eventForm.title}
                  onChange={handleEventChange}
                  required
                  className={inputClass}
                  placeholder="e.g. Fall Harvest Picnic in the Park"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" /> Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    data-testid="input-event-date"
                    name="eventDate"
                    type="date"
                    value={eventForm.eventDate}
                    onChange={handleEventChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    data-testid="input-event-time"
                    name="eventTime"
                    type="time"
                    value={eventForm.eventTime}
                    onChange={handleEventChange}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Location <span className="text-destructive">*</span>
                </label>
                <input
                  data-testid="input-event-location"
                  name="location"
                  value={eventForm.location}
                  onChange={handleEventChange}
                  required
                  className={inputClass}
                  placeholder="e.g. Riverside Park, Main Pavilion"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Estimated Cost
                </label>
                <input
                  data-testid="input-event-cost"
                  name="estimatedCost"
                  value={eventForm.estimatedCost}
                  onChange={handleEventChange}
                  className={inputClass}
                  placeholder="e.g. Free, $5 per person, $10–15 per family"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea
                  data-testid="input-event-description"
                  name="description"
                  value={eventForm.description}
                  onChange={handleEventChange}
                  rows={3}
                  className={`${inputClass} resize-none`}
                  placeholder="Share any additional details, what to bring, parking info, etc."
                />
              </div>
            </motion.div>
          )}

          {/* Picture image input */}
          {selectedType === "picture" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="button-image-url"
                  onClick={() => { setImageMode("url"); clearImage(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    imageMode === "url" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" /> Image URL
                </button>
                <button
                  type="button"
                  data-testid="button-image-file"
                  onClick={() => { setImageMode("file"); clearImage(); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    imageMode === "file" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
              </div>

              {imageMode === "url" ? (
                <input
                  data-testid="input-image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/image.jpg"
                />
              ) : (
                <div>
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white"
                        data-testid="button-clear-image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      data-testid="button-choose-file"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-sm font-medium">Click to choose an image</span>
                      <span className="text-xs">JPG, PNG, WEBP up to 8MB</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="input-image-file"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* Content textarea (non-event types) */}
          {selectedType !== "event" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                {selectedType === "picture" ? "Caption" : "Message"}
              </label>
              <textarea
                data-testid="input-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder={
                  selectedType === "picture"  ? "Write a caption..."
                  : selectedType === "prayer" ? "Share your prayer request with the coordinator..."
                  : selectedType === "question" ? "What would you like to ask?"
                  : selectedType === "help"   ? "Describe how we can help you..."
                  : "Share your hosting story..."
                }
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs font-medium">
              {selectedType === "event" ? (
                <span className="text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-md">Public event</span>
              ) : currentType.public ? (
                <span className="text-primary bg-primary/10 px-2.5 py-1 rounded-md">Public post</span>
              ) : (
                <span className="text-muted-foreground bg-muted px-2.5 py-1 rounded-md">Private to coordinator</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg font-semibold text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="button-submit-post"
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-lg font-bold text-sm shadow-md disabled:opacity-50 flex items-center gap-1.5 transition-opacity ${
                  selectedType === "event"
                    ? "bg-red-600 text-white shadow-red-600/20"
                    : "bg-primary text-primary-foreground shadow-primary/20"
                }`}
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting
                  ? selectedType === "event" ? "Creating..." : "Submitting..."
                  : selectedType === "event" ? "Create Event" : "Submit"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
