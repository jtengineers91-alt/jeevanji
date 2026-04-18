import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Activity, Crown, Loader2, CalendarClock } from "lucide-react";
import type { StandingRow } from "@/lib/ipl-standings-2026";
import {
  ORANGE_CAP_2026,
  PURPLE_CAP_2026,
  type BatterStat,
  type BowlerStat,
} from "@/lib/ipl-stats-2026";
import { findIPLTeam } from "@/lib/ipl-teams";
import { NeedHelpButton } from "@/components/FloatingChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const formColors: Record<string, string> = {
  W: "bg-primary text-primary-foreground",
  L: "bg-destructive/80 text-destructive-foreground",
  N: "bg-muted text-muted-foreground",
};

const IPLPointsTablePage = () => {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [standingsLoading, setStandingsLoading] = useState<boolean>(true);
  const [isLiveStandings, setIsLiveStandings] = useState<boolean>(false);
  const sorted = [...standings].sort((a, b) => b.points - a.points || b.nrr - a.nrr);

  const [orangeCap, setOrangeCap] = useState<BatterStat[]>(ORANGE_CAP_2026);
  const [purpleCap, setPurpleCap] = useState<BowlerStat[]>(PURPLE_CAP_2026);
  const [statsSeason, setStatsSeason] = useState<string>("2026");
  const [isLiveStats, setIsLiveStats] = useState<boolean>(false);
  const [statsUpdatedAt, setStatsUpdatedAt] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    const fetchStandings = async () => {
      setStandingsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ipl-standings", { body: {} });
        if (error || !data) throw error || new Error("No data");
        if (!alive) return;
        const rows = Array.isArray(data.standings) ? (data.standings as StandingRow[]) : [];
        setStandings(rows.map((r) => ({ ...r, form: r.form?.length ? r.form : [] })));
        setIsLiveStandings(Boolean(data.isLive));
      } catch (err) {
        console.warn("Failed to fetch live IPL standings", err);
        if (alive) {
          setStandings([]);
          setIsLiveStandings(false);
        }
      } finally {
        if (alive) setStandingsLoading(false);
      }
    };
    fetchStandings();
    const t = setInterval(fetchStandings, 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ipl-cap-stats", {
          body: {},
        });
        if (error || !data) throw error || new Error("No data");
        if (!alive) return;
        if (Array.isArray(data.orangeCap) && data.orangeCap.length > 0) {
          setOrangeCap(data.orangeCap as BatterStat[]);
        }
        if (Array.isArray(data.purpleCap) && data.purpleCap.length > 0) {
          setPurpleCap(data.purpleCap as BowlerStat[]);
        }
        setStatsSeason(String(data.season || "2026"));
        setIsLiveStats(Boolean(data.isLive));
        setStatsUpdatedAt(data.updatedAt || null);
      } catch (err) {
        console.warn("Failed to fetch live IPL caps, using seed data", err);
      } finally {
        if (alive) setStatsLoading(false);
      }
    };
    fetchStats();
    // Refresh every 5 min while open
    const t = setInterval(fetchStats, 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-5xl relative">
        <NeedHelpButton position="top-right" />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
            <Trophy className="inline h-10 w-10 text-gold mr-2" />
            IPL 2026 <span className="text-primary">Points Table</span>
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            {standingsLoading ? (
              <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching live standings…</span>
            ) : isLiveStandings ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
                Live IPL 2026 standings • Updated by admin sync
              </>
            ) : (
              <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> IPL 2026 standings will appear once admin syncs from ESPN (or season begins)</span>
            )}
          </p>
        </motion.div>

        {sorted.length === 0 && !standingsLoading ? null : (
          <>

        {/* Top 4 highlight */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {sorted.slice(0, 4).map((row, i) => {
            const team = findIPLTeam(row.shortName);
            return (
              <motion.div key={row.shortName} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <Badge className="mb-2 bg-gold/20 text-gold border-gold/40">Q{i + 1}</Badge>
                    {team && <img src={team.logo} alt={team.shortName} className="h-12 w-12 object-contain mb-2" />}
                    <p className="font-display font-bold text-sm text-foreground">{row.shortName}</p>
                    <p className="text-2xl font-display font-bold text-primary mt-1">{row.points}<span className="text-xs text-muted-foreground ml-1">pts</span></p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Full Table */}
        <Card className="border-2 border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60">
                <tr className="text-left">
                  <th className="px-2 sm:px-4 py-3 font-display text-xs uppercase tracking-wider text-muted-foreground">#</th>
                  <th className="px-2 sm:px-4 py-3 font-display text-xs uppercase tracking-wider text-muted-foreground">Team</th>
                  <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center">P</th>
                  <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center">W</th>
                  <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center">L</th>
                  <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden sm:table-cell">NR</th>
                  <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center">NRR</th>
                  <th className="px-2 sm:px-4 py-3 font-display text-xs uppercase text-muted-foreground text-center">Pts</th>
                  <th className="px-2 sm:px-4 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden md:table-cell">Form</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => {
                  const team = findIPLTeam(row.shortName);
                  const inTop4 = i < 4;
                  return (
                    <motion.tr
                      key={row.shortName}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`border-t border-border/40 hover:bg-secondary/30 transition-colors ${inTop4 ? "bg-primary/[0.03]" : ""}`}
                    >
                      <td className="px-2 sm:px-4 py-3">
                        <span className={`font-display font-bold ${inTop4 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {team && <img src={team.logo} alt={team.shortName} className="h-7 w-7 sm:h-9 sm:w-9 object-contain shrink-0" />}
                          <div className="min-w-0">
                            <p className="font-display font-bold text-foreground text-sm">{row.shortName}</p>
                            <p className="text-[10px] text-muted-foreground hidden sm:block truncate">{team?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center text-foreground">{row.played}</td>
                      <td className="px-2 py-3 text-center text-primary font-bold">{row.won}</td>
                      <td className="px-2 py-3 text-center text-destructive font-bold">{row.lost}</td>
                      <td className="px-2 py-3 text-center text-muted-foreground hidden sm:table-cell">{row.noResult}</td>
                      <td className="px-2 py-3 text-center">
                        <span className={`flex items-center justify-center gap-0.5 font-mono text-xs ${row.nrr >= 0 ? "text-primary" : "text-destructive"}`}>
                          {row.nrr >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {row.nrr > 0 ? "+" : ""}{row.nrr.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center">
                        <span className="inline-block bg-primary/10 text-primary font-display font-bold text-base px-2 py-0.5 rounded">{row.points}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1">
                          {row.form.map((f, fi) => (
                            <span key={fi} className={`h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center ${formColors[f]}`}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-primary/20 border border-primary/40" />Top 4 qualify for playoffs</div>
          <div className="flex items-center gap-2"><Activity className="h-3 w-3 text-primary" />NRR = Net Run Rate</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-primary" />W = Won</div>
          <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive/80" />L = Lost</div>
        </div>
        </>
        )}

        {/* Caps & Stat Leaders */}
        <div className="mt-12">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-1">
              <Crown className="inline h-8 w-8 text-gold mr-2" />
              Tournament <span className="text-primary">Caps</span>
              <span className="ml-2 align-middle text-base font-display text-muted-foreground">
                · IPL {statsSeason}
              </span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-sm">
              {statsLoading ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching latest stats…
                </span>
              ) : isLiveStats ? (
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Live · IPL {statsSeason} · Updated after every match
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Showing IPL 2026 stats · Updates live as the season progresses
                </span>
              )}
            </div>
          </div>

          {/* Top Cap Holders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Orange Cap Leader */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-2 overflow-hidden relative" style={{ borderColor: "hsl(25 95% 53% / 0.5)" }}>
                <div className="absolute inset-0 opacity-10" style={{ background: "linear-gradient(135deg, hsl(25 95% 53%) 0%, transparent 60%)" }} />
                <CardContent className="p-5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: "hsl(25 95% 53%)" }}>
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg" style={{ color: "hsl(25 95% 53%)" }}>Orange Cap</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Most Runs</p>
                    </div>
                  </div>
                  {(() => {
                    const top = orangeCap[0];
                    const team = findIPLTeam(top.team);
                    return (
                      <div className="flex items-center gap-4">
                        {team && <img src={team.logo} alt={team.shortName} className="h-14 w-14 object-contain" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-foreground truncate">{top.name}</p>
                          <p className="text-xs text-muted-foreground">{team?.name}</p>
                          <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span><b className="text-foreground">{top.matches}</b> M</span>
                            <span><b className="text-foreground">{top.average.toFixed(1)}</b> Avg</span>
                            <span><b className="text-foreground">{top.strikeRate.toFixed(1)}</b> SR</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-display font-bold" style={{ color: "hsl(25 95% 53%)" }}>{top.runs}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">runs</p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>

            {/* Purple Cap Leader */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <Card className="border-2 overflow-hidden relative" style={{ borderColor: "hsl(280 70% 55% / 0.5)" }}>
                <div className="absolute inset-0 opacity-10" style={{ background: "linear-gradient(135deg, hsl(280 70% 55%) 0%, transparent 60%)" }} />
                <CardContent className="p-5 relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: "hsl(280 70% 55%)" }}>
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg" style={{ color: "hsl(280 70% 55%)" }}>Purple Cap</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Most Wickets</p>
                    </div>
                  </div>
                  {(() => {
                    const top = purpleCap[0];
                    const team = findIPLTeam(top.team);
                    return (
                      <div className="flex items-center gap-4">
                        {team && <img src={team.logo} alt={team.shortName} className="h-14 w-14 object-contain" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-foreground truncate">{top.name}</p>
                          <p className="text-xs text-muted-foreground">{team?.name}</p>
                          <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span><b className="text-foreground">{top.matches}</b> M</span>
                            <span><b className="text-foreground">{top.economy.toFixed(2)}</b> Econ</span>
                            <span><b className="text-foreground">{top.best}</b> Best</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-display font-bold" style={{ color: "hsl(280 70% 55%)" }}>{top.wickets}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">wickets</p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Tabbed Leaderboards */}
          <Tabs defaultValue="batting" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="batting" className="font-display">🏏 Most Runs</TabsTrigger>
              <TabsTrigger value="bowling" className="font-display">🎯 Most Wickets</TabsTrigger>
            </TabsList>

            <TabsContent value="batting">
              <Card className="border-2 border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60">
                      <tr className="text-left">
                        <th className="px-2 sm:px-3 py-3 font-display text-xs uppercase text-muted-foreground">#</th>
                        <th className="px-2 sm:px-3 py-3 font-display text-xs uppercase text-muted-foreground">Batter</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center">M</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden sm:table-cell">Inns</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden md:table-cell">HS</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden sm:table-cell">Avg</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center">SR</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden md:table-cell">50/100</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden md:table-cell">4s/6s</th>
                        <th className="px-2 sm:px-3 py-3 font-display text-xs uppercase text-muted-foreground text-center">Runs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orangeCap.map((b, i) => {
                        const team = findIPLTeam(b.team);
                        return (
                          <motion.tr key={b.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                            className={`border-t border-border/40 hover:bg-secondary/30 ${i === 0 ? "bg-orange-500/5" : ""}`}>
                            <td className="px-2 sm:px-3 py-3">
                              <span className="font-display font-bold text-muted-foreground">{i + 1}</span>
                            </td>
                            <td className="px-2 sm:px-3 py-3">
                              <div className="flex items-center gap-2">
                                {team && <img src={team.logo} alt={team.shortName} className="h-7 w-7 object-contain shrink-0" />}
                                <div className="min-w-0">
                                  <p className="font-display font-bold text-foreground text-sm truncate">{b.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{b.team}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center text-foreground">{b.matches}</td>
                            <td className="px-2 py-3 text-center text-muted-foreground hidden sm:table-cell">{b.innings}</td>
                            <td className="px-2 py-3 text-center text-foreground hidden md:table-cell">{b.highest}</td>
                            <td className="px-2 py-3 text-center text-foreground hidden sm:table-cell">{b.average.toFixed(2)}</td>
                            <td className="px-2 py-3 text-center text-foreground">{b.strikeRate.toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-muted-foreground hidden md:table-cell">{b.fifties}/{b.hundreds}</td>
                            <td className="px-2 py-3 text-center text-muted-foreground hidden md:table-cell">{b.fours}/{b.sixes}</td>
                            <td className="px-2 sm:px-3 py-3 text-center">
                              <span className="inline-block bg-orange-500/10 font-display font-bold text-base px-2 py-0.5 rounded" style={{ color: "hsl(25 95% 53%)" }}>{b.runs}</span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="bowling">
              <Card className="border-2 border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60">
                      <tr className="text-left">
                        <th className="px-2 sm:px-3 py-3 font-display text-xs uppercase text-muted-foreground">#</th>
                        <th className="px-2 sm:px-3 py-3 font-display text-xs uppercase text-muted-foreground">Bowler</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center">M</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden sm:table-cell">Ov</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden md:table-cell">Runs</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center">Econ</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden sm:table-cell">Avg</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden md:table-cell">Best</th>
                        <th className="px-2 py-3 font-display text-xs uppercase text-muted-foreground text-center hidden md:table-cell">4w/5w</th>
                        <th className="px-2 sm:px-3 py-3 font-display text-xs uppercase text-muted-foreground text-center">Wkts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purpleCap.map((b, i) => {
                        const team = findIPLTeam(b.team);
                        return (
                          <motion.tr key={b.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                            className={`border-t border-border/40 hover:bg-secondary/30 ${i === 0 ? "bg-purple-500/5" : ""}`}>
                            <td className="px-2 sm:px-3 py-3">
                              <span className="font-display font-bold text-muted-foreground">{i + 1}</span>
                            </td>
                            <td className="px-2 sm:px-3 py-3">
                              <div className="flex items-center gap-2">
                                {team && <img src={team.logo} alt={team.shortName} className="h-7 w-7 object-contain shrink-0" />}
                                <div className="min-w-0">
                                  <p className="font-display font-bold text-foreground text-sm truncate">{b.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{b.team}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center text-foreground">{b.matches}</td>
                            <td className="px-2 py-3 text-center text-muted-foreground hidden sm:table-cell">{b.overs}</td>
                            <td className="px-2 py-3 text-center text-muted-foreground hidden md:table-cell">{b.runs}</td>
                            <td className="px-2 py-3 text-center text-foreground">{b.economy.toFixed(2)}</td>
                            <td className="px-2 py-3 text-center text-foreground hidden sm:table-cell">{b.average.toFixed(2)}</td>
                            <td className="px-2 py-3 text-center text-foreground hidden md:table-cell">{b.best}</td>
                            <td className="px-2 py-3 text-center text-muted-foreground hidden md:table-cell">{b.fourW}/{b.fiveW}</td>
                            <td className="px-2 sm:px-3 py-3 text-center">
                              <span className="inline-block bg-purple-500/10 font-display font-bold text-base px-2 py-0.5 rounded" style={{ color: "hsl(280 70% 55%)" }}>{b.wickets}</span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <NeedHelpButton position="bottom-center" />
      </div>
      <Footer />
    </div>
  );
};

export default IPLPointsTablePage;
