import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type PostResponse, type PostInput, type ReplyResponse } from "@shared/routes";
import type { Reply, PostWithLikes } from "@shared/schema";
import { z } from "zod";

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...options });
  return res;
}

export function usePublicPosts() {
  return useQuery<PostWithLikes[]>({
    queryKey: [api.posts.listPublic.path],
    queryFn: async () => {
      const res = await apiFetch(api.posts.listPublic.path);
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiFetch(`/api/posts/${postId}/like`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to like post");
      return json as { liked: boolean; count: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.listPublic.path] });
    },
  });
}

export function usePrivatePosts() {
  return useQuery<PostsListResponse>({
    queryKey: [api.posts.listPrivate.path],
    queryFn: async () => {
      const res = await apiFetch(api.posts.listPrivate.path);
      if (!res.ok) throw new Error("Failed to fetch private posts");
      return res.json();
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PostInput) => {
      const res = await apiFetch(api.posts.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to create post");
      return json as PostResponse;
    },
    onSuccess: (newPost) => {
      if (newPost.isPublic) {
        queryClient.invalidateQueries({ queryKey: [api.posts.listPublic.path] });
      } else {
        queryClient.invalidateQueries({ queryKey: [api.posts.listPrivate.path] });
      }
    },
  });
}

export function useReplies(postId: number) {
  return useQuery<Reply[]>({
    queryKey: ["/api/posts", postId, "replies"],
    queryFn: async () => {
      const res = await apiFetch(`/api/posts/${postId}/replies`);
      if (!res.ok) throw new Error("Failed to fetch replies");
      return res.json();
    },
  });
}

export function useCreateReply(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await apiFetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to send reply");
      return json as ReplyResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "replies"] });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiFetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");
      return json as { imageUrl: string };
    },
  });
}
