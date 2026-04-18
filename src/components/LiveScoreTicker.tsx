import { useEffect, useState } from "react";
import { Radio, MapPin, Trophy, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { findIPLTeam } from "@/lib/ipl-teams";
import { Link } from "react-router-dom";

interface CricketMatch {
  id: string;
  name: string;
  status: string;
  venue: string;
  teams: string[];
  score: { inning: string; r: number; w: number; o: number }[];
  matchStarted: boolean;
  matchEnded: boolean;
  matchType: string;
}

const teamShort = (name: string) => {
  if (!name) return "";
  const t = findIPLTeam(name);
  if (t) return t.shortName;
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 4);
};

const LiveScoreTicker = () => {
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    try {
      const { data } = await supabase.functions.invoke("cricket-scores");
      if (data?.status === "success" && Array.isArray(data.data)) {
        const live = data.data.filter((m: CricketMatch) => m.matchStarted && !m.matchEnded);
        const upcoming = data.data.filter((m: CricketMatch) => !m.matchStarted);
        setMatches(live.length > 0 ? live : upcoming.slice(0, 3));
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchScores();
    const t = setInterval(fetchScores, 45_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (matches.length <= 1) return;
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % matches.length), 6000);
    return () => clearInterval(t);
  }, [matches.length]);

  if (loading || matches.length === 0) return null;

  const m = matches[activeIdx];
  const isLive = m.matchStarted && !m.matchEnded;
  const aShort = teamShort(m.teams[0] || "");
  const bShort = teamShort(m.teams[1] || "");
  const aObj = findIPLTeam(m.teams[0] || "") || findIPLTeam(aShort);
  const bObj = findIPLTeam(m.teams[1] || "") || findIPLTeam(bShort);
  const sA = m.score?.find((s) => s.inning?.includes(m.teams[0])) || m.score?.[0];
  const sB = m.score?.find((s) => s.inning?.includes(m.teams[1])) || m.score?.[1];

  return (
    <section className="relative overflow-hidden border-y-2 border-primary/30
      bg-gradient-to-r from-background via-primary/[0.06] to-background
      dark:from-[hsl(220_30%_6%)] dark:via-[hsl(150_60%_8%)] dark:to-[hsl(220_30%_6%)]">

      {/* Radial accent glows */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 dark:opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 18% 50%, hsl(var(--primary) / 0.18) 0%, transparent 55%), radial-gradient(ellipse at 82% 50%, hsl(0 85% 55% / 0.12) 0%, transparent 50%)",
        }}
      />

      <Link to="/games/daily-winner" className="relative block group">
        <div className="container py-3.5 sm:py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 sm:gap-6"
            >
              {/* LIVE pill */}
              <div className="shrink-0">
                {isLive ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/15 border border-destructive/50 backdrop-blur-sm shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </span>
                    <span className="text-[11px] font-display font-extrabold text-destructive uppercase tracking-[0.15em]">
                      Live
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/50">
                    <Radio className="h-3 w-3 text-primary" />
                    <span className="text-[11px] font-display font-extrabold text-primary uppercase tracking-[0.15em]">
                      Upcoming
                    </span>
                  </div>
                )}
              </div>

              {/* Match scoreboard */}
              <div className="flex-1 min-w-0 flex items-center justify-center sm:justify-start gap-3 sm:gap-5">
                {/* Team A */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {aObj ? (
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
                      <img src={aObj.logo} alt={aShort} className="relative h-9 w-9 sm:h-11 sm:w-11 object-contain" />
                    </div>
                  ) : (
                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center font-display font-extrabold text-xs text-foreground">
                      {aShort.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 text-right sm:text-left">
                    <p className="font-display font-extrabold text-base sm:text-lg text-foreground leading-tight tracking-wide">
                      {aShort || "TBD"}
                    </p>
                    {sA && sA.r > 0 ? (
                      <p className="text-sm sm:text-base font-mono font-bold text-primary leading-tight">
                        {sA.r}<span className="text-foreground/70">/{sA.w}</span>
                        <span className="text-muted-foreground text-xs ml-1">({sA.o})</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground font-medium">yet to bat</p>
                    )}
                  </div>
                </div>

                {/* VS divider */}
                <div className="flex flex-col items-center shrink-0 px-1">
                  <span className="text-[11px] font-display font-extrabold text-gold uppercase tracking-wider">vs</span>
                  <div className="h-4 w-px bg-gradient-to-b from-transparent via-gold/60 to-transparent" />
                </div>

                {/* Team B */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {bObj ? (
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
                      <img src={bObj.logo} alt={bShort} className="relative h-9 w-9 sm:h-11 sm:w-11 object-contain" />
                    </div>
                  ) : (
                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center font-display font-extrabold text-xs text-foreground">
                      {bShort.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-display font-extrabold text-base sm:text-lg text-foreground leading-tight tracking-wide">
                      {bShort || "TBD"}
                    </p>
                    {sB && sB.r > 0 ? (
                      <p className="text-sm sm:text-base font-mono font-bold text-primary leading-tight">
                        {sB.r}<span className="text-foreground/70">/{sB.w}</span>
                        <span className="text-muted-foreground text-xs ml-1">({sB.o})</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground font-medium">yet to bat</p>
                    )}
                  </div>
                </div>

                {/* Status / venue (desktop) */}
                <div className="hidden lg:flex items-center gap-2 ml-auto pl-4 border-l border-border text-xs text-muted-foreground min-w-0">
                  <Trophy className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span className="truncate max-w-[220px] font-medium text-foreground/80">{m.status}</span>
                  {m.venue && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[160px]">{m.venue}</span>
                    </>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/50 group-hover:bg-primary/30 transition-all">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-display font-extrabold uppercase tracking-[0.12em] text-primary">
                  Predict & Win
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-primary group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.div>
          </AnimatePresence>

          {matches.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {matches.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === activeIdx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      </Link>
    </section>
  );
};

export default LiveScoreTicker;
