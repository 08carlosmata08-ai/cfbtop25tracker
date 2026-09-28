import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — GoalLINE" },
      {
        name: "description",
        content:
          "How GoalLINE, the live college football Top 25 tracker, handles visitor data.",
      },
      { property: "og:title", content: "Privacy Policy — GoalLINE" },
      {
        property: "og:description",
        content:
          "How GoalLINE, the live college football Top 25 tracker, handles visitor data.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Overview",
    body: (
      <>
        GoalLINE (the "Service") is a free, read-only college football tracker.
        This policy explains what information the Service handles when you
        visit, what stays on your device, and what is shared with third
        parties. By using the Service you agree to this policy.
      </>
    ),
  },
  {
    title: "2. Information we do not collect",
    body: (
      <>
        GoalLINE has no accounts, no sign-up, and no newsletter. We do not ask
        for or store your name, email address, phone number, payment details,
        or any other personal identification information. There is no user
        profile to create or delete, because none exists.
      </>
    ),
  },
  {
    title: "3. Local storage on your device",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong>Followed teams</strong> — the teams you follow are saved in
          your browser's local storage so the board remembers your choices
          between visits.
        </li>
        <li>
          <strong>Cookie preference</strong> — whether you accepted or declined
          the cookie notice is saved locally so we stop asking.
        </li>
      </ul>
    ),
  },
  {
    title: "4. Cookies",
    body: (
      <>
        GoalLINE itself sets no tracking or advertising cookies. The only
        record the Service keeps is the local storage entries described above,
        which never leave your device and can be cleared at any time through
        your browser settings (clearing them simply resets your followed teams
        and cookie preference). Our cookie notice on the home page lets you
        accept or decline; declining does not limit any feature of the
        Service.
      </>
    ),
  },
  {
    title: "5. Third-party sports data",
    body: (
      <>
        Scores, rankings, schedules, play-by-play, statistics, and broadcast
        information shown on GoalLINE are requested from third-party sports
        data providers. Those requests are made by our servers, not by your
        browser, so your IP address and device details are not shared with
        those providers as part of loading game data. We do not control those
        providers' own privacy practices.
      </>
    ),
  },
  {
    title: "6. Hosting and server logs",
    body: (
      <>
        Like nearly all websites, the hosting platform that serves GoalLINE
        processes standard technical data — such as IP addresses and request
        timestamps — to deliver pages, protect against abuse, and keep the
        Service available. This data is used for security and operations only,
        and is not used to build advertising or marketing profiles.
      </>
    ),
  },
  {
    title: "7. Analytics and advertising",
    body: (
      <>
        GoalLINE does not run third-party analytics, advertising networks,
        social media pixels, or cross-site trackers. We do not sell, rent, or
        trade any visitor information — there is no personal information to
        sell.
      </>
    ),
  },
  {
    title: "8. Children's privacy",
    body: (
      <>
        The Service is a general-audience sports tracker and does not
        knowingly collect personal information from anyone, including children
        under 13. Because no personal information is collected, no such data
        can be stored or shared.
      </>
    ),
  },
  {
    title: "9. Your choices",
    body: (
      <>
        You can browse the entire Service without accepting anything. To
        remove the data GoalLINE stores, clear your browser's local storage
        for this site (or use your browser's "clear site data" option), which
        resets your followed teams and cookie preference. You can also block
        or clear local storage through your browser settings at any time.
      </>
    ),
  },
  {
    title: "10. Changes to this policy",
    body: (
      <>
        We may update this policy as the Service evolves. Material changes
        will be reflected on this page with an updated effective date.
        Continued use of the Service after changes constitutes acceptance of
        the revised policy.
      </>
    ),
  },
  {
    title: "11. Contact",
    body: (
      <>
        Questions about privacy on GoalLINE can be sent through the feedback
        channel where you access the Service. See also our{" "}
        <Link
          to="/terms"
          className="text-gold underline decoration-white/30 underline-offset-2 transition-colors hover:text-ink"
        >
          Terms of Service
        </Link>
        .
      </>
    ),
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-frost font-body text-ink">
      <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Link
            to="/"
            className="grid size-9 place-items-center rounded-md bg-gold font-display text-lg font-bold leading-none text-frost"
          >
            G
          </Link>
          <div className="leading-none">
            <div className="font-display text-xl font-bold tracking-wide">
              Goal<span className="text-gold">LINE</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
              Live CFB Tracker
            </div>
          </div>
          <Link
            to="/"
            className="ml-auto rounded-md bg-white/5 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-mute outline-1 -outline-offset-1 outline-white/10 transition-colors hover:text-ink"
          >
            Back to board
          </Link>
        </div>

        <div className="rounded-xl bg-white/5 p-6 outline-1 -outline-offset-1 outline-white/10 backdrop-blur-md sm:p-8">
          <h1 className="font-display text-3xl font-bold tracking-wide">
            Privacy Policy
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-mute">
            Effective September 28, 2026
          </p>

          <div className="mt-8 space-y-7">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="font-display text-lg font-semibold tracking-wide">
                  {s.title}
                </h2>
                <div className="mt-2 text-sm leading-relaxed text-ink/85">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-mute">
          GoalLINE is an independent tracker and is not affiliated with the NCAA, the AP, or any university.
        </p>
      </div>
    </div>
  );
}
