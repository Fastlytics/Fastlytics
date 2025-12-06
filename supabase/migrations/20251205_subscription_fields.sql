-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone DEFAULT (now() + interval '14 days'),
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free';

-- Update the handle_new_user function to include default subscription data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    avatar_url,
    subscription_status,
    trial_start_date,
    trial_end_date,
    tier
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'free',
    null,
    null,
    'free'
  );
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset existing users to free tier (Run this to fix current data)
UPDATE public.profiles 
SET subscription_status = 'free', 
    trial_start_date = NULL, 
    trial_end_date = NULL, 
    tier = 'free'
WHERE subscription_status = 'trialing' OR subscription_status = 'active';
