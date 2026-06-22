import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary.helpers";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No files provided" },
        { status: 400 }
      );
    }

    const results: { url: string; publicId: string; type: "IMAGE" | "VIDEO" | "RAW" }[] = [];

    for (const file of files) {
      const isVideo = file.type.startsWith("video/");

      // Validate file type
      if (isVideo && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: `Unsupported video format: ${file.type}. Allowed: mp4, mov` },
          { status: 400 }
        );
      }
      if (!isVideo && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, message: `Unsupported image format: ${file.type}. Allowed: jpg, jpeg, png, webp` },
          { status: 400 }
        );
      }

      // Validate file size
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, message: `File too large: ${file.name}. Max: ${isVideo ? "100MB" : "10MB"}` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await uploadToCloudinary(buffer, file.name, isVideo);
      results.push(result);
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
