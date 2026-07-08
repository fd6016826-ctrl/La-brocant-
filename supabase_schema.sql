-- SQL Script to initialize all required tables on Supabase for La Brocante

-- 1. Create profiles table (users)
CREATE TABLE IF NOT EXISTS public.profiles (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public upsert access to profiles" ON public.profiles;
CREATE POLICY "Allow public upsert access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Insert the two active default accounts
INSERT INTO public.profiles (email, name, avatar_url)
VALUES 
    ('jean.testeur@gmail.com', 'Jean Testeur', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop'),
    ('sophie.b69@gmail.com', 'Sophie B.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url;


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
    seller_email TEXT,
    seller_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_sold BOOLEAN DEFAULT false,
    is_sponsored BOOLEAN DEFAULT false,
    buyer_email TEXT,
    buyer_name TEXT,
    buyer_confirmed BOOLEAN DEFAULT false,
    seller_confirmed BOOLEAN DEFAULT false,
    requested_quantity INTEGER DEFAULT 1
);

-- Enable Row Level Security (RLS) for listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to listings" ON public.listings;
CREATE POLICY "Allow public read access to listings" ON public.listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to listings" ON public.listings;
CREATE POLICY "Allow public insert access to listings" ON public.listings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to listings" ON public.listings;
CREATE POLICY "Allow public update access to listings" ON public.listings FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete access to listings" ON public.listings;
CREATE POLICY "Allow public delete access to listings" ON public.listings FOR DELETE USING (true);


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
    buyer_email TEXT,
    buyer_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for demands
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to demands" ON public.demands;
CREATE POLICY "Allow public read access to demands" ON public.demands FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to demands" ON public.demands;
CREATE POLICY "Allow public insert access to demands" ON public.demands FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to demands" ON public.demands;
CREATE POLICY "Allow public update access to demands" ON public.demands FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete access to demands" ON public.demands;
CREATE POLICY "Allow public delete access to demands" ON public.demands FOR DELETE USING (true);


-- 4. Create chats table (fils de discussion de messagerie)
CREATE TABLE IF NOT EXISTS public.chats (
    id TEXT PRIMARY KEY,
    listing_id TEXT,
    listing_title TEXT,
    listing_price NUMERIC,
    listing_image_url TEXT,
    seller_email TEXT,
    seller_name TEXT,
    buyer_email TEXT,
    buyer_name TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    requested_quantity INTEGER DEFAULT 1
);

-- Enable Row Level Security (RLS) for chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to chats" ON public.chats;
CREATE POLICY "Allow public read access to chats" ON public.chats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert access to chats" ON public.chats;
CREATE POLICY "Allow public insert access to chats" ON public.chats FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update access to chats" ON public.chats;
CREATE POLICY "Allow public update access to chats" ON public.chats FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete access to chats" ON public.chats;
CREATE POLICY "Allow public delete access to chats" ON public.chats FOR DELETE USING (true);
