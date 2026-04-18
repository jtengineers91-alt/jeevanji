import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trophy, ArrowRight, Swords } from "lucide-react";
import playerVirat from "@/assets/ipl-player-virat.jpg";
import playerMSD from "@/assets/ipl-player-msd.jpg";
import playerABD from "@/assets/ipl-player-abd.jpg";
import playerRohit from "@/assets/ipl-player-rohit.jpg";
import playerHardik from "@/assets/ipl-player-hardik.jpg";
import bannerDailyWinner from "@/assets/banner-daily-winner.jpg";

const banners = [
  {
    image: bannerDailyWinner,
    player: "",
    tagline: "Daily Match Winner",
    title: "Predict & Win Daily",
    subtitle: "Pick today's winning team from live IPL matches — instant results, instant rewards!",
    cta: "Play Daily Winner",
    link: "/games/daily-winner",
    icon: "swords",
  },
  {
    image: playerVirat,
    player: "Virat Kohli",
    tagline: "Fantasy Cricket League",
    title: "Win Upto ₹50 Crore",
    subtitle: "Build your dream team, pick your captain & crush the leaderboard!",
    cta: "Play Fantasy Cricket",
    link: "/games/fantasy-cricket",
  },
  {
    image: playerMSD,
    player: "MS Dhoni",
    tagline: "Fantasy Cricket",
    title: "Win Upto ₹50 Crore",
    subtitle: "Captain your squad like Thala — pick smart, win big!",
    cta: "Create Your Team",
    link: "/games/fantasy-cricket",
  },
  {
    image: playerABD,
    player: "AB de Villiers",
    tagline: "Mega Fantasy Contest",
    title: "Win Upto ₹50 Crore",
    subtitle: "Play 360° Fantasy Cricket — every match, massive prizes!",
    cta: "Join Fantasy Now",
    link: "/games/fantasy-cricket",
  },
  {
    image: playerRohit,
    player: "Rohit Sharma",
    tagline: "Fantasy Premier League",
    title: "Win Upto ₹50 Crore",
    subtitle: "Hit it out of the park with India's biggest fantasy platform",
    cta: "Enter Fantasy Contest",
    link: "/games/fantasy-cricket",
  },
  {
    image: playerHardik,
    player: "Hardik Pandya",
    tagline: "All-Rounder Fantasy",
    title: "Win Upto ₹50 Crore",
    subtitle: "Show your all-round skills — build teams & win crores!",
    cta: "Play & Win",
    link: "/games/fantasy-cricket",
  },
];

const IPLBannerCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((p) => (p + 1) % banners.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + banners.length) % banners.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [next]);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const b = banners[current];

  return (
    <section className="relative w-full overflow-hidden bg-card border-b border-border">
      <div className="relative h-[300px] sm:h-[380px] md:h-[440px] lg:h-[520px]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* BG Image */}
            <img
              src={b.image}
              alt={b.player}
              className="absolute inset-0 w-full h-full object-cover object-top"
              width={1920}
              height={640}
            />
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="container">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="max-w-lg"
                >
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/15 border border-primary/25 text-primary text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-3">
                      {(b as any).icon === "swords" ? <Swords className="h-3 w-3" /> : <Trophy className="h-3 w-3" />}
                      {b.tagline}
                    </div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-none mb-1">
                    {b.title}
                  </h2>
                  {b.player && (
                    <p className="text-xs sm:text-sm text-primary/80 font-display font-semibold tracking-wide mb-2">
                      ft. {b.player}
                    </p>
                  )}
                  <p className="text-sm sm:text-base text-muted-foreground mb-5 max-w-sm">
                    {b.subtitle}
                  </p>
                  <Link to={b.link}>
                    <Button className="gradient-primary text-primary-foreground font-display tracking-wider px-6 box-glow">
                      {b.cta} <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary/20 hover:border-primary/40 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary/20 hover:border-primary/40 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-6 bg-primary" : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default IPLBannerCarousel;
