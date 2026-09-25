-- SQL Script to initialize all required tables on Supabase for La Brocante
-- Structured with connected tables (foreign keys) and notification system

-- 1. Create profiles table (users)
CREATE TABLE IF NOT EXISTS public.profiles (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_url TEXT,
    password TEXT, -- Hash PBKDF2 UNIQUEMENT (jamais de mot de passe en clair)
    pref_notif_announcements BOOLEAN DEFAULT true, -- User choice for announcement alerts
    is_pro BOOLEAN DEFAULT false,
    pro_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for profiles
-- ⚠️ La colonne password ne doit JAMAIS être lisible via l'API publique
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
-- Masquer les hash de mots de passe à toute lecture via PostgREST (even service_key exposes via API)
REVOKE ALL ON public.profiles FROM anon;
CREATE OR REPLACE FUNCTION public.safe_profile()
RETURNS TABLE (email TEXT, name TEXT, avatar_url TEXT, pref_notif_announcements BOOLEAN, is_pro BOOLEAN, pro_expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT email, name, avatar_url, pref_notif_announcements, is_pro, pro_expires_at FROM public.profiles;
$$;
GRANT EXECUTE ON FUNCTION public.safe_profile() TO anon, authenticated;
DROP POLICY IF EXISTS "Allow owner update access to profiles" ON public.profiles;
CREATE POLICY "Allow owner update access to profiles" ON public.profiles FOR ALL USING (email = auth.jwt()->>'email') WITH CHECK (email = auth.jwt()->>'email');

-- -----------------------------------------------------------------------------
-- SUPPRESSION DES COMPTES ET DONNÉES DE TEST
-- Exécuter UNE FOIS en production pour nettoyer les anciens comptes de démo.
-- Le profil admin n'est PAS supprimé.
-- -----------------------------------------------------------------------------
DELETE FROM public.notifications WHERE user_email IN (
    'jean.testeur@gmail.com', 'sophie.b69@gmail.com', 'marc.dupuis@outlook.fr', 'pierre.m@gmail.com'
);
DELETE FROM public.chats WHERE buyer_email IN (
    'jean.testeur@gmail.com', 'sophie.b69@gmail.com', 'marc.dupuis@outlook.fr', 'pierre.m@gmail.com'
) OR seller_email IN (
    'jean.testeur@gmail.com', 'sophie.b69@gmail.com', 'marc.dupuis@outlook.fr', 'pierre.m@gmail.com'
);
DELETE FROM public.demands WHERE buyer_email IN (
    'jean.testeur@gmail.com', 'sophie.b69@gmail.com', 'marc.dupuis@outlook.fr', 'pierre.m@gmail.com'
);
DELETE FROM public.listings WHERE seller_email IN (
    'jean.testeur@gmail.com', 'sophie.b69@gmail.com', 'marc.dupuis@outlook.fr', 'pierre.m@gmail.com'
);
DELETE FROM public.profiles WHERE email IN (
    'jean.testeur@gmail.com', 'sophie.b69@gmail.com', 'marc.dupuis@outlook.fr', 'pierre.m@gmail.com'
);
-- Si des utilisateurs ont été créés via l'inscription OTP et n'ont jamais payé,
-- ils restent — c'est de vrais comptes. À supprimer manuellement si nécessaire.

-- AUCUN compte n'est créé automatiquement ici.
-- Le compte administrateur est créé/synchronisé automatiquement à la connexion
-- (voir /api/auth/login dans server.ts) — définissez ADMIN_EMAIL et ADMIN_PASSWORD
-- dans les variables d'environnement Vercel.



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
CREATE POLICY "Allow authenticated insert access to listings" ON public.listings FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND seller_email = auth.jwt()->>'email'
);

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
CREATE POLICY "Allow authenticated insert access to demands" ON public.demands FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND buyer_email = auth.jwt()->>'email'
);

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
CREATE POLICY "Allow authenticated insert access to chats" ON public.chats FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (buyer_email = auth.jwt()->>'email' OR seller_email = auth.jwt()->>'email')
);

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
CREATE POLICY "Allow system insert access to notifications" ON public.notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow user update access to notifications" ON public.notifications;
CREATE POLICY "Allow user update access to notifications" ON public.notifications FOR UPDATE USING (user_email = auth.jwt()->>'email') WITH CHECK (user_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Allow user delete access to notifications" ON public.notifications;
CREATE POLICY "Allow user delete access to notifications" ON public.notifications FOR DELETE USING (user_email = auth.jwt()->>'email');
