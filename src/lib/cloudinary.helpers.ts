import cloudinary from "@/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";

interface UploadResult {
  url: string;
  publicId: string;
  type: "IMAGE" | "VIDEO" | "RAW";
}

/**
 * Upload a file buffer to Cloudinary.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  type: boolean | "IMAGE" | "VIDEO" | "RAW"
): Promise<UploadResult> {
  const isVideo = type === true || type === "VIDEO";
  const isRaw = type === "RAW";
  
  let folder = "ad-space-marketplace/images";
  let resourceType: "image" | "video" | "raw" = "image";

  if (isVideo) {
    folder = "ad-space-marketplace/videos";
    resourceType = "video";
  } else if (isRaw) {
    folder = "ad-space-marketplace/files";
    resourceType = "raw";
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
          public_id: `${Date.now()}-${filename.replace(/\.[^.]+$/, "").replace(/\s+/g, "-")}`,
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Upload failed"));
            return;
          }

          let optimizedUrl = (result as UploadApiResponse).secure_url;
          if (!isVideo && !isRaw) {
            // Inject f_auto,q_auto for images
            optimizedUrl = optimizedUrl.replace("/upload/", "/upload/f_auto,q_auto/");
          }

          resolve({
            url: optimizedUrl,
            publicId: (result as UploadApiResponse).public_id,
            type: isVideo ? "VIDEO" : isRaw ? "RAW" : "IMAGE",
          });
        }
      )
      .end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by its public_id.
 */
export async function deleteFromCloudinary(
  publicId: string,
  type: "IMAGE" | "VIDEO" = "IMAGE"
): Promise<void> {
  const resourceType = type === "VIDEO" ? "video" : "image";
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (result.result !== "ok" && result.result !== "not found") {
      console.warn(`[Cloudinary Warning] Deletion returned non-ok result for ${publicId}:`, result);
    }
  } catch (error) {
    console.error(`[Cloudinary Error] Deletion failed for ${publicId}:`, error);
  }
}

/**
 * Delete multiple assets from Cloudinary.
 */
export async function deleteMultipleFromCloudinary(
  media: { publicId: string | null; type: "IMAGE" | "VIDEO" }[]
): Promise<void> {
  const deletions = media
    .filter((m) => m.publicId)
    .map((m) => deleteFromCloudinary(m.publicId as string, m.type));

  await Promise.allSettled(deletions);
}
