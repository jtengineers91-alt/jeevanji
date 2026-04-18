// Sync cricket_matches table with live ESPN scoreboard data so dates/times
// shown across all games match the actual live schedule.
// Admin only: POST { season?: string, days?: number }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ESPN_ENDPOINTS = [
  { url: "https://site.api.espn.com/apis/site/v2/sports/cricket/8048/scoreboard", type: "ipl" },
  { url: "https://site.api.espn.com/apis/site/v2/sports/cricket/8039/scoreboard", type: "international" },
];

interface IncomingMatch {
  external_id: string;
  team_a: string;
  team_b: string;
  match_date: string; // ISO UTC
  venue: string | null;
  status: "upcoming" | "live" | "completed";
  match_type: string;
}

function mapState(state: string | undefined): "upcoming" | "live" | "completed" {
  if (state === "in" || state === "live") return "live";
  if (state === "post") return "completed";
  return "upcoming";
}

async function fetchEspnEvents(): Promise<IncomingMatch[]> {
  const out: IncomingMatch[] = [];
  for (const ep of ESPN_ENDPOINTS) {
    try {
      const res = await fetch(ep.url, { headers: { "User-Agent": "Mozilla/5.0 JeevanGames/1.0" } });
      if (!res.ok) continue;
      const json = await res.json();
      const events = json?.events || [];
      for (const e of events) {
        const comp = (e.competitions || [])[0];
        if (!comp) continue;
        const teams = (comp.competitors || []).map(
          (c: any) => c.team?.displayName || c.team?.shortDisplayName || "Unknown"
        );
        if (teams.length < 2) continue;
        const date = e.date;
        if (!date) continue;
        out.push({
          external_id: String(e.id || `${teams[0]}-${teams[1]}-${date}`),
          team_a: teams[0],
          team_b: teams[1],
          match_date: new Date(date).toISOString(),
          venue: comp.venue?.fullName || comp.venue?.address?.city || null,
          status: mapState(e.status?.type?.state),
          match_type: ep.type,
        });
      }
    } catch (err) {
      console.error("ESPN fetch failed:", ep.url, err);
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // Verify admin
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

    const incoming = await fetchEspnEvents();
    if (incoming.length === 0) {
      return new Response(JSON.stringify({
        status: "empty", message: "No matches available from ESPN right now.", count: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Pull existing matches in the time window we care about (next/prev 30 days)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await admin
      .from("cricket_matches")
      .select("id, team_a, team_b, match_date")
      .gte("match_date", since);

    let inserted = 0;
    let updated = 0;

    for (const m of incoming) {
      // Match by team pair (either order) within ±2 days of incoming time
      const incomingTime = new Date(m.match_date).getTime();
      const dupe = (existing || []).find((x: any) => {
        const tA = (x.team_a || "").toLowerCase();
        const tB = (x.team_b || "").toLowerCase();
        const mA = m.team_a.toLowerCase();
        const mB = m.team_b.toLowerCase();
        const samePair = (tA === mA && tB === mB) || (tA === mB && tB === mA);
        if (!samePair) return false;
        const diff = Math.abs(new Date(x.match_date).getTime() - incomingTime);
        return diff < 2 * 24 * 60 * 60 * 1000;
      });

      if (dupe) {
        await admin.from("cricket_matches").update({
          match_date: m.match_date,
          venue: m.venue,
          status: m.status,
          match_type: m.match_type,
          updated_at: new Date().toISOString(),
        }).eq("id", dupe.id);
        updated++;
      } else {
        await admin.from("cricket_matches").insert({
          team_a: m.team_a,
          team_b: m.team_b,
          match_date: m.match_date,
          venue: m.venue,
          status: m.status,
          match_type: m.match_type,
        });
        inserted++;
      }
    }

    return new Response(JSON.stringify({
      status: "success",
      message: `Synced ${incoming.length} matches from ESPN (${inserted} new, ${updated} updated)`,
      count: incoming.length, inserted, updated,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("sync-cricket-matches error:", err);
    return new Response(JSON.stringify({
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
