import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import PrizePoolBanner from "@/components/PrizePoolBanner";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Medal, Users, Trophy, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NeedHelpButton } from "@/components/FloatingChat";
import { motion } from "framer-motion";
import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";
import { IPL_TEAMS } from "@/lib/ipl-teams";
import { formatINRWords } from "@/lib/format-inr";
import { inflateVotes } from "@/lib/fake-votes";

const IPLPredictionGame = () => {
  const { isActive, loading: gameLoading } = useGameActive("ipl_prediction");
  const { user, wallet, refreshWallet } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState("");
  const [myPrediction, setMyPrediction] = useState<any>(null);
  const [placing, setPlacing] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [gameConfig, setGameConfig] = useState<any>(null);

  useEffect(() => {
    fetchVoteCounts();
    fetchGameConfig();
    if (user) fetchMyPrediction();
  }, [user]);

  const fetchGameConfig = async () => {
    const { data } = await supabase
      .from("game_configs")
      .select("*")
      .eq("game_type", "ipl_prediction")
      .single();
    setGameConfig(data);
  };

  const fetchMyPrediction = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ipl_predictions")
      .select("*")
      .eq("user_id", user.id)
      .eq("season", "2026")
      .eq("prediction_type", "winner")
      .maybeSingle();
    setMyPrediction(data);
    if (data) setSelectedTeam(data.prediction_value);
  };

  const fetchVoteCounts = async () => {
    const { data } = await supabase
      .from("ipl_predictions")
      .select("prediction_value")
      .eq("season", "2026")
      .eq("prediction_type", "winner");
    const counts: Record<string, number> = {};
    (data || []).forEach(p => {
      counts[p.prediction_value] = (counts[p.prediction_value] || 0) + 1;
    });
    // UI-only fake vote inflation
    const inflated = inflateVotes(counts, IPL_TEAMS.map(t => t.shortName), "ipl_winner_2026", 850, 6200);
    setVoteCounts(inflated);
  };

  const totalVotes = Object.values(voteCounts).reduce((s, v) => s + v, 0);
  const entryFee = gameConfig?.min_bet || 100;
  const prizePool = gameConfig?.max_bet || 50000;

  const placePrediction = async () => {
    if (!user) return toast.error("Please sign in");
    if (!selectedTeam) return toast.error("Select a team");
    if (myPrediction) return toast.error("You already predicted!");
    if (entryFee > (wallet?.balance || 0)) return toast.error("Insufficient balance");

    setPlacing(true);
    try {
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - entryFee }).eq("user_id", user.id);
      await supabase.from("ipl_predictions").insert({
        user_id: user.id,
        season: "2026",
        prediction_type: "winner",
        prediction_value: selectedTeam,
        amount: entryFee,
      });
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "game_entry",
        amount: -entryFee,
        status: "completed",
        description: `IPL 2026 Winner Prediction - ${selectedTeam}`,
      });
      toast.success("Prediction placed!");
      refreshWallet();
      fetchMyPrediction();
      fetchVoteCounts();
    } catch {
      toast.error("Failed to place prediction");
    } finally {
      setPlacing(false);
    }
  };

  if (gameLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (isActive === false) return <GameDisabled title="IPL Prediction" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-4xl relative">
        <NeedHelpButton position="top-right" />
        <PrizePoolBanner gameType="ipl_prediction" className="mb-6" />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
            <Medal className="inline h-10 w-10 text-primary mr-2" />
            IPL 2026 <span className="text-primary">Winner</span>
          </h1>
          <p className="text-muted-foreground">Pick the team you think will lift the IPL 2026 trophy!</p>
        </motion.div>

        {/* Prize & Entry */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="bg-primary/10 border border-primary/30 rounded-2xl px-8 py-4 text-center">
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Entry Fee</p>
            <p className="text-3xl font-display font-bold text-primary">₹{entryFee}</p>
          </div>
          <div className="bg-gold/10 border border-gold/30 rounded-2xl px-8 py-4 text-center">
            <Trophy className="h-6 w-6 text-gold mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Prize Pool</p>
            <p className="text-3xl font-display font-bold text-gold">₹{formatINRWords(prizePool)}</p>
          </div>
          <div className="bg-secondary rounded-2xl px-8 py-4 text-center">
            <Users className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Total Votes</p>
            <p className="text-3xl font-display font-bold text-foreground">{totalVotes}</p>
          </div>
        </motion.div>

        {myPrediction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-8 text-center">
            <CheckCircle2 className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-sm text-foreground font-medium">You predicted <span className="text-primary font-bold">{myPrediction.prediction_value}</span></p>
            <Badge variant="secondary" className={`mt-1 ${myPrediction.status === "won" ? "text-primary" : myPrediction.status === "lost" ? "text-destructive" : "text-muted-foreground"}`}>
              {myPrediction.status}
            </Badge>
          </motion.div>
        )}

        {/* Team Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 gap-2 sm:gap-4 mb-8">
          {IPL_TEAMS.map((team, i) => {
            const votes = voteCounts[team.shortName] || 0;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isSelected = selectedTeam === team.shortName;
            const isMyPick = myPrediction?.prediction_value === team.shortName;

            return (
              <motion.div key={team.shortName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 border-2 relative overflow-hidden ${
                    isMyPick ? "border-primary bg-primary/5 shadow-lg shadow-primary/20" :
                    isSelected ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/30"
                  } ${myPrediction ? "pointer-events-none" : ""}`}
                  onClick={() => !myPrediction && setSelectedTeam(team.shortName)}
                >
                  {isMyPick && (
                    <div className="absolute top-0.5 right-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-primary" />
                    </div>
                  )}
                  <CardContent className="p-2 sm:p-4 flex flex-col items-center text-center">
                    <img src={team.logo} alt={team.shortName} className="h-10 w-10 sm:h-20 sm:w-20 object-contain mb-1 sm:mb-2" />
                    <p className="font-display font-bold text-[11px] sm:text-sm text-foreground leading-tight">{team.shortName}</p>
                    <p className="hidden sm:block text-[10px] text-muted-foreground leading-tight">{team.name}</p>
                    <div className="w-full mt-1.5 sm:mt-3">
                      <div className="h-1 sm:h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground">{votes}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-primary">{pct}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {!myPrediction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <Button onClick={placePrediction} disabled={placing || !selectedTeam} size="lg"
              className="gradient-primary text-primary-foreground font-display text-lg px-12 py-6">
              {placing ? "Placing..." : `Predict ${selectedTeam || "..."} for ₹${entryFee}`}
            </Button>
            {wallet && <p className="text-xs text-muted-foreground mt-2">Balance: ₹{wallet.balance}</p>}
          </motion.div>
        )}
        <NeedHelpButton position="bottom-center" />
      </div>
      <Footer />
    </div>
  );
};

export default IPLPredictionGame;
