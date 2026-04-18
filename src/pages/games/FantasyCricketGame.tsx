import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import PrizePoolBanner from "@/components/PrizePoolBanner";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Users, Star, Crown, Medal, Calendar, Zap, Radio, Swords, Target, Shield, CircleUser, Clock, Award } from "lucide-react";
import { NeedHelpButton } from "@/components/FloatingChat";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";
import LiveScorecard from "@/components/LiveScorecard";
import { IPL_TEAMS, findIPLTeam } from "@/lib/ipl-teams";
import { formatINRWords } from "@/lib/format-inr";
import { formatMatchIST } from "@/lib/format-date";

const TeamLogo = ({ teamName, size = "h-10 w-10" }: { teamName: string; size?: string }) => {
  const team = findIPLTeam(teamName);
  if (!team) return <span className="text-xs font-bold text-muted-foreground">{teamName}</span>;
  return <img src={team.logo} alt={team.shortName} className={`${size} object-contain`} title={team.name} />;
};

const roleConfig: Record<string, { label: string; color: string; icon: typeof Swords; bg: string }> = {
  batsman: { label: "Batsman", color: "text-primary", icon: Swords, bg: "bg-primary/10" },
  bowler: { label: "Bowler", color: "text-neon-red", icon: Target, bg: "bg-neon-red/10" },
  all_rounder: { label: "All-Rounder", color: "text-neon-orange", icon: Star, bg: "bg-neon-orange/10" },
  wicket_keeper: { label: "Wicket Keeper", color: "text-neon-blue", icon: Shield, bg: "bg-neon-blue/10" },
};

