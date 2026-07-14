-- SQL Script to initialize all required tables on Supabase for La Brocante
-- Structured with connected tables (foreign keys) and notification system

-- 1. Create profiles table (users)
CREATE TABLE IF NOT EXISTS public.profiles (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT,
    password TEXT, -- Local fallback authentication
    pref_notif_announcements BOOLEAN DEFAULT true, -- User choice for announcement alerts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow owner update access to profiles" ON public.profiles;
CREATE POLICY "Allow owner update access to profiles" ON public.profiles FOR ALL USING (email = auth.jwt()->>'email') WITH CHECK (email = auth.jwt()->>'email');

-- Insert the default active accounts
INSERT INTO public.profiles (email, name, avatar_url, password, pref_notif_announcements)
VALUES 
    ('fd6016826@gmail.com', 'Fallou Diouf', 'data:image/svg+xml;utf8,<svg xmlns=''http://www.w3.org/2000/svg'' viewBox=''0 0 100 100''><defs><linearGradient id=''g1'' x1=''0%'' y1=''0%'' x2=''100%'' y2=''100%''><stop offset=''0%'' stop-color=''%23fbbf24''/><stop offset=''100%'' stop-color=''%23d97706''/></linearGradient></defs><rect width=''100'' height=''100'' rx=''28'' fill=''url(%23g1)''/><g fill=''none'' stroke=''%23ffffff'' stroke-width=''5.5'' stroke-linecap=''round'' stroke-linejoin=' 'round''><path d=''M30 42h40v30c0 4-3 7-7 7H37c-4 0-7-3-7-7V42z''/><path d=''M40 42c0-5 3-9 10-9s10 4 10 9''/><circle cx=''50'' cy=''58'' r=''4'' fill=''%23ffffff''/></g></svg>', 'Diouffallou@2004', true),
    ('jean.testeur@gmail.com', 'Jean Testeur', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop', '123456', true),
    ('sophie.b69@gmail.com', 'Sophie B.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', '123456', true)
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, password = EXCLUDED.password;



-- 2. Create listings table (annonces de vente)
CREATE TABLE IF NOT EXISTS public.listings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    category TEXT,
    location TEXT,
    condition TEXT,
    image_url TEXT,
    video_url TEXT,
    size TEXT,
    color TEXT,
    quantity INTEGER DEFAULT 1,
    additional_images JSONB DEFAULT '[]'::jsonb,
    seller_name TEXT,
    seller_email TEXT REFERENCES public.profiles(email) ON DELETE SET NULL ON UPDATE CASCADE,
    seller_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_sold BOOLEAN DEFAULT false,
    is_sponsored BOOLEAN DEFAULT false,
    buyer_email TEXT REFERENCES public.profiles(email) ON DELETE SET NULL ON UPDATE CASCADE,
    buyer_name TEXT,
    buyer_confirmed BOOLEAN DEFAULT false,
    seller_confirmed BOOLEAN DEFAULT false,
    requested_quantity INTEGER DEFAULT 1
);

-- Enable Row Level Security (RLS) for listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to listings" ON public.listings;
CREATE POLICY "Allow public read access to listings" ON public.listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert access to listings" ON public.listings;
CREATE POLICY "Allow authenticated insert access to listings" ON public.listings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow owners and buyers update access to listings" ON public.listings;
CREATE POLICY "Allow owners and buyers update access to listings" ON public.listings FOR UPDATE USING (
    seller_email = auth.jwt()->>'email' OR buyer_email = auth.jwt()->>'email'
) WITH CHECK (
    seller_email = auth.jwt()->>'email' OR buyer_email = auth.jwt()->>'email'
);

DROP POLICY IF EXISTS "Allow owners delete access to listings" ON public.listings;
CREATE POLICY "Allow owners delete access to listings" ON public.listings FOR DELETE USING (seller_email = auth.jwt()->>'email');


-- 3. Create demands table (recherches citoyennes d'achat)
CREATE TABLE IF NOT EXISTS public.demands (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    desired_price NUMERIC,
    quantity INTEGER DEFAULT 1,
    size TEXT,
    color TEXT,
    other_specs TEXT,
    image_url TEXT,
    buyer_email TEXT REFERENCES public.profiles(email) ON DELETE CASCADE ON UPDATE CASCADE,
    buyer_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for demands
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to demands" ON public.demands;
CREATE POLICY "Allow public read access to demands" ON public.demands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert access to demands" ON public.demands;
CREATE POLICY "Allow authenticated insert access to demands" ON public.demands FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow owners update access to demands" ON public.demands;
CREATE POLICY "Allow owners update access to demands" ON public.demands FOR UPDATE USING (buyer_email = auth.jwt()->>'email') WITH CHECK (buyer_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Allow owners delete access to demands" ON public.demands;
CREATE POLICY "Allow owners delete access to demands" ON public.demands FOR DELETE USING (buyer_email = auth.jwt()->>'email');


-- 4. Create chats table (fils de discussion de messagerie)
CREATE TABLE IF NOT EXISTS public.chats (
    id TEXT PRIMARY KEY,
    listing_id TEXT REFERENCES public.listings(id) ON DELETE SET NULL ON UPDATE CASCADE,
    listing_title TEXT,
    listing_price NUMERIC,
    listing_image_url TEXT,
    seller_email TEXT REFERENCES public.profiles(email) ON DELETE SET NULL ON UPDATE CASCADE,
    seller_name TEXT,
    buyer_email TEXT REFERENCES public.profiles(email) ON DELETE SET NULL ON UPDATE CASCADE,
    buyer_name TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    requested_quantity INTEGER DEFAULT 1
);

-- Enable Row Level Security (RLS) for chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members read access to chats" ON public.chats;
CREATE POLICY "Allow members read access to chats" ON public.chats FOR SELECT USING (
    buyer_email = auth.jwt()->>'email' OR seller_email = auth.jwt()->>'email'
);

DROP POLICY IF EXISTS "Allow authenticated insert access to chats" ON public.chats;
CREATE POLICY "Allow authenticated insert access to chats" ON public.chats FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow members update access to chats" ON public.chats;
CREATE POLICY "Allow members update access to chats" ON public.chats FOR UPDATE USING (
    buyer_email = auth.jwt()->>'email' OR seller_email = auth.jwt()->>'email'
) WITH CHECK (
    buyer_email = auth.jwt()->>'email' OR seller_email = auth.jwt()->>'email'
);

DROP POLICY IF EXISTS "Allow members delete access to chats" ON public.chats;
CREATE POLICY "Allow members delete access to chats" ON public.chats FOR DELETE USING (
    buyer_email = auth.jwt()->>'email' OR seller_email = auth.jwt()->>'email'
);


-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE ON UPDATE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'system', 'purchase', 'announcement', 'demand'
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user read access to notifications" ON public.notifications;
CREATE POLICY "Allow user read access to notifications" ON public.notifications FOR SELECT USING (user_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Allow system insert access to notifications" ON public.notifications;
CREATE POLICY "Allow system insert access to notifications" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow user update access to notifications" ON public.notifications;
CREATE POLICY "Allow user update access to notifications" ON public.notifications FOR UPDATE USING (user_email = auth.jwt()->>'email') WITH CHECK (user_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Allow user delete access to notifications" ON public.notifications;
CREATE POLICY "Allow user delete access to notifications" ON public.notifications FOR DELETE USING (user_email = auth.jwt()->>'email');
