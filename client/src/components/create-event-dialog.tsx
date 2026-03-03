import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CalendarDays, Clock, MapPin, DollarSign, Loader2, Info } from "lucide-react";
import { useCreateEvent } from "@/hooks/use-events";
import { useToast } from "@/hooks/use-toast";

interface EventForm {
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  location: string;
  estimatedCost: string;
}

const EMPTY: EventForm = {
  title: "",
  description: "",
  eventDate: "",
  eventTime: "",
  location: "",
  estimatedCost: "",
};

export function CreateEventDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState<EventForm>(EMPTY);
  const createEvent = useCreateEvent();
  const { toast } = useToast();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleClose() {
    setForm(EMPTY);
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.eventDate || !form.eventTime || !form.location) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createEvent.mutate(
      { ...form, estimatedCost: form.estimatedCost || "Free" },
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
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            Create a Community Event
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Share an upcoming event with all host families and students.
          </DialogDescription>
        </DialogHeader>

        {/* Reminder note */}
        <div className="mx-6 mt-4 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Please only post events that are open and appropriate for <strong>any host family and international student</strong> to attend together — regardless of age, background, or culture.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-4 flex flex-col gap-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Event Title <span className="text-destructive">*</span></label>
            <input
              data-testid="input-event-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="e.g. Fall Harvest Picnic in the Park"
            />
          </div>

          {/* Date & Time in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" /> Date <span className="text-destructive">*</span>
              </label>
              <input
                data-testid="input-event-date"
                name="eventDate"
                type="date"
                value={form.eventDate}
                onChange={handleChange}
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
                value={form.eventTime}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Location <span className="text-destructive">*</span>
            </label>
            <input
              data-testid="input-event-location"
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder="e.g. Riverside Park, Main Pavilion"
            />
          </div>

          {/* Estimated Cost */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Estimated Cost
            </label>
            <input
              data-testid="input-event-cost"
              name="estimatedCost"
              value={form.estimatedCost}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Free, $5 per person, $10-15 per family"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Description</label>
            <textarea
              data-testid="input-event-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Share any additional details about the event, what to bring, parking info, etc."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={createEvent.isPending}
              className="px-4 py-2 rounded-lg font-semibold text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="button-submit-event"
              disabled={createEvent.isPending}
              className="px-5 py-2 rounded-lg font-bold text-sm bg-emerald-600 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              {createEvent.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {createEvent.isPending ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
