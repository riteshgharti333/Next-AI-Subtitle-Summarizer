import fetch from "node-fetch";
import he from "he";
import striptags from "striptags";

/**
 * Subtitle interface
 */
export interface Subtitle {
  start: string;
  dur: string;
  text: string;
}

export interface VideoDetails {
  title: string;
  description: string;
  subtitles: Subtitle[];
}

interface Options {
  videoID: string;
  lang?: string;
}

/**
 * Type definitions for YouTube API responses
 */
interface ContinuationItemRenderer {
  continuationEndpoint?: {
    getTranscriptEndpoint?: {
      params: string;
    };
    continuationCommand?: {
      token: string;
    };
  };
}

interface TranscriptSegmentRenderer {
  transcriptSegmentRenderer?: {
    startMs: string;
    endMs: string;
    snippet: {
      simpleText?: string;
      runs?: Array<{ text: string }>;
    };
  };
}

interface EngagementPanel {
  engagementPanelSectionListRenderer?: {
    panelIdentifier: string;
    content?: {
      continuationItemRenderer?: ContinuationItemRenderer;
    };
  };
}

interface CaptionTrack {
  baseUrl?: string;
  vssId?: string;
}

interface PlayerCaptionsTracklistRenderer {
  captionTracks?: CaptionTrack[];
}

interface PlayerData {
  captions?: {
    playerCaptionsTracklistRenderer?: PlayerCaptionsTracklistRenderer;
  };
  videoDetails?: {
    title?: string;
    shortDescription?: string;
  };
  playabilityStatus?: {
    status: string;
  };
}

interface TranscriptResponse {
  actions?: Array<{
    updateEngagementPanelAction?: {
      content?: {
        transcriptRenderer?: {
          content?: {
            transcriptSearchPanelRenderer?: {
              body?: {
                transcriptSegmentListRenderer?: {
                  initialSegments?: TranscriptSegmentRenderer[];
                };
              };
            };
          };
        };
      };
    };
  }>;
}

/**
 * YouTube InnerTube API config
 */
const INNERTUBE_CONFIG = {
  API_BASE: "https://www.youtube.com/youtubei/v1",
  API_KEY: "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
  CLIENT: {
    WEB: {
      NAME: "WEB",
      VERSION: "2.20250222.10.00",
    },
  },
};

/**
 * Generate visitor data
 */
