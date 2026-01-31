ALTER TABLE public.profiles
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS trial_start_date,
DROP COLUMN IF EXISTS trial_end_date,
DROP COLUMN IF EXISTS tier;

-- Drop subscription columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    onboarding_completed
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    false
  );
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
