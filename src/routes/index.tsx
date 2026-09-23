import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import stadium from "@/assets/stadium.jpg";
import {
  getPlayByPlay,
  getRankedGames,
  getRankings,
  type Game,
  type GameTeam,
  type RankRow,
} from "@/lib/cfb.functions";

const rankingsQuery = {
  queryKey: ["rankings"],
  queryFn: () => getRankings(),
  staleTime: 30_000,
  refetchInterval: 30_000,
};

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(rankingsQuery),
  head: () => ({
    meta: [
      { title: "Fieldline — Live College Football Top 25 Tracker" },
      {
        name: "description",
        content:
          "Live scores, AP Top 25 rankings and play-by-play for ranked college football games. Follow your teams and watch every drive.",
      },
      { property: "og:title", content: "Fieldline — Live College Football Top 25 Tracker" },
      {
        property: "og:description",
        content:
          "Live scores, AP Top 25 rankings and play-by-play for ranked college football games.",
      },
    ],
  }),
  component: Index,
});

const FOLLOW_KEY = "fieldline.following";

function useFollowing() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FOLLOW_KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  const toggle = (id: string) =>
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  return { ids, toggle };
}

function clock(state: Game["state"], g: Game) {
  if (state === "in") return `Q${g.period} · ${g.clock}`;
  return g.detail;
}

function kickoff(iso: string) {
  if (!iso) return "";
  try {
    return (
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
      }).format(new Date(iso)) + " ET"
    );
  } catch {
    return "";
  }
}

