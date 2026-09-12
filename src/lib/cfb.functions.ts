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
  color: string;
};

export type GameTeam = {
  id: string;
  abbr: string;
  name: string;
  score: number;
  record: string;
  rank: number | null;
  logo: string | null;
  color: string;
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

const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
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
      color: `#${(r.team?.color ?? "7FC2E6").replace("#", "")}`,
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
            color: `#${(comp.team?.color ?? "7FC2E6").replace("#", "")}`,
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

async function fetchPlays(eventId: string): Promise<Play[]> {
  const summary = await getJson(`${BASE}/summary?event=${encodeURIComponent(eventId)}`);
  const drives = summary?.drives ?? {};
  const all: any[] = [
    ...(drives.previous ?? []).flatMap((d: any) => d.plays ?? []),
    ...(drives.current?.plays ?? []),
  ];
  return all
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
    .reverse();
}

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

export type TeamColors = {
  id: string;
  name: string;
  fullName: string;
  abbr: string;
  logo: string | null;
  primary: string;
  secondary: string;
  record: string;
  rank: number | null;
  score: number | null;
};

export type TeamDetail = {
  team: TeamColors;
  opponent: TeamColors | null;
  eventId: string | null;
  eventName: string;
  date: string;
  state: "pre" | "in" | "post";
  detail: string;
  homeId: string | null;
  broadcast: string | null;
  venue: string | null;
  plays: Play[];
  error: string | null;
};

function hex(v: any, fallback: string) {
  const s = typeof v === "string" && v.trim() ? v.replace("#", "") : fallback;
  return `#${s}`;
}

async function teamColors(id: string) {
  try {
    const d = await getJson(`${BASE}/teams/${encodeURIComponent(id)}`);
    const t = d?.team;
    return {
      primary: hex(t?.color, "1f6feb"),
      secondary: hex(t?.alternateColor, "ffffff"),
      fullName: t?.displayName ?? "",
    };
  } catch {
    return { primary: "#1f6feb", secondary: "#ffffff", fullName: "" };
  }
}

export const getTeamDetail = createServerFn({ method: "GET" })
  .inputValidator((data: { teamId: string }) => {
    if (!data?.teamId) throw new Error("teamId required");
    return { teamId: String(data.teamId) };
  })
  .handler(async ({ data }): Promise<TeamDetail> => {
    const base: TeamColors = {
      id: data.teamId,
      name: "",
      fullName: "",
      abbr: "",
      logo: null,
      primary: "#1f6feb",
      secondary: "#ffffff",
      record: "",
      rank: null,
      score: null,
    };
    try {
      const [teamRes, schedRes] = await Promise.all([
        getJson(`${BASE}/teams/${encodeURIComponent(data.teamId)}`),
        getJson(`${BASE}/teams/${encodeURIComponent(data.teamId)}/schedule`),
      ]);
      const t = teamRes?.team;
      const me: TeamColors = {
        ...base,
        name: t?.shortDisplayName ?? t?.nickname ?? t?.location ?? "Team",
        fullName: t?.displayName ?? "",
        abbr: t?.abbreviation ?? "",
        logo: t?.logos?.[0]?.href ?? null,
        primary: hex(t?.color, "1f6feb"),
        secondary: hex(t?.alternateColor, "ffffff"),
        record: t?.record?.items?.[0]?.summary ?? "",
        rank: typeof t?.rank === "number" && t.rank > 0 && t.rank <= 25 ? t.rank : null,
      };

      const events: any[] = schedRes?.events ?? [];
      const live = events.find((e) => e?.competitions?.[0]?.status?.type?.state === "in");
      const played = [...events]
        .filter((e) => e?.competitions?.[0]?.status?.type?.state === "post")
        .pop();
      const next = events.find((e) => e?.competitions?.[0]?.status?.type?.state === "pre");
      const event = live ?? played ?? next ?? null;

      if (!event) {
        return {
          team: me,
          opponent: null,
          eventId: null,
          eventName: "",
          date: "",
          state: "pre",
          detail: "No games scheduled",
          homeId: null,
          broadcast: null,
          venue: null,
          plays: [],
          error: null,
        };
      }

      const c = event.competitions?.[0];
      const mine = c?.competitors?.find((x: any) => String(x.team?.id) === data.teamId);
      const other = c?.competitors?.find((x: any) => String(x.team?.id) !== data.teamId);
      const oTeam = other?.team;
      const oColors = oTeam?.id ? await teamColors(String(oTeam.id)) : null;
      const opponent: TeamColors | null = oTeam
        ? {
            id: String(oTeam.id),
            name: oTeam.shortDisplayName ?? oTeam.nickname ?? oTeam.location ?? "",
            fullName: oColors?.fullName || oTeam.displayName || "",
            abbr: oTeam.abbreviation ?? "",
            logo: oTeam.logos?.[0]?.href ?? null,
            primary: oColors?.primary ?? "#1f6feb",
            secondary: oColors?.secondary ?? "#ffffff",
            record: other?.record?.[0]?.displayValue ?? "",
            rank: typeof other?.curatedRank?.current === "number" && other.curatedRank.current <= 25
              ? other.curatedRank.current
              : null,
            score: other?.score?.value ?? null,
          }
        : null;

      me.score = mine?.score?.value ?? null;
      const state = (c?.status?.type?.state ?? "pre") as TeamDetail["state"];

      let plays: Play[] = [];
      if (state !== "pre") {
        plays = await fetchPlays(String(event.id));
      }

      return {
        team: me,
        opponent,
        eventId: String(event.id),
        eventName: event.name ?? "",
        date: event.date ?? "",
        state,
        detail: c?.status?.type?.shortDetail ?? "",
        homeId: c?.competitors?.find((x: any) => x.homeAway === "home")?.team?.id
          ? String(c.competitors.find((x: any) => x.homeAway === "home").team.id)
          : null,
        broadcast: c?.broadcasts?.[0]?.media?.shortName ?? null,
        venue: c?.venue?.fullName ?? null,
        plays,
        error: null,
      };
    } catch (e) {
      return {
        team: base,
        opponent: null,
        eventId: null,
        eventName: "",
        date: "",
        state: "pre",
        detail: "",
        homeId: null,
        broadcast: null,
        venue: null,
        plays: [],
        error: (e as Error).message,
      };
    }
  });
