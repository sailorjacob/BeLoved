-- Create custom types
CREATE TYPE user_type AS ENUM ('member', 'driver', 'admin');
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
CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'on_break');
CREATE TYPE payment_status AS ENUM ('pending', 'paid');
CREATE TYPE recurring_type AS ENUM ('none', 'daily', 'weekly', 'monthly');

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  user_type user_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create rides table
CREATE TABLE rides (
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

-- Create driver_profiles table
CREATE TABLE driver_profiles (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status driver_status DEFAULT 'active',
  completed_rides INTEGER DEFAULT 0,
  total_miles NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_timestamp_rides
  BEFORE UPDATE ON rides
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_timestamp_driver_profiles
  BEFORE UPDATE ON driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Rides policies
CREATE POLICY "Members can view their own rides"
  ON rides FOR SELECT
  USING (auth.uid() = member_id);

CREATE POLICY "Drivers can view their assigned rides"
  ON rides FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all rides"
  ON rides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Members can create rides"
  ON rides FOR INSERT
  WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Members can update their own rides"
  ON rides FOR UPDATE
  USING (auth.uid() = member_id);

-- Driver profiles policies
CREATE POLICY "Driver profiles are viewable by everyone"
  ON driver_profiles FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage driver profiles"
  ON driver_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Drivers can update their own profile"
  ON driver_profiles FOR UPDATE
  USING (auth.uid() = id); 