import React from "react";
import { 
  ShoppingBag, 
  ArrowRight, 
  Star, 
  MessageSquare, 
  ShieldCheck, 
  Zap,
  TrendingDown,
  Sparkles,
  Play,
  CheckCircle2,
  Lock,
  Compass,
  ArrowRightLeft
} from "lucide-react";
import { motion } from "motion/react";
import { DEFAULT_AVATAR_PLACEHOLDER } from "../App";
import { Listing } from "../types";
import { Currency } from "../utils/currency";
import { ListingCard } from "./ListingCard";
import { ProBadge } from "./ProBadge";

export interface LandingPageProps {
  onEnterMarketplace: () => void;
  onEnterLogin: () => void;
  onOpenAccountModal?: () => void;
  currentUserEmail: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onLogout?: () => void;
  onShowTerms: () => void;
  listingsCount: number;
  listings: Listing[];
  currency: Currency;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenListingDetails: (listing: Listing) => void;
  isProUser?: boolean;
}

export function LandingPage({
  onEnterMarketplace,
  onEnterLogin,
  onOpenAccountModal,
  currentUserEmail,
  currentUserName,
  currentUserAvatar,
  onLogout,
  onShowTerms,
  listingsCount,
  listings,
  currency,
  favorites,
  onToggleFavorite,
  onOpenListingDetails,
  isProUser = false
}: LandingPageProps) {
  return (
    <div className={`min-h-screen bg-[#fcfbf9] text-stone-900 flex flex-col font-sans overflow-x-hidden selection:bg-amber-100 selection:text-amber-900 ${currentUserEmail ? "pb-32" : ""}`}>
      
      {/* NAVBAR */}
      <nav className="border-b border-stone-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-xs">
              <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 stroke-[2.5px]" />
            </div>
            <div>
              <span className="font-serif text-sm sm:text-lg font-bold tracking-tight text-stone-900 block leading-none">
                La Brocante
              </span>
              <span className="text-[8.5px] sm:text-[9px] font-mono uppercase tracking-widest text-stone-400 block mt-0.5">
                Chiner en toute liberté
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600">
            <button 
              onClick={onEnterMarketplace}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Le Marché
            </button>
            <button 
              onClick={onShowTerms}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Règles de sécurité
            </button>
            <button 
              onClick={onShowTerms}
              className="hover:text-stone-900 transition-colors cursor-pointer"
            >
              Conditions d'utilisation
            </button>
            <span className="text-stone-200">|</span>
            <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-1 rounded-sm border border-stone-200/50">
              Simulé: {currentUserEmail}
            </span>
          </div>

          {/* Auth triggers */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {currentUserEmail ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  id="nav-to-marketplace-active"
                  onClick={onEnterMarketplace}
                  className="bg-stone-900 text-white text-[10px] sm:text-xs font-semibold py-1.5 px-2.5 sm:py-2 sm:px-3.5 rounded-lg hover:bg-stone-800 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden xs:inline">Accéder au Marché</span>
                  <span className="xs:hidden">Marché</span>
                </button>

                {/* Unified profile photo button for landing page */}
                {onOpenAccountModal && (
                  <button
                    onClick={onOpenAccountModal}
                    className="p-1 relative rounded-full transition-transform hover:scale-105 active:scale-95 flex items-center justify-center focus:outline-hidden cursor-pointer shrink-0"
                    title="Gérer mon compte & profils simulés"
                  >
                    <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full overflow-hidden border border-amber-300 bg-[#fcd462] flex items-center justify-center shadow-3xs hover:brightness-105 transition-all text-stone-950 shrink-0">
                      <img
                        src={currentUserAvatar || DEFAULT_AVATAR_PLACEHOLDER}
                        alt={currentUserName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {isProUser && (
                      <ProBadge size="sm" className="absolute bottom-0 right-0" />
                    )}
                  </button>
                )}

                <button
                  onClick={onEnterLogin}
                  className="p-1.5 sm:p-2 border border-stone-200 hover:bg-stone-100 rounded-lg text-[10px] sm:text-xs font-semibold text-stone-700 transition flex items-center gap-1 cursor-pointer shrink-0"
                  title="Changer d'utilisateur / Profil"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span className="hidden sm:inline">Changer de compte</span>
                  <span className="sm:hidden">Compte</span>
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={onEnterLogin}
                  className="text-stone-600 hover:text-stone-900 text-[10px] sm:text-xs font-semibold px-2 py-1.5 cursor-pointer"
                >
                  Se connecter
                </button>
                <button 
                  onClick={onEnterLogin}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-lg sm:rounded-xl shadow-xs transition cursor-pointer"
                >
                  Créer un compte
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Inspired by Image 1 "Grow+" Layout */}
      <section className="px-4 py-6 md:py-12 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="bg-[#e4e2de] rounded-[2rem] p-6 sm:p-10 md:p-16 relative overflow-hidden shadow-xs border border-stone-300/40 flex flex-col lg:flex-row gap-12 items-center">
          
          {/* Subtle design graphics in background */}
          <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none opacity-50" />
          
          {/* Left Column: Grow+ styled typographies */}
          <div className="flex-1 space-y-6 md:space-y-8 z-10 w-full">
            
            {/* Top Badge: 20M+ User look */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-mono text-stone-600 font-bold uppercase tracking-wider leading-none">
                  Marché 100% de Proximité
                </p>
                <button
                  onClick={onShowTerms}
                  className="text-[10px] text-stone-500 underline hover:text-stone-950 block mt-0.5"
                >
                  Lire nos garanties citoyennes ↗
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <span className="block text-stone-400/80 font-mono text-xs uppercase tracking-widest font-semibold">
                — DEUXIÈME VIE SANS LIMITES
              </span>
              <h1 className="font-serif text-7xl md:text-9xl tracking-tight leading-[0.85] text-stone-900 font-bold select-none">
                Plus de<span className="text-amber-600 font-sans font-light"> vente</span>
              </h1>
            </div>

            <div className="border-t border-stone-400/30 pt-4" />

            {/* Tagline */}
            <p className="text-stone-700 text-xs sm:text-sm md:text-base leading-relaxed font-sans max-w-lg">
              Boostez votre pouvoir d'achat. Vendez tout ce qui encombre vos placards en direct et sans commission — Jusqu'à 50× plus rapide en remise en propre.
            </p>

            {/* Testimonial feedback badges */}
            <div className="flex items-center gap-3 bg-white/40 backdrop-blur-xs p-3 rounded-2xl border border-white/20 max-w-sm">
              <div className="flex -space-x-1">
                <img className="w-7 h-7 rounded-full border border-white object-cover shadow-3xs" src={DEFAULT_AVATAR_PLACEHOLDER} alt="avatar" />
                <div className="w-7 h-7 rounded-full border border-white bg-amber-500 text-[9px] font-bold text-stone-900 flex items-center justify-center font-mono shadow-3xs">+12k</div>
              </div>
              <div>
                <p className="text-[11px] font-sans text-stone-800 font-medium">
                  "J'ai vendu mon canapé en 2 heures !"
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-stone-600 font-semibold">Brocanteurs satisfaits</span>
                  <div className="flex text-amber-500">
                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                  </div>
                  <span className="text-[9px] font-mono text-stone-500">4.9/5</span>
                </div>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onEnterMarketplace}
                className="bg-stone-900 hover:bg-stone-850 text-white font-semibold text-xs py-3.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>Accéder aux Annonces ({listingsCount})</span>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onEnterMarketplace}
                className="text-stone-700 hover:text-stone-900 font-semibold text-xs tracking-wide py-3 px-4 flex items-center gap-1 cursor-pointer"
              >
                <span>Comment ça marche</span>
                <span className="text-stone-400 font-light">↗</span>
              </button>
            </div>
          </div>

          {/* Right Column: Beautiful Image + Interactive Overlaid widgets */}
          <div className="flex-1 w-full relative max-w-md lg:max-w-none flex flex-col items-center justify-center py-6">
            
            {/* Explanation of the welcome video above the image */}
            <div className="mb-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-stone-200/80 shadow-md text-center max-w-[340px] z-20 transition-all hover:scale-101">
              <span className="inline-block bg-[#fcd462] text-stone-950 px-2.5 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-wider font-bold mb-1">
                🎬 Vidéo d'accueil de la Brocante
              </span>
              <p className="text-[11px] text-stone-850 leading-normal font-medium">
                Découvrez en 1 minute le fonctionnement de notre marché citoyen : apprenez à chiner en mains propres et à filmer vos objets en action !
              </p>
            </div>
            
            {/* The Main Container representing the orange showcase background in Image 1 */}
            <div className="relative w-full aspect-4/5 rounded-3xl overflow-hidden bg-gradient-to-tr from-amber-600 to-amber-500 shadow-xl max-w-[340px] group border-4 border-white">
              
              {/* Product/Scene Image inside */}
              <img 
                src="https://images.unsplash.com/photo-1484755560695-a4c7300c5c29?w=600" 
                alt="Vide grenier brocante" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-85 mix-blend-multiply filter contrast-110"
              />

              {/* Central Video play demo placeholder badge */}
              <button 
                type="button"
                onClick={onEnterMarketplace}
                className="absolute inset-0 m-auto w-12 h-12 bg-white text-stone-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition active:scale-95 z-20 group-hover:bg-amber-100"
              >
                <Play className="w-5 h-5 fill-stone-900 ml-0.5" />
              </button>

              {/* Bottom absolute gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-950/70 to-transparent pointer-events-none" />
            </div>

            {/* OVERLAID TRANSPARENT WIDGETS (Exactly modeled after Image 1 layouts) */}
            
            {/* 1. Translucent Up to 60% saving tag (Top right) */}
            <div className="absolute -top-1 md:-top-4 -right-1 md:-right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-lg max-w-[130px] font-sans">
              <p className="text-[8px] font-mono text-stone-400 uppercase tracking-widest leading-none font-bold">
                — ÉCOLOGIQUE
              </p>
              <p className="text-2xl font-serif text-stone-950 font-bold mt-1 tracking-tight">
                -60%
              </p>
              <p className="text-[9px] text-stone-500 font-medium leading-tight mt-0.5">
                Économies certifiées en seconde main
              </p>
            </div>

            {/* 2. Chat Dialogue balloon 1 ("How is the fit?" styled in orange checkbox) */}
            <div className="absolute left-[-20px] top-[15%] bg-white rounded-full px-3.5 py-2 shadow-md border border-stone-100 flex items-center gap-2 max-w-[190px]">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </span>
              <p className="text-[10px] text-stone-800 font-semibold truncate">
                Dispo pour remise en main ?
              </p>
            </div>

            {/* 3. Chat Dialogue balloon 2 ("Do you like the design?" styled in blue checkbox) */}
            <div className="absolute left-[-30px] top-[30%] bg-white rounded-full px-3.5 py-2 shadow-md border border-stone-100 flex items-center gap-2 max-w-[190px]">
              <span className="w-4 h-4 rounded-full bg-[#1da1f2] text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </span>
              <p className="text-[10px] text-stone-800 font-semibold truncate">
                Oui ! Je baisse de 10€
              </p>
            </div>

            {/* 4. Product overlay card (Bottom right) with Sneaker mock details copy */}
            <div className="absolute right-[-14px] bottom-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-stone-200 shadow-xl w-48 text-left">
              <div className="relative rounded-lg overflow-hidden h-24 mb-2 bg-stone-100">
                <img 
                  src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300" 
                  alt="Sneakers vintage" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 right-1 bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[8px] font-mono leading-none">
                  A vendre
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono leading-none">MODE & ACCESSOIRES</p>
              <p className="text-xs font-serif font-bold text-stone-950 truncate mt-1">Sneakers Retro 1990</p>
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-stone-100">
                <span className="text-stone-900 text-xs font-mono font-bold">45.00 €</span>
                <span className="text-[9px] text-stone-500 bg-stone-100 px-1 py-0.5 rounded flex items-center gap-0.5">
                  ⭐ 4.8
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4 REAL ADS SIMULTANEOUSLY GRID SHOWCASE */}
      <section className="px-4 py-12 max-w-7xl mx-auto w-full border-t border-stone-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="space-y-1">
            <span className="bg-amber-100 text-amber-950 border border-amber-200/50 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
              ✨ À la Une cette semaine
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Découvrez quatre pièces uniques rattachées à la communauté
            </h2>
            <p className="text-xs text-stone-500">
              Annonces triées par ordre de parution récent. Contact direct de gré à gré, sans commission.
            </p>
          </div>
          <button
            onClick={onEnterMarketplace}
            className="text-stone-700 hover:text-stone-950 text-xs font-bold flex items-center gap-1 group border-b border-stone-400 pb-0.5"
          >
            <span>Explorer tout le marché</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(() => {
            const BACKFILL_LISTINGS: Listing[] = [
              {
                id: "mock-1",
                title: "Table basse en chêne massif brut",
                description: "Superbe table artisanale poncée. Parfait état, prête à être huilée ou vernie selon vos envies déco.",
                price: 120,
                category: "Maison & Déco",
                location: "Lyon (69)",
                condition: "Très bon état",
                imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600",
                sellerName: "Sophie B.",
                sellerEmail: "sophie.b69@gmail.com",
                sellerPhone: "06 12 34 56 78",
                createdAt: new Date().toISOString(),
                isSold: false
              },
              {
                id: "mock-2",
                title: "Sneakers Retro Air Jordan V",
                description: "Édition spéciale vintage de 1995. Portées quelques fois, boîte d'origine abîmée fournie avec.",
                price: 85,
                category: "Mode & Vêtements",
                location: "Paris (75)",
                condition: "Bon état",
                imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600",
                sellerName: "Marc Dupuis",
                sellerEmail: "marc.dupuis@outlook.fr",
                sellerPhone: "06 87 65 43 21",
                createdAt: new Date().toISOString(),
                isSold: false
              },
              {
                id: "mock-3",
                title: "Vélo de course Motobécane 1982",
                description: "Cadre acier d'origine, vitesses au cadre. Pneus et câbles changés à neuf par un passionné.",
                price: 150,
                category: "Véhicules",
                location: "Marseille (13)",
                condition: "Très bon état",
                imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600",
                sellerName: "Jean Testeur",
                sellerEmail: "jean.testeur@gmail.com",
                sellerPhone: "06 55 44 33 22",
                createdAt: new Date().toISOString(),
                isSold: false
              },
              {
                id: "mock-4",
                title: "Appareil photo argentique Canon AE-1",
                description: "Objectif 50mm f/1.8. Entièrement testé, cellule fonctionnelle, mousses d'étanchéité neuves.",
                price: 110,
                category: "Électronique",
                location: "Toulouse (31)",
                condition: "Comme neuf",
                imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600",
                sellerName: "Pierre M.",
                sellerEmail: "pierre.m@gmail.com",
                sellerPhone: "06 11 22 33 44",
                createdAt: new Date().toISOString(),
                isSold: false
              }
            ];

            const displayListings = [...listings].filter(item => !item.isSold);
            if (displayListings.length < 4) {
              const needed = 4 - displayListings.length;
              const addedMock = BACKFILL_LISTINGS.filter(mockItem => !listings.some(realItem => realItem.title === mockItem.title)).slice(0, needed);
              displayListings.push(...addedMock);
            }

            return displayListings.slice(0, 4).map((item) => (
              <ListingCard
                key={item.id}
                listing={item}
                onClick={() => {
                  onOpenListingDetails(item);
                }}
                currency={currency}
                isFavorited={favorites.includes(item.id)}
                onToggleFavorite={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }}
              />
            ));
          })()}
        </div>
      </section>

      {/* RUSTIC BRANDS SUPPORT ROW (Image 1 Bottom Row) */}
      <section className="bg-stone-50 py-10 px-4 border-y border-stone-200/50 mt-auto">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-6">
            NOS RECOMMANDATIONS DE CITOYENNETÉ ET PROXIMITÉ
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40 grayscale saturate-0">
            <span className="font-serif text-lg font-bold tracking-tight text-stone-950">RECYCLERIE LOCALE</span>
            <span className="font-serif text-lg font-bold tracking-tight text-stone-950">EMMAÜS FRANCE</span>
            <span className="font-serif text-lg font-bold tracking-tight text-stone-950">VIDE-GRENIER ASSOCIATION</span>
            <span className="font-serif text-lg font-bold tracking-tight text-stone-950">REPAR'ACTEURS®</span>
            <span className="font-serif text-lg font-bold tracking-tight text-stone-950">VENEZ CHINER COOP</span>
          </div>
        </div>
      </section>

      {/* CORE INFO BENTO GRID */}
      <section className="px-4 py-12 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-stone-250/70 p-6 rounded-2xl shadow-3xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">Mise en vente instantanée</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Remplissez notre formulaire ultra-rapide, ajoutez des photos magnifiques et incluez une vidéo de démonstration pour rassurer vos acheteurs instantanément.
          </p>
        </div>

        <div className="bg-white border border-stone-250/70 p-6 rounded-2xl shadow-3xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">Messagerie Directe</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Négociez et discutez de vive voix grâce à notre chat privé intégré sécurisé. Filtrez vos messages en un clic par achats et ventes.
          </p>
        </div>

        <div className="bg-white border border-stone-250/70 p-6 rounded-2xl shadow-3xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#1da1f2]/10 text-[#1da1f2] flex items-center justify-center font-bold mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900">Zéro Commission</h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            Tout se fait de gré à gré, en mains propres ou selon vos conditions choisies. Vous conservez 100% de la valeur de vos pièces fétiches.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-stone-200/60 bg-white/50 text-center py-6 text-stone-400 text-[11px] font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 La Brocante — Le Marché de Proximité Citoyen.</p>
          <div className="flex gap-4">
            <button onClick={onShowTerms} className="hover:text-stone-800 underline">Conditions d'Utilisation</button>
            <button onClick={onShowTerms} className="hover:text-stone-800 underline">Sécurité & Confiance</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
