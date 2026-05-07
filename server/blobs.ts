import { getStore } from "@netlify/blobs";
import { randomBytes } from "crypto";

export const POST_IMAGES_STORE = "post-images";

export async function uploadImage(buffer: Buffer, contentType: string): Promise<string> {
  const store = getStore(POST_IMAGES_STORE);
  const ext = contentType.split("/")[1]?.split("+")[0] ?? "bin";
  const key = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
  await store.set(key, buffer, { metadata: { contentType } });
  return `/api/images/${key}`;
}

export async function getImage(key: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const store = getStore(POST_IMAGES_STORE);
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result) return null;
  const contentType = (result.metadata?.contentType as string | undefined) ?? "application/octet-stream";
  return { data: result.data as ArrayBuffer, contentType };
}
