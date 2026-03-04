import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { hashPassword, comparePasswords, requireApproved, requireCoordinator } from "./auth";
import multer from "multer";
import { Resend } from "resend";

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function sendReplyNotification(
  toEmail: string,
  toName: string,
  postContent: string,
  replyContent: string,
  coordinatorName: string
) {
  const resend = getResendClient();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "HostFamily Hub <onboarding@resend.dev>",
      to: toEmail,
      subject: "The coordinator replied to your request",
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a2e;">
          <h2 style="color: #1e429f;">You have a new reply on HostFamily Hub</h2>
          <p>Hi ${toName},</p>
          <p>${coordinatorName} has replied to your private request:</p>
          <blockquote style="border-left: 3px solid #cbd5e1; margin: 12px 0; padding: 8px 16px; color: #64748b; font-style: italic;">
            ${postContent}
          </blockquote>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <strong>${coordinatorName} wrote:</strong>
            <p style="margin: 8px 0 0;">${replyContent}</p>
          </div>
          <p>Log in to HostFamily Hub to see the full conversation and continue the discussion.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">HostFamily Hub — The Hospitality Center &amp; USA Homestays</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send reply email:", err);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Auth ──────────────────────────────────────────────
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists." });
      }
      const hashed = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashed });
      const { password: _, ...safeUser } = user;
      return res.status(201).json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
      const valid = await comparePasswords(input.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userStatus = user.status;
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {});
    res.json({ message: "Logged out" });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) return res.json(null);
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.json(null);
    const { password: _, ...safeUser } = user;
    // Refresh session data in case role/status changed
    req.session.userRole = user.role;
    req.session.userStatus = user.status;
    return res.json(safeUser);
  });

  // ── Admin ─────────────────────────────────────────────
  app.get(api.admin.listUsers.path, requireCoordinator, async (req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  app.patch(api.admin.updateUser.path, requireCoordinator, async (req, res) => {
    try {
      const input = api.admin.updateUser.input.parse(req.body);
      const id = parseInt(req.params.id);
      const user = await storage.updateUser(id, input);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = user;
      return res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // ── Image Upload ──────────────────────────────────────
  app.post(api.upload.image.path, requireApproved, upload.single("image"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const base64 = req.file.buffer.toString("base64");
    const imageUrl = `data:${req.file.mimetype};base64,${base64}`;
    return res.json({ imageUrl });
  });

  // ── Posts ─────────────────────────────────────────────
  app.get(api.posts.listPublic.path, requireApproved, async (req, res) => {
    const publicPosts = await storage.getPublicPosts(req.session.userId);
    res.json(publicPosts);
  });

  app.get(api.posts.listPrivate.path, requireCoordinator, async (req, res) => {
    const privatePosts = await storage.getPrivatePosts();
    res.json(privatePosts);
  });

  app.post(api.posts.create.path, requireApproved, async (req, res) => {
    try {
      const input = api.posts.create.input.parse(req.body);
      const post = await storage.createPost(input);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  // ── Likes ─────────────────────────────────────────────
  app.post("/api/posts/:id/like", requireApproved, async (req, res) => {
    const postId = parseInt(req.params.id);
    const userId = req.session.userId!;
    const result = await storage.toggleLike(postId, userId);
    res.json(result);
  });

  // ── Replies ───────────────────────────────────────────
  app.get(api.replies.listByPost.path, requireCoordinator, async (req, res) => {
    const postId = parseInt(req.params.id);
    const postReplies = await storage.getRepliesByPost(postId);
    res.json(postReplies);
  });

  app.post(api.replies.create.path, requireCoordinator, async (req, res) => {
    try {
      const input = api.replies.create.input.parse(req.body);
      const postId = parseInt(req.params.id);
      const coordinator = await storage.getUserById(req.session.userId!);
      const reply = await storage.createReply({
        postId,
        authorName: coordinator?.name ?? "Coordinator",
        content: input.content,
      });
      res.status(201).json(reply);

      // Send email notification to the post author (fire-and-forget)
      const post = await storage.getPostById(postId);
      if (post?.userId) {
        const author = await storage.getUserById(post.userId);
        if (author?.email) {
          sendReplyNotification(
            author.email,
            author.name,
            post.content,
            input.content,
            coordinator?.name ?? "Your coordinator"
          );
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // ── Events ────────────────────────────────────────────
  app.get("/api/events", requireApproved, async (req, res) => {
    const evts = await storage.getEvents(req.session.userId);
    res.json(evts);
  });

  app.post("/api/events", requireApproved, async (req, res) => {
    try {
      const body = req.body;
      const user = await storage.getUserById(req.session.userId!);
      const event = await storage.createEvent({
        title: body.title,
        description: body.description,
        eventDate: body.eventDate,
        eventTime: body.eventTime,
        location: body.location,
        estimatedCost: body.estimatedCost || "Free",
        authorName: user?.name ?? "A host family",
        userId: req.session.userId ?? null,
      });
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/events/:id/attend", requireApproved, async (req, res) => {
    const eventId = parseInt(req.params.id);
    const userId = req.session.userId!;
    const user = await storage.getUserById(userId);
    const result = await storage.toggleAttendance(eventId, userId, user?.name ?? "A host family");
    res.json(result);
  });

  return httpServer;
}

export async function seedDatabase() {
  const existingPosts = await storage.getPublicPosts();
  if (existingPosts.length === 0) {
    await storage.createPost({
      type: "story",
      authorName: "The Harrison Family",
      userId: null,
      content: "We had a wonderful weekend showing our student around the local farmers market. She was amazed by all the fresh produce and tried her first apple cider donut!",
      isPublic: true,
    });
    await storage.createPost({
      type: "picture",
      authorName: "The Nguyen Family",
      userId: null,
      content: "Hiking trip with our amazing student last weekend! The fall colors were absolutely breathtaking.",
      imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000&auto=format&fit=crop",
      isPublic: true,
    });
    await storage.createPost({
      type: "question",
      authorName: "Emily R.",
      userId: null,
      content: "What are some good dietary-friendly recipes for our student who is vegetarian? She loves trying new things but we want to make sure we are meeting her nutritional needs.",
      isPublic: false,
    });
    await storage.createPost({
      type: "prayer",
      authorName: "The Torres Family",
      userId: null,
      content: "Please pray for our student who is feeling a bit homesick this week. She misses her family especially during the holidays approaching.",
      isPublic: false,
    });
  }
}
