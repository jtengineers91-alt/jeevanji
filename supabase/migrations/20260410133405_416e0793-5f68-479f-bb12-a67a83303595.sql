
-- Add screenshot column to transactions
ALTER TABLE public.transactions ADD COLUMN payment_screenshot_url text;

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true);

-- Storage policies
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view payment screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots');

CREATE POLICY "Admins can manage payment screenshots"
ON storage.objects FOR ALL
USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'::app_role));
