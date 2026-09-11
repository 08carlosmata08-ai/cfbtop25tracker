import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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

function isTouchdown(text: string) {
  return /touchdown/i.test(text ?? "");
}

function TeamPage() {
  const { teamId } = Route.useParams();
  const q = useQuery({
    queryKey: ["team-detail", teamId],
    queryFn: () => getTeamDetail({ data: { teamId } }),
    refetchInterval: 20_000,
  });

  const d = q.data;
  const [quarter, setQuarter] = useState<number | null>(null);

  const periods = useMemo(() => {
    const set = new Set<number>();
    (q.data?.plays ?? []).forEach((p) => p.period > 0 && set.add(p.period));
    return [...set].sort((x, y) => x - y);
  }, [q.data]);

  const activeQuarter = quarter ?? periods[periods.length - 1] ?? null;
  const quarterPlays = (q.data?.plays ?? []).filter((p) => p.period === activeQuarter);
  const endOfQuarter = quarterPlays[0] ?? null;
  const periodLabel = (n: number) => (n <= 4 ? `Quarter ${n}` : `OT ${n - 4}`);
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold tracking-wide">Play-by-Play</h2>
                {periods.length > 0 && (
                  <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">
                    Period
                    <select
                      value={activeQuarter ?? ""}
                      onChange={(e) => setQuarter(Number(e.target.value))}
                      className="rounded-md bg-black/50 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-ink outline-1 -outline-offset-1 outline-white/25"
                    >
                      {periods.map((n) => (
                        <option key={n} value={n} className="bg-[#10151d]">
                          {periodLabel(n)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              {endOfQuarter && (
                <div className="mt-3 flex items-center gap-3 rounded-md bg-black/40 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-white/80">
                  <span className="text-gold">End of {periodLabel(activeQuarter!)}</span>
                  <span>
                    {d.homeId === me?.id
                      ? `${opp?.abbr ?? "AWAY"} ${endOfQuarter.awayScore} · ${me?.abbr} ${endOfQuarter.homeScore}`
                      : `${me?.abbr} ${endOfQuarter.awayScore} · ${opp?.abbr ?? "HOME"} ${endOfQuarter.homeScore}`}
                  </span>
                </div>
              )}
              <div className="mt-3 max-h-[520px] overflow-y-auto">
                {quarterPlays.length === 0 && (
                  <p className="py-2.5 font-mono text-xs text-white/70">
                    {d.state === "pre" ? "Kickoff hasn't happened yet." : "No plays logged yet."}
                  </p>
                )}
                {quarterPlays.map((p) => {
                  const owner: TeamColors | null =
                    p.teamId === me?.id ? me! : p.teamId === opp?.id ? opp : null;
                  const td = isTouchdown(p.text);
                  const tdColor = td ? owner?.primary : undefined;
                  return (
                    <div
                      key={p.id}
                      className={`flex gap-3 border-b border-white/10 last:border-0 ${td ? "my-1 rounded-lg px-2 py-3 outline-1 -outline-offset-1" : "py-2.5"}`}
                      style={
                        td
                          ? {
                              backgroundColor: `${tdColor}22`,
                              outlineColor: `${tdColor}66`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: td ? tdColor : owner?.primary ?? "transparent" }}
                      />
                      <span
                        className={`w-16 shrink-0 font-mono ${td ? "text-sm font-semibold" : "text-xs"} ${p.scoring ? "text-gold" : "text-white/60"}`}
                      >
                        Q{p.period} {p.clock}
                      </span>
                      <p className={`${td ? "text-base font-semibold" : "text-sm"}`}>
                        <span style={td ? { color: tdColor } : undefined}>{p.text}</span>{" "}
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
