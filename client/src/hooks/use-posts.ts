import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PostResponse, type PostsListResponse, type PostInput } from "@shared/routes";
import { z } from "zod";

// Helper to log Zod errors for easier debugging
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw new Error(`Invalid response format from ${label}`);
  }
  return result.data;
}

export function usePublicPosts() {
  return useQuery({
    queryKey: [api.posts.listPublic.path],
    queryFn: async () => {
      const res = await fetch(api.posts.listPublic.path, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch public posts');
      const data = await res.json();
      return parseWithLogging(api.posts.listPublic.responses[200], data, "public posts");
    },
  });
}

export function usePrivatePosts() {
  return useQuery({
    queryKey: [api.posts.listPrivate.path],
    queryFn: async () => {
      const res = await fetch(api.posts.listPrivate.path, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch private posts');
      const data = await res.json();
      return parseWithLogging(api.posts.listPrivate.responses[200], data, "private posts");
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: PostInput) => {
      const validated = api.posts.create.input.parse(data);
      const res = await fetch(api.posts.create.path, {
        method: api.posts.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const errorData = await res.json();
          // Attempt to parse standard validation error
          const error = api.posts.create.responses[400].safeParse(errorData);
          if (error.success) {
            throw new Error(error.data.message);
          }
          throw new Error('Validation failed');
        }
        throw new Error('Failed to create post');
      }
      
      const responseData = await res.json();
      return parseWithLogging(api.posts.create.responses[201], responseData, "create post");
    },
    onSuccess: (newPost) => {
      // Invalidate relevant queries based on post visibility
      if (newPost.isPublic) {
        queryClient.invalidateQueries({ queryKey: [api.posts.listPublic.path] });
      } else {
        queryClient.invalidateQueries({ queryKey: [api.posts.listPrivate.path] });
      }
    },
  });
}
