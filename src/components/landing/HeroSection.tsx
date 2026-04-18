import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Trophy, Shield, ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0 bg-grid opacity-10" />
      
      {/* Accent line */}
      <div className="absolute top-14 left-0 right-0 h-1 gradient-primary" />

      <div className="container relative z-10 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6">
              <Zap className="h-3 w-3" />
              Live Now
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[0.95] mb-5">
              <span className="text-foreground">PLAY.</span>
              <br />
              <span className="text-primary">PREDICT.</span>
              <br />
              <span className="text-foreground">WIN BIG.</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
              India's most exciting skill-based gaming and sports prediction platform. 
              Play real games. Win real rewards.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/games">
                <Button size="lg" className="gradient-primary text-primary-foreground font-display text-base tracking-wider px-8 box-glow">
                  Start Playing <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:border-primary/40 hover:text-primary font-display tracking-wider px-8">
                  Create Account
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex gap-8">
              {[
                { value: "5+", label: "Games" },
                { value: "24/7", label: "Live" },
                { value: "100%", label: "Secure" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-display font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Game cards preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:block relative"
          >
            <div className="space-y-3">
              {[
                { icon: "🎯", name: "Color Trading", status: "LIVE", players: "2.4K" },
                { icon: "🏏", name: "Cricket Predictions", status: "LIVE", players: "5.1K" },
                { icon: "🎱", name: "Ball Pool", status: "LIVE", players: "1.8K" },
                { icon: "♠️", name: "Rummy", status: "LIVE", players: "3.2K" },
              ].map((game, i) => (
                <motion.div
                  key={game.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/60 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{game.icon}</span>
                    <div>
                      <div className="text-sm font-display font-semibold text-foreground group-hover:text-primary transition-colors">{game.name}</div>
                      <div className="text-xs text-muted-foreground">{game.players} playing</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                      {game.status}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
