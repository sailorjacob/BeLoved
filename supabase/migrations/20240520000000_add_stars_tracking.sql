-- Add total_stars and weekly_stars_count columns to driver_profiles table
ALTER TABLE public.driver_profiles
ADD COLUMN IF NOT EXISTS total_stars INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_stars_count INTEGER DEFAULT 0;

-- Create a function to update total_stars when a new checkin is added
CREATE OR REPLACE FUNCTION update_driver_stars()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the driver's total stars count
  UPDATE public.driver_profiles
  SET total_stars = total_stars + 1,
      weekly_stars_count = weekly_stars_count + 1
  WHERE id = NEW.driver_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stars count on new checkin
DROP TRIGGER IF EXISTS update_driver_stars_trigger ON public.carwash_checkins;
CREATE TRIGGER update_driver_stars_trigger
AFTER INSERT ON public.carwash_checkins
FOR EACH ROW
EXECUTE FUNCTION update_driver_stars();

-- Create a function to reset weekly stars count on Sunday at midnight
CREATE OR REPLACE FUNCTION reset_weekly_stars()
RETURNS void AS $$
BEGIN
  UPDATE public.driver_profiles
  SET weekly_stars_count = 0;
END;
$$ LANGUAGE plpgsql;

-- You would typically call this function from a scheduled job
-- This can be set up in your application's scheduler or using Supabase's edge functions with cron 

SELECT * FROM pg_available_extensions WHERE name = 'pg_cron'; 