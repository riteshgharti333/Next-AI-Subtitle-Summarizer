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
  name?: {
    simpleText?: string;
  };
}

interface PlayerCaptionsTracklistRenderer {
  captionTracks?: CaptionTrack[];
}

interface PlayerData {
  captions?: {
    playerCaptionsTracklistRenderer?: PlayerCaptionsTracklistRenderer;
  };
}

/**
 * Fetch YouTube subtitles (manual or auto-generated) for a video.
 * @param videoId YouTube video ID
 * @param lang Language code (default: "en")
 * @returns Array of subtitle objects
 */
export async function getSubtitles(videoId: string, lang = "en"): Promise<Subtitle[]> {
  if (!YT_API_KEY) {
    console.error("YOUTUBE_API key is not set in environment variables");
    throw new Error("YOUTUBE_API key is not set in env");
  }

  if (!videoId || typeof videoId !== 'string') {
    throw new Error("Invalid video ID provided");
  }

  // Step 1: Get video player info
  const playerUrl = `https://www.youtube.com/youtubei/v1/player?key=${YT_API_KEY}`;
  
  let playerRes;
  try {
    playerRes = await fetch(playerUrl, {
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

    if (!playerRes.ok) {
      throw new Error(`YouTube API request failed: ${playerRes.status} ${playerRes.statusText}`);
    }
  } catch (fetchError) {
    const errorMessage = fetchError instanceof Error ? fetchError.message : 'Network error';
    console.error("Failed to fetch player data:", errorMessage);
    throw new Error(`Failed to fetch video data: ${errorMessage}`);
  }

  let playerData;
  try {
    playerData = await playerRes.json() as PlayerData;
  } catch (parseError) {
    console.error("Failed to parse player response:", parseError);
    throw new Error("Failed to parse YouTube response");
  }

  // Step 2: Extract captions
  try {
    const captionTracks =
      playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || !captionTracks.length) {
      throw new Error("No caption tracks found");
    }

    // Pick requested language or fallback to first
    const captionTrack =
      captionTracks.find((track: CaptionTrack) => track.languageCode === lang) || captionTracks[0];

    if (!captionTrack?.baseUrl) {
      console.error("No valid caption URL found in track:", captionTrack);
      throw new Error("No valid caption URL");
    }

    let captionRes;
    try {
      captionRes = await fetch(captionTrack.baseUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Referer: `https://www.youtube.com/watch?v=${videoId}`,
        },
      });

      if (!captionRes.ok) {
        throw new Error(`Caption fetch failed: ${captionRes.status} ${captionRes.statusText}`);
      }
    } catch (captionError) {
      const errorMessage = captionError instanceof Error ? captionError.message : 'Unknown error';
      console.error("Failed to fetch captions:", errorMessage);
      throw new Error(`Failed to fetch captions: ${errorMessage}`);
    }

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
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log("Fallback captions failed:", errorMessage);
    return [];
  }
}