import { db } from "./db";
import { users, posts, replies } from "@shared/schema";
import type { InsertUser, User, InsertPost, Post, InsertReply, Reply, SafeUser } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role?: string; status?: string }): Promise<User>;
  updateUser(id: number, updates: Partial<Pick<User, "status" | "role">>): Promise<User>;
  getAllUsers(): Promise<SafeUser[]>;

  // Posts
  getPublicPosts(): Promise<Post[]>;
  getPrivatePosts(): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;

  // Replies
  getRepliesByPost(postId: number): Promise<Reply[]>;
  createReply(reply: InsertReply): Promise<Reply>;
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

  async getPublicPosts(): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.isPublic, true));
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
}

export const storage = new DatabaseStorage();
