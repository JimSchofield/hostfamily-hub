import { z } from 'zod';
import { insertPostSchema, posts } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  posts: {
    listPublic: {
      method: 'GET' as const,
      path: '/api/posts/public' as const,
      responses: {
        200: z.array(z.custom<typeof posts.$inferSelect>()),
      },
    },
    listPrivate: {
      method: 'GET' as const,
      path: '/api/posts/private' as const,
      responses: {
        200: z.array(z.custom<typeof posts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/posts' as const,
      input: insertPostSchema,
      responses: {
        201: z.custom<typeof posts.$inferSelect>(),
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
