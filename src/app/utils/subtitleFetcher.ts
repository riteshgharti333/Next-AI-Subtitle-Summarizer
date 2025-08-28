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

interface CaptionTrack {
  baseUrl?: string;
  languageCode?: string;
  name?: { simpleText?: string };
}

interface PlayerCaptionsTracklistRenderer {
  captionTracks?: CaptionTrack[];
}

interface PlayerData {
  captions?: {
    playerCaptionsTracklistRenderer?: PlayerCaptionsTracklistRenderer;
  };
}

// Detect serverless environment
const isServerless = !!(
  process.env.VERCEL 
);

/**
 * Generate visitorData for serverless requests
 */
function generateVisitorData(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate session data for player request
 */
function generateSessionData() {
  const visitorData = generateVisitorData();
  return {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20210721.00.00",
      },
      user: {
        enableSafetyMode: false,
      },
      request: {
        useSsl: true,
      },
    },
    visitorData,
  };
}

/**
 * Fetch YouTube subtitles (manual or auto-generated)
 */
export async function getSubtitles(videoId: string, lang = "en"): Promise<Subtitle[]> {
  if (!YT_API_KEY) {
    throw new Error("YOUTUBE_API key is not set in environment variables");
  }

  if (!videoId || typeof videoId !== "string") {
    throw new Error("Invalid video ID provided");
  }

  const playerUrl = `https://www.youtube.com/youtubei/v1/player?key=${YT_API_KEY}`;
  const sessionData = generateSessionData();

  // Step 1: Fetch player data
  let playerRes;
  try {
    playerRes = await fetch(playerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        ...(isServerless && { "X-Goog-Visitor-Id": sessionData.visitorData }),
      },
      body: JSON.stringify({ ...sessionData, videoId }),
    });

    if (!playerRes.ok) {
      throw new Error(`YouTube API request failed: ${playerRes.status} ${playerRes.statusText}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new Error(`Failed to fetch video data: ${msg}`);
  }

  let playerData: PlayerData;
  try {
    playerData = await playerRes.json() as PlayerData;
  } catch (err) {
    throw new Error("Failed to parse YouTube response");
  }

  // Step 2: Extract captions
  try {
    const captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || !captionTracks.length) {
      throw new Error("No caption tracks found");
    }

    const captionTrack = captionTracks.find(track => track.languageCode === lang) || captionTracks[0];
    if (!captionTrack?.baseUrl) {
      throw new Error("No valid caption URL found");
    }

    const captionRes = await fetch(captionTrack.baseUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": `https://www.youtube.com/watch?v=${videoId}`,
        "Origin": "https://www.youtube.com",
        ...(isServerless && { "X-Goog-Visitor-Id": sessionData.visitorData }),
      },
    });

    if (!captionRes.ok) {
      throw new Error(`Caption fetch failed: ${captionRes.status} ${captionRes.statusText}`);
    }

    const captionXml = await captionRes.text();

    // Parse XML captions
    const matches = Array.from(captionXml.matchAll(/<text start="(.*?)" dur="(.*?)">(.*?)<\/text>/g));

    return matches.map(m => ({
      start: parseFloat(m[1]),
      dur: parseFloat(m[2]),
      text: he.decode(striptags(m[3])),
    }));

  } catch (err: unknown) {
    console.error("Failed to fetch or parse captions:", err);
    return [];
  }
}