const FantasyCricketGame = () => {
  const { isActive, loading: gameLoading } = useGameActive("fantasy");
  const { user, wallet, refreshWallet } = useAuth();
  const [contests, setContests] = useState<any[]>([]);
  const [selectedContest, setSelectedContest] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<any[]>([]);
  const [captain, setCaptain] = useState("");
  const [viceCaptain, setViceCaptain] = useState("");
  const [teamName, setTeamName] = useState("My Dream Team");
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState("contests");

  useEffect(() => {
    fetchContests();
    if (user) fetchMyTeams();
  }, [user]);

  const fetchContests = async () => {
    const { data } = await (supabase as any)
      .from("fantasy_contests")
      .select("*, cricket_matches(*)")
      .in("status", ["upcoming", "live", "completed"])
      .order("created_at", { ascending: false });
    // Sort: upcoming first (by match_date), then live, then completed
    const sorted = (data || []).sort((a: any, b: any) => {
      const order: Record<string, number> = { upcoming: 0, live: 1, completed: 2 };
      const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
      if (diff !== 0) return diff;
      const dA = new Date(a.cricket_matches?.match_date || 0).getTime();
      const dB = new Date(b.cricket_matches?.match_date || 0).getTime();
      return a.status === "completed" ? dB - dA : dA - dB;
    });
    setContests(sorted);
  };

  const fetchMyTeams = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("fantasy_teams")
      .select("*, fantasy_contests(*, cricket_matches(*))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMyTeams(data || []);
  };

  const selectContest = async (contest: any) => {
    setSelectedContest(contest);
    setSelectedPlayers([]);
    setCaptain("");
    setViceCaptain("");
    const { data } = await (supabase as any)
      .from("fantasy_players")
      .select("*")
      .eq("match_id", contest.match_id)
      .eq("is_playing", true)
      .order("credits", { ascending: false });
    setPlayers(data || []);

    const { data: lb } = await (supabase as any)
      .from("fantasy_teams")
      .select("*, profiles!inner(display_name, username)")
      .eq("contest_id", contest.id)
      .order("total_points", { ascending: false })
      .limit(10);
    setLeaderboard(lb || []);
    setTab("create-team");
  };

  const isContestLocked = selectedContest && selectedContest.status !== "upcoming";

  const togglePlayer = (player: any) => {
    if (isContestLocked) return toast.error("Contest is locked — match is live or completed");
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
      if (captain === player.player_name) setCaptain("");
      if (viceCaptain === player.player_name) setViceCaptain("");
    } else {
      if (selectedPlayers.length >= 11) return toast.error("Max 11 players");
      const totalCredits = selectedPlayers.reduce((s, p) => s + Number(p.credits), 0) + Number(player.credits);
      if (totalCredits > 100) return toast.error("Credit limit exceeded (100)");
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const totalCredits = selectedPlayers.reduce((s, p) => s + Number(p.credits), 0);

  const joinContest = async () => {
    if (!user) return toast.error("Please sign in");
    if (!selectedContest) return;
    if (isContestLocked) return toast.error("Contest is locked — match is live or completed");
    if (selectedPlayers.length !== 11) return toast.error("Select exactly 11 players");
    if (!captain) return toast.error("Select a captain");
    if (!viceCaptain) return toast.error("Select a vice-captain");
    if (captain === viceCaptain) return toast.error("Captain and Vice-Captain must be different");

    const fee = selectedContest.entry_fee;
    if ((wallet?.balance || 0) < fee) return toast.error("Insufficient balance");

    setJoining(true);
    try {
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - fee }).eq("user_id", user.id);
      const { error } = await (supabase as any).from("fantasy_teams").insert({
        contest_id: selectedContest.id,
        user_id: user.id,
        team_name: teamName,
        players: selectedPlayers.map(p => ({ id: p.id, name: p.player_name, role: p.role })),
        captain,
        vice_captain: viceCaptain,
      });
      if (error) throw error;
      await (supabase as any).from("fantasy_contests").update({
        current_participants: (selectedContest.current_participants || 0) + 1,
        prize_pool: (selectedContest.prize_pool || 0) + fee,
      }).eq("id", selectedContest.id);
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "game_entry",
        amount: -fee,
        status: "completed",
        description: `Fantasy Cricket - ${selectedContest.title}`,
      });
      toast.success("Team created! Good luck!");
      refreshWallet();
      fetchMyTeams();
      fetchContests();
      setTab("my-teams");
    } catch (err: any) {
      toast.error(err.message?.includes("unique") ? "Already joined this contest" : err.message || "Error joining");
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) }).eq("user_id", user.id);
    } finally {
      setJoining(false);
    }
  };

  if (gameLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (isActive === false) return <GameDisabled title="Fantasy Cricket" />;

  const formatMatchDate = (dateStr: string) => formatMatchIST(dateStr);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-6xl relative">
        <NeedHelpButton position="top-right" />
        <PrizePoolBanner gameType="fantasy_cricket" className="mb-6" />
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
            <Crown className="inline h-10 w-10 text-primary mr-2" />
            Fantasy <span className="text-primary text-glow">Cricket</span>
          </h1>
          <p className="text-muted-foreground text-lg">Build your dream team & win big prizes!</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="contests" className="font-display">🏆 Contests</TabsTrigger>
            <TabsTrigger value="create-team" className="font-display">⚡ Create Team</TabsTrigger>
            <TabsTrigger value="my-contests" className="font-display">📋 My Contests</TabsTrigger>
            <TabsTrigger value="my-teams" className="font-display">👥 My Teams</TabsTrigger>
            <TabsTrigger value="leaderboard" className="font-display">🏅 Leaderboard</TabsTrigger>
            <TabsTrigger value="live-scores" className="font-display">📺 Live Scores</TabsTrigger>
          </TabsList>

          {/* CONTESTS TAB */}
          <TabsContent value="contests">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {contests.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-12 text-lg">No contests available. Check back soon!</p>}
              {contests.map(c => {
                const match = c.cricket_matches;
                const isFull = c.current_participants >= c.max_participants;
                const alreadyJoined = myTeams.some(t => t.contest_id === c.id);
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="gradient-card border-border/50 hover:border-primary/40 transition-all hover:shadow-xl hover:shadow-primary/5 overflow-hidden">
                      <CardContent className="p-0">
                        {/* Match Header */}
                        <div className="bg-secondary/60 p-4 border-b border-border/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <TeamLogo teamName={match?.team_a} size="h-12 w-12" />
                              <span className="font-display font-bold text-lg text-foreground">VS</span>
                              <TeamLogo teamName={match?.team_b} size="h-12 w-12" />
                            </div>
                            <Badge className={`text-sm px-3 py-1 ${c.status === "live" ? "bg-neon-red/20 text-neon-red animate-pulse" : c.status === "completed" ? "bg-secondary text-muted-foreground" : "gradient-primary text-primary-foreground"}`}>
                              {c.status === "live" ? "🔴 LIVE" : c.status === "completed" ? "Completed" : "Upcoming"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {match ? formatMatchDate(match.match_date) : "TBD"}
                          </p>
                        </div>

                        <div className="p-5">
                          <h3 className="font-display font-bold text-lg text-foreground mb-1">{c.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {match?.team_a} vs {match?.team_b}
                          </p>

                          {/* Prize Display - Big & Attractive */}
                          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4 mb-4 border border-primary/20">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Prize Pool</p>
                                <p className="font-display font-black text-3xl text-primary text-glow">₹{formatINRWords(c.prize_pool)}</p>
                              </div>
                              <Trophy className="h-10 w-10 text-primary/40" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-center mb-4">
                            <div className="bg-secondary/50 rounded-xl p-3 border border-border/30">
                              <p className="text-xs text-muted-foreground">Entry Fee</p>
                              <p className="font-display font-bold text-xl text-foreground">₹{c.entry_fee}</p>
                            </div>
                            <div className="bg-secondary/50 rounded-xl p-3 border border-border/30">
                              <p className="text-xs text-muted-foreground">Spots Left</p>
                              <p className="font-display font-bold text-xl text-foreground">{c.max_participants - c.current_participants}</p>
                              <p className="text-[10px] text-muted-foreground">{c.current_participants}/{c.max_participants} joined</p>
                            </div>
                          </div>

                          <Button
                            className="w-full gradient-primary text-primary-foreground font-display text-base h-12"
                            disabled={isFull || alreadyJoined || c.status !== "upcoming"}
                            onClick={() => selectContest(c)}
                          >
                            {alreadyJoined ? "✅ Already Joined" : isFull ? "Full" : c.status !== "upcoming" ? "Closed" : "⚡ Join Contest"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* CREATE TEAM TAB */}
          <TabsContent value="create-team">
            {!selectedContest ? (
              <div className="text-center py-16">
                <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Select a contest first from the Contests tab.</p>
              </div>
            ) : isContestLocked ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
                  <Clock className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">Contest Locked</h3>
                <p className="text-muted-foreground">This match is <span className="font-bold text-destructive">{selectedContest.status === "live" ? "LIVE" : "completed"}</span>. Team creation, editing, and deletion are closed.</p>
                <Badge className="mt-3 bg-destructive/10 text-destructive border-destructive/30">No changes allowed</Badge>
              </div>
            ) : (
              <div className="space-y-6">
                <Card className="gradient-card border-primary/30 shadow-lg shadow-primary/5">
                  <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <TeamLogo teamName={selectedContest.cricket_matches?.team_a} size="h-10 w-10" />
                      <span className="font-display font-bold text-sm">VS</span>
                      <TeamLogo teamName={selectedContest.cricket_matches?.team_b} size="h-10 w-10" />
                      <div className="ml-2">
                        <p className="font-display font-bold text-foreground">{selectedContest.title}</p>
                        <p className="text-xs text-muted-foreground">Entry: ₹{selectedContest.entry_fee} • Prize: ₹{formatINRWords(selectedContest.prize_pool)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Players</p>
                        <p className={`font-display font-bold text-2xl ${selectedPlayers.length === 11 ? "text-primary" : "text-foreground"}`}>{selectedPlayers.length}/11</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Credits</p>
                        <p className={`font-display font-bold text-2xl ${totalCredits > 100 ? "text-neon-red" : "text-foreground"}`}>{totalCredits.toFixed(1)}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Input
                  placeholder="Team Name"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="bg-secondary border-border max-w-sm text-lg h-12"
                />

                {/* Player Selection - Team Wise */}
                {(() => {
                  const match = selectedContest.cricket_matches;
                  const teamA = match?.team_a || "Team A";
                  const teamB = match?.team_b || "Team B";
                  const teamAPlayers = players.filter(p => p.team === teamA);
                  const teamBPlayers = players.filter(p => p.team === teamB);
                  const otherPlayers = players.filter(p => p.team !== teamA && p.team !== teamB);
                  
                  const renderPlayerCard = (p: any) => {
                    const isSelected = selectedPlayers.find(sp => sp.id === p.id);
                    const isCaptain = captain === p.player_name;
                    const isVC = viceCaptain === p.player_name;
                    const role = roleConfig[p.role] || { label: p.role, color: "text-muted-foreground", icon: CircleUser, bg: "bg-muted" };
                    const RoleIcon = role.icon;
                    return (
                      <Card
                        key={p.id}
                        className={`cursor-pointer transition-all ${isSelected ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]" : "gradient-card border-border/30 hover:border-border hover:shadow-md"}`}
                        onClick={() => togglePlayer(p)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Player Avatar - BIGGER */}
                            <div className={`relative w-16 h-16 rounded-full ${role.bg} flex items-center justify-center shrink-0 border-3 ${isSelected ? "border-primary" : "border-border/50"} overflow-hidden shadow-lg`}>
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.player_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <CircleUser className={`h-9 w-9 ${role.color}`} />
                              )}
                              {(isCaptain || isVC) && (
                                <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isCaptain ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40" : "bg-neon-orange text-white shadow-lg shadow-neon-orange/40"}`}>
                                  {isCaptain ? "C" : "VC"}
                                </div>
                              )}
                            </div>

                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-bold text-base text-foreground truncate">{p.player_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <RoleIcon className={`h-4 w-4 ${role.color}`} />
                                <span className={`text-xs font-semibold ${role.color}`}>{role.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{p.team}</p>
                            </div>

                            {/* Credits & Actions */}
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant="secondary" className="text-xs font-display font-bold px-3 py-1">
                                {p.credits} CR
                              </Badge>
                              {isSelected && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={e => { e.stopPropagation(); setCaptain(p.player_name); }}
                                    className={`w-8 h-8 rounded-full text-xs font-black border-2 transition-all ${isCaptain ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg shadow-primary/30" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"}`}
                                    title="Set as Captain (2x points)"
                                  >
                                    C
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); setViceCaptain(p.player_name); }}
                                    className={`w-8 h-8 rounded-full text-xs font-black border-2 transition-all ${isVC ? "bg-neon-orange text-white border-neon-orange scale-110 shadow-lg shadow-neon-orange/30" : "border-border text-muted-foreground hover:border-neon-orange/50 hover:text-neon-orange"}`}
                                    title="Set as Vice-Captain (1.5x points)"
                                  >
                                    VC
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  };

                  return (
                    <div className="space-y-8">
                      {players.length === 0 && <p className="text-muted-foreground text-center py-8">No playing XI announced for this match yet.</p>}
                      
                      {teamAPlayers.length > 0 && (
                        <div>
                          <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-3">
                            <TeamLogo teamName={teamA} size="h-10 w-10" />
                            <span>{teamA}</span>
                            <Badge className="bg-primary/20 text-primary">{teamAPlayers.length} players</Badge>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {teamAPlayers.map(renderPlayerCard)}
                          </div>
                        </div>
                      )}

                      {teamBPlayers.length > 0 && (
                        <div>
                          <h3 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-3">
                            <TeamLogo teamName={teamB} size="h-10 w-10" />
                            <span>{teamB}</span>
                            <Badge className="bg-neon-red/20 text-neon-red">{teamBPlayers.length} players</Badge>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {teamBPlayers.map(renderPlayerCard)}
                          </div>
                        </div>
                      )}

                      {otherPlayers.length > 0 && (
                        <div>
                          <h3 className="font-display font-bold text-lg text-foreground mb-4">Other Players</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {otherPlayers.map(renderPlayerCard)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <Button
                  onClick={joinContest}
                  disabled={joining || selectedPlayers.length !== 11}
                  className="gradient-primary text-primary-foreground font-display px-10 h-14 text-lg"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {joining ? "Joining..." : `Join Contest (₹${selectedContest.entry_fee})`}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* MY CONTESTS TAB */}
          <TabsContent value="my-contests">
            <div className="space-y-4">
              {!user && <p className="text-muted-foreground text-center py-12">Please sign in to see your contests.</p>}
              {user && myTeams.length === 0 && <p className="text-muted-foreground text-center py-12">You haven't joined any contests yet.</p>}
              
              {/* Group by status */}
              {user && (() => {
                const grouped: Record<string, any[]> = { live: [], upcoming: [], completed: [] };
                myTeams.forEach(t => {
                  const status = t.fantasy_contests?.status || "upcoming";
                  if (!grouped[status]) grouped[status] = [];
                  grouped[status].push(t);
                });
                // Sort each group by date
                Object.values(grouped).forEach(arr => arr.sort((a: any, b: any) => {
                  const dA = new Date(a.fantasy_contests?.cricket_matches?.match_date || 0).getTime();
                  const dB = new Date(b.fantasy_contests?.cricket_matches?.match_date || 0).getTime();
                  return dB - dA;
                }));

                const statusLabels: Record<string, { label: string; emoji: string; color: string }> = {
                  live: { label: "Live Contests", emoji: "🔴", color: "text-neon-red" },
                  upcoming: { label: "Upcoming Contests", emoji: "📅", color: "text-primary" },
                  completed: { label: "Completed Contests", emoji: "✅", color: "text-muted-foreground" },
                };

                return (
                  <div className="space-y-8">
                    {["live", "upcoming", "completed"].map(status => {
                      const items = grouped[status] || [];
                      if (items.length === 0) return null;
                      const cfg = statusLabels[status];
                      return (
                        <div key={status}>
                          <h2 className={`font-display font-bold text-xl mb-4 flex items-center gap-2 ${cfg.color}`}>
                            {cfg.emoji} {cfg.label} ({items.length})
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map(t => {
                              const contest = t.fantasy_contests;
                              const match = contest?.cricket_matches;
                              return (
                                <Card key={t.id} className={`gradient-card overflow-hidden ${status === "live" ? "border-neon-red/30" : "border-border/50"}`}>
                                  <CardContent className="p-0">
                                    <div className="bg-secondary/60 p-4 border-b border-border/30">
                                      <div className="flex items-center gap-3">
                                        <TeamLogo teamName={match?.team_a} size="h-10 w-10" />
                                        <span className="font-display font-bold text-sm">VS</span>
                                        <TeamLogo teamName={match?.team_b} size="h-10 w-10" />
                                        <Badge className={status === "live" ? "bg-neon-red/20 text-neon-red animate-pulse ml-auto" : status === "completed" ? "bg-secondary text-muted-foreground ml-auto" : "gradient-primary text-primary-foreground ml-auto"}>
                                          {status === "live" ? "🔴 LIVE" : status}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {match ? formatMatchDate(match.match_date) : "TBD"}
                                      </p>
                                    </div>
                                    <div className="p-4">
                                      <h3 className="font-display font-bold text-foreground mb-1">{contest?.title}</h3>
                                      <p className="text-sm text-muted-foreground mb-3">Team: {t.team_name}</p>
                                      <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-secondary/50 rounded-lg p-2">
                                          <p className="text-[10px] text-muted-foreground">Points</p>
                                          <p className="font-display font-bold text-lg text-primary">{t.total_points}</p>
                                        </div>
                                        <div className="bg-secondary/50 rounded-lg p-2">
                                          <p className="text-[10px] text-muted-foreground">Rank</p>
                                          <p className="font-display font-bold text-lg text-foreground">{t.rank ? `#${t.rank}` : "-"}</p>
                                        </div>
                                        <div className="bg-secondary/50 rounded-lg p-2">
                                          <p className="text-[10px] text-muted-foreground">Won</p>
                                          <p className={`font-display font-bold text-lg ${t.payout > 0 ? "text-primary" : "text-muted-foreground"}`}>{t.payout > 0 ? `₹${t.payout}` : "-"}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </TabsContent>

          {/* MY TEAMS TAB */}
          <TabsContent value="my-teams">
            <div className="space-y-6">
              {myTeams.length === 0 && (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No teams yet. Join a contest!</p>
                </div>
              )}
              {myTeams.map(t => {
                const contest = t.fantasy_contests;
                const match = contest?.cricket_matches;
                const teamPlayers = (t.players as any[]) || [];
                const status = contest?.status || "upcoming";
                return (
                  <Card key={t.id} className={`gradient-card overflow-hidden ${status === "live" ? "border-neon-red/40 shadow-lg shadow-neon-red/5" : status === "completed" ? "border-border/40" : "border-primary/30"}`}>
                    <CardContent className="p-0">
                      {/* Match Header */}
                      <div className="bg-secondary/60 p-4 border-b border-border/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <TeamLogo teamName={match?.team_a} size="h-12 w-12" />
                            <span className="font-display font-bold text-sm text-muted-foreground">VS</span>
                            <TeamLogo teamName={match?.team_b} size="h-12 w-12" />
                          </div>
                          <Badge className={`text-sm px-3 py-1 ${status === "live" ? "bg-neon-red/20 text-neon-red animate-pulse" : status === "completed" ? "bg-secondary text-muted-foreground" : "gradient-primary text-primary-foreground"}`}>
                            {status === "live" ? "🔴 LIVE" : status === "completed" ? "✅ Completed" : "📅 Upcoming"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {match ? formatMatchDate(match.match_date) : "TBD"}
                        </p>
                      </div>

                      {/* Team Info */}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-display font-bold text-lg text-foreground">{t.team_name}</h3>
                            <p className="text-sm text-muted-foreground">{contest?.title}</p>
                          </div>
                          <div className="text-right">
                            {t.payout > 0 && (
                              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg px-4 py-2 border border-primary/20">
                                <p className="text-xs text-muted-foreground">Won</p>
                                <p className="font-display font-black text-2xl text-primary text-glow">₹{t.payout}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3 text-center mb-5">
                          <div className="bg-secondary/50 rounded-xl p-3 border border-border/30">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Points</p>
                            <p className="font-display font-bold text-2xl text-primary">{t.total_points}</p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-3 border border-border/30">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rank</p>
                            <p className="font-display font-bold text-2xl text-foreground">{t.rank ? `#${t.rank}` : "-"}</p>
                          </div>
                          <div className="bg-secondary/50 rounded-xl p-3 border border-border/30">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entry</p>
                            <p className="font-display font-bold text-2xl text-foreground">₹{contest?.entry_fee || 0}</p>
                          </div>
                        </div>

                        {/* Players Grid */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Your Squad</p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            {teamPlayers.map((p: any, i: number) => {
                              const isCap = p.name === t.captain;
                              const isVC = p.name === t.vice_captain;
                              return (
                                <div key={i} className={`relative text-center p-2 rounded-lg border ${isCap ? "border-primary/40 bg-primary/5" : isVC ? "border-neon-orange/40 bg-neon-orange/5" : "border-border/30 bg-secondary/30"}`}>
                                  {(isCap || isVC) && (
                                    <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${isCap ? "bg-primary text-primary-foreground" : "bg-neon-orange text-white"}`}>
                                      {isCap ? "C" : "VC"}
                                    </div>
                                  )}
                                  <p className="text-[11px] font-display font-bold text-foreground truncate">{p.name}</p>
                                  <p className="text-[9px] text-muted-foreground capitalize">{p.role?.replace("_", " ")}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* LEADERBOARD TAB */}
          <TabsContent value="leaderboard">
            {!selectedContest ? (
              <div className="text-center py-16">
                <Medal className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">Select a contest to view leaderboard.</p>
              </div>
            ) : (
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-xl">
                    <Trophy className="h-6 w-6 text-primary" />
                    Winners - {selectedContest.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No teams yet.</p>}
                    {leaderboard.map((t: any, i: number) => (
                      <div key={t.id} className={`flex items-center justify-between p-4 rounded-xl ${i < 3 ? "bg-primary/5 border border-primary/20 shadow-sm" : "bg-secondary/30"}`}>
                        <div className="flex items-center gap-4">
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-base ${i === 0 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : i === 1 ? "bg-muted text-foreground" : i === 2 ? "bg-neon-orange/20 text-neon-orange" : "bg-secondary text-muted-foreground"}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                          </span>
                          <div>
                            <p className="font-display font-semibold text-foreground">{t.team_name}</p>
                            <p className="text-xs text-muted-foreground">{t.profiles?.display_name || t.profiles?.username || "Player"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-primary text-lg">{t.total_points} pts</p>
                          {t.payout > 0 && <p className="text-sm text-primary font-bold">₹{t.payout}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* LIVE SCORES TAB */}
          <TabsContent value="live-scores">
            <LiveScorecard />
          </TabsContent>
        </Tabs>
        <NeedHelpButton position="bottom-center" />
      </div>
      <Footer />
    </div>
  );
};

export default FantasyCricketGame;
