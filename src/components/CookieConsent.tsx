import { useEffect, useState } from "react";

const COOKIE_KEY = "fieldline.cookies";

type Choice = "accepted" | "declined";

function readChoice(): Choice | null {
  try {
    const raw = localStorage.getItem(COOKIE_KEY);
    if (raw === "accepted" || raw === "declined") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readChoice()) setVisible(true);
  }, []);

  if (!visible) return null;

  const decide = (choice: Choice) => {
    try {
      localStorage.setItem(COOKIE_KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-frost/85 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 font-mono text-lg text-gold">●</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-ink">
              Cookies
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-mute">
              Fieldline uses cookies to remember the teams you follow and keep
              your live board running smoothly. You can accept or keep browsing
              with only the essentials.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            onClick={() => decide("declined")}
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-mute transition-colors hover:border-sky/50 hover:text-ink"
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold uppercase tracking-wide text-frost transition-colors hover:brightness-110"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
