-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'ngo_user', 'viewer');

-- Create organization types enum
CREATE TYPE public.org_type AS ENUM ('ngo', 'government', 'partner');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type org_type NOT NULL DEFAULT 'ngo',
  color TEXT DEFAULT '#1E3A5F',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'ngo_user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create areas table
CREATE TABLE public.areas (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  district TEXT NOT NULL,
  village TEXT NOT NULL,
  latitude DECIMAL(9, 6) NOT NULL,
  longitude DECIMAL(9, 6) NOT NULL,
  population INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create aid_type enum
CREATE TYPE public.aid_type AS ENUM ('water', 'food', 'health', 'cash');

-- Create aid_records table
CREATE TABLE public.aid_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id TEXT NOT NULL REFERENCES public.areas(id),
  aid_type aid_type NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  quantity DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  delivery_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aid_records ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- RLS Policies for organizations
CREATE POLICY "Anyone can view organizations"
  ON public.organizations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage organizations"
  ON public.organizations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for areas
CREATE POLICY "Anyone can view areas"
  ON public.areas FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert areas"
  ON public.areas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage areas"
  ON public.areas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for aid_records
CREATE POLICY "Anyone can view aid records"
  ON public.aid_records FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert aid records"
  ON public.aid_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own org records"
  ON public.aid_records FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can delete their own org records"
  ON public.aid_records FOR DELETE
  TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Default role is ngo_user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'ngo_user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aid_records_updated_at
  BEFORE UPDATE ON public.aid_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial organizations
INSERT INTO public.organizations (id, name, type, color) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'UNICEF', 'ngo', '#00AEEF'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'World Food Programme', 'ngo', '#009edb'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Red Cross', 'ngo', '#ED1B2E'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Ministry of Health', 'government', '#2E8B57'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Save the Children', 'ngo', '#E31837'),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'Oxfam', 'ngo', '#61A534');

-- Seed initial areas
INSERT INTO public.areas (id, country, region, district, village, latitude, longitude, population) VALUES
  ('SO-BAY-BDW-GBW', 'Somalia', 'Bay', 'Baidoa', 'Gob Weyn', 3.1167, 43.6500, 2500),
  ('SO-BAY-BDW-HWD', 'Somalia', 'Bay', 'Baidoa', 'Howl Wadag', 3.1200, 43.6600, 3200),
  ('SO-BAY-BDW-IFT', 'Somalia', 'Bay', 'Baidoa', 'Iftiin', 3.1100, 43.6400, 1800),
  ('SO-BAY-DIN-WRB', 'Somalia', 'Bay', 'Dinsor', 'Warbaley', 2.4167, 43.5167, 4100),
  ('SO-BAY-DIN-XGR', 'Somalia', 'Bay', 'Dinsor', 'Xagar', 2.4300, 43.5300, 2900),
  ('SO-BAY-QNS-BMR', 'Somalia', 'Bay', 'Qansax Dheere', 'Buulo Mareer', 2.7667, 44.0833, 3500),
  ('SO-HRN-BLT-DGD', 'Somalia', 'Hiraan', 'Beledweyne', 'Dug Dug', 4.7356, 45.2036, 5200),
  ('SO-HRN-BLT-MXD', 'Somalia', 'Hiraan', 'Beledweyne', 'Maxaas Dheer', 4.7500, 45.2100, 2100),
  ('SO-GDO-GBH-SHL', 'Somalia', 'Gedo', 'Garbahaarey', 'Shilabo', 3.3333, 42.2167, 3800),
  ('SO-GDO-LKD-BRH', 'Somalia', 'Gedo', 'Luuq', 'Bur Hakaba', 3.8000, 42.5500, 4500);