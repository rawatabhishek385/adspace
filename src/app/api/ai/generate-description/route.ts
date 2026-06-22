import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini SDK
// It will automatically pick up process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { title, city, category, size, indoorOutdoor, digitalPhysical } = await req.json();

    if (!title || !category) {
      return NextResponse.json({ success: false, error: "Title and Category are required" }, { status: 400 });
    }

    const prompt = `
      You are an expert copywriter for an advertising space marketplace (like Airbnb for billboards).
      Generate a highly professional, SEO-friendly, and engaging listing description for the following space:
      
      Title: ${title}
      Category: ${category}
      City: ${city || "Not specified"}
      Size: ${size || "Not specified"}
      Type: ${indoorOutdoor || "Not specified"}
      Format: ${digitalPhysical || "Not specified"}
      
      Instructions:
      1. Write 2-3 short, engaging paragraphs.
      2. Highlight the benefits for advertisers (visibility, foot traffic, ROI).
      3. Use a professional, persuasive tone.
      4. Do not use generic placeholder text. Do not include a title in the output, just the description body.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";

    return NextResponse.json({
      success: true,
      description: text.trim(),
    });

  } catch (error: any) {
    console.error("Failed to generate description:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate description" },
      { status: 500 }
    );
  }
}
