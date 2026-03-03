import { db } from "./db";
import { posts, type InsertPost, type Post } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPublicPosts(): Promise<Post[]>;
  getPrivatePosts(): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
}

export class DatabaseStorage implements IStorage {
  async getPublicPosts(): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.isPublic, true));
  }

  async getPrivatePosts(): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.isPublic, false));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }
}

export const storage = new DatabaseStorage();
