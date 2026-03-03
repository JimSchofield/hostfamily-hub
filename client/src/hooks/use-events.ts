import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EventWithAttendees } from "@shared/schema";

const EVENTS_KEY = ["/api/events"];

async function apiFetch(url: string, options?: RequestInit) {
  return fetch(url, { credentials: "include", ...options });
}

export function useEvents() {
  return useQuery<EventWithAttendees[]>({
    queryKey: EVENTS_KEY,
    queryFn: async () => {
      const res = await apiFetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      eventDate: string;
      eventTime: string;
      location: string;
      estimatedCost: string;
    }) => {
      const res = await apiFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create event");
      return json;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}

export function useAttendEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => {
      const res = await apiFetch(`/api/events/${eventId}/attend`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to RSVP");
      return json as { attending: boolean; count: number };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}
