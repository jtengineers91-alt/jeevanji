import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Plus, Trash2, Users, Trophy, Star, Award, Radio, Download, Settings, Eye, EyeOff, RefreshCw, Loader2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { IPL_TEAMS } from "@/lib/ipl-teams";
import { formatINRWords } from "@/lib/format-inr";
import { formatMatchIST, formatDateIST } from "@/lib/format-date";

// Cast to any since fantasy tables aren't in generated types yet
const db = supabase as any;
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const AdminFantasy = () => {
  const [contests, setContests] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Live scores
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveScoresEnabled, setLiveScoresEnabled] = useState(true);
  const [importingMatch, setImportingMatch] = useState<string | null>(null);

  // New contest form
  const [matchId, setMatchId] = useState("");
  const [title, setTitle] = useState("");
  const [entryFee, setEntryFee] = useState("50");
  const [maxPart, setMaxPart] = useState("100");
  const [prizePool, setPrizePool] = useState("5000");
  const [numWinners, setNumWinners] = useState("10");

  // New player form
  const [pMatchId, setPMatchId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerTeam, setPlayerTeam] = useState("");
  const [playerRole, setPlayerRole] = useState("batsman");
  const [playerCredits, setPlayerCredits] = useState("8.0");

  // Points assignment
  const [selectedContestId, setSelectedContestId] = useState("");

  // Squad fetch loading states
  const [fetchingA, setFetchingA] = useState(false);
  const [fetchingB, setFetchingB] = useState(false);

  // Edit player
  const [editPlayer, setEditPlayer] = useState<any>(null);
  const [editForm, setEditForm] = useState({ player_name: "", team: "", role: "batsman", credits: "8.0", image_url: "" });

  // Fantasy settings
  const [fantasyConfig, setFantasyConfig] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState({
    min_entry_fee: "10",
    max_entry_fee: "5000",
    default_max_participants: "100",
    commission_percent: "10",
    prize_distribution: "[{\"rank\":1,\"percent\":40},{\"rank\":2,\"percent\":25},{\"rank\":3,\"percent\":15},{\"rank\":4,\"percent\":8},{\"rank\":5,\"percent\":5},{\"rank\":6,\"percent\":3},{\"rank\":7,\"percent\":2},{\"rank\":8,\"percent\":1},{\"rank\":9,\"percent\":0.5},{\"rank\":10,\"percent\":0.5}]",
  });

  useEffect(() => {
    fetchAll();
    fetchLiveScoresConfig();
  }, []);

  const fetchAll = async () => {
    const [{ data: c }, { data: m }, { data: p }] = await Promise.all([
      db.from("fantasy_contests").select("*, cricket_matches(team_a, team_b, match_date)").order("created_at", { ascending: false }),
      db.from("cricket_matches").select("*").order("match_date", { ascending: false }),
      db.from("fantasy_players").select("*, cricket_matches(team_a, team_b)").order("created_at", { ascending: false }),
    ]);
    // Sort contests: upcoming first (by match_date), then live, then completed
    const sorted = (c || []).sort((a: any, b: any) => {
      const order: Record<string, number> = { upcoming: 0, live: 1, completed: 2 };
      const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
      if (diff !== 0) return diff;
      const dA = new Date(a.cricket_matches?.match_date || 0).getTime();
      const dB = new Date(b.cricket_matches?.match_date || 0).getTime();
      return a.status === "completed" ? dB - dA : dA - dB;
    });
    setContests(sorted);
    setMatches(m || []);
    setPlayers(p || []);
  };

  const fetchLiveScoresConfig = async () => {
    const { data } = await db.from("game_configs").select("*").eq("game_type", "fantasy").single();
    if (data) {
      setFantasyConfig(data);
      const settings = data.settings || {};
      setLiveScoresEnabled(settings.live_scores_enabled !== false);
      setSettingsForm({
        min_entry_fee: String(settings.min_entry_fee || 10),
        max_entry_fee: String(settings.max_entry_fee || 5000),
        default_max_participants: String(settings.default_max_participants || 100),
        commission_percent: String(data.commission_percent || 10),
        prize_distribution: JSON.stringify(settings.prize_distribution || [
          { rank: 1, percent: 40 }, { rank: 2, percent: 25 }, { rank: 3, percent: 15 },
          { rank: 4, percent: 8 }, { rank: 5, percent: 5 }, { rank: 6, percent: 3 },
          { rank: 7, percent: 2 }, { rank: 8, percent: 1 }, { rank: 9, percent: 0.5 }, { rank: 10, percent: 0.5 },
        ]),
      });
    }
  };

  const toggleLiveScores = async (enabled: boolean) => {
    setLiveScoresEnabled(enabled);
    if (fantasyConfig) {
      const settings = { ...(fantasyConfig.settings || {}), live_scores_enabled: enabled };
      await db.from("game_configs").update({ settings }).eq("id", fantasyConfig.id);
      toast.success(enabled ? "Live scores enabled" : "Live scores disabled");
      fetchLiveScoresConfig();
    }
  };

  const fetchLiveMatches = async () => {
    setLiveLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cricket-scores");
      if (error) throw error;
      if (data?.status === "success") {
        setLiveMatches(data.data || []);
      } else {
        toast.error("Failed to fetch live matches");
      }
    } catch {
      toast.error("Error fetching live scores");
    } finally {
      setLiveLoading(false);
    }
  };

  const importMatchFromAPI = async (liveMatch: any) => {
    setImportingMatch(liveMatch.id);
    try {
      const teamA = liveMatch.teams?.[0] || "Team A";
      const teamB = liveMatch.teams?.[1] || "Team B";

      // Check if already imported
      const { data: existing } = await db.from("cricket_matches")
        .select("id")
        .eq("team_a", teamA)
        .eq("team_b", teamB)
        .gte("match_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (existing && existing.length > 0) {
        toast.info("Match already exists in database");
        setImportingMatch(null);
        return;
      }

      await db.from("cricket_matches").insert({
        team_a: teamA,
        team_b: teamB,
        match_date: new Date().toISOString(),
        venue: liveMatch.venue || "",
        match_type: liveMatch.matchType || "international",
        status: liveMatch.matchEnded ? "completed" : liveMatch.matchStarted ? "live" : "upcoming",
      });
      toast.success(`Imported: ${teamA} vs ${teamB}`);
      fetchAll();
    } catch {
      toast.error("Failed to import match");
    } finally {
      setImportingMatch(null);
    }
  };

  const saveFantasySettings = async () => {
    if (!fantasyConfig) return;
    try {
      const parsedPrize = JSON.parse(settingsForm.prize_distribution);
      const totalPercent = parsedPrize.reduce((s: number, p: any) => s + p.percent, 0);
      if (totalPercent > 100) return toast.error("Prize distribution exceeds 100%");

      const settings = {
        ...(fantasyConfig.settings || {}),
        live_scores_enabled: liveScoresEnabled,
        min_entry_fee: parseInt(settingsForm.min_entry_fee),
        max_entry_fee: parseInt(settingsForm.max_entry_fee),
        default_max_participants: parseInt(settingsForm.default_max_participants),
        prize_distribution: parsedPrize,
      };
      await db.from("game_configs").update({
        settings,
        commission_percent: parseFloat(settingsForm.commission_percent),
      }).eq("id", fantasyConfig.id);
      toast.success("Settings saved!");
      fetchLiveScoresConfig();
    } catch {
      toast.error("Invalid prize distribution JSON");
    }
  };

  const createContest = async () => {
    if (!matchId || !title) return toast.error("Fill match and title");
    const { data: { user } } = await db.auth.getUser();
    const winners = parseInt(numWinners) || 10;
    // Auto-generate prize distribution based on number of winners
    const distribution = [];
    const percents = winners === 1 ? [100] :
      winners === 2 ? [60, 40] :
      winners === 3 ? [50, 30, 20] :
      winners <= 5 ? [35, 25, 18, 12, 10] :
      Array.from({ length: winners }, (_, i) => {
        if (i === 0) return 30;
        if (i === 1) return 20;
        if (i === 2) return 15;
        return Math.max(1, Math.round(35 / (winners - 3)));
      });
    // Normalize to 100%
    const total = percents.reduce((s, v) => s + v, 0);
    for (let i = 0; i < winners; i++) {
      distribution.push({ rank: i + 1, percent: Math.round((percents[i] / total) * 100 * 10) / 10 });
    }
    await db.from("fantasy_contests").insert({
      match_id: matchId,
      title,
      entry_fee: parseInt(entryFee) || 50,
      prize_pool: parseInt(prizePool) || 5000,
      max_participants: parseInt(maxPart) || 100,
      created_by: user?.email || "admin",
      prize_distribution: distribution,
    });
    toast.success("Contest created!");
    setTitle(""); setEntryFee("50"); setMaxPart("100"); setPrizePool("5000"); setNumWinners("10");
    fetchAll();
  };

  const addPlayer = async () => {
    if (!pMatchId || !playerName || !playerTeam) return toast.error("Fill all fields");
    await db.from("fantasy_players").insert({
      match_id: pMatchId,
      player_name: playerName,
      team: playerTeam,
      role: playerRole,
      credits: parseFloat(playerCredits) || 8.0,
    });
    toast.success("Player added!");
    setPlayerName(""); setPlayerTeam(""); setPlayerCredits("8.0");
    fetchAll();
  };

  const deletePlayer = async (id: string) => {
    if (!confirm("Delete this player?")) return;
    await db.from("fantasy_players").delete().eq("id", id);
    toast.success("Player removed");
    fetchAll();
  };

  const openEditPlayer = (p: any) => {
    setEditPlayer(p);
    setEditForm({
      player_name: p.player_name || "",
      team: p.team || "",
      role: p.role || "batsman",
      credits: String(p.credits || 8.0),
      image_url: p.image_url || "",
    });
  };

  const saveEditPlayer = async () => {
    if (!editPlayer) return;
    await db.from("fantasy_players").update({
      player_name: editForm.player_name,
      team: editForm.team,
      role: editForm.role,
      credits: parseFloat(editForm.credits) || 8.0,
      image_url: editForm.image_url || null,
    }).eq("id", editPlayer.id);
    toast.success("Player updated!");
    setEditPlayer(null);
    fetchAll();
  };

  const updateContestStatus = async (id: string, status: string) => {
    await db.from("fantasy_contests").update({ status }).eq("id", id);
    toast.success(`Contest set to ${status}`);
    fetchAll();
  };

  const deleteContest = async (id: string) => {
    if (!confirm("Delete this contest?")) return;
    await db.from("fantasy_teams").delete().eq("contest_id", id);
    await db.from("fantasy_contests").delete().eq("id", id);
    toast.success("Contest deleted");
    fetchAll();
  };

  const fetchTeams = async (contestId: string) => {
    setSelectedContestId(contestId);
    const { data } = await db
      .from("fantasy_teams")
      .select("*")
      .eq("contest_id", contestId)
      .order("total_points", { ascending: false });
    setTeams(data || []);
  };

  const updatePoints = async (teamId: string, points: number) => {
    await db.from("fantasy_teams").update({ total_points: points }).eq("id", teamId);
    toast.success("Points updated");
    fetchTeams(selectedContestId);
  };

  const assignRanksAndPrizes = async (contestId: string) => {
    const contest = contests.find(c => c.id === contestId);
    if (!contest) return;
    
    // Get all players for this match to calculate points
    const { data: matchPlayers } = await db
      .from("fantasy_players")
      .select("*")
      .eq("match_id", contest.match_id);

    const playerPointsMap: Record<string, number> = {};
    (matchPlayers || []).forEach((p: any) => {
      playerPointsMap[p.id] = Number(p.points) || 0;
    });

    const { data: teamsData } = await db
      .from("fantasy_teams")
      .select("*")
      .eq("contest_id", contestId);

    if (!teamsData || teamsData.length === 0) return toast.error("No teams found");

    // Calculate total points for each team based on player points + captain/VC multipliers
    for (const team of teamsData) {
      const teamPlayers = (team.players as any[]) || [];
      let totalPoints = 0;
      for (const tp of teamPlayers) {
        const pts = playerPointsMap[tp.id] || 0;
        if (tp.name === team.captain) totalPoints += pts * 2;
        else if (tp.name === team.vice_captain) totalPoints += pts * 1.5;
        else totalPoints += pts;
      }
      await db.from("fantasy_teams").update({ total_points: totalPoints }).eq("id", team.id);
      team.total_points = totalPoints;
    }

    // Sort by points descending
    teamsData.sort((a: any, b: any) => b.total_points - a.total_points);

    const prizeDistribution = contest.prize_distribution || [];
    const pool = contest.prize_pool || 0;

    for (let i = 0; i < teamsData.length; i++) {
      const rank = i + 1;
      const prizeEntry = prizeDistribution.find((p: any) => p.rank === rank);
      const payout = prizeEntry ? Math.floor((pool * prizeEntry.percent) / 100) : 0;
      
      await db.from("fantasy_teams").update({ rank, payout }).eq("id", teamsData[i].id);

      if (payout > 0) {
        const { data: walletData } = await db.from("wallets").select("*").eq("user_id", teamsData[i].user_id).single();
        if (walletData) {
          await db.from("wallets").update({
            balance: (walletData.balance || 0) + payout,
            total_winnings: (walletData.total_winnings || 0) + payout,
          }).eq("user_id", teamsData[i].user_id);

          await db.from("transactions").insert({
            user_id: teamsData[i].user_id,
            type: "winning",
            amount: payout,
            status: "completed",
            description: `Fantasy Cricket - Rank #${rank} prize`,
          });
        }
      }
    }

    await db.from("fantasy_contests").update({ status: "completed" }).eq("id", contestId);
    toast.success("Rankings calculated from player points & prizes distributed!");
    fetchAll();
    fetchTeams(contestId);
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">
        Fantasy <span className="text-primary text-glow">Management</span>
      </h1>

      <Tabs defaultValue="live-scores">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="live-scores">Live Scores</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="teams">Teams & Points</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* LIVE SCORES TAB */}
        <TabsContent value="live-scores">
          <div className="space-y-6">
            {/* Toggle */}
            <Card className="gradient-card border-border/50">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Radio className="h-5 w-5 text-neon-red" />
                  <div>
                    <p className="font-display font-bold text-foreground">Live Scorecard Widget</p>
                    <p className="text-xs text-muted-foreground">Show live international cricket scores on the website</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{liveScoresEnabled ? "Enabled" : "Disabled"}</Label>
                  <Switch checked={liveScoresEnabled} onCheckedChange={toggleLiveScores} />
                </div>
              </CardContent>
            </Card>

            {/* Fetch & Import */}
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Import Matches from Live API
              </h3>
              <Button variant="outline" size="sm" onClick={fetchLiveMatches} disabled={liveLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${liveLoading ? "animate-spin" : ""}`} />
                Fetch Live Matches
              </Button>
            </div>

            {liveMatches.length === 0 && !liveLoading && (
              <p className="text-sm text-muted-foreground">Click "Fetch Live Matches" to load current matches from ESPN API.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.map(m => (
                <Card key={m.id} className="gradient-card border-border/50 hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={m.matchEnded ? "bg-secondary text-muted-foreground" : m.matchStarted ? "bg-neon-red/20 text-neon-red" : "bg-primary/20 text-primary"}>
                        {m.matchEnded ? "Completed" : m.matchStarted ? "LIVE" : "Upcoming"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{m.venue?.substring(0, 30)}</span>
                    </div>
                    <h3 className="font-display font-bold text-sm text-foreground mb-2">{m.name}</h3>
                    {m.score?.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {m.score.map((s: any, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{s.inning?.substring(0, 25)}</span>
                            <span className="font-display font-bold text-xs text-primary">{s.r}/{s.w} ({s.o} ov)</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mb-3">{m.status}</p>
                    <Button
                      size="sm"
                      className="w-full gradient-primary text-primary-foreground text-xs"
                      onClick={() => importMatchFromAPI(m)}
                      disabled={importingMatch === m.id}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {importingMatch === m.id ? "Importing..." : "Import to Database"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Existing matches visibility */}
            <div>
              <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Manage Match Visibility
              </h3>
              <div className="space-y-2">
                {matches.slice(0, 20).map(m => (
                  <Card key={m.id} className="gradient-card border-border/30">
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-display font-semibold text-sm text-foreground">{m.team_a} vs {m.team_b}</p>
                        <p className="text-xs text-muted-foreground">{formatMatchIST(m.match_date)} • {m.venue || "TBD"} • {m.match_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          m.status === "live" ? "bg-neon-red/20 text-neon-red" :
                          m.status === "completed" ? "bg-secondary text-muted-foreground" :
                          "bg-primary/20 text-primary"
                        }>
                          {m.status}
                        </Badge>
                        <Select
                          value={m.status}
                          onValueChange={async (val) => {
                            await db.from("cricket_matches").update({ status: val }).eq("id", m.id);
                            toast.success(`Match status updated to ${val}`);
                            fetchAll();
                          }}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs bg-secondary border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {matches.length === 0 && <p className="text-sm text-muted-foreground">No matches in database.</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CONTESTS TAB */}
        <TabsContent value="contests">
          <div className="flex justify-end mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground font-display">
                  <Plus className="h-4 w-4 mr-2" /> Create Contest
                </Button>
              </DialogTrigger>
              <DialogContent className="gradient-card border-border">
                <DialogHeader><DialogTitle className="font-display">Create Fantasy Contest</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-4">
                  <Select value={matchId} onValueChange={setMatchId}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Match" /></SelectTrigger>
                    <SelectContent>
                      {matches.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.team_a} vs {m.team_b} - {formatDateIST(m.match_date)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Contest Title" value={title} onChange={e => setTitle(e.target.value)} className="bg-secondary border-border" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Entry Fee (₹)" value={entryFee} onChange={e => setEntryFee(e.target.value)} className="bg-secondary border-border" />
                    <Input type="number" placeholder="Fixed Prize Pool (₹)" value={prizePool} onChange={e => setPrizePool(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Max Participants" value={maxPart} onChange={e => setMaxPart(e.target.value)} className="bg-secondary border-border" />
                    <Input type="number" placeholder="Number of Winners" value={numWinners} onChange={e => setNumWinners(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <p className="text-xs text-muted-foreground">Prize will be auto-distributed among {numWinners} winners</p>
                  <Button onClick={createContest} className="w-full gradient-primary text-primary-foreground">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {contests.map(c => {
              const match = c.cricket_matches;
              const winners = (c.prize_distribution as any[])?.length || 10;
              return (
                <Card key={c.id} className={`gradient-card ${c.status === "live" ? "border-neon-red/30" : c.status === "completed" ? "border-border/30" : "border-primary/30"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-display font-bold text-lg text-foreground">{c.title}</p>
                          <Badge className={c.status === "live" ? "bg-neon-red/20 text-neon-red animate-pulse" : c.status === "completed" ? "bg-secondary text-muted-foreground" : "gradient-primary text-primary-foreground"}>
                            {c.status === "live" ? "🔴 LIVE" : c.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {match?.team_a} vs {match?.team_b} • {formatMatchIST(match?.match_date)}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Entry: <strong className="text-foreground">₹{c.entry_fee}</strong></span>
                          <span>Prize: <strong className="text-primary">₹{formatINRWords(c.prize_pool)}</strong></span>
                          <span>Joined: <strong className="text-foreground">{c.current_participants}/{c.max_participants}</strong></span>
                          <span>Winners: <strong className="text-primary">{winners}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {c.status === "upcoming" && (
                          <>
                            <Button size="sm" variant="outline" className="text-xs border-neon-red/40 text-neon-red" onClick={() => updateContestStatus(c.id, "live")}>
                              Set Live
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs border-orange-400/40 text-orange-500" onClick={() => updateContestStatus(c.id, "closed")}>
                              Close
                            </Button>
                          </>
                        )}
                        {c.status === "live" && (
                          <>
                            <Button size="sm" variant="outline" className="text-xs border-orange-400/40 text-orange-500" onClick={() => updateContestStatus(c.id, "closed")}>
                              Close
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs border-primary/40 text-primary" onClick={() => assignRanksAndPrizes(c.id)}>
                              <Award className="h-3 w-3 mr-1" /> Finalize & Pay
                            </Button>
                          </>
                        )}
                        {c.status === "closed" && (
                          <>
                            <Button size="sm" variant="outline" className="text-xs border-primary/40 text-primary" onClick={() => updateContestStatus(c.id, "live")}>
                              Reopen
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs border-green-500/40 text-green-600" onClick={() => assignRanksAndPrizes(c.id)}>
                              <Award className="h-3 w-3 mr-1" /> Finalize & Pay
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" className="text-xs border-destructive/40 text-destructive" onClick={() => deleteContest(c.id)}>
                          <Trash2 className="h-3 w-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {contests.length === 0 && <p className="text-sm text-muted-foreground">No contests. Create one above.</p>}
          </div>
        </TabsContent>

        {/* PLAYERS TAB */}
        <TabsContent value="players">
          {/* Fetch Squad Section */}
          <Card className="gradient-card border-border/50 mb-6">
            <CardContent className="p-5">
              <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Fetch IPL Squad from ESPN API
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Select a match, then fetch 15-player squads with real photos for each team.</p>
              
              <div className="space-y-3">
                <Select value={pMatchId} onValueChange={setPMatchId}>
                  <SelectTrigger className="bg-secondary border-border max-w-md">
                    <SelectValue placeholder="Select Match" />
                  </SelectTrigger>
                  <SelectContent>
                    {matches.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const tA = IPL_TEAMS.find(t => t.name === m.team_a || t.shortName === m.team_a);
                            const tB = IPL_TEAMS.find(t => t.name === m.team_b || t.shortName === m.team_b);
                            return (
                              <>
                                {tA && <img src={tA.logo} alt={tA.shortName} className="h-4 w-4 object-contain" />}
                                <span>{m.team_a} vs {m.team_b}</span>
                                {tB && <img src={tB.logo} alt={tB.shortName} className="h-4 w-4 object-contain" />}
                              </>
                            );
                          })()}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {pMatchId && pMatchId !== "all" && (() => {
                  const match = matches.find((m: any) => m.id === pMatchId);
                  if (!match) return null;
                  const teamAShort = IPL_TEAMS.find(t => t.name === match.team_a || t.shortName === match.team_a)?.shortName || match.team_a;
                  const teamBShort = IPL_TEAMS.find(t => t.name === match.team_b || t.shortName === match.team_b)?.shortName || match.team_b;
                  const teamAInfo = IPL_TEAMS.find(t => t.shortName === teamAShort);
                  const teamBInfo = IPL_TEAMS.find(t => t.shortName === teamBShort);

                  const fetchSquad = async (shortName: string, setFetching: (v: boolean) => void) => {
                    setFetching(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("fetch-ipl-squad", {
                        body: { team_short_name: shortName, match_id: pMatchId },
                      });
                      if (error) throw error;
                      if (data?.fallback) {
                        toast.error("ESPN API unavailable. Please add players manually.");
                        return;
                      }
                      if (data?.success) {
                        toast.success(`Fetched ${data.players?.length || 0} players for ${shortName} (${data.saved?.inserted} new, ${data.saved?.skipped} updated)`);
                        fetchAll();
                      } else {
                        toast.error(data?.error || "Failed to fetch squad");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Error fetching squad");
                    } finally {
                      setFetching(false);
                    }
                  };

                  const fetchBothSquads = async () => {
                    setFetchingA(true);
                    setFetchingB(true);
                    try {
                      const [resA, resB] = await Promise.all([
                        supabase.functions.invoke("fetch-ipl-squad", { body: { team_short_name: teamAShort, match_id: pMatchId } }),
                        supabase.functions.invoke("fetch-ipl-squad", { body: { team_short_name: teamBShort, match_id: pMatchId } }),
                      ]);
                      if (resA.data?.success) toast.success(`${teamAShort}: ${resA.data.saved?.inserted} new, ${resA.data.saved?.skipped} updated`);
                      else toast.error(`${teamAShort}: ${resA.data?.error || resA.error?.message || "Failed"}`);
                      if (resB.data?.success) toast.success(`${teamBShort}: ${resB.data.saved?.inserted} new, ${resB.data.saved?.skipped} updated`);
                      else toast.error(`${teamBShort}: ${resB.data?.error || resB.error?.message || "Failed"}`);
                      fetchAll();
                    } catch (err: any) {
                      toast.error(err.message || "Error fetching squads");
                    } finally {
                      setFetchingA(false);
                      setFetchingB(false);
                    }
                  };

                  return (
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        className="border-primary/40 text-primary"
                        disabled={fetchingA}
                        onClick={() => fetchSquad(teamAShort, setFetchingA)}
                      >
                        {fetchingA ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : teamAInfo ? <img src={teamAInfo.logo} className="h-5 w-5 mr-2 object-contain" /> : null}
                        Fetch {teamAShort} Squad (15)
                      </Button>
                      <Button
                        variant="outline"
                        className="border-primary/40 text-primary"
                        disabled={fetchingB}
                        onClick={() => fetchSquad(teamBShort, setFetchingB)}
                      >
                        {fetchingB ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : teamBInfo ? <img src={teamBInfo.logo} className="h-5 w-5 mr-2 object-contain" /> : null}
                        Fetch {teamBShort} Squad (15)
                      </Button>
                      <Button
                        className="gradient-primary text-primary-foreground"
                        disabled={fetchingA || fetchingB}
                        onClick={fetchBothSquads}
                      >
                        {(fetchingA || fetchingB) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Fetch Both Squads (30)
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground font-display">
                  <Plus className="h-4 w-4 mr-2" /> Add Player Manually
                </Button>
              </DialogTrigger>
              <DialogContent className="gradient-card border-border">
                <DialogHeader><DialogTitle className="font-display">Add Fantasy Player</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-4">
                  <Select value={pMatchId} onValueChange={setPMatchId}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select Match" /></SelectTrigger>
                    <SelectContent>
                      {matches.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.team_a} vs {m.team_b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Player Name" value={playerName} onChange={e => setPlayerName(e.target.value)} className="bg-secondary border-border" />
                  <Input placeholder="Team (e.g. IND, AUS)" value={playerTeam} onChange={e => setPlayerTeam(e.target.value)} className="bg-secondary border-border" />
                  <Select value={playerRole} onValueChange={setPlayerRole}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="batsman">Batsman</SelectItem>
                      <SelectItem value="bowler">Bowler</SelectItem>
                      <SelectItem value="all_rounder">All Rounder</SelectItem>
                      <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Credits (e.g. 8.5)" value={playerCredits} onChange={e => setPlayerCredits(e.target.value)} className="bg-secondary border-border" step="0.5" />
                  <Button onClick={addPlayer} className="w-full gradient-primary text-primary-foreground">Add Player</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter by match */}
          <div className="mb-4">
            <Select value={pMatchId} onValueChange={setPMatchId}>
              <SelectTrigger className="bg-secondary border-border max-w-md">
                <SelectValue placeholder="Filter by match" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Matches</SelectItem>
                {matches.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.team_a} vs {m.team_b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Playing XI count */}
          {pMatchId && pMatchId !== "all" && (() => {
            const matchPlayers = players.filter(p => p.match_id === pMatchId);
            const playingCount = matchPlayers.filter(p => p.is_playing).length;
            return (
              <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-border/30">
                <p className="text-sm font-display font-bold text-foreground">
                  Playing XI: <span className={playingCount === 22 ? "text-primary" : playingCount > 22 ? "text-neon-red" : "text-muted-foreground"}>{playingCount}/22</span>
                  <span className="text-xs text-muted-foreground ml-2">(11 per team = 22 total playing players)</span>
                </p>
              </div>
            );
          })()}

          {(() => {
            const filteredPlayers = pMatchId && pMatchId !== "all" ? players.filter(p => p.match_id === pMatchId) : players;
            
            // Group by team
            const teamGroups: Record<string, any[]> = {};
            filteredPlayers.forEach(p => {
              const team = p.team || "Unknown";
              if (!teamGroups[team]) teamGroups[team] = [];
              teamGroups[team].push(p);
            });
            const teamNames = Object.keys(teamGroups);

            const renderPlayerCard = (p: any) => (
              <Card key={p.id} className={`gradient-card ${p.is_playing ? "border-primary/40" : "border-border/30"}`}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={p.is_playing || false}
                      onCheckedChange={async (checked) => {
                        await db.from("fantasy_players").update({ is_playing: checked }).eq("id", p.id);
                        toast.success(checked ? `${p.player_name} marked as playing` : `${p.player_name} removed from playing XI`);
                        fetchAll();
                      }}
                    />
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.player_name} className="w-14 h-14 rounded-full object-cover border-2 border-border/50 bg-secondary shadow-md" onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground border-2 border-border/50">
                        {p.player_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-display font-semibold text-sm text-foreground">
                        {p.player_name}
                        {p.is_playing && <Badge className="ml-2 bg-primary/20 text-primary text-[10px]">Playing</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.role} • {p.credits} cr • {p.points} pts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20 h-8 text-xs bg-secondary border-border"
                      placeholder="Points"
                      defaultValue={p.points}
                      onBlur={async e => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          await db.from("fantasy_players").update({ points: val }).eq("id", p.id);
                          toast.success("Points saved");
                        }
                      }}
                    />
                    <Button size="sm" variant="ghost" className="text-primary" onClick={() => openEditPlayer(p)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePlayer(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );

            if (teamNames.length === 0) {
              return <p className="text-sm text-muted-foreground">No players added yet.</p>;
            }

            // If match selected, show team-wise separated view
            if (pMatchId && pMatchId !== "all" && teamNames.length >= 1) {
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {teamNames.map(teamName => {
                    const teamInfo = IPL_TEAMS.find(t => t.name === teamName || t.shortName === teamName);
                    const teamPlayers = teamGroups[teamName];
                    const playingCount = teamPlayers.filter(p => p.is_playing).length;
                    return (
                      <div key={teamName}>
                        <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-secondary/50 border border-border/30">
                          {teamInfo && <img src={teamInfo.logo} alt={teamInfo.shortName} className="h-12 w-12 object-contain" />}
                          <div>
                            <p className="font-display font-bold text-foreground">{teamName}</p>
                            <p className="text-xs text-muted-foreground">
                              {teamPlayers.length} players • <span className={playingCount === 11 ? "text-primary font-bold" : ""}>{playingCount}/11 playing</span>
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {teamPlayers.map(renderPlayerCard)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // All matches - flat list
            return (
              <div className="space-y-2">
                {filteredPlayers.map(renderPlayerCard)}
              </div>
            );
          })()}

          {/* Edit Player Dialog */}
          <Dialog open={!!editPlayer} onOpenChange={(open) => { if (!open) setEditPlayer(null); }}>
            <DialogContent className="gradient-card border-border">
              <DialogHeader><DialogTitle className="font-display">Edit Player</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Player Name</Label>
                  <Input value={editForm.player_name} onChange={e => setEditForm({ ...editForm, player_name: e.target.value })} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Team</Label>
                  <Input value={editForm.team} onChange={e => setEditForm({ ...editForm, team: e.target.value })} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v })}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="batsman">Batsman</SelectItem>
                      <SelectItem value="bowler">Bowler</SelectItem>
                      <SelectItem value="all_rounder">All Rounder</SelectItem>
                      <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Credits</Label>
                  <Input type="number" step="0.5" value={editForm.credits} onChange={e => setEditForm({ ...editForm, credits: e.target.value })} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Image URL</Label>
                  <Input value={editForm.image_url} onChange={e => setEditForm({ ...editForm, image_url: e.target.value })} className="bg-secondary border-border mt-1" placeholder="https://..." />
                </div>
                <Button onClick={saveEditPlayer} className="w-full gradient-primary text-primary-foreground">Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* TEAMS & POINTS TAB */}
        <TabsContent value="teams">
          <div className="mb-4">
            <Select value={selectedContestId} onValueChange={fetchTeams}>
              <SelectTrigger className="bg-secondary border-border max-w-md">
                <SelectValue placeholder="Select a contest to view teams" />
              </SelectTrigger>
              <SelectContent>
                {contests.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title} ({c.current_participants} teams)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {teams.map((t, i) => {
              const teamPlayers = (t.players as any[]) || [];
              return (
                <Card key={t.id} className={`gradient-card ${i < 3 ? "border-primary/30" : "border-border/30"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-muted text-foreground" : i === 2 ? "bg-neon-orange/20 text-neon-orange" : "bg-secondary text-muted-foreground"}`}>
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-display font-bold text-sm text-foreground">{t.team_name}</p>
                          <p className="text-xs text-muted-foreground">C: {t.captain} | VC: {t.vice_captain}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-24 h-8 text-xs bg-secondary border-border"
                          placeholder="Total Points"
                          defaultValue={t.total_points}
                          onBlur={e => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) updatePoints(t.id, val);
                          }}
                        />
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {teamPlayers.map((p: any, j: number) => (
                        <Badge key={j} variant="secondary" className="text-[10px]">
                          {p.name === t.captain ? "👑" : p.name === t.vice_captain ? "⭐" : ""} {p.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {teams.length === 0 && selectedContestId && <p className="text-sm text-muted-foreground">No teams in this contest yet.</p>}
          </div>

          {selectedContestId && teams.length > 0 && (
            <Button
              className="mt-4 gradient-primary text-primary-foreground font-display"
              onClick={() => assignRanksAndPrizes(selectedContestId)}
            >
              <Trophy className="h-4 w-4 mr-2" /> Finalize Rankings & Distribute Prizes
            </Button>
          )}
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings">
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Fantasy Cricket Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Min Entry Fee (₹)</Label>
                  <Input
                    type="number"
                    value={settingsForm.min_entry_fee}
                    onChange={e => setSettingsForm({ ...settingsForm, min_entry_fee: e.target.value })}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Max Entry Fee (₹)</Label>
                  <Input
                    type="number"
                    value={settingsForm.max_entry_fee}
                    onChange={e => setSettingsForm({ ...settingsForm, max_entry_fee: e.target.value })}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Default Max Participants</Label>
                  <Input
                    type="number"
                    value={settingsForm.default_max_participants}
                    onChange={e => setSettingsForm({ ...settingsForm, default_max_participants: e.target.value })}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Commission %</Label>
                  <Input
                    type="number"
                    value={settingsForm.commission_percent}
                    onChange={e => setSettingsForm({ ...settingsForm, commission_percent: e.target.value })}
                    className="bg-secondary border-border mt-1"
                    step="0.5"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Prize Distribution (JSON)</Label>
                <textarea
                  value={settingsForm.prize_distribution}
                  onChange={e => setSettingsForm({ ...settingsForm, prize_distribution: e.target.value })}
                  className="w-full mt-1 p-3 rounded-md bg-secondary border border-border text-sm text-foreground font-mono min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">Format: [{"{"}"rank":1,"percent":40{"}"}, ...] — total must not exceed 100%</p>
              </div>

              <Button onClick={saveFantasySettings} className="gradient-primary text-primary-foreground font-display">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFantasy;
