-- Create custom types if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE user_type AS ENUM ('member', 'driver', 'admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ride_status') THEN
        CREATE TYPE ride_status AS ENUM (
            'pending',
            'assigned',
            'started',
            'picked_up',
            'completed',
            'return_pending',
            'return_started',
            'return_picked_up',
            'return_completed'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status') THEN
        CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'on_break');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurring_type') THEN
        CREATE TYPE recurring_type AS ENUM ('none', 'daily', 'weekly', 'monthly');
    END IF;
END $$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  user_type user_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create rides table if it doesn't exist
CREATE TABLE IF NOT EXISTS rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES profiles(id),
  driver_id UUID REFERENCES profiles(id),
  pickup_address JSONB NOT NULL,
  dropoff_address JSONB NOT NULL,
  scheduled_pickup_time TIMESTAMPTZ NOT NULL,
  status ride_status DEFAULT 'pending',
  start_miles NUMERIC,
  end_miles NUMERIC,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  notes TEXT,
  payment_method TEXT NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  recurring recurring_type DEFAULT 'none',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create driver_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status driver_status DEFAULT 'active',
  completed_rides INTEGER DEFAULT 0,
  total_miles NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create function to handle updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_profiles') THEN
        CREATE TRIGGER set_timestamp_profiles
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_rides') THEN
        CREATE TRIGGER set_timestamp_rides
            BEFORE UPDATE ON rides
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_driver_profiles') THEN
        CREATE TRIGGER set_timestamp_driver_profiles
            BEFORE UPDATE ON driver_profiles
            FOR EACH ROW
            EXECUTE FUNCTION handle_updated_at();
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DO $$ BEGIN
    -- Profiles policies
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    
    -- Driver profiles policies
    DROP POLICY IF EXISTS "Driver profiles are viewable by everyone" ON driver_profiles;
    DROP POLICY IF EXISTS "Drivers can update their own profile" ON driver_profiles;
    DROP POLICY IF EXISTS "Only admins can create driver profiles" ON driver_profiles;
    
    -- Rides policies
    DROP POLICY IF EXISTS "Members can view their own rides" ON rides;
    DROP POLICY IF EXISTS "Members can create their own rides" ON rides;
    DROP POLICY IF EXISTS "Members and drivers can update their rides" ON rides;
END $$;

-- Create new policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Driver profiles are viewable by everyone"
ON driver_profiles FOR SELECT
USING (true);

CREATE POLICY "Drivers can update their own profile"
ON driver_profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Only admins can create driver profiles"
ON driver_profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

CREATE POLICY "Members can view their own rides"
ON rides FOR SELECT
USING (
  auth.uid() = member_id OR
  auth.uid() = driver_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

CREATE POLICY "Members can create their own rides"
ON rides FOR INSERT
WITH CHECK (
  auth.uid() = member_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

CREATE POLICY "Members and drivers can update their rides"
ON rides FOR UPDATE
USING (
  auth.uid() = member_id OR
  auth.uid() = driver_id OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

-- Create functions for ride management if they don't exist
CREATE OR REPLACE FUNCTION update_driver_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE driver_profiles
    SET completed_rides = completed_rides + 1
    WHERE id = NEW.driver_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for driver stats if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_driver_stats_trigger') THEN
        CREATE TRIGGER update_driver_stats_trigger
            AFTER UPDATE ON rides
            FOR EACH ROW
            EXECUTE FUNCTION update_driver_stats();
    END IF;
END $$;

-- Create function to handle recurring rides if it doesn't exist
CREATE OR REPLACE FUNCTION create_recurring_ride()
RETURNS TRIGGER AS $$
DECLARE
  next_pickup_time TIMESTAMP;
BEGIN
  IF NEW.recurring != 'none' THEN
    CASE NEW.recurring
      WHEN 'daily' THEN
        next_pickup_time := NEW.scheduled_pickup_time + INTERVAL '1 day';
      WHEN 'weekly' THEN
        next_pickup_time := NEW.scheduled_pickup_time + INTERVAL '1 week';
      WHEN 'monthly' THEN
        next_pickup_time := NEW.scheduled_pickup_time + INTERVAL '1 month';
    END CASE;

    INSERT INTO rides (
      member_id,
      pickup_address,
      dropoff_address,
      scheduled_pickup_time,
      notes,
      payment_method,
      recurring,
      status
    ) VALUES (
      NEW.member_id,
      NEW.pickup_address,
      NEW.dropoff_address,
      next_pickup_time,
      NEW.notes,
      NEW.payment_method,
      NEW.recurring,
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for recurring rides if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'create_recurring_ride_trigger') THEN
        CREATE TRIGGER create_recurring_ride_trigger
            AFTER INSERT ON rides
            FOR EACH ROW
            EXECUTE FUNCTION create_recurring_ride();
    END IF;
END $$; 