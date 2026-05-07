import { Hono } from "hono";
import { handle } from "hono/netlify";
import { z } from "zod";
import { storage } from "../../server/storage";
import { hashPassword, comparePasswords } from "../../server/auth";
import {
  createSession,
  destroySession,
  destroyAllUserSessions,
  getSessionUser,
  requireApproved,
  requireCoordinator,
  HttpError,
} from "../../server/session";
import {
  sendNewRequestNotification,
  sendReplyNotification,
} from "../../server/email";
import { uploadImage, getImage } from "../../server/blobs";
import { api } from "../../shared/routes";

const app = new Hono().basePath("/api");

function safe<T extends { password: string }>(user: T): Omit<T, "password"> {
  const { password: _, ...rest } = user;
  return rest;
}

function zerr(err: z.ZodError) {
  return { message: err.errors[0].message, field: err.errors[0].path.join(".") };
}

// ── Auth ──────────────────────────────────────────────
app.post("/auth/register", async (c) => {
  const body = await c.req.json();
  const parsed = api.auth.register.input.safeParse(body);
  if (!parsed.success) return c.json(zerr(parsed.error), 400);
  const existing = await storage.getUserByEmail(parsed.data.email);
  if (existing) {
    return c.json({ message: "An account with this email already exists." }, 400);
  }
  const hashed = await hashPassword(parsed.data.password);
  const user = await storage.createUser({ ...parsed.data, password: hashed });
  return c.json(safe(user), 201);
});

app.post("/auth/login", async (c) => {
  const body = await c.req.json();
  const parsed = api.auth.login.input.safeParse(body);
  if (!parsed.success) return c.json(zerr(parsed.error), 400);
  const user = await storage.getUserByEmail(parsed.data.email);
  if (!user) return c.json({ message: "Invalid email or password." }, 401);
  const valid = await comparePasswords(parsed.data.password, user.password);
  if (!valid) return c.json({ message: "Invalid email or password." }, 401);
  await createSession(c, user.id);
  return c.json(safe(user));
});

app.post("/auth/logout", async (c) => {
  await destroySession(c);
  return c.json({ message: "Logged out" });
});

app.get("/auth/me", async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json(null);
  return c.json(safe(user));
});

// ── Admin ─────────────────────────────────────────────
app.get("/admin/users", async (c) => {
  await requireCoordinator(c);
  const allUsers = await storage.getAllUsers();
  return c.json(allUsers);
});

app.patch("/admin/users/:id", async (c) => {
  await requireCoordinator(c);
  const body = await c.req.json();
  const parsed = api.admin.updateUser.input.safeParse(body);
  if (!parsed.success) return c.json(zerr(parsed.error), 400);
  const id = parseInt(c.req.param("id"));
  const user = await storage.updateUser(id, parsed.data);
  if (!user) return c.json({ message: "User not found" }, 404);
  // If status moved away from "approved" or role demoted, kill all sessions.
  if (parsed.data.status && parsed.data.status !== "approved") {
    await destroyAllUserSessions(id);
  }
  return c.json(safe(user));
});

// ── Image Upload ──────────────────────────────────────
app.post("/upload/image", async (c) => {
  await requireApproved(c);
  const form = await c.req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return c.json({ message: "No image file provided" }, 400);
  }
  if (!file.type.startsWith("image/")) {
    return c.json({ message: "Only image files are allowed" }, 400);
  }
  if (file.size > 6 * 1024 * 1024) {
    return c.json({ message: "Image must be smaller than 6 MB" }, 400);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const imageUrl = await uploadImage(buffer, file.type);
  return c.json({ imageUrl });
});

app.get("/images/:key", async (c) => {
  const key = c.req.param("key");
  const result = await getImage(key);
  if (!result) return c.text("Not found", 404);
  return new Response(result.data, {
    headers: {
      "content-type": result.contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
});

// ── Posts ─────────────────────────────────────────────
app.get("/posts/public", async (c) => {
  const user = await requireApproved(c);
  const publicPosts = await storage.getPublicPosts(user.id);
  return c.json(publicPosts);
});

app.get("/posts/private", async (c) => {
  await requireCoordinator(c);
  const privatePosts = await storage.getPrivatePosts();
  return c.json(privatePosts);
});

app.post("/posts", async (c) => {
  await requireApproved(c);
  const body = await c.req.json();
  const parsed = api.posts.create.input.safeParse(body);
  if (!parsed.success) return c.json(zerr(parsed.error), 400);
  const post = await storage.createPost(parsed.data);

  if (!post.isPublic && ["question", "prayer", "help"].includes(post.type)) {
    const coordinators = await storage.getCoordinators();
    for (const coordinator of coordinators) {
      sendNewRequestNotification(
        coordinator.email,
        coordinator.name,
        post.authorName,
        post.type,
        post.content,
      );
    }
  }
  return c.json(post, 201);
});

// ── Likes ─────────────────────────────────────────────
app.post("/posts/:id/like", async (c) => {
  const user = await requireApproved(c);
  const postId = parseInt(c.req.param("id"));
  const result = await storage.toggleLike(postId, user.id);
  return c.json(result);
});

// ── Replies ───────────────────────────────────────────
// NOTE: GET is coordinator-only — preserved oddity (see ODDITY.md on desktop).
app.get("/posts/:id/replies", async (c) => {
  await requireCoordinator(c);
  const postId = parseInt(c.req.param("id"));
  const postReplies = await storage.getRepliesByPost(postId);
  return c.json(postReplies);
});

app.post("/posts/:id/replies", async (c) => {
  const coordinator = await requireCoordinator(c);
  const body = await c.req.json();
  const parsed = api.replies.create.input.safeParse(body);
  if (!parsed.success) return c.json(zerr(parsed.error), 400);
  const postId = parseInt(c.req.param("id"));
  const reply = await storage.createReply({
    postId,
    authorName: coordinator.name,
    content: parsed.data.content,
  });

  const post = await storage.getPostById(postId);
  if (post?.userId) {
    const author = await storage.getUserById(post.userId);
    if (author?.email) {
      sendReplyNotification(
        author.email,
        author.name,
        post.content,
        parsed.data.content,
        coordinator.name,
      );
    }
  }
  return c.json(reply, 201);
});

// ── Events ────────────────────────────────────────────
app.get("/events", async (c) => {
  const user = await requireApproved(c);
  const evts = await storage.getEvents(user.id);
  return c.json(evts);
});

app.post("/events", async (c) => {
  const user = await requireApproved(c);
  const body = await c.req.json();
  const event = await storage.createEvent({
    title: body.title,
    description: body.description,
    eventDate: body.eventDate,
    eventTime: body.eventTime,
    location: body.location,
    estimatedCost: body.estimatedCost || "Free",
    authorName: user.name,
    userId: user.id,
  });
  return c.json(event, 201);
});

app.post("/events/:id/attend", async (c) => {
  const user = await requireApproved(c);
  const eventId = parseInt(c.req.param("id"));
  const result = await storage.toggleAttendance(eventId, user.id, user.name);
  return c.json(result);
});

// ── Error handler ─────────────────────────────────────
app.onError((err, c) => {
  if (err instanceof HttpError) {
    const body: { message: string; field?: string } = { message: err.message };
    if (err.field) body.field = err.field;
    return c.json(body, err.status as any);
  }
  console.error("Unhandled error:", err);
  return c.json({ message: "Internal Server Error" }, 500);
});

export default handle(app);
