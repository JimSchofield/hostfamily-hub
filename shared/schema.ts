import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("volunteer"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  authorName: text("author_name").notNull(),
  userId: integer("user_id"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time").notNull(),
  location: text("location").notNull(),
  estimatedCost: text("estimated_cost").notNull().default("Free"),
  authorName: text("author_name").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eventAttendees = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  attendeeName: text("attendee_name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, role: true, status: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true });
export const insertReplySchema = createInsertSchema(replies).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Reply = typeof replies.$inferSelect;
export type InsertReply = z.infer<typeof insertReplySchema>;
export type Like = typeof likes.$inferSelect;
export type PostWithLikes = Post & { likeCount: number; likedByMe: boolean };
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type EventWithAttendees = Event & { attendeeCount: number; isAttending: boolean; attendees: string[] };

export type SafeUser = Omit<User, "password">;
