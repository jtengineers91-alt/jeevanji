import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import PrizePoolBanner from "@/components/PrizePoolBanner";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Users, Swords, CheckCircle2, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NeedHelpButton } from "@/components/FloatingChat";
import { motion } from "framer-motion";
import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";
import { findIPLTeam } from "@/lib/ipl-teams";
import { formatINRWords } from "@/lib/format-inr";
import { inflateVotes } from "@/lib/fake-votes";
import { formatMatchIST } from "@/lib/format-date";

const DailyMatchWinnerGame = () => {
  const { isActive, loading: gameLoading } = useGameActive("daily_winner");
  const { user, wallet, refreshWallet } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [myPredictions, setMyPredictions] = useState<any[]>([]);
  const [placing, setPlacing] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, Record<string, number>>>({});
  const [selectedTeams, setSelectedTeams] = useState<Record<string, string>>({});
  const [gameConfig, setGameConfig] = useState<any>(null);

  useEffect(() => {
    fetchMatches();
    fetchGameConfig();
    if (user) fetchMyPredictions();
  }, [user]);

  const fetchGameConfig = async () => {
    const { data } = await supabase.from("game_configs").select("*").eq("game_type", "daily_winner").single();
    setGameConfig(data);
  };

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("cricket_matches")
      .select("*")
      .in("status", ["upcoming", "live"])
      .order("match_date", { ascending: true });
    setMatches(data || []);
    // Fetch vote counts for all matches
    if (data && data.length > 0) {
      const { data: preds } = await supabase
        .from("daily_match_predictions" as any)
        .select("match_id, predicted_team")
        .in("match_id", data.map(m => m.id));
      const counts: Record<string, Record<string, number>> = {};
      (preds || []).forEach((p: any) => {
        if (!counts[p.match_id]) counts[p.match_id] = {};
        counts[p.match_id][p.predicted_team] = (counts[p.match_id][p.predicted_team] || 0) + 1;
      });
      // UI-only fake vote inflation per match
      const inflated: Record<string, Record<string, number>> = {};
      data.forEach(m => {
        inflated[m.id] = inflateVotes(counts[m.id] || {}, [m.team_a, m.team_b], `daily:${m.id}`, 320, 2400);
      });
      setVoteCounts(inflated);
    }
  };

  const fetchMyPredictions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_match_predictions" as any)
      .select("*, cricket_matches(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMyPredictions(data || []);
  };

  const entryFee = gameConfig?.min_bet || 50;
  const prizePool = gameConfig?.max_bet || 10000;

  const hasPredicted = (matchId: string) => myPredictions.some((p: any) => p.match_id === matchId);

  const placePrediction = async (match: any) => {
    const team = selectedTeams[match.id];
    if (!user) return toast.error("Please sign in");
    if (!team) return toast.error("Select a team");
    if (hasPredicted(match.id)) return toast.error("Already predicted");
    if (entryFee > (wallet?.balance || 0)) return toast.error("Insufficient balance");

    setPlacing(match.id);
    try {
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - entryFee }).eq("user_id", user.id);
      await supabase.from("daily_match_predictions" as any).insert({
        user_id: user.id,
        match_id: match.id,
        predicted_team: team,
        amount: entryFee,
      });
      await supabase.from("transactions").insert({
        user_id: user.id, type: "game_entry", amount: -entryFee, status: "completed",
        description: `Daily Winner - ${team} (${match.team_a} vs ${match.team_b})`,
      });
      toast.success("Prediction placed!");
      refreshWallet();
      fetchMyPredictions();
      fetchMatches();
    } catch {
      toast.error("Failed to place prediction");
    } finally {
      setPlacing(null);
    }
  };

  if (gameLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (isActive === false) return <GameDisabled title="Daily Match Winner" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-4xl relative">
        <NeedHelpButton position="top-right" />
        <PrizePoolBanner gameType="daily_match_winner" className="mb-6" />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
            <Swords className="inline h-10 w-10 text-primary mr-2" />
            Daily Match <span className="text-primary">Winner</span>
          </h1>
          <p className="text-muted-foreground">Pick the winning team for today's matches!</p>
        </motion.div>

        {/* Prize */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="bg-primary/10 border border-primary/30 rounded-2xl px-8 py-4 text-center">
            <p className="text-xs text-muted-foreground font-display uppercase">Entry Fee / Match</p>
            <p className="text-3xl font-display font-bold text-primary">₹{entryFee}</p>
          </div>
          <div className="bg-gold/10 border border-gold/30 rounded-2xl px-8 py-4 text-center">
            <Trophy className="h-6 w-6 text-gold mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-display uppercase">Prize / Match</p>
            <p className="text-3xl font-display font-bold text-gold">₹{formatINRWords(prizePool)}</p>
          </div>
        </div>

        {matches.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No upcoming matches available</Card>
        ) : (
          <div className="space-y-6">
            {matches.map((match, idx) => {
              const teamA = findIPLTeam(match.team_a);
              const teamB = findIPLTeam(match.team_b);
              const matchVotes = voteCounts[match.id] || {};
              const totalMatchVotes = Object.values(matchVotes).reduce((s, v) => s + v, 0);
              const predicted = hasPredicted(match.id);
              const myPick = myPredictions.find((p: any) => p.match_id === match.id);
              const selected = selectedTeams[match.id];

              return (
                <motion.div key={match.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className="border-2 border-border overflow-hidden">
                    <div className="bg-secondary/50 px-4 py-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatMatchIST(match.match_date)}
                      </p>
                      {match.venue && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{match.venue}</p>}
                      <Badge variant="secondary" className="text-[10px]">{match.status}</Badge>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center gap-6 mb-6">
                        {/* Team A */}
                        <div
                          className={`flex-1 flex flex-col items-center cursor-pointer p-4 rounded-xl transition-all border-2 ${
                            (predicted && myPick?.predicted_team === match.team_a) ? "border-primary bg-primary/10" :
                            selected === match.team_a ? "border-primary/60 bg-primary/5" : "border-transparent hover:border-primary/20"
                          } ${predicted ? "pointer-events-none" : ""}`}
                          onClick={() => !predicted && setSelectedTeams(prev => ({ ...prev, [match.id]: match.team_a }))}
                        >
                          {teamA && <img src={teamA.logo} className="h-16 w-16 sm:h-20 sm:w-20 object-contain mb-2" alt={teamA.shortName} />}
                          <p className="font-display font-bold text-lg">{match.team_a}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{matchVotes[match.team_a] || 0} votes</span>
                          </div>
                          {totalMatchVotes > 0 && (
                            <div className="w-full mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round(((matchVotes[match.team_a] || 0) / totalMatchVotes) * 100)}%` }} />
                            </div>
                          )}
                        </div>

                        <span className="text-xl font-display font-bold text-muted-foreground">VS</span>

                        {/* Team B */}
                        <div
                          className={`flex-1 flex flex-col items-center cursor-pointer p-4 rounded-xl transition-all border-2 ${
                            (predicted && myPick?.predicted_team === match.team_b) ? "border-primary bg-primary/10" :
                            selected === match.team_b ? "border-primary/60 bg-primary/5" : "border-transparent hover:border-primary/20"
                          } ${predicted ? "pointer-events-none" : ""}`}
                          onClick={() => !predicted && setSelectedTeams(prev => ({ ...prev, [match.id]: match.team_b }))}
                        >
                          {teamB && <img src={teamB.logo} className="h-16 w-16 sm:h-20 sm:w-20 object-contain mb-2" alt={teamB.shortName} />}
                          <p className="font-display font-bold text-lg">{match.team_b}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{matchVotes[match.team_b] || 0} votes</span>
                          </div>
                          {totalMatchVotes > 0 && (
                            <div className="w-full mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round(((matchVotes[match.team_b] || 0) / totalMatchVotes) * 100)}%` }} />
                            </div>
                          )}
                        </div>
                      </div>

                      {predicted ? (
                        <div className="text-center bg-primary/10 rounded-xl p-3">
                          <CheckCircle2 className="h-5 w-5 text-primary mx-auto mb-1" />
                          <p className="text-sm">You picked <span className="font-bold text-primary">{myPick?.predicted_team}</span></p>
                          <Badge variant="secondary" className={myPick?.status === "won" ? "text-primary" : myPick?.status === "lost" ? "text-destructive" : "text-muted-foreground"}>
                            {myPick?.status}
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Button onClick={() => placePrediction(match)} disabled={placing === match.id || !selected} size="lg"
                            className="gradient-primary text-primary-foreground font-display px-8">
                            {placing === match.id ? "Placing..." : `Predict for ₹${entryFee}`}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {wallet && <p className="text-xs text-muted-foreground text-center mt-4">Balance: ₹{wallet.balance}</p>}
        <NeedHelpButton position="bottom-center" />
      </div>
      <Footer />
    </div>
  );
};

export default DailyMatchWinnerGame;
