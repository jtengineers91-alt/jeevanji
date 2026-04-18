// IPL Standings edge function.
// Modes:
//   - GET (default): returns standings from `ipl_standings_cache` (admin-managed).
//   - POST { action: "sync", season }: scrapes ESPN live and upserts cache. Admin only.
//   - GET ?live=1: bypasses cache and fetches ESPN directly (read-only preview).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface StandingRow {
  shortName: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  points: number;
  nrr: number;
  form: ("W" | "L" | "N")[];
}

const TEAM_SHORT: Record<string, string> = {
  "Mumbai Indians": "MI",
  "Chennai Super Kings": "CSK",
  "Royal Challengers Bengaluru": "RCB",
  "Royal Challengers Bangalore": "RCB",
  "Kolkata Knight Riders": "KKR",
  "Gujarat Titans": "GT",
  "Sunrisers Hyderabad": "SRH",
  "Rajasthan Royals": "RR",
  "Delhi Capitals": "DC",
  "Lucknow Super Giants": "LSG",
  "Punjab Kings": "PBKS",
};

const SEASON_TO_ESPN_TROPHY: Record<string, string> = {
  "2026": "16527",
  "2025": "16415",
  "2024": "15940",
};

// ---------- ESPN scoreboard JSON (preferred) ----------
async function fetchFromEspnJson(season: string): Promise<StandingRow[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/standings?season=${season}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 JeevanGames/1.0" } });
    if (!res.ok) return [];
    const json = await res.json();
    const groups = json?.children || [];
    const entries =
      Array.isArray(groups) && groups[0]?.standings?.entries
        ? groups[0].standings.entries
        : json?.standings?.entries || [];
    if (!Array.isArray(entries) || entries.length === 0) return [];

    const rows: StandingRow[] = [];
    for (const e of entries) {
      const teamName = e?.team?.displayName || e?.team?.name || "";
      const stats = e?.stats || [];
      const get = (k: string) => {
        const s = stats.find((x: any) => x.name === k || x.type === k || x.abbreviation === k);
        return s ? Number(s.value) || 0 : 0;
      };
      const played = get("gamesPlayed") || get("played");
      if (!played) continue;
      rows.push({
        shortName: TEAM_SHORT[teamName] || teamName.slice(0, 3).toUpperCase(),
        played,
        won: get("wins") || get("won"),
        lost: get("losses") || get("lost"),
        noResult: get("ties") || get("noResult"),
        points: get("points"),
        nrr: get("netRunRate") || get("nrr"),
        form: [],
      });
    }
    return rows.filter((r) => r.played > 0);
  } catch (err) {
    console.error("ESPN JSON failed:", err);
    return [];
  }
}

// ---------- ESPN Cricinfo HTML scrape (fallback) ----------
async function fetchFromEspnHtml(trophyId: string): Promise<StandingRow[]> {
  const url = `https://stats.espncricinfo.com/ci/engine/records/team/team_standings.html?id=${trophyId};type=trophy`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; JeevanGames/1.0)" } });
    if (!res.ok) return [];
    const html = await res.text();
    if (/no records|no data|no results/i.test(html)) return [];

    const rowRegex = /<tr[^>]*class="data\d?"[^>]*>([\s\S]*?)<\/tr>/g;
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();

    const rows: StandingRow[] = [];
    let m: RegExpExecArray | null;
    while ((m = rowRegex.exec(html)) !== null) {
      const cells: string[] = [];
      let c: RegExpExecArray | null;
      cellRegex.lastIndex = 0;
      while ((c = cellRegex.exec(m[1])) !== null) cells.push(stripTags(c[1]));
      if (cells.length < 7) continue;
      const teamName = cells[0];
      rows.push({
        shortName: TEAM_SHORT[teamName] || teamName.slice(0, 3).toUpperCase(),
        played: parseInt(cells[1]) || 0,
        won: parseInt(cells[2]) || 0,
        lost: parseInt(cells[3]) || 0,
        noResult: parseInt(cells[5]) || 0,
        points: parseInt(cells[6]) || 0,
        nrr: parseFloat(cells[7]) || 0,
        form: [],
      });
    }
    return rows.filter((r) => r.played > 0);
  } catch (err) {
    console.error("ESPN HTML failed:", err);
    return [];
  }
}

