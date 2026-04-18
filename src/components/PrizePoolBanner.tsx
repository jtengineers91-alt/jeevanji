import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface Props {
  gameType: string;
  className?: string;
}

const PrizePoolBanner = ({ gameType, className = "" }: Props) => {
  const [amount, setAmount] = useState<number | null>(null);
  const [words, setWords] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("game_configs")
        .select("settings")
        .eq("game_type", gameType)
        .maybeSingle();
      if (!alive) return;
      const s = (data?.settings as any) || {};
      setAmount(s.prize_pool ?? null);
      setWords(s.prize_pool_words ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [gameType]);

  if (!amount) return null;

  return (
    <Card className={`border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex items-center gap-3 ${className}`}>
      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Trophy className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">Total Prize Pool</p>
        <p className="text-2xl sm:text-3xl font-display font-extrabold text-primary leading-tight">
          ₹{amount.toLocaleString("en-IN")}
        </p>
        {words ? <p className="text-xs sm:text-sm text-foreground/80 italic">{words}</p> : null}
      </div>
    </Card>
  );
};

export default PrizePoolBanner;
