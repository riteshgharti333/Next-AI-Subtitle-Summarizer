
export function extractVideoId(url: string): string | null {
  try {
    // Standard YouTube URL: ?v=VIDEO_ID
    const ytMatch = url.match(/[?&]v=([^&#]+)/);
    if (ytMatch && ytMatch[1]) return ytMatch[1];

    // Short YouTube URL: youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?&#]+)/);
    if (shortMatch && shortMatch[1]) return shortMatch[1];

    return null;
  } catch {
    return null;
  }
}
