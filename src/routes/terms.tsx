import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Fieldline" },
      {
        name: "description",
        content:
          "Terms of Service for Fieldline, the live college football Top 25 tracker.",
      },
      { property: "og:title", content: "Terms of Service — Fieldline" },
      {
        property: "og:description",
        content: "Terms of Service for Fieldline, the live college football Top 25 tracker.",
      },
    ],
  }),
  component: TermsPage,
});

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Acceptance of terms",
    body: (
      <>
        By accessing or using Fieldline (the "Service"), you agree to be bound by
        these Terms of Service. If you do not agree with any part of these terms,
        you may not use the Service.
      </>
    ),
  },
  {
    title: "2. Description of the service",
    body: (
      <>
        Fieldline displays live college football scores, AP Top 25 rankings,
        play-by-play updates, team statistics, and broadcast information for
        ranked games. The Service is provided free of charge for personal,
        non-commercial use.
      </>
    ),
  },
  {
    title: "3. Third-party data",
    body: (
      <>
        Scores, rankings, schedules, statistics, and broadcast details shown on
        Fieldline are sourced from third-party sports data providers. Fieldline
        does not generate or own this data and makes no guarantee as to its
        accuracy, completeness, or timeliness. All team names, logos, and
        trademarks belong to their respective owners and are used for
        identification purposes only.
      </>
    ),
  },
  {
    title: "4. Acceptable use",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Do not attempt to disrupt, overload, or interfere with the Service.</li>
        <li>Do not scrape, resell, or redistribute the Service's data feeds.</li>
        <li>Do not use the Service for any unlawful purpose.</li>
        <li>Do not misrepresent your identity or affiliation when using the Service.</li>
      </ul>
    ),
  },
  {
    title: "5. Cookies and local storage",
    body: (
      <>
        Fieldline stores a small amount of information in your browser — such as
        the teams you follow and your cookie preference — so the board remembers
        you between visits. This data stays on your device. See our cookie notice
        on the home page for details on how to accept or decline.
      </>
    ),
  },
  {
    title: "6. Intellectual property",
    body: (
      <>
        The Fieldline name, design, and original code are the property of
        Fieldline. Third-party sports data and team marks remain the property of
        their respective rights holders. Nothing in these terms transfers any
        ownership rights to you.
      </>
    ),
  },
  {
    title: "7. Disclaimer of warranties",
    body: (
      <>
        The Service is provided "as is" and "as available" without warranties of
        any kind, express or implied, including merchantability, fitness for a
        particular purpose, and non-infringement. We do not warrant that the
        Service will be uninterrupted, error-free, or that live data will always
        be current.
      </>
    ),
  },
  {
    title: "8. Limitation of liability",
    body: (
      <>
        To the maximum extent permitted by law, Fieldline and its operators shall
        not be liable for any indirect, incidental, special, consequential, or
        punitive damages arising from your use of, or inability to use, the
        Service — including reliance on scores, rankings, or broadcast
        information displayed on the Service.
      </>
    ),
  },
  {
    title: "9. Changes to the service and terms",
    body: (
      <>
        We may modify or discontinue the Service, or update these terms, at any
        time. Material changes to these terms will be reflected on this page with
        an updated effective date. Continued use of the Service after changes
        constitutes acceptance of the revised terms.
      </>
    ),
  },
  {
    title: "10. Contact",
    body: (
      <>
        Questions about these terms can be sent through the feedback channel
        where you access Fieldline.
      </>
    ),
  },
];

function TermsPage() {
  return (
    <div className="min-h-screen bg-frost font-body text-ink">
      <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <Link
            to="/"
            className="grid size-9 place-items-center rounded-md bg-gold font-display text-lg font-bold leading-none text-frost"
          >
            F
          </Link>
          <div className="leading-none">
            <div className="font-display text-xl font-bold tracking-wide">
              FIELD<span className="text-gold">LINE</span>
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
            Terms of Service
          </h1>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-mute">
            Effective September 23, 2026
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
          Fieldline is an independent tracker and is not affiliated with the NCAA, the AP, or any university.
        </p>
      </div>
    </div>
  );
}
