import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Circle, Spade, Medal, Trophy, Crown, Swords, Star, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { findIPLTeam } from "@/lib/ipl-teams";
import { formatMatchIST } from "@/lib/format-date";

const BALLS = Array.from({ length: 10 }, (_, i) => ({
  number: i + 1,
  color: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#a855f7"][i],
  multiplier: [1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10][i],
}));

const AdminGameResults = () => {
  const [colorRounds, setColorRounds] = useState<any[]>([]);
  const [ballRounds, setBallRounds] = useState<any[]>([]);
  const [rummyTables, setRummyTables] = useState<any[]>([]);
  const [iplPredictions, setIplPredictions] = useState<any[]>([]);
  const [motmPredictions, setMotmPredictions] = useState<any[]>([]);
  const [dailyPredictions, setDailyPredictions] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchColorRounds();
    fetchBallRounds();
    fetchRummyTables();
    fetchIPLPredictions();
    fetchMotmPredictions();
    fetchDailyPredictions();
    fetchMatches();
  };

  const fetchMatches = async () => {
    const { data } = await supabase.from("cricket_matches").select("*").order("match_date", { ascending: false }).limit(30);
    setMatches(data || []);
  };

  const fetchColorRounds = async () => {
    const { data } = await supabase.from("color_trading_rounds").select("*").in("status", ["closed", "betting", "completed"]).order("created_at", { ascending: false }).limit(30);
    setColorRounds(data || []);
  };

  const fetchBallRounds = async () => {
    const { data } = await supabase.from("ball_pool_rounds").select("*").in("status", ["closed", "betting", "completed"]).order("created_at", { ascending: false }).limit(30);
    setBallRounds(data || []);
  };

  const fetchRummyTables = async () => {
    const { data } = await supabase.from("rummy_tables").select("*, rummy_players(*)").in("status", ["playing", "waiting", "completed"]).order("created_at", { ascending: false });
    setRummyTables(data || []);
  };

  const fetchIPLPredictions = async () => {
    const { data } = await supabase.from("ipl_predictions").select("*").order("created_at", { ascending: false }).limit(100);
    setIplPredictions(data || []);
  };

  const fetchMotmPredictions = async () => {
    const { data } = await supabase
      .from("match_predictions")
      .select("*, cricket_matches(team_a, team_b, match_date, status)")
      .eq("prediction_type", "man_of_match")
      .order("created_at", { ascending: false })
      .limit(100);
    setMotmPredictions(data || []);
  };

  const fetchDailyPredictions = async () => {
    const { data } = await supabase
      .from("daily_match_predictions" as any)
      .select("*, cricket_matches(team_a, team_b, match_date, status)")
      .order("created_at", { ascending: false })
      .limit(100);
    setDailyPredictions(data || []);
  };

  // ===== COLOR TRADING =====
  const setColorResult = async (roundId: string, color: string) => {
    await supabase.from("color_trading_rounds").update({ result_color: color, status: "completed" }).eq("id", roundId);
    const { data: bets } = await supabase.from("color_trading_bets").select("*").eq("round_id", roundId).eq("status", "pending");
    for (const bet of bets || []) {
      const won = bet.predicted_color === color;
      const payout = won ? bet.amount * 3 : 0;
      await supabase.from("color_trading_bets").update({ status: won ? "won" : "lost", payout }).eq("id", bet.id);
      if (won) {
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", bet.user_id).single();
        await supabase.from("wallets").update({ balance: (wallet?.balance || 0) + payout }).eq("user_id", bet.user_id);
        await supabase.from("transactions").insert({ user_id: bet.user_id, type: "game_win", amount: payout, status: "completed", description: `Color Trading - Won on ${color}` });
      }
    }
    toast.success(`Round result set: ${color}. All bets processed!`);
    fetchColorRounds();
  };

  // ===== BALL POOL =====
  const setBallResult = async (roundId: string, ball: number) => {
    const mult = BALLS[ball - 1].multiplier;
    await supabase.from("ball_pool_rounds").update({ winning_ball: ball, multiplier: mult, status: "completed" }).eq("id", roundId);
    const { data: bets } = await supabase.from("ball_pool_bets").select("*").eq("round_id", roundId).eq("status", "pending");
    for (const bet of bets || []) {
      const won = bet.selected_ball === ball;
      const payout = won ? Math.floor(bet.amount * mult) : 0;
      await supabase.from("ball_pool_bets").update({ status: won ? "won" : "lost", payout }).eq("id", bet.id);
      if (won) {
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", bet.user_id).single();
        await supabase.from("wallets").update({ balance: (wallet?.balance || 0) + payout }).eq("user_id", bet.user_id);
        await supabase.from("transactions").insert({ user_id: bet.user_id, type: "game_win", amount: payout, status: "completed", description: `Ball Pool - Won on Ball #${ball}` });
      }
    }
    toast.success(`Ball #${ball} set as winner. All bets processed!`);
    fetchBallRounds();
  };

  // ===== RUMMY =====
  const setRummyWinner = async (tableId: string, winnerId: string, prizePool: number) => {
    const commission = Math.floor(prizePool * 0.05);
    const winAmount = prizePool - commission;
    await supabase.from("rummy_tables").update({ winner_id: winnerId, status: "completed" }).eq("id", tableId);
    await supabase.from("rummy_players").update({ status: "eliminated" }).eq("table_id", tableId).neq("user_id", winnerId);
    await supabase.from("rummy_players").update({ status: "won" }).eq("table_id", tableId).eq("user_id", winnerId);
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", winnerId).single();
    await supabase.from("wallets").update({ balance: (wallet?.balance || 0) + winAmount }).eq("user_id", winnerId);
    await supabase.from("transactions").insert({ user_id: winnerId, type: "game_win", amount: winAmount, status: "completed", description: `Rummy - Won ₹${winAmount}` });
    toast.success(`Winner set! ₹${winAmount} credited (₹${commission} commission).`);
    fetchRummyTables();
  };

  // ===== IPL =====
  const resolveIPLPrediction = async (id: string, status: "won" | "lost", amount: number, userId: string) => {
    const payout = status === "won" ? amount * 5 : 0;
    await supabase.from("ipl_predictions").update({ status, payout }).eq("id", id);
    if (status === "won") {
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) + payout }).eq("user_id", userId);
      await supabase.from("transactions").insert({ user_id: userId, type: "game_win", amount: payout, status: "completed", description: `IPL Prediction - Won ₹${payout}` });
    }
    toast.success(`Prediction marked as ${status}`);
    fetchIPLPredictions();
  };

  // ===== MAN OF MATCH =====
  const resolveMotmPrediction = async (id: string, status: "won" | "lost", amount: number, userId: string) => {
    const payout = status === "won" ? amount * 5 : 0;
    await supabase.from("match_predictions").update({ status, payout }).eq("id", id);
    if (status === "won") {
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) + payout }).eq("user_id", userId);
      await supabase.from("transactions").insert({ user_id: userId, type: "game_win", amount: payout, status: "completed", description: `Man of Match - Won ₹${payout}` });
    }
    toast.success(`MoM prediction marked as ${status}`);
    fetchMotmPredictions();
  };

  // ===== DAILY MATCH WINNER =====
  const resolveDailyPrediction = async (id: string, status: "won" | "lost", amount: number, userId: string) => {
    const payout = status === "won" ? amount * 3 : 0;
    await supabase.from("daily_match_predictions" as any).update({ status, payout }).eq("id", id);
    if (status === "won") {
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) + payout }).eq("user_id", userId);
      await supabase.from("transactions").insert({ user_id: userId, type: "game_win", amount: payout, status: "completed", description: `Daily Match Winner - Won ₹${payout}` });
    }
    toast.success(`Daily prediction marked as ${status}`);
    fetchDailyPredictions();
  };

  // Bulk resolve helpers
  const bulkResolveMotm = async (matchId: string, winnerPlayer: string) => {
    const matchPreds = motmPredictions.filter(p => p.match_id === matchId && p.status === "pending");
    for (const p of matchPreds) {
      const s = p.prediction_value === winnerPlayer ? "won" : "lost";
      await resolveMotmPrediction(p.id, s as "won" | "lost", p.amount, p.user_id);
    }
    toast.success(`All MoM predictions for this match resolved!`);
  };

  const bulkResolveDailyWinner = async (matchId: string, winnerTeam: string) => {
    const matchPreds = dailyPredictions.filter((p: any) => p.match_id === matchId && p.status === "pending");
    for (const p of matchPreds) {
      const s = (p as any).predicted_team === winnerTeam ? "won" : "lost";
      await resolveDailyPrediction(p.id, s as "won" | "lost", (p as any).amount, (p as any).user_id);
    }
    toast.success(`All daily predictions for this match resolved!`);
  };

  // Group predictions by match
  const motmByMatch: Record<string, any[]> = motmPredictions.reduce((acc: Record<string, any[]>, p) => {
    const key = p.match_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const dailyByMatch: Record<string, any[]> = (dailyPredictions as any[]).reduce((acc: Record<string, any[]>, p: any) => {
    const key = p.match_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">
        <Crown className="inline h-7 w-7 text-primary mr-2" />
        Game <span className="text-primary">Results Control</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Set winners for all games. Results are final and wallets are updated automatically.</p>

      <Tabs defaultValue="color" className="space-y-4">
        <TabsList className="bg-secondary border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="color" className="font-display text-xs"><Palette className="h-3 w-3 mr-1" /> Color</TabsTrigger>
          <TabsTrigger value="ball" className="font-display text-xs"><Circle className="h-3 w-3 mr-1" /> Ball Pool</TabsTrigger>
          <TabsTrigger value="rummy" className="font-display text-xs"><Spade className="h-3 w-3 mr-1" /> Rummy</TabsTrigger>
          <TabsTrigger value="ipl" className="font-display text-xs"><Medal className="h-3 w-3 mr-1" /> IPL Winner</TabsTrigger>
          <TabsTrigger value="motm" className="font-display text-xs"><Star className="h-3 w-3 mr-1" /> Man of Match</TabsTrigger>
          <TabsTrigger value="daily" className="font-display text-xs"><Swords className="h-3 w-3 mr-1" /> Daily Winner</TabsTrigger>
        </TabsList>

        {/* COLOR TRADING TAB */}
        <TabsContent value="color">
          <div className="space-y-3">
            {colorRounds.length === 0 && <p className="text-sm text-muted-foreground">No active rounds</p>}
            {colorRounds.map(r => (
              <Card key={r.id} className="border-border/50">
                <CardContent className="flex items-center justify-between p-4 flex-wrap gap-3">
                  <div>
                    <p className="font-display font-bold">Round #{r.round_number}</p>
                    <Badge className={r.status === "closed" ? "bg-orange-100 text-orange-700" : "bg-primary/20 text-primary"}>{r.status === "closed" ? "Awaiting Result" : "Betting Open"}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {["red", "green", "blue"].map(color => (
                      <Button key={color} size="sm" onClick={() => setColorResult(r.id, color)}
                        className={`capitalize font-display ${color === "red" ? "bg-red-500 hover:bg-red-600" : color === "green" ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}>
                        {color}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* BALL POOL TAB */}
        <TabsContent value="ball">
          <div className="space-y-3">
            {ballRounds.length === 0 && <p className="text-sm text-muted-foreground">No active rounds</p>}
            {ballRounds.map(r => (
              <Card key={r.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display font-bold">Round #{r.round_number}</p>
                      <Badge className={r.status === "closed" ? "bg-orange-100 text-orange-700" : "bg-primary/20 text-primary"}>{r.status === "closed" ? "Awaiting Result" : "Betting Open"}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {BALLS.map(ball => (
                      <Button key={ball.number} size="sm" onClick={() => setBallResult(r.id, ball.number)} className="h-12 font-display font-bold text-white" style={{ background: ball.color }}>
                        #{ball.number}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* RUMMY TAB */}
        <TabsContent value="rummy">
          <div className="space-y-3">
            {rummyTables.length === 0 && <p className="text-sm text-muted-foreground">No active tables</p>}
            {rummyTables.map(t => {
              const players = (t.rummy_players as any[]) || [];
              return (
                <Card key={t.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-display font-bold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">Prize: ₹{t.prize_pool} • {t.current_players}/{t.max_players} players</p>
                      </div>
                      <Badge className={t.status === "playing" ? "bg-red-100 text-red-700" : "bg-primary/20 text-primary"}>{t.status}</Badge>
                    </div>
                    {t.status === "playing" && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-display">Select Winner:</p>
                        <div className="flex flex-wrap gap-2">
                          {players.map((p: any) => (
                            <Button key={p.id} size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-display text-xs"
                              onClick={() => setRummyWinner(t.id, p.user_id, t.prize_pool)}>
                              <Trophy className="h-3 w-3 mr-1" /> {p.user_id.slice(0, 8)}...
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* IPL TAB */}
        <TabsContent value="ipl">
          <div className="space-y-3">
            {iplPredictions.length === 0 && <p className="text-sm text-muted-foreground">No predictions</p>}
            {iplPredictions.map(p => (
              <Card key={p.id} className="border-border/50">
                <CardContent className="flex items-center justify-between p-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {findIPLTeam(p.prediction_value) && <img src={findIPLTeam(p.prediction_value)!.logo} className="h-10 w-10 object-contain" />}
                    <div>
                      <p className="font-display font-bold">{p.prediction_value}</p>
                      <p className="text-xs text-muted-foreground">Amount: ₹{p.amount} • User: {p.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.status === "pending" ? (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-display text-xs" onClick={() => resolveIPLPrediction(p.id, "won", p.amount, p.user_id)}>✓ Won</Button>
                        <Button size="sm" variant="outline" className="border-destructive/40 text-destructive text-xs" onClick={() => resolveIPLPrediction(p.id, "lost", p.amount, p.user_id)}>✗ Lost</Button>
                      </>
                    ) : (
                      <Badge variant="secondary" className={`text-xs ${p.status === "won" ? "text-green-600" : "text-destructive"}`}>
                        {p.status} {p.payout > 0 && `• ₹${p.payout}`}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* MAN OF MATCH TAB */}
        <TabsContent value="motm">
          <div className="space-y-6">
            {Object.keys(motmByMatch).length === 0 && <p className="text-sm text-muted-foreground">No Man of Match predictions yet</p>}
            {Object.entries(motmByMatch).map(([matchId, preds]) => {
              const match = preds[0]?.cricket_matches;
              const teamA = findIPLTeam(match?.team_a);
              const teamB = findIPLTeam(match?.team_b);
              const pendingPreds = preds.filter(p => p.status === "pending");
              const uniquePlayers = [...new Set(preds.map(p => p.prediction_value))];
              const playerVotes = uniquePlayers.map(name => ({
                name,
                votes: preds.filter(p => p.prediction_value === name).length,
              })).sort((a, b) => b.votes - a.votes);

              return (
                <Card key={matchId} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {teamA && <img src={teamA.logo} className="h-10 w-10 object-contain" />}
                      <CardTitle className="text-base font-display">{match?.team_a} vs {match?.team_b}</CardTitle>
                      {teamB && <img src={teamB.logo} className="h-10 w-10 object-contain" />}
                      <Badge variant="secondary" className="ml-auto text-xs">{match?.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatMatchIST(match?.match_date)}
                      <span className="ml-2"><Users className="h-3 w-3 inline" /> {preds.length} predictions</span>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Vote summary */}
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs font-display font-bold mb-2">Player Votes Summary</p>
                      <div className="space-y-1">
                        {playerVotes.map(pv => (
                          <div key={pv.name} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{pv.name}</span>
                            <span className="text-muted-foreground">{pv.votes} votes</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bulk resolve */}
                    {pendingPreds.length > 0 && (
                      <div>
                        <p className="text-xs font-display font-bold mb-2">Set Winner (resolves all predictions):</p>
                        <div className="flex flex-wrap gap-2">
                          {uniquePlayers.map(name => (
                            <Button key={name} size="sm" variant="outline" className="text-xs border-primary/40 text-primary hover:bg-primary/10"
                              onClick={() => bulkResolveMotm(matchId, name)}>
                              <Trophy className="h-3 w-3 mr-1" /> {name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Individual predictions */}
                    <div>
                      <p className="text-xs font-display font-bold mb-2">All Predictions ({preds.length})</p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {preds.map(p => (
                          <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                            <div>
                              <span className="text-sm font-medium">{p.prediction_value}</span>
                              <span className="text-xs text-muted-foreground ml-2">₹{p.amount} • {p.user_id.slice(0, 8)}...</span>
                            </div>
                            <Badge variant="secondary" className={`text-[10px] ${p.status === "won" ? "text-green-600" : p.status === "lost" ? "text-destructive" : ""}`}>{p.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* DAILY MATCH WINNER TAB */}
        <TabsContent value="daily">
          <div className="space-y-6">
            {Object.keys(dailyByMatch).length === 0 && <p className="text-sm text-muted-foreground">No Daily Winner predictions yet</p>}
            {Object.entries(dailyByMatch).map(([matchId, preds]) => {
              const match = (preds[0] as any)?.cricket_matches;
              const teamA = findIPLTeam(match?.team_a);
              const teamB = findIPLTeam(match?.team_b);
              const pendingPreds = preds.filter((p: any) => p.status === "pending");
              const teamAVotes = preds.filter((p: any) => p.predicted_team === match?.team_a).length;
              const teamBVotes = preds.filter((p: any) => p.predicted_team === match?.team_b).length;

              return (
                <Card key={matchId} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {teamA && <img src={teamA.logo} className="h-10 w-10 object-contain" />}
                      <CardTitle className="text-base font-display">{match?.team_a} vs {match?.team_b}</CardTitle>
                      {teamB && <img src={teamB.logo} className="h-10 w-10 object-contain" />}
                      <Badge variant="secondary" className="ml-auto text-xs">{match?.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatMatchIST(match?.match_date)}
                      <span className="ml-2"><Users className="h-3 w-3 inline" /> {preds.length} predictions</span>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Vote summary */}
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-xs font-display font-bold mb-3">Team Votes</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-lg border border-border">
                          {teamA && <img src={teamA.logo} className="h-12 w-12 mx-auto mb-1 object-contain" />}
                          <p className="font-display font-bold">{match?.team_a}</p>
                          <p className="text-2xl font-display font-bold text-primary">{teamAVotes}</p>
                          <p className="text-xs text-muted-foreground">votes</p>
                        </div>
                        <div className="text-center p-3 rounded-lg border border-border">
                          {teamB && <img src={teamB.logo} className="h-12 w-12 mx-auto mb-1 object-contain" />}
                          <p className="font-display font-bold">{match?.team_b}</p>
                          <p className="text-2xl font-display font-bold text-primary">{teamBVotes}</p>
                          <p className="text-xs text-muted-foreground">votes</p>
                        </div>
                      </div>
                    </div>

                    {/* Bulk resolve */}
                    {pendingPreds.length > 0 && (
                      <div>
                        <p className="text-xs font-display font-bold mb-2">Declare Winner (resolves all {pendingPreds.length} pending predictions):</p>
                        <div className="flex gap-3">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-display flex items-center gap-2"
                            onClick={() => bulkResolveDailyWinner(matchId, match?.team_a)}>
                            {teamA && <img src={teamA.logo} className="h-5 w-5 object-contain" />} {match?.team_a} Won
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-display flex items-center gap-2"
                            onClick={() => bulkResolveDailyWinner(matchId, match?.team_b)}>
                            {teamB && <img src={teamB.logo} className="h-5 w-5 object-contain" />} {match?.team_b} Won
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Individual predictions */}
                    <div>
                      <p className="text-xs font-display font-bold mb-2">All Predictions ({preds.length})</p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {preds.map((p: any) => {
                          const pTeam = findIPLTeam(p.predicted_team);
                          return (
                            <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                              <div className="flex items-center gap-2">
                                {pTeam && <img src={pTeam.logo} className="h-6 w-6 object-contain" />}
                                <span className="text-sm font-medium">{p.predicted_team}</span>
                                <span className="text-xs text-muted-foreground">₹{p.amount} • {p.user_id.slice(0, 8)}...</span>
                              </div>
                              <Badge variant="secondary" className={`text-[10px] ${p.status === "won" ? "text-green-600" : p.status === "lost" ? "text-destructive" : ""}`}>{p.status}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGameResults;
