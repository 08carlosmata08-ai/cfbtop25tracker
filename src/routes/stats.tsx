import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getTop25Stats, type TeamStats } from "@/lib/cfb.functions";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Top 25 Team Stats — Fieldline" },
      {
        name: "description",
        content:
          "Season stats for every AP Top 25 college football team: wins, losses, points, yards and game-by-game scoring trends.",
      },
      { property: "og:title", content: "Top 25 Team Stats — Fieldline" },
      {
        property: "og:description",
        content: "Wins, losses, points, yards and scoring trends for every AP Top 25 team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatsPage,
});

type SortKey = "rank" | "wins" | "pointsPerGame" | "pointsAllowedPerGame" | "yardsPerGame";

function Spark({ team }: { team: TeamStats }) {
  const games = team.games.slice(-8);
  if (games.length === 0) return <span className="font-mono text-[10px] text-mute">no games</span>;
  const max = Math.max(...games.map((g) => Math.max(g.pointsFor, g.pointsAgainst)), 10);
  return (
    <div className="flex items-end gap-1" aria-hidden>
      {games.map((g) => (
        <span key={g.id} className="flex items-end gap-[2px]" title={`${g.label} ${g.pointsFor}-${g.pointsAgainst}`}>
          <span
            className="w-1.5 rounded-sm"
            style={{ height: `${8 + (g.pointsFor / max) * 26}px`, backgroundColor: team.color }}
          />
          <span
            className="w-1.5 rounded-sm bg-white/25"
            style={{ height: `${8 + (g.pointsAgainst / max) * 26}px` }}
          />
        </span>
      ))}
    </div>
  );
}

function StatsPage() {
  const q = useQuery({
    queryKey: ["top25-stats"],
    queryFn: () => getTop25Stats(),
    staleTime: 10 * 60 * 1000,
  });
  const [sort, setSort] = useState<SortKey>("rank");

  const all = q.data?.teams ?? [];

  // Rank (1 = best) for each stat across the Top 25.
  const statRanks = new Map<string, Map<string, number>>();
  const rankBy = (key: "wins" | "pointsPerGame" | "pointsAllowedPerGame" | "yardsPerGame") => {
    if (!statRanks.has(key)) {
      const sorted = [...all].sort((a, b) =>
        key === "pointsAllowedPerGame"
          ? a[key] - b[key]
          : key === "wins"
            ? b.wins - a.wins || a.losses - b.losses
            : b[key] - a[key],
      );
      statRanks.set(key, new Map(sorted.map((t, i) => [t.teamId, i + 1])));
    }
    return statRanks.get(key)!;
  };

  const teams = [...all].sort((a, b) =>
    sort === "rank"
      ? a.rank - b.rank
      : sort === "pointsAllowedPerGame"
        ? a[sort] - b[sort]
        : b[sort] - a[sort],
  );

  // Ranking shown in the leading column: AP rank, or rank within the sorted stat.
  const statRankOf = (t: TeamStats): number | null =>
    sort === "rank" ? null : sort === "wins" ? rankBy("wins").get(t.teamId)! : rankBy(sort).get(t.teamId)!;

  const cols: { key: SortKey; label: string }[] = [
    { key: "rank", label: "Rank" },
    { key: "wins", label: "Record" },
    { key: "pointsPerGame", label: "PPG" },
    { key: "pointsAllowedPerGame", label: "Opp PPG" },
    { key: "yardsPerGame", label: "Yds/G" },
  ];

  const leadHeader =
    sort === "rank"
      ? "AP"
      : sort === "wins"
        ? "W Rk"
        : cols.find((c) => c.key === sort)!.label + " Rk";

  return (
    <div className="relative min-h-screen w-full bg-[#0a1626] font-body text-ink">
      <div className="mx-auto max-w-[1200px] px-5 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 font-mono text-xs uppercase tracking-[0.2em]"
        >
          ← Back to board
        </Link>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-wide">Top 25 Team Stats</h1>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.25em] text-mute">
          {q.data?.week || "AP Top 25"} · wins, losses, points, yards & scoring trends
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {cols.map((c) => (
            <button
              key={c.key}
              onClick={() => setSort(c.key)}
              className={`rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] outline-1 -outline-offset-1 outline-white/15 ${
                sort === c.key ? "bg-gold/20 text-gold" : "bg-white/5 text-mute"
              }`}
            >
              Sort · {c.label}
            </button>
          ))}
        </div>

        {q.isLoading && <p className="mt-8 font-mono text-sm text-mute">Loading season stats…</p>}
        {q.data?.error && (
          <p className="mt-8 font-mono text-sm text-clay">Stats feed unavailable: {q.data.error}</p>
        )}

        <div className="mt-5 overflow-x-auto rounded-xl bg-white/5 outline-1 -outline-offset-1 outline-white/10">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
                <th className="px-4 py-3 text-left">{leadHeader}</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-right">W–L</th>
                <th className="px-4 py-3 text-right">PF</th>
                <th className="px-4 py-3 text-right">PA</th>
                <th className="px-4 py-3 text-right">PPG</th>
                <th className="px-4 py-3 text-right">Opp PPG</th>
                <th className="px-4 py-3 text-right">Yds/G</th>
                <th className="px-4 py-3 text-right">Total Yds</th>
                <th className="px-4 py-3 text-left">Scoring trend</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => {
                const statRank = statRankOf(t);
                return (
                <tr key={t.teamId} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    {sort === "rank" ? (
                      <span className="font-mono text-sm">{t.rank}</span>
                    ) : (
                      <span
                        className={`inline-grid size-7 place-items-center rounded font-display text-sm font-bold ${
                          statRank === 1 ? "bg-gold/25 text-gold" : "bg-white/5 text-mute"
                        }`}
                        title={`#${statRank} in ${leadHeader.replace(" Rk", "")} among the Top 25`}
                      >
                        {statRank}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to="/team/$teamId"
                      params={{ teamId: t.teamId }}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="grid size-8 place-items-center rounded font-display text-xs font-bold"
                        style={{ backgroundColor: `${t.color}33`, color: t.color }}
                      >
                        {t.logo ? (
                          <img src={t.logo} alt="" width={22} height={22} className="size-[22px]" />
                        ) : (
                          t.abbr
                        )}
                      </span>
                      <span className="font-display text-base font-medium">{t.name}</span>
                      <span
                        className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-mute"
                        title="AP Top 25 ranking"
                      >
                        #{t.rank}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    {t.wins}–{t.losses}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-mute">{t.pointsFor}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-mute">
                    {t.pointsAgainst}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{t.pointsPerGame}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    {t.pointsAllowedPerGame}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{t.yardsPerGame}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-mute">
                    {t.totalYards}
                  </td>
                  <td className="px-4 py-3">
                    <Spark team={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
