import { db } from "./db";
import { users, posts, replies, likes } from "@shared/schema";
import type { InsertUser, User, InsertPost, Post, InsertReply, Reply, SafeUser, PostWithLikes } from "@shared/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: string; status?: string }): Promise<User>;
  updateUser(id: number, updates: Partial<Pick<User, "status" | "role">>): Promise<User>;
  getAllUsers(): Promise<SafeUser[]>;

  // Posts
  getPublicPosts(userId?: number): Promise<PostWithLikes[]>;
  getPrivatePosts(): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;

  // Replies
  getRepliesByPost(postId: number): Promise<Reply[]>;
  createReply(reply: InsertReply): Promise<Reply>;

  // Likes
  toggleLike(postId: number, userId: number): Promise<{ liked: boolean; count: number }>;
}

function toSafeUser(user: User): SafeUser {
  const { password, ...safe } = user;
  return safe;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser & { role?: string; status?: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      name: insertUser.name,
      email: insertUser.email.toLowerCase(),
      password: insertUser.password,
      role: insertUser.role ?? "volunteer",
      status: insertUser.status ?? "pending",
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<Pick<User, "status" | "role">>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<SafeUser[]> {
    const all = await db.select().from(users);
    return all.map(toSafeUser);
  }

  async getPublicPosts(userId?: number): Promise<PostWithLikes[]> {
    const rawPosts = await db.select().from(posts).where(eq(posts.isPublic, true));
    if (rawPosts.length === 0) return [];

    const postIds = rawPosts.map((p) => p.id);

    // Get like counts grouped by post
    const likeCounts = await db
      .select({ postId: likes.postId, count: sql<number>`cast(count(*) as int)` })
      .from(likes)
      .where(inArray(likes.postId, postIds))
      .groupBy(likes.postId);

    // Get this user's likes
    const userLikes = userId
      ? await db
          .select({ postId: likes.postId })
          .from(likes)
          .where(and(inArray(likes.postId, postIds), eq(likes.userId, userId)))
      : [];

    const countMap = new Map(likeCounts.map((l) => [l.postId, l.count]));
    const likedSet = new Set(userLikes.map((l) => l.postId));

    return rawPosts.map((p) => ({
      ...p,
      likeCount: countMap.get(p.id) ?? 0,
      likedByMe: likedSet.has(p.id),
    }));
  }

  async getPrivatePosts(): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.isPublic, false));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async getRepliesByPost(postId: number): Promise<Reply[]> {
    return await db.select().from(replies).where(eq(replies.postId, postId));
  }

  async createReply(insertReply: InsertReply): Promise<Reply> {
    const [reply] = await db.insert(replies).values(insertReply).returning();
    return reply;
  }

  async toggleLike(postId: number, userId: number): Promise<{ liked: boolean; count: number }> {
    const [existing] = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));

    if (existing) {
      await db.delete(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    } else {
      await db.insert(likes).values({ postId, userId });
    }

    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(likes)
      .where(eq(likes.postId, postId));

    return { liked: !existing, count };
  }
}

export const storage = new DatabaseStorage();
