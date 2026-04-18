import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trophy, RefreshCw, CheckCircle2, AlertTriangle, Save, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface Row {
  id?: string;
  short_name: string;
  played: number;
  won: number;
  lost: number;
  no_result: number;
  points: number;
  nrr: number;
  position: number;
}

const SEASONS = ["2026", "2025", "2024"];
const TEAMS = ["MI", "CSK", "RCB", "KKR", "GT", "SRH", "RR", "DC", "LSG", "PBKS"];

const AdminIPLStandings = () => {
  const [season, setSeason] = useState("2026");
  const [rows, setRows] = useState<Row[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ipl_standings_cache" as any)
      .select("*")
      .eq("season", season)
      .order("position", { ascending: true });
    const list = (data || []) as any[];
    setRows(
      list.map((r) => ({
        id: r.id,
        short_name: r.short_name,
        played: r.played,
        won: r.won,
        lost: r.lost,
        no_result: r.no_result,
        points: r.points,
        nrr: Number(r.nrr) || 0,
        position: r.position,
      }))
    );
    setLastSync(list[0]?.last_synced_at || null);
    setSource(list[0]?.source || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [season]);

  const syncLive = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ipl-standings", {
        body: { action: "sync", season },
      });
      if (error) throw error;
      if (data?.status === "empty") {
        toast.warning(data.message || "No live data yet — IPL season may not have started.");
      } else if (data?.status === "success") {
        toast.success(data.message || `Synced ${data.count} teams`);
        await load();
      } else {
        toast.error(data?.message || "Sync failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const updateRow = (idx: number, key: keyof Row, val: any) => {
    setRows((prev) => {
      const next = [...prev];
      (next[idx] as any)[key] = key === "short_name" ? val : Number(val) || 0;
      return next;
    });
  };

  const saveRow = async (row: Row) => {
    if (!row.short_name) return toast.error("Pick a team");
    const payload: any = {
      season,
      short_name: row.short_name,
      played: row.played, won: row.won, lost: row.lost,
      no_result: row.no_result, points: row.points,
      nrr: row.nrr, position: row.position,
      last_synced_at: new Date().toISOString(),
      synced_by: "manual-admin",
      source: "manual",
    };
    if (row.id) {
      const { error } = await supabase.from("ipl_standings_cache" as any).update(payload).eq("id", row.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("ipl_standings_cache" as any).insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success(`Saved ${row.short_name}`);
    load();
  };

  const deleteRow = async (row: Row) => {
    if (!row.id) return;
    if (!confirm(`Delete ${row.short_name}?`)) return;
    const { error } = await supabase.from("ipl_standings_cache" as any).delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        short_name: "",
        played: 0, won: 0, lost: 0, no_result: 0,
        points: 0, nrr: 0,
        position: prev.length + 1,
      },
    ]);
  };

  const wipeSeason = async () => {
    if (!confirm(`Delete ALL ${season} standings? This can't be undone.`)) return;
    const { error } = await supabase.from("ipl_standings_cache" as any).delete().eq("season", season);
    if (error) return toast.error(error.message);
    toast.success("Cleared");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-gold" />
            IPL Points Table — Live Sync
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pull live IPL {season} standings from ESPN, then edit any row manually if needed. The public Points Table page reads from this data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={season} onValueChange={setSeason}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEASONS.map((s) => <SelectItem key={s} value={s}>IPL {s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={syncLive} disabled={syncing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Live from ESPN"}
          </Button>
        </div>
      </div>

      {/* Status card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
        <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {rows.length > 0 ? (
              <CheckCircle2 className="h-8 w-8 text-primary" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-gold" />
            )}
            <div>
              <p className="font-display font-bold">
                {rows.length > 0
                  ? `${rows.length} teams in cache for IPL ${season}`
                  : `No standings stored for IPL ${season}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastSync ? `Last synced: ${format(new Date(lastSync), "PPp")}` : "Never synced"}
                {source && <span className="ml-2"><Badge variant="outline">{source}</Badge></span>}
              </p>
            </div>
          </div>
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={wipeSeason} className="gap-2 text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Clear {season}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Editable table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Manual Edit</CardTitle>
          <Button size="sm" variant="outline" onClick={addRow} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Row
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No rows yet. Click <b>Sync Live from ESPN</b> above to auto-populate, or <b>Add Row</b> to add manually.
            </p>
          ) : (
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="text-left border-b border-border/40 text-muted-foreground">
                  <th className="py-2 pr-2">Pos</th>
                  <th className="py-2 pr-2">Team</th>
                  <th className="py-2 pr-2">P</th>
                  <th className="py-2 pr-2">W</th>
                  <th className="py-2 pr-2">L</th>
                  <th className="py-2 pr-2">NR</th>
                  <th className="py-2 pr-2">Pts</th>
                  <th className="py-2 pr-2">NRR</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id || i} className="border-b border-border/20">
                    <td className="py-1.5 pr-2">
                      <Input className="h-8 w-14" type="number" value={row.position}
                             onChange={(e) => updateRow(i, "position", e.target.value)} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <Select value={row.short_name} onValueChange={(v) => updateRow(i, "short_name", v)}>
                        <SelectTrigger className="h-8 w-24"><SelectValue placeholder="Team" /></SelectTrigger>
                        <SelectContent>
                          {TEAMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    {(["played", "won", "lost", "no_result", "points"] as const).map((k) => (
                      <td key={k} className="py-1.5 pr-2">
                        <Input className="h-8 w-14" type="number" value={(row as any)[k]}
                               onChange={(e) => updateRow(i, k, e.target.value)} />
                      </td>
                    ))}
                    <td className="py-1.5 pr-2">
                      <Input className="h-8 w-20" type="number" step="0.01" value={row.nrr}
                             onChange={(e) => updateRow(i, "nrr", e.target.value)} />
                    </td>
                    <td className="py-1.5 flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => saveRow(row)} className="h-8 px-2">
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteRow(row)}
                              className="h-8 px-2 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminIPLStandings;
