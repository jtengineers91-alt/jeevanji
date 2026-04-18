import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Spade, Palette, Circle, Trophy, Medal, Crown, ArrowRight, TrendingUp, Star, Users, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const useFakePlayers = (base: number) => {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);
  return Math.max(base - 20, count);
};

import gameFantasy from "@/assets/game-fantasy.jpg";
import gameIpl from "@/assets/game-ipl.jpg";
import gameMotm from "@/assets/game-motm.jpg";
import gameColorTrading from "@/assets/game-color-trading.jpg";
import gameBallPool from "@/assets/game-ball-pool.jpg";
import gameRummy from "@/assets/game-rummy.jpg";
import gameDailyWinner from "@/assets/game-daily-winner.jpg";

const trendingGames = [
  {
    title: "IPL Winner Predict",
    description: "Predict the IPL champion team",
    image: gameIpl,
    route: "/games/ipl-prediction",
    icon: Medal,
    color: "text-neon-purple",
    prize: null,
    players: 8721,
  },
  {
    title: "Daily Match Winner",
    description: "Predict today's winning team",
    image: gameDailyWinner,
    route: "/games/daily-winner",
    icon: Swords,
    color: "text-neon-blue",
    prize: null,
    players: 7200,
  },
  {
    title: "Man of the Match",
    description: "Pick the match hero & earn rewards",
    image: gameMotm,
    route: "/games/man-of-match",
    icon: Trophy,
    color: "text-gold",
    prize: null,
    players: 6389,
  },
  {
    title: "Fantasy Cricket",
    description: "Build your dream team & win big",
    image: gameFantasy,
    route: "/games/fantasy-cricket",
    icon: Crown,
    color: "text-primary",
    prize: "Win Upto ₹50 Crore",
    players: 12453,
  },
];
const popularGames = [
  {
    title: "Color Trading",
    description: "Predict the color & multiply your bet",
    image: gameColorTrading,
    route: "/games/color-trading",
    icon: Palette,
    color: "text-neon-orange",
    players: 9234,
  },
  {
    title: "Ball Pool",
    description: "Pick the winning ball number",
    image: gameBallPool,
    route: "/games/ball-pool",
    icon: Circle,
    color: "text-neon-blue",
    players: 5412,
  },
  {
    title: "Rummy",
    description: "Classic card game with real stakes",
    image: gameRummy,
    route: "/games/rummy",
    icon: Spade,
    players: 7891,
    color: "text-neon-red",
  },
];

interface GameCardProps {
  game: {
    title: string;
    description: string;
    image: string;
    route: string;
    icon: any;
    color: string;
    prize?: string | null;
    players: number;
  };
  index: number;
  large?: boolean;
}

const GameCard = ({ game, index, large }: GameCardProps) => {
  const Icon = game.icon;
  const livePlayers = useFakePlayers(game.players);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={game.route} className="block pm-card overflow-hidden group">
        <div className="relative overflow-hidden">
          <img
            src={game.image}
            alt={game.title}
            loading="lazy"
            width={768}
            height={512}
            className={`w-full object-cover ${large ? "h-44 sm:h-52" : "h-36 sm:h-40"} group-hover:scale-105 transition-transform duration-500`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 backdrop-blur-sm px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            LIVE
          </div>
          {game.prize && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="bg-gold/90 text-background font-display text-[10px] border-0 animate-pulse">
                🏆 {game.prize}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-4 w-4 ${game.color}`} />
            <h3 className="font-display text-base font-bold text-foreground">{game.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{game.description}</p>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3 text-primary" />
              <span className="text-primary font-semibold">{livePlayers.toLocaleString()}</span> playing
            </span>
            <Button size="sm" className="h-7 px-3 text-xs gradient-primary text-primary-foreground font-display tracking-wide">
              Play Now <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const GameModules = () => {
  return (
    <section id="games" className="py-12 relative space-y-14">
      <div className="container">
        {/* Trending Games */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              <span className="text-primary">Trending</span> Games
            </h2>
          </div>
          <Link to="/games">
            <Button variant="ghost" className="text-primary hover:bg-primary/5 font-display text-sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingGames.map((game, i) => (
            <GameCard key={game.title} game={game} index={i} large />
          ))}
        </div>
      </div>

      <div className="container">
        {/* Popular Games */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-gold" />
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              <span className="text-gold">Popular</span> Games
            </h2>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularGames.map((game, i) => (
            <GameCard key={game.title} game={game} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameModules;