function generateVisitorData(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate session data
 */
function generateSessionData() {
  const visitorData = generateVisitorData();

  return {
    context: {
      client: {
        hl: "en",
        gl: "US",
        clientName: INNERTUBE_CONFIG.CLIENT.WEB.NAME,
        clientVersion: INNERTUBE_CONFIG.CLIENT.WEB.VERSION,
        visitorData,
      },
      user: { enableSafetyMode: false },
      request: { useSsl: true },
    },
    visitorData,
  };
}

/**
 * Helper: Call InnerTube endpoints
 */
async function fetchInnerTube(endpoint: string, data: Record<string, unknown>): Promise<unknown> {
  const headers = {
    "Content-Type": "application/json",
    Accept: "*/*",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "X-Youtube-Client-Version": INNERTUBE_CONFIG.CLIENT.WEB.VERSION,
    "X-Youtube-Client-Name": "1", // WEB
    "X-Goog-Visitor-Id": data.visitorData as string,
    Origin: "https://www.youtube.com",
    Referer: "https://www.youtube.com/",
  };

  const url = `${INNERTUBE_CONFIG.API_BASE}${endpoint}?key=${INNERTUBE_CONFIG.API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`InnerTube request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get video info (player + next API)
 */
async function getVideoInfo(videoID: string): Promise<{ playerData: PlayerData; nextData: unknown }> {
  const sessionData = generateSessionData();

  const payload = {
    ...sessionData,
    videoId: videoID,
    playbackContext: {
      contentPlaybackContext: { vis: 0, splay: false, lactMilliseconds: "-1" },
    },
    racyCheckOk: true,
    contentCheckOk: true,
  };

  const playerData = (await fetchInnerTube("/player", payload)) as PlayerData;

  let nextData: unknown = null;
  if (playerData.playabilityStatus?.status === "LOGIN_REQUIRED") {
    nextData = await fetchInnerTube("/next", { ...sessionData, videoId: videoID });
  }

  return { playerData, nextData };
}

/**
 * Extract subtitles from transcript API (engagement panels)
 */
async function getTranscriptFromEngagementPanel(
  videoID: string,
  nextData: unknown
): Promise<Subtitle[]> {
  const engagementPanels = (nextData as { engagementPanels?: EngagementPanel[] })?.engagementPanels;
  if (!engagementPanels) return [];

  const panel = engagementPanels.find(
    (p: EngagementPanel) =>
      p?.engagementPanelSectionListRenderer?.panelIdentifier ===
      "engagement-panel-searchable-transcript"
  );
  if (!panel) return [];

  let token: string | null = null;

  // Look for continuation token
  const content = panel.engagementPanelSectionListRenderer?.content;
  if (
    content?.continuationItemRenderer?.continuationEndpoint?.getTranscriptEndpoint?.params
  ) {
    token =
      content.continuationItemRenderer.continuationEndpoint.getTranscriptEndpoint
        .params;
  }

  if (!token) return [];

  const sessionData = generateSessionData();
  const transcriptData = (await fetchInnerTube("/get_transcript", {
    ...sessionData,
    params: token,
  })) as TranscriptResponse;

  const segments =
    transcriptData?.actions?.[0]?.updateEngagementPanelAction?.content
      ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
      ?.transcriptSegmentListRenderer?.initialSegments;

  if (!segments) return [];

  return segments
    .map((s: TranscriptSegmentRenderer) => {
      const r = s.transcriptSegmentRenderer;
      if (!r) return null;
      const text =
        r.snippet?.simpleText ||
        (r.snippet?.runs || []).map((run: { text: string }) => run.text).join("");
      if (!text) return null;

      const startMs = parseInt(r.startMs || "0");
      const endMs = parseInt(r.endMs || "0");
      return {
        start: (startMs / 1000).toString(),
        dur: ((endMs - startMs) / 1000).toString(),
        text: he.decode(striptags(text)),
      };
    })
    .filter(Boolean) as Subtitle[];
}

/**
 * Fallback: Extract from caption tracks
 */
async function getSubtitlesFromCaptions(
  videoID: string,
  playerData: PlayerData,
  lang = "en"
): Promise<Subtitle[]> {
  const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || !tracks.length) return [];

  const track =
    tracks.find((t: CaptionTrack) => t.vssId === `.${lang}`) ||
    tracks.find((t: CaptionTrack) => t.vssId === `a.${lang}`) ||
    tracks[0];

  if (!track?.baseUrl) return [];

  const url = track.baseUrl.replace("&fmt=srv3", ""); // XML only
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Caption fetch failed: ${res.status}`);

  const xml = await res.text();
  const regex = /<text start="([\d.]+)" dur="([\d.]+)">(.*?)<\/text>/g;

  return Array.from(xml.matchAll(regex)).map((m) => ({
    start: m[1],
    dur: m[2],
    text: he.decode(striptags(m[3])),
  }));
}

/**
 * Public: Get subtitles only
 */
export const getSubtitles = async ({
  videoID,
  lang = "en",
}: Options): Promise<Subtitle[]> => {
  const { playerData, nextData } = await getVideoInfo(videoID);

  // Try transcript API
  if (nextData) {
    const subs = await getTranscriptFromEngagementPanel(videoID, nextData);
    if (subs.length > 0) return subs;
  }

  // Fallback
  return await getSubtitlesFromCaptions(videoID, playerData, lang);
};

/**
 * Public: Get video details (title, description, subtitles)
 */
export const getVideoDetails = async ({
  videoID,
  lang = "en",
}: Options): Promise<VideoDetails> => {
  const { playerData } = await getVideoInfo(videoID);

  const details = playerData?.videoDetails || {};
  const title = details.title || "No title";
  const description = details.shortDescription || "No description";

  const subtitles = await getSubtitles({ videoID, lang });

  return { title, description, subtitles };
};