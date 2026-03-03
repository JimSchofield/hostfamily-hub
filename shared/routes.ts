import { z } from 'zod';
import { insertPostSchema, insertUserSchema, insertReplySchema, posts, users, replies } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

const safeUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.string(),
  createdAt: z.string().or(z.date()),
});

const postSchema = z.custom<typeof posts.$inferSelect>();
const replySchema = z.custom<typeof replies.$inferSelect>();

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema.extend({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6) }),
      responses: {
        201: safeUserSchema,
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: safeUserSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: { 200: z.object({ message: z.string() }) },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: safeUserSchema.nullable(),
      },
    },
  },
  admin: {
    listUsers: {
      method: 'GET' as const,
      path: '/api/admin/users' as const,
      responses: { 200: z.array(safeUserSchema) },
    },
    updateUser: {
      method: 'PATCH' as const,
      path: '/api/admin/users/:id' as const,
      input: z.object({ status: z.enum(['approved', 'rejected', 'pending']).optional(), role: z.enum(['volunteer', 'coordinator']).optional() }),
      responses: {
        200: safeUserSchema,
        404: errorSchemas.notFound,
      },
    },
  },
  posts: {
    listPublic: {
      method: 'GET' as const,
      path: '/api/posts/public' as const,
      responses: { 200: z.array(postSchema) },
    },
    listPrivate: {
      method: 'GET' as const,
      path: '/api/posts/private' as const,
      responses: { 200: z.array(postSchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts' as const,
      input: insertPostSchema,
      responses: {
        201: postSchema,
        400: errorSchemas.validation,
      },
    },
  },
  replies: {
    listByPost: {
      method: 'GET' as const,
      path: '/api/posts/:id/replies' as const,
      responses: { 200: z.array(replySchema) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts/:id/replies' as const,
      input: z.object({ content: z.string().min(1) }),
      responses: {
        201: replySchema,
        400: errorSchemas.validation,
        403: errorSchemas.unauthorized,
      },
    },
  },
  upload: {
    image: {
      method: 'POST' as const,
      path: '/api/upload/image' as const,
      responses: {
        200: z.object({ imageUrl: z.string() }),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type PostInput = z.infer<typeof api.posts.create.input>;
export type PostResponse = z.infer<typeof api.posts.create.responses[201]>;
export type PostsListResponse = z.infer<typeof api.posts.listPublic.responses[200]>;
export type SafeUser = z.infer<typeof safeUserSchema>;
export type RegisterInput = z.infer<typeof api.auth.register.input>;
export type LoginInput = z.infer<typeof api.auth.login.input>;
export type ReplyResponse = z.infer<typeof api.replies.create.responses[201]>;
