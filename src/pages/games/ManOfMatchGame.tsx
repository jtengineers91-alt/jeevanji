import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import PrizePoolBanner from "@/components/PrizePoolBanner";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Users, Star, CheckCircle2, Calendar, MapPin, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NeedHelpButton } from "@/components/FloatingChat";
import { motion } from "framer-motion";
import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";
import { findIPLTeam } from "@/lib/ipl-teams";
import { formatINRWords } from "@/lib/format-inr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inflateVotes } from "@/lib/fake-votes";
import { formatMatchIST } from "@/lib/format-date";

const ManOfMatchGame = () => {
  const { isActive, loading: gameLoading } = useGameActive("motm");
  const { user, wallet, refreshWallet } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [step, setStep] = useState<"matches" | "players">("matches");
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [placing, setPlacing] = useState(false);
  const [myPredictions, setMyPredictions] = useState<any[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [gameConfig, setGameConfig] = useState<any>(null);

  useEffect(() => {
    fetchMatches();
    fetchGameConfig();
    if (user) fetchMyPredictions();
  }, [user]);

  const fetchGameConfig = async () => {
    const { data } = await supabase.from("game_configs").select("*").eq("game_type", "motm").single();
    setGameConfig(data);
  };

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("cricket_matches")
      .select("*")
      .in("status", ["upcoming", "live"])
      .order("match_date", { ascending: true });
    setMatches(data || []);
    // Don't auto-select — let user pick a match first
  };

  const selectMatch = async (match: any) => {
    setSelectedMatch(match);
    setSelectedPlayer("");
    setStep("players");
    // Fetch players for this match
    const { data } = await supabase
      .from("fantasy_players")
      .select("*")
      .eq("match_id", match.id)
      .eq("is_playing", true)
      .order("team");
    setPlayers(data || []);
    // Fetch vote counts for this match
    const { data: preds } = await supabase
      .from("match_predictions")
      .select("prediction_value")
      .eq("match_id", match.id)
      .eq("prediction_type", "man_of_match");
    const counts: Record<string, number> = {};
    (preds || []).forEach(p => { counts[p.prediction_value] = (counts[p.prediction_value] || 0) + 1; });
    // UI-only fake vote inflation across all match players
    const allNames = (data || []).map(pl => pl.player_name);
    const inflated = inflateVotes(counts, allNames, `motm:${match.id}`, 45, 680);
    setVoteCounts(inflated);
  };

  const fetchMyPredictions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("match_predictions")
      .select("*, cricket_matches(*)")
      .eq("user_id", user.id)
      .eq("prediction_type", "man_of_match")
      .order("created_at", { ascending: false });
    setMyPredictions(data || []);
  };

  const entryFee = gameConfig?.min_bet || 50;
  const prizePool = gameConfig?.max_bet || 25000;
  const totalVotes = Object.values(voteCounts).reduce((s, v) => s + v, 0);

  const alreadyPredicted = selectedMatch && myPredictions.some(p => p.match_id === selectedMatch.id);

  const placePrediction = async () => {
    if (!user) return toast.error("Please sign in");
    if (!selectedMatch) return toast.error("Select a match");
    if (!selectedPlayer) return toast.error("Select a player");
    if (alreadyPredicted) return toast.error("Already predicted for this match");
    if (entryFee > (wallet?.balance || 0)) return toast.error("Insufficient balance");

    setPlacing(true);
    try {
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - entryFee }).eq("user_id", user.id);
      await supabase.from("match_predictions").insert({
        user_id: user.id,
        match_id: selectedMatch.id,
        prediction_type: "man_of_match",
        prediction_value: selectedPlayer,
        amount: entryFee,
      });
      await supabase.from("transactions").insert({
        user_id: user.id, type: "game_entry", amount: -entryFee, status: "completed",
        description: `MoM Prediction - ${selectedPlayer}`,
      });
      toast.success("Man of Match prediction placed!");
      refreshWallet();
      fetchMyPredictions();
      selectMatch(selectedMatch);
    } catch {
      toast.error("Failed to place prediction");
    } finally {
      setPlacing(false);
    }
  };

  const teamAPlayers = players.filter(p => p.team === selectedMatch?.team_a);
  const teamBPlayers = players.filter(p => p.team === selectedMatch?.team_b);

  if (gameLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (isActive === false) return <GameDisabled title="Man of the Match" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-5xl relative">
        <NeedHelpButton position="top-right" />
        <PrizePoolBanner gameType="motm" className="mb-6" />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
            <Star className="inline h-10 w-10 text-gold mr-2" />
            Man of the <span className="text-gold">Match</span>
          </h1>
          <p className="text-muted-foreground">Pick the player who'll be the hero of the match!</p>
        </motion.div>

        {/* Prize */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="bg-primary/10 border border-primary/30 rounded-2xl px-8 py-4 text-center">
            <p className="text-xs text-muted-foreground font-display uppercase">Entry Fee</p>
            <p className="text-3xl font-display font-bold text-primary">₹{entryFee}</p>
          </div>
          <div className="bg-gold/10 border border-gold/30 rounded-2xl px-8 py-4 text-center">
            <Trophy className="h-6 w-6 text-gold mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-display uppercase">Prize Pool</p>
            <p className="text-3xl font-display font-bold text-gold">₹{formatINRWords(prizePool)}</p>
          </div>
        </div>

        {/* Match Selector */}
        {matches.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No upcoming matches available</Card>
        ) : step === "matches" ? (
          /* STEP 1: Select a Match */
          <>
            <h2 className="font-display font-bold text-xl mb-4 text-foreground">Select a Match</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {matches.map((m, i) => {
                const teamA = findIPLTeam(m.team_a);
                const teamB = findIPLTeam(m.team_b);
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card onClick={() => selectMatch(m)}
                      className="cursor-pointer transition-all duration-200 hover:scale-[1.02] border-2 border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-center gap-4 mb-3">
                          <div className="flex flex-col items-center">
                            {teamA && <img src={teamA.logo} className="h-14 w-14 object-contain mb-1" alt={teamA.shortName} />}
                            <p className="text-xs font-display font-bold text-foreground">{m.team_a}</p>
                          </div>
                          <span className="text-lg font-display font-bold text-muted-foreground">VS</span>
                          <div className="flex flex-col items-center">
                            {teamB && <img src={teamB.logo} className="h-14 w-14 object-contain mb-1" alt={teamB.shortName} />}
                            <p className="text-xs font-display font-bold text-foreground">{m.team_b}</p>
                          </div>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatMatchIST(m.match_date)}
                          </p>
                          {m.venue && <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1"><MapPin className="h-3 w-3" />{m.venue}</p>}
                          <Badge variant="secondary" className={`text-[10px] ${m.status === "live" ? "bg-destructive/10 text-destructive animate-pulse" : ""}`}>
                            {m.status === "live" ? "🔴 LIVE" : m.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : selectedMatch && (
          /* STEP 2: Select a Player */
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            {/* Back button + Match header */}
            <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={() => setStep("matches")} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex items-center gap-3">
                {findIPLTeam(selectedMatch.team_a) && <img src={findIPLTeam(selectedMatch.team_a)!.logo} className="h-10 w-10 object-contain" />}
                <span className="font-display font-bold text-lg">{selectedMatch.team_a} vs {selectedMatch.team_b}</span>
                {findIPLTeam(selectedMatch.team_b) && <img src={findIPLTeam(selectedMatch.team_b)!.logo} className="h-10 w-10 object-contain" />}
              </div>
            </div>

            {alreadyPredicted && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 text-center">
                <CheckCircle2 className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm">You already predicted for this match</p>
              </div>
            )}

            <h2 className="font-display font-bold text-xl mb-4">Choose Your Man of the Match</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {[{ team: selectedMatch.team_a, players: teamAPlayers }, { team: selectedMatch.team_b, players: teamBPlayers }].map(({ team, players: tPlayers }) => {
                const teamInfo = findIPLTeam(team);
                return (
                  <div key={team}>
                    <div className="flex items-center gap-2 mb-3 p-2 bg-secondary/50 rounded-lg">
                      {teamInfo && <img src={teamInfo.logo} className="h-10 w-10 object-contain" alt={team} />}
                      <h3 className="font-display font-bold text-lg">{team}</h3>
                      <Badge variant="secondary" className="ml-auto text-[10px]">{tPlayers.length} players</Badge>
                    </div>
                    <div className="space-y-2">
                      {tPlayers.map((p, pi) => {
                        const votes = voteCounts[p.player_name] || 0;
                        const isSelected = selectedPlayer === p.player_name;
                        const totalVotesLocal = Object.values(voteCounts).reduce((s: number, v: number) => s + v, 0);
                        const pct = totalVotesLocal > 0 ? Math.round((votes / totalVotesLocal) * 100) : 0;
                        return (
                          <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.03 }}>
                            <Card
                              className={`cursor-pointer transition-all border-2 ${
                                isSelected ? "border-gold bg-gold/5 shadow-md shadow-gold/10" : "border-border hover:border-gold/30"
                              } ${alreadyPredicted ? "pointer-events-none" : ""}`}
                              onClick={() => !alreadyPredicted && setSelectedPlayer(p.player_name)}>
                              <CardContent className="p-3 flex items-center gap-3">
                                <img src={p.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.player_name)}&background=random`}
                                  className="h-14 w-14 rounded-full object-cover border-2 border-border" alt={p.player_name} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-display font-bold text-sm truncate">{p.player_name}</p>
                                  <p className="text-[10px] text-muted-foreground capitalize">{p.role?.replace("_", " ")}</p>
                                  <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden w-24">
                                    <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs font-bold text-foreground">{votes}</p>
                                  <p className="text-[10px] text-muted-foreground">votes</p>
                                  {isSelected && <CheckCircle2 className="h-5 w-5 text-gold mt-1 ml-auto" />}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                      {tPlayers.length === 0 && <p className="text-xs text-muted-foreground p-4">No players available yet</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {!alreadyPredicted && (
              <div className="text-center">
                <Button onClick={placePrediction} disabled={placing || !selectedPlayer} size="lg"
                  className="gradient-primary text-primary-foreground font-display text-lg px-12 py-6">
                  {placing ? "Placing..." : `Predict ${selectedPlayer || "..."} for ₹${entryFee}`}
                </Button>
                {wallet && <p className="text-xs text-muted-foreground mt-2">Balance: ₹{wallet.balance}</p>}
              </div>
            )}
          </motion.div>
        )}

        {/* My Predictions */}
        {myPredictions.length > 0 && (
          <Card className="mt-10 border-border/50">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-lg mb-4">My MoM Predictions</h3>
              <div className="space-y-3">
                {myPredictions.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-bold">{p.prediction_value}</p>
                      <p className="text-[10px] text-muted-foreground">{p.cricket_matches?.team_a} vs {p.cricket_matches?.team_b}</p>
                    </div>
                    <Badge variant="secondary" className={p.status === "won" ? "text-primary" : p.status === "lost" ? "text-destructive" : "text-muted-foreground"}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <NeedHelpButton position="bottom-center" />
      </div>
      <Footer />
    </div>
  );
};

export default ManOfMatchGame;
