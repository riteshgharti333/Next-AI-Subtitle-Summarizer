// src/utils/subtitleFetcher.ts
import fetch from "node-fetch";
import he from "he";
import striptags from "striptags";

const YT_API_KEY = process.env.YOUTUBE_API;

export interface Subtitle {
  start: number;
  dur: number;
  text: string;
}

/**
 * Fetch YouTube subtitles (manual or auto-generated) for a video.
 * @param videoId YouTube video ID
 * @param lang Language code (default: "en")
 * @returns Array of subtitle objects
 */
export async function getSubtitles(videoId: string, lang = "en"): Promise<Subtitle[]> {
  if (!YT_API_KEY) throw new Error("YOUTUBE_API key is not set in env");

  // Step 1: Get video player info
  const playerUrl = `https://www.youtube.com/youtubei/v1/player?key=${YT_API_KEY}`;
  const playerRes = await fetch(playerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20210721.00.00",
        },
      },
      videoId,
    }),
  });

  const playerData: any = await playerRes.json();

  // Step 2: Extract captions
  try {
    const captionTracks =
      playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || !captionTracks.length) {
      throw new Error("No caption tracks found");
    }

    // Pick requested language or fallback to first
    const captionTrack =
      captionTracks.find((track: any) => track.languageCode === lang) || captionTracks[0];

    if (!captionTrack?.baseUrl) throw new Error("No valid caption URL");

    const captionRes = await fetch(captionTrack.baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: `https://www.youtube.com/watch?v=${videoId}`,
      },
    });

    const captionXml = await captionRes.text();

    // Parse captions
    const matches = Array.from(
      captionXml.matchAll(/<text start="(.*?)" dur="(.*?)">(.*?)<\/text>/g)
    );

    return matches.map((m) => ({
      start: parseFloat(m[1]),
      dur: parseFloat(m[2]),
      text: he.decode(striptags(m[3])),
    }));
  } catch (err: any) {
    console.log("Fallback captions failed:", err.message);
    return [];
  }
}
