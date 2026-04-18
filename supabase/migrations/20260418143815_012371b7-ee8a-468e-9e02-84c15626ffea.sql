CREATE TABLE IF NOT EXISTS public.ipl_standings_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season text NOT NULL,
  short_name text NOT NULL,
  played integer NOT NULL DEFAULT 0,
  won integer NOT NULL DEFAULT 0,
  lost integer NOT NULL DEFAULT 0,
  no_result integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  nrr numeric NOT NULL DEFAULT 0,
  form jsonb NOT NULL DEFAULT '[]'::jsonb,
  position integer NOT NULL DEFAULT 0,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  synced_by text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season, short_name)
);

CREATE INDEX IF NOT EXISTS idx_ipl_standings_season ON public.ipl_standings_cache(season);

ALTER TABLE public.ipl_standings_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view standings"
  ON public.ipl_standings_cache FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert standings"
  ON public.ipl_standings_cache FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update standings"
  ON public.ipl_standings_cache FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete standings"
  ON public.ipl_standings_cache FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ipl_standings_cache_updated_at
  BEFORE UPDATE ON public.ipl_standings_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();