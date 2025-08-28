"use client";
import { useState } from "react";
import {
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaLinkedin,
  FaLink,
  FaCopy,
  FaLaptopCode,
} from "react-icons/fa";

export default function Homepage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchTranscript = async () => {
    if (!youtubeUrl.trim()) return;

    setLoading(true);
    setTranscript("");
    setError("");
    setCopied(false);

    try {
      const res = await fetch(
        `/api/subtitles?link=${encodeURIComponent(youtubeUrl)}`
      );
      const data = await res.json();

      if (res.ok) setTranscript(data.summary);
      else setError(data.error || "Failed to fetch transcript");
    } catch (err) {
      console.error(err);
      setError("Server error");
    }

    setLoading(false);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchTranscript();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(
      "https://next-ai-subtitle-summarizer.vercel.app/"
    );
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Function to share on social media
  const shareOnSocialMedia = (platform: string) => {
    const currentUrl = encodeURIComponent(
      "https://next-ai-subtitle-summarizer.vercel.app/"
    );
    const title = encodeURIComponent(
      "YouTube Subtitle Extractor - Get AI summaries of YouTube videos"
    );

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${currentUrl}&text=${title}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${title} ${currentUrl}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-2 md:p-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto mb-8 md:mb-12 text-center">
        <div className="max-[480px]:flex-col flex items-center justify-center mb-3">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500 rounded-full flex items-center justify-center max-[480px]:mr-0 mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 md:h-8 md:w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="max-[480px]:mt-3 text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-pink-500">
            AI YouTube Subtitle Extractor
          </h1>
        </div>
        <p className="text-gray-400 text-sm md:text-base">
          Instantly extract and summarize YouTube subtitles with AI for quick
          insights.
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        {/* Input Section - Now using a form */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-5 md:p-6 mb-6 border border-gray-700 shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Paste YouTube URL here..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !youtubeUrl}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl font-medium flex items-center justify-center transition-all duration-300 transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <span className="flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Get AI Summary
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 bg-opacity-30 border border-red-800 rounded-xl flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-400 mr-3 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Transcript Section */}
        {transcript && (
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl border border-gray-700 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h2 className="font-semibold text-lg flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-pink-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                AI Transcript
              </h2>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                {copied ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Text
                  </>
                )}
              </button>
            </div>
            <div className="max-[480px]:p-2 p-5 md:p-6">
              <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-p:leading-relaxed flex flex-col gap-2">
                {transcript.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto mt-8 md:mt-12 text-center">
        <div className="flex justify-center space-x-4 mb-4">
          {/* Facebook Icon */}
          <button
            onClick={() => shareOnSocialMedia("facebook")}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
            aria-label="Share on Facebook"
          >
            <FaFacebook className="w-5 h-5" />
          </button>

          {/* Twitter Icon */}
          <button
            onClick={() => shareOnSocialMedia("twitter")}
            className="w-10 h-10 rounded-full bg-blue-400 hover:bg-blue-500 flex items-center justify-center transition-colors"
            aria-label="Share on Twitter"
          >
            <FaTwitter className="w-5 h-5" />
          </button>

          {/* WhatsApp Icon */}
          <button
            onClick={() => shareOnSocialMedia("whatsapp")}
            className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
            aria-label="Share on WhatsApp"
          >
            <FaWhatsapp className="w-5 h-5" />
          </button>

          {/* LinkedIn Icon */}
          <button
            onClick={() => shareOnSocialMedia("linkedin")}
            className="w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center transition-colors"
            aria-label="Share on LinkedIn"
          >
            <FaLinkedin className="w-5 h-5" />
          </button>

          {/* Copy Link Icon */}
          <button
            onClick={copyLinkToClipboard}
            className="w-10 h-10 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center transition-colors"
            aria-label="Copy site link"
          >
            {linkCopied ? (
              <FaCopy className="w-4 h-4 text-green-400" />
            ) : (
              <FaLink className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()}  Instantly extract and summarize YouTube subtitles using AI. Get clear, concise, free, fast, and easy to use.
          <br />
          <a
            href="https://rgdev-portfolio-six.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#06b6d4] hover:text-[#ec4899] transition-colors duration-300"
          >
            <FaLaptopCode className="text-lg transition-colors duration-300" />
            <span className="hover:underline">Check my portfolio</span>
          </a>
        </p>
      </footer>
    </div>
  );
}
