import { useState } from "react";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { CalendarDays, Clock, MapPin, DollarSign, Users, CheckCircle, Loader2 } from "lucide-react";
import { type EventWithAttendees } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useAttendEvent } from "@/hooks/use-events";
import { useToast } from "@/hooks/use-toast";

export function EventCard({ event, index = 0 }: { event: EventWithAttendees; index?: number }) {
  const attendEvent = useAttendEvent();
  const { toast } = useToast();
  const [showAttendees, setShowAttendees] = useState(false);

  const [optimistic, setOptimistic] = useState<{ attending: boolean; count: number } | null>(null);
  const attending = optimistic?.attending ?? event.isAttending;
  const count = optimistic?.count ?? event.attendeeCount;

  function handleAttend() {
    const next = { attending: !attending, count: attending ? count - 1 : count + 1 };
    setOptimistic(next);
    attendEvent.mutate(event.id, {
      onError: () => {
        setOptimistic(null);
        toast({ title: "Could not update RSVP", variant: "destructive" });
      },
      onSuccess: (data) => setOptimistic(data),
    });
  }

  let formattedDate = event.eventDate;
  try {
    formattedDate = format(parseISO(event.eventDate), "EEEE, MMMM d, yyyy");
  } catch {
    // keep as-is if parsing fails
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      data-testid={`card-event-${event.id}`}
      className="bg-card rounded-2xl border border-border/50 shadow-sm flex flex-col"
    >
      {/* Header bar */}
      <div className="bg-gradient-to-r from-red-500/10 to-rose-400/10 border-b border-red-200/30 px-5 py-3 rounded-t-2xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Community Event</span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Title */}
        <h3 className="text-base font-bold text-foreground leading-snug" data-testid={`text-event-title-${event.id}`}>
          {event.title}
        </h3>

        {/* Details grid */}
        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-start gap-2 text-sm">
            <CalendarDays className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="text-foreground font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-foreground">{event.eventTime}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="text-foreground">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-foreground">{event.estimatedCost}</span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
        )}

        {/* Footer: author, attendees, RSVP */}
        <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs shrink-0">
              {event.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-none">{event.authorName}</p>
              <button
                onClick={() => setShowAttendees((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 hover:text-foreground transition-colors"
                data-testid={`button-attendees-${event.id}`}
              >
                <Users className="w-3 h-3" />
                {count} attending
              </button>
            </div>
          </div>

          <button
            type="button"
            data-testid={`button-attend-${event.id}`}
            onClick={handleAttend}
            disabled={attendEvent.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              attending
                ? "bg-red-100 text-red-700"
                : "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
            }`}
          >
            {attendEvent.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : attending ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : null}
            {attending ? "You're going!" : "Count me in!"}
          </button>
        </div>

        {/* Attendee list */}
        <AnimatePresence>
          {showAttendees && count > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs font-bold text-foreground mb-2">Who's attending:</p>
                <div className="flex flex-wrap gap-1.5">
                  {event.attendees.map((name) => (
                    <span key={name} className="text-xs bg-background border border-border px-2 py-0.5 rounded-full text-foreground">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
