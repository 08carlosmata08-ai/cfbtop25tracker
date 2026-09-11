import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { getTeamDetail, type TeamColors } from "@/lib/cfb.functions";

export const Route = createFileRoute("/team/$teamId")({
  head: () => ({
    meta: [
      { title: "Team Game Center — Fieldline" },
      {
        name: "description",
        content:
          "Team game center with live score, matchup details and full play-by-play, styled in both teams' colors.",
      },
      { property: "og:title", content: "Team Game Center — Fieldline" },
      {
        property: "og:description",
        content: "Live score, matchup details and play-by-play in both teams' colors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

function readable(hexColor: string) {
  const h = hexColor.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.7 ? "#10151d" : "#ffffff";
}

function TeamPage() {
  const { teamId } = Route.useParams();
  const q = useQuery({
    queryKey: ["team-detail", teamId],
    queryFn: () => getTeamDetail({ data: { teamId } }),
    refetchInterval: 20_000,
  });

  const d = q.data;
  const me = d?.team;
  const opp = d?.opponent;
  const a = me?.primary ?? "#1f2937";
  const b = opp?.primary ?? me?.secondary ?? "#0b1220";

  return (
    <div className="relative min-h-screen w-full font-body text-ink">
      <div
        className="absolute inset-0 z-0"
        style={{ background: `linear-gradient(115deg, ${a} 0%, ${a} 45%, ${b} 55%, ${b} 100%)` }}
      />
      <div className="absolute inset-0 z-0 bg-[#050a12]/45" />
      <div
        className="absolute inset-x-0 top-0 z-0 h-1.5"
        style={{
          background: `linear-gradient(90deg, ${me?.secondary ?? "#fff"} 0%, ${me?.secondary ?? "#fff"} 50%, ${opp?.secondary ?? "#fff"} 50%, ${opp?.secondary ?? "#fff"} 100%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1100px] px-5 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.2em] backdrop-blur-md"
        >
          ← Back to board
        </Link>

        {q.isLoading && (
          <p className="mt-8 font-mono text-sm text-white/80">Loading the game center…</p>
        )}

        {d && (
          <>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-wide">
              {d.eventName || me?.fullName || "Game Center"}
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.25em] text-white/70">
              {[d.detail, d.venue, d.broadcast].filter(Boolean).join(" · ") || "Schedule pending"}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[me, opp].map((t, i) =>
                t ? (
                  <div
                    key={t.id + String(i)}
                    className="overflow-hidden rounded-xl outline-1 -outline-offset-1 outline-white/20"
                    style={{ backgroundColor: `${t.primary}f0`, color: readable(t.primary) }}
                  >
                    <div className="h-2" style={{ backgroundColor: t.secondary }} />
                    <div className="flex items-center gap-4 p-5">
                      {t.logo && (
                        <img src={t.logo} alt="" width={56} height={56} className="size-14" />
                      )}
                      <div>
                        <div className="font-display text-2xl font-bold leading-tight">
                          {t.fullName || t.name}
                        </div>
                        <div className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-80">
                          {t.record}
                          {t.rank ? ` · #${t.rank}` : ""}
                        </div>
                      </div>
                      <div className="ml-auto font-mono text-5xl font-semibold">
                        {d.state === "pre" ? "–" : (t.score ?? 0)}
                      </div>
                    </div>
                  </div>
                ) : null,
              )}
            </div>

            <div className="mt-6 rounded-xl bg-black/35 p-5 outline-1 -outline-offset-1 outline-white/15 backdrop-blur-md">
              <h2 className="font-display text-lg font-semibold tracking-wide">Play-by-Play</h2>
              <div className="mt-3 max-h-[520px] overflow-y-auto">
                {d.plays.length === 0 && (
                  <p className="py-2.5 font-mono text-xs text-white/70">
                    {d.state === "pre" ? "Kickoff hasn't happened yet." : "No plays logged yet."}
                  </p>
                )}
                {d.plays.map((p) => {
                  const owner: TeamColors | null =
                    p.teamId === me?.id ? me! : p.teamId === opp?.id ? opp : null;
                  return (
                    <div
                      key={p.id}
                      className="flex gap-3 border-b border-white/10 py-2.5 last:border-0"
                    >
                      <span
                        className="w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: owner?.primary ?? "transparent" }}
                      />
                      <span
                        className={`w-16 shrink-0 font-mono text-xs ${p.scoring ? "text-gold" : "text-white/60"}`}
                      >
                        Q{p.period} {p.clock}
                      </span>
                      <p className="text-sm">
                        {p.text}{" "}
                        <span className="font-mono text-xs text-white/60">
                          {d.homeId === me?.id
                            ? `${opp?.abbr ?? "AWAY"} ${p.awayScore} · ${me?.abbr} ${p.homeScore}`
                            : `${me?.abbr} ${p.awayScore} · ${opp?.abbr ?? "HOME"} ${p.homeScore}`}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
