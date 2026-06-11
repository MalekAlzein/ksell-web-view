import React, { useEffect, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { getShowcaseUrl } from '../lib/api';

// LocalStorage flag — matches the Flutter key so the "first time" video shows once.
const FIRST_TIME_KEY = 'show_case_request_video';

/**
 * Extract a YouTube video id from any common URL shape (watch, youtu.be, embed,
 * shorts) — the web equivalent of Flutter's `YoutubePlayer.convertUrlToId`.
 * Returns null if no valid 11-char id is found.
 */
function youtubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  // Already a bare id.
  if (/^[\w-]{11}$/.test(url)) return url;
  return null;
}

/**
 * Floating "How it works" button that plays a showcase YouTube video, with the
 * same behaviour as the Flutter screen: the link comes from the native app, and
 * the video auto-opens the very first time the screen is seen.
 */
export function HowItWorks() {
  const url = getShowcaseUrl();
  const videoId = url ? youtubeId(url) : null;
  const [open, setOpen] = useState(false);

  // First time only: auto-open the video once, then remember we did.
  useEffect(() => {
    if (!videoId) return;
    let firstTime = false;
    try {
      firstTime = !window.localStorage.getItem(FIRST_TIME_KEY);
    } catch {
      /* ignore storage errors (private mode) */
    }
    if (firstTime) {
      setOpen(true);
      try {
        window.localStorage.setItem(FIRST_TIME_KEY, '1');
      } catch {
        /* ignore */
      }
    }
  }, [videoId]);

  return (
    <>
      {/* Floating How it works */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={() => videoId && setOpen(true)}
          className="bg-app-accent/10 dark:bg-app-accent/20 text-app-accent dark:text-red-400 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium border border-app-accent/20">
          <HelpCircle className="w-4 h-4" />
          How it work
        </button>
      </div>

      {/* Video modal */}
      {open && videoId &&
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}>
          <div
            className="relative w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close video"
              className="absolute -top-11 end-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="relative w-full pb-[56.25%] rounded-2xl overflow-hidden bg-black shadow-2xl">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`}
                title="How it works"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen />
            </div>
          </div>
        </div>
      }
    </>);

}