function Index() {
  const rankings = useQuery(rankingsQuery);
  const board = useQuery({
    queryKey: ["ranked-games"],
    queryFn: () => getRankedGames(),
    refetchInterval: 20_000,
  });

  const games = board.data?.games ?? [];
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const featured = useMemo(
    () => games.find((g) => g.id === selectedGameId) ?? games[0] ?? null,
    [games, selectedGameId],
  );

  const pbp = useQuery({
    queryKey: ["pbp", featured?.id],
    queryFn: () => getPlayByPlay({ data: { eventId: featured!.id } }),
    enabled: Boolean(featured),
    refetchInterval: featured?.state === "in" ? 15_000 : false,
  });

  const { ids: following, toggle } = useFollowing();
  const [accent, setAccent] = useState<{ name: string; color: string } | null>(null);

  const liveCount = games.filter((g) => g.state === "in").length;
  const rows = rankings.data?.rows ?? [];
  const half = Math.ceil(rows.length / 2);

  return (
    <div className="relative min-h-screen w-full overflow-hidden font-body text-ink">
      <img
        src={stadium}
        alt=""
        width={1920}
        height={1200}
        className="absolute inset-0 z-0 size-full object-cover"
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a1626]/85 via-[#0c1c30]/70 to-[#0a1626]/90" />
      {accent && (
        <div
          className="absolute inset-0 z-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(120% 90% at 15% 0%, ${accent.color}bb, transparent 60%), radial-gradient(100% 80% at 90% 100%, ${accent.color}66, transparent 65%)`,
          }}
        />
      )}

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-5 lg:px-8">
        {/* Top bar */}
        <header className="mb-5 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-md bg-gold font-display text-lg font-bold leading-none text-frost">
              F
            </div>
            <div className="leading-none">
              <div className="font-display text-xl font-bold tracking-wide">
                FIELD<span className="text-gold">LINE</span>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
                Live CFB Tracker
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 outline-1 -outline-offset-1 outline-white/10 backdrop-blur-md">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-moss/70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-moss" />
              </span>
              <span className="font-mono text-xs text-ink">{liveCount} LIVE</span>
            </span>
            <span className="rounded-md bg-white/5 px-3 py-2 font-mono text-xs text-mute outline-1 -outline-offset-1 outline-white/10 backdrop-blur-md">
              {mounted ? rankings.data?.week || "AP TOP 25" : "AP TOP 25"}
            </span>
            <Link
              to="/stats"
              className="rounded-md bg-gold/15 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-gold outline-1 -outline-offset-1 outline-gold/30 backdrop-blur-md"
            >
              Team Stats
            </Link>
            {accent && (
              <button
                onClick={() => setAccent(null)}
                className="rounded-md bg-white/5 px-3 py-2 font-mono text-xs text-gold outline-1 -outline-offset-1 outline-white/10 backdrop-blur-md"
              >
                {accent.name} · clear
              </button>
            )}
          </div>
        </header>

        {/* Ticker */}
        <div className="mb-5 flex items-center gap-3 overflow-x-auto rounded-lg bg-white/5 px-4 py-2.5 outline-1 -outline-offset-1 outline-white/10 backdrop-blur-md">
          <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Now
          </span>
          <div className="flex items-center gap-4 whitespace-nowrap font-mono text-xs text-mute">
            {games.length === 0 && <span>No Top 25 matchups on the board right now.</span>}
            {games.slice(0, 12).map((g, i) => (
              <span key={g.id} className="flex items-center gap-4">
                {i > 0 && <span className="text-line">|</span>}
                <button onClick={() => setSelectedGameId(g.id)} className="hover:text-ink">
                  <b className="text-ink">
                    {g.away.abbr} {g.state === "pre" ? "" : g.away.score}
                  </b>{" "}
                  ·{" "}
                  <b className="text-ink">
                    {g.home.abbr} {g.state === "pre" ? "" : g.home.score}
                  </b>{" "}
                  <span className={g.state === "in" ? "text-clay" : "text-moss"}>
                    {clock(g.state, g)}
                  </span>
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Featured game strip */}
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-xl bg-white/5 p-5 outline-1 -outline-offset-1 outline-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="rounded bg-gold/15 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                Top 25 Matchup
              </span>
              <span className="font-mono text-xs text-clay">
                {featured ? clock(featured.state, featured) : "—"}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {featured ? (
                <>
                  <TeamLine
                    team={featured.away}
                    state={featured.state}
                    onSelect={setAccent}
                    following={following.includes(featured.away.id)}
                    onFollow={toggle}
                  />
                  <div className="h-px bg-white/10" />
                  <TeamLine
                    team={featured.home}
                    state={featured.state}
                    onSelect={setAccent}
                    following={following.includes(featured.home.id)}
                    onFollow={toggle}
                  />
                </>
              ) : (
                <p className="font-mono text-xs text-mute">
                  {board.isLoading ? "Loading the board…" : "No Top 25 matchups scheduled."}
                </p>
              )}
            </div>
            {(featured?.broadcasts?.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded bg-gold/15 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                  Where to watch
                </span>
                <span className="font-mono text-xs font-semibold text-ink">
                  {featured!.broadcasts.join(" · ")}
                </span>
                <span className="font-mono text-xs text-mute">
                  {[
                    featured!.state === "pre" ? kickoff(featured!.startTime) : featured!.detail,
                    featured!.venue,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 rounded-md bg-frost/60 px-3 py-2 font-mono text-xs uppercase text-mute">
              <span className="size-1.5 rounded-full bg-gold" />
              {featured?.situation ??
                featured?.detail ??
                (featured?.broadcast ? featured.broadcast : "Awaiting kickoff")}
            </div>
          </div>

          {/* Play-by-play */}
          <div className="rounded-xl bg-white/5 p-5 outline-1 -outline-offset-1 outline-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-wide">Play-by-Play</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
                {featured ? `${featured.away.name} vs ${featured.home.name}` : "—"}
              </span>
            </div>
            <div className="mt-3 max-h-[320px] space-y-0 overflow-y-auto">
              {(pbp.data?.plays ?? []).length === 0 && (
                <p className="py-2.5 font-mono text-xs text-mute">
                  {pbp.isFetching ? "Pulling the drive chart…" : "No plays logged yet."}
                </p>
              )}
              {(pbp.data?.plays ?? []).map((p) => (
                <div key={p.id} className="flex gap-3 border-b border-white/10 py-2.5 last:border-0">
                  <span
                    className={`w-14 shrink-0 font-mono text-xs ${p.scoring ? "text-gold" : "text-mute"}`}
                  >
                    Q{p.period} {p.clock}
                  </span>
                  <p className="text-sm">
                    <span className={p.scoring ? "text-ink" : "text-ink/85"}>{p.text}</span>{" "}
                    <span className="text-mute">
                      {featured?.away.abbr} {p.awayScore} · {featured?.home.abbr} {p.homeScore}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active rankings */}
        <div className="rounded-xl bg-white/5 p-5 outline-1 -outline-offset-1 outline-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-wide">Active Top 25</h2>
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-moss/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-moss" />
                </span>
                {rankings.data?.poll ?? "AP Top 25"} · {following.length} followed · auto-updating
              </p>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-moss" />
                Up
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-clay" />
                Down
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-gold" />
                Followed
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-0 lg:grid-cols-2">
            {[rows.slice(0, half), rows.slice(half)].map((col, i) => (
              <div key={i} className="divide-y divide-white/10">
                {col.map((r) => (
                  <RankLine
                    key={r.teamId + r.rank}
                    row={r}
                    following={following.includes(r.teamId)}
                    onFollow={toggle}
                    onSelect={setAccent}
                    onOpen={() => {
                      const g = games.find(
                        (x) => x.home.id === r.teamId || x.away.id === r.teamId,
                      );
                      if (g) setSelectedGameId(g.id);
                    }}
                  />
                ))}
                {col.length === 0 && (
                  <p className="py-2.5 font-mono text-xs text-mute">Loading rankings…</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamLine({
  team,
  state,
  onSelect,
  following,
  onFollow,
}: {
  team: GameTeam;
  state: Game["state"];
  onSelect: (a: { name: string; color: string }) => void;
  following: boolean;
  onFollow: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Link
        to="/team/$teamId"
        params={{ teamId: team.id }}
        className="flex items-center gap-3 text-left"
        onClick={() => onSelect({ name: team.name, color: team.color })}
      >
        <div
          className="grid size-10 place-items-center rounded-md font-display font-bold"
          style={{ backgroundColor: `${team.color}33`, color: team.color }}
        >
          {team.logo ? (
            <img src={team.logo} alt="" width={28} height={28} className="size-7" />
          ) : (
            team.abbr
          )}
        </div>
        <div>
          <div className="font-display text-lg font-semibold leading-none">{team.name}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-mute">
            {team.record}
            {team.rank ? ` · #${team.rank}` : ""}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onFollow(team.id)}
          aria-label={following ? "Unfollow team" : "Follow team"}
          className={`font-mono text-sm ${following ? "text-gold" : "text-mute hover:text-ink"}`}
        >
          {following ? "★" : "☆"}
        </button>
        <div className="font-mono text-4xl font-semibold text-ink">
          {state === "pre" ? "–" : team.score}
        </div>
      </div>
    </div>
  );
}

function RankLine({
  row,
  following,
  onFollow,
  onSelect,
  onOpen,
}: {
  row: RankRow;
  following: boolean;
  onFollow: (id: string) => void;
  onSelect: (a: { name: string; color: string }) => void;
  onOpen: () => void;
}) {
  const trend = row.trend === "-" ? "—" : row.trend;
  const tone = trend.startsWith("+") ? "text-moss" : trend.startsWith("-") ? "text-clay" : "text-mute";
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-7 font-mono text-sm font-semibold text-ink">{row.rank}</span>
      <span className={`font-mono text-xs ${tone}`}>
        {trend.startsWith("+") ? `▲${trend.slice(1)}` : trend.startsWith("-") ? `▼${trend.slice(1)}` : "—"}
      </span>
      <Link
        to="/team/$teamId"
        params={{ teamId: row.teamId }}
        className="flex flex-1 items-center gap-3 text-left"
        onClick={() => {
          onSelect({ name: row.name, color: row.color });
          onOpen();
        }}
      >
        <div
          className="grid size-8 place-items-center rounded font-display text-sm font-bold"
          style={{ backgroundColor: `${row.color}33`, color: row.color }}
        >
          {row.logo ? (
            <img src={row.logo} alt="" width={22} height={22} className="size-[22px]" />
          ) : (
            row.abbr
          )}
        </div>
        <span className="font-display text-base font-medium">{row.name}</span>
      </Link>
      <span className="font-mono text-xs text-mute">{row.record}</span>
      <button
        onClick={() => onFollow(row.teamId)}
        aria-label={following ? "Unfollow team" : "Follow team"}
        className={`font-mono text-sm ${following ? "text-gold" : "text-mute hover:text-ink"}`}
      >
        {following ? "★" : "☆"}
      </button>
    </div>
  );
}
