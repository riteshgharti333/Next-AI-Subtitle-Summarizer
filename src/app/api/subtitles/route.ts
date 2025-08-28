import { NextRequest, NextResponse } from "next/server";
import he from "he";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractVideoId } from "@/app/utils/extractVideoId";
import { getSubtitles } from "@/app/utils/subtitleFetcher";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("❌ GEMINI_API_KEY is not set in .env.local");

const genAI = new GoogleGenerativeAI(apiKey);

function cleanMarkdown(text: string) {
  return text.replace(/[*_#>`]/g, "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const link = searchParams.get("link");

    if (!link) {
      return NextResponse.json(
        { error: "YouTube link is required" },
        { status: 400 }
      );
    }

    // Extract videoId from URL
    const videoId = extractVideoId(link);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube link" },
        { status: 400 }
      );
    }

    // Fetch subtitles
    const subtitles = await getSubtitles({ videoID: videoId });
    if (!subtitles.length) {
      return NextResponse.json(
        { error: "No subtitles found" },
        { status: 404 }
      );
    }

    // Join & clean subtitle text
    const text = subtitles
      .map((s) => he.decode(s.text.trim()))
      .join(" ")
      .replace(/\s+/g, " ");

    // Summarize using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Summarize the following subtitles into clear, concise English bullet points:\n\n${text}`
    );

    // Correct way to extract text
    const rawText =
      result.response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const aiSummary = cleanMarkdown(rawText);

    return NextResponse.json({ videoId, summary: aiSummary });
  } catch (err) {
    console.error("Subtitle/AI error:", err);
    return NextResponse.json(
      { error: "Failed to fetch or process subtitles" },
      { status: 500 }
    );
  }
}
