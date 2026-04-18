
CREATE TABLE public.daily_match_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  match_id uuid NOT NULL REFERENCES public.cricket_matches(id) ON DELETE CASCADE,
  predicted_team text NOT NULL,
  amount bigint NOT NULL,
  payout bigint DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE public.daily_match_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily predictions" ON public.daily_match_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create daily predictions" ON public.daily_match_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage daily predictions" ON public.daily_match_predictions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all daily predictions" ON public.daily_match_predictions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
