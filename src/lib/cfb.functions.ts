import { createServerFn } from "@tanstack/react-start";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/football/college-football";

export type RankRow = {
  rank: number;
  teamId: string;
  name: string;
  abbr: string;
  record: string;
  trend: string;
  logo: string | null;
};

export type GameTeam = {
  id: string;
  abbr: string;
  name: string;
  score: number;
  record: string;
  rank: number | null;
  logo: string | null;
};

export type Game = {
  id: string;
  state: "pre" | "in" | "post";
  detail: string;
  clock: string;
  period: number;
  situation: string | null;
  possessionId: string | null;
  broadcast: string | null;
  home: GameTeam;
  away: GameTeam;
};

export type Play = {
  id: string;
  text: string;
  clock: string;
  period: number;
  scoring: boolean;
  awayScore: number;
  homeScore: number;
  teamId: string | null;
};

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Feed unavailable (${res.status})`);
  return res.json();
}

function pickLogo(t: any): string | null {
  if (typeof t?.logo === "string") return t.logo;
  const l = t?.logos?.[0]?.href;
  return typeof l === "string" ? l : null;
}

export const getRankings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await getJson(`${BASE}/rankings`);
    const poll =
      data?.rankings?.find((r: any) => r?.shortName === "AP Top 25" || r?.name === "AP Top 25") ??
      data?.rankings?.[0];
    const rows: RankRow[] = (poll?.ranks ?? []).slice(0, 25).map((r: any) => ({
      rank: r.current,
      teamId: String(r.team?.id ?? ""),
      name: r.team?.nickname ?? r.team?.location ?? "—",
      abbr: r.team?.abbreviation ?? "",
      record: r.recordSummary ?? "",
      trend: r.trend ?? "-",
      logo: pickLogo(r.team),
    }));
    return {
      poll: poll?.name ?? "AP Top 25",
      week: data?.latestWeek?.displayName ?? poll?.occurrence?.displayValue ?? "",
      rows,
      error: null as string | null,
    };
  } catch (e) {
    return { poll: "AP Top 25", week: "", rows: [] as RankRow[], error: (e as Error).message };
  }
});

export const getRankedGames = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const data = await getJson(`${BASE}/scoreboard?groups=80&limit=200`);
    const games: Game[] = (data?.events ?? [])
      .map((e: any) => {
        const c = e?.competitions?.[0];
        if (!c) return null;
        const mk = (side: string): GameTeam | null => {
          const comp = c.competitors?.find((x: any) => x.homeAway === side);
          if (!comp) return null;
          const rank = comp.curatedRank?.current;
          return {
            id: String(comp.team?.id ?? ""),
            abbr: comp.team?.abbreviation ?? "",
            name: comp.team?.shortDisplayName ?? comp.team?.location ?? "",
            score: Number(comp.score ?? 0),
            record: comp.records?.[0]?.summary ?? "",
            rank: typeof rank === "number" && rank > 0 && rank <= 25 ? rank : null,
            logo: pickLogo(comp.team),
          };
        };
        const home = mk("home");
        const away = mk("away");
        if (!home || !away) return null;
        const st = c.status?.type;
        const sit = c.situation;
        return {
          id: String(e.id),
          state: (st?.state ?? "pre") as Game["state"],
          detail: st?.shortDetail ?? "",
          clock: c.status?.displayClock ?? "",
          period: c.status?.period ?? 0,
          situation: sit?.downDistanceText
            ? `${sit.downDistanceText}${sit.possessionText ? ` at ${sit.possessionText}` : ""}`
            : null,
          possessionId: sit?.possession ? String(sit.possession) : null,
          broadcast: c.broadcasts?.[0]?.names?.[0] ?? null,
          home,
          away,
        } as Game;
      })
      .filter(Boolean)
      .filter((g: Game) => g.home.rank !== null || g.away.rank !== null);

    const order = { in: 0, pre: 1, post: 2 } as const;
    games.sort((a, b) => {
      if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state];
      const ra = Math.min(a.home.rank ?? 99, a.away.rank ?? 99);
      const rb = Math.min(b.home.rank ?? 99, b.away.rank ?? 99);
      return ra - rb;
    });
    return { games, error: null as string | null };
  } catch (e) {
    return { games: [] as Game[], error: (e as Error).message };
  }
});

export const getPlayByPlay = createServerFn({ method: "GET" })
  .inputValidator((data: { eventId: string }) => {
    if (!data?.eventId) throw new Error("eventId required");
    return { eventId: String(data.eventId) };
  })
  .handler(async ({ data }) => {
    try {
      const summary = await getJson(`${BASE}/summary?event=${encodeURIComponent(data.eventId)}`);
      const drives = summary?.drives ?? {};
      const all: any[] = [
        ...(drives.previous ?? []).flatMap((d: any) => d.plays ?? []),
        ...(drives.current?.plays ?? []),
      ];
      const plays: Play[] = all
        .map((p: any) => ({
          id: String(p.id ?? `${p.sequenceNumber}`),
          text: p.text ?? p.type?.text ?? "",
          clock: p.clock?.displayValue ?? "",
          period: p.period?.number ?? 0,
          scoring: Boolean(p.scoringPlay),
          awayScore: Number(p.awayScore ?? 0),
          homeScore: Number(p.homeScore ?? 0),
          teamId: p.start?.team?.id ? String(p.start.team.id) : null,
        }))
        .filter((p) => p.text)
        .reverse()
        .slice(0, 40);
      return { plays, error: null as string | null };
    } catch (e) {
      return { plays: [] as Play[], error: (e as Error).message };
    }
  });