async function fetchLiveStandings(season: string): Promise<{ rows: StandingRow[]; source: string | null }> {
  let rows = await fetchFromEspnJson(season);
  let source: string | null = rows.length ? "espn-json" : null;
  if (rows.length === 0) {
    const trophyId = SEASON_TO_ESPN_TROPHY[season];
    if (trophyId) {
      rows = await fetchFromEspnHtml(trophyId);
      source = rows.length ? "espn-html" : null;
    }
  }
  return { rows, source };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // Parse body for POST
    let body: any = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
    }
    const action = (body.action as string) || url.searchParams.get("action") || "read";
    const season = (body.season as string) || url.searchParams.get("season") || "2026";

    // ---------- SYNC (admin) ----------
    if (action === "sync") {
      // Verify caller is admin via JWT
      const authHeader = req.headers.get("Authorization") || "";
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (userErr || !userData?.user) {
        return new Response(JSON.stringify({ status: "error", message: "Not authenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleRow } = await userClient
        .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
      if (!roleRow) {
        return new Response(JSON.stringify({ status: "error", message: "Admin only" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { rows, source } = await fetchLiveStandings(season);
      if (rows.length === 0) {
        return new Response(JSON.stringify({
          status: "empty",
          message: `No live IPL ${season} data available yet from ESPN. Season may not have started.`,
          season, isLive: false, count: 0,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Sort by points then nrr to assign positions
      const sorted = [...rows].sort((a, b) => b.points - a.points || b.nrr - a.nrr);
      const admin = createClient(supabaseUrl, serviceKey);

      // Wipe existing rows for this season then insert fresh
      await admin.from("ipl_standings_cache").delete().eq("season", season);
      const upsertRows = sorted.map((r, idx) => ({
        season,
        short_name: r.shortName,
        played: r.played,
        won: r.won,
        lost: r.lost,
        no_result: r.noResult,
        points: r.points,
        nrr: r.nrr,
        form: r.form,
        position: idx + 1,
        last_synced_at: new Date().toISOString(),
        synced_by: userData.user.email || "admin",
        source,
      }));
      const { error: insErr } = await admin.from("ipl_standings_cache").insert(upsertRows);
      if (insErr) throw insErr;

      return new Response(JSON.stringify({
        status: "success", season, source, isLive: true, count: upsertRows.length,
        message: `Synced ${upsertRows.length} teams from ${source}`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---------- LIVE preview (no cache write) ----------
    if (action === "live" || url.searchParams.get("live") === "1") {
      const { rows, source } = await fetchLiveStandings(season);
      return new Response(JSON.stringify({
        status: "success", season, isLive: rows.length > 0, source, standings: rows,
        updatedAt: new Date().toISOString(),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ---------- READ from cache (default, public) ----------
    const publicClient = createClient(supabaseUrl, anonKey);
    const { data: cached } = await publicClient
      .from("ipl_standings_cache").select("*").eq("season", season).order("position", { ascending: true });

    const standings = (cached || []).map((r: any) => ({
      shortName: r.short_name,
      played: r.played, won: r.won, lost: r.lost,
      noResult: r.no_result, points: r.points, nrr: Number(r.nrr) || 0,
      form: Array.isArray(r.form) ? r.form : [],
    }));
    const lastSyncedAt = cached?.[0]?.last_synced_at || null;

    return new Response(JSON.stringify({
      status: "success", season,
      isLive: standings.length > 0,
      source: cached?.[0]?.source || null,
      lastSyncedAt,
      updatedAt: new Date().toISOString(),
      standings,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
      isLive: false, standings: [],
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
