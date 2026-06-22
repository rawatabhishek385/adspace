import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ success: false, error: "Query is required" }, { status: 400 });
    }

    const prompt = `
      You are an NLP extractor for an advertising space marketplace search engine.
      Extract the following fields from the user's search query, returning ONLY a raw, minified JSON object and nothing else.
      
      Query: "${query}"
      
      Output JSON Format:
      {
        "city": "string or null",
        "budget": "number or null",
        "categoryName": "string or null",
        "keywords": "string or null"
      }
      
      Rules:
      - If they mention a price/budget (e.g., "under 5000", "cheap"), extract the maximum budget as a number.
      - If they mention a location (e.g., "Delhi", "Mumbai"), extract it as 'city'.
      - If they mention a type of space (e.g., "Billboard", "LED Screen"), extract it as 'categoryName'.
      - Any other descriptive words should go into 'keywords'.
      - Make absolutely sure your response is ONLY valid JSON with no markdown formatting (\`\`\`json) and no conversational text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "{}";
    
    // Clean up potential markdown formatting from Gemini
    const cleanJsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let extractedParams;
    try {
      extractedParams = JSON.parse(cleanJsonString);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", text);
      return NextResponse.json({ success: false, error: "Failed to parse search query" }, { status: 500 });
    }

    const { city, budget, categoryName, keywords } = extractedParams;

    // Build Prisma query
    const whereClause: any = { isActive: true };

    if (city) {
      whereClause.city = { contains: city };
    }

    if (budget) {
      whereClause.price = { lte: budget };
    }

    if (categoryName) {
      const category = await prisma.category.findFirst({
        where: { name: { contains: categoryName } }
      });
      if (category) {
        whereClause.categoryId = category.id;
      }
    }

    if (keywords) {
      whereClause.OR = [
        { title: { contains: keywords } },
        { description: { contains: keywords } }
      ];
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      take: 20,
      include: {
        category: { select: { id: true, name: true } },
        media: { select: { id: true, url: true, type: true } },
        _count: { select: { favorites: true } }
      },
      orderBy: { trendingScore: 'desc' }
    });

    return NextResponse.json({
      success: true,
      extractedParams,
      data: listings
    });

  } catch (error: any) {
    console.error("Smart search error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to search" },
      { status: 500 }
    );
  }
}
