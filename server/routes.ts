import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.posts.listPublic.path, async (req, res) => {
    const publicPosts = await storage.getPublicPosts();
    res.json(publicPosts);
  });

  app.get(api.posts.listPrivate.path, async (req, res) => {
    const privatePosts = await storage.getPrivatePosts();
    res.json(privatePosts);
  });

  app.post(api.posts.create.path, async (req, res) => {
    try {
      const input = api.posts.create.input.parse(req.body);
      const post = await storage.createPost(input);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  return httpServer;
}

// Ensure seed function can be called after db push
export async function seedDatabase() {
  const existingPosts = await storage.getPublicPosts();
  if (existingPosts.length === 0) {
    await storage.createPost({
      type: "story",
      authorName: "Sarah M.",
      content: "We had a wonderful weekend showing our student around the local farmers market!",
      isPublic: true,
    });
    await storage.createPost({
      type: "picture",
      authorName: "John D.",
      content: "Hiking trip with our amazing student!",
      imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000&auto=format&fit=crop",
      isPublic: true,
    });
    await storage.createPost({
      type: "question",
      authorName: "Emily R.",
      content: "What are some good dietary-friendly recipes for our student who is vegetarian?",
      isPublic: false,
    });
    await storage.createPost({
      type: "prayer",
      authorName: "Mike T.",
      content: "Please pray for our student who is feeling a bit homesick this week.",
      isPublic: false,
    });
  }
}
