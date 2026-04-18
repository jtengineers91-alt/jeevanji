import { motion } from "framer-motion";
import { Shield, Wallet, Users, BarChart3, Smartphone, Trophy } from "lucide-react";

const features = [
  { icon: Shield, title: "Fair Play", desc: "Server-side RNG validation ensures every game is provably fair" },
  { icon: Wallet, title: "Instant Wallet", desc: "Deposit and withdraw securely with real-time balance tracking" },
  { icon: Users, title: "Referral Bonus", desc: "Invite friends and earn bonus credits on every signup" },
  { icon: BarChart3, title: "Live Stats", desc: "Real-time analytics, leaderboards, and performance tracking" },
  { icon: Trophy, title: "Daily Tournaments", desc: "Compete in daily contests with massive prize pools" },
  { icon: Smartphone, title: "Play Anywhere", desc: "Optimized for mobile, tablet, and desktop devices" },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-4xl font-display font-bold mb-2">
            Why <span className="text-primary">JEEVAN</span>?
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Built for serious players who demand security, speed, and fairness
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="p-4 md:p-5 pm-card group"
            >
              <div className="w-9 h-9 rounded flex items-center justify-center bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-display text-sm md:text-base font-bold text-foreground mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
