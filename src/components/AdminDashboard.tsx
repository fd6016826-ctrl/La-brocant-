import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShoppingBag, 
  Coins, 
  MessageSquare, 
  Trash2, 
  Crown, 
  Megaphone, 
  Search, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  BarChart3, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { Listing } from "../types";
import { formatPrice, Currency } from "../utils/currency";
import { motion, AnimatePresence } from "motion/react";

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  soldListings: number;
  totalValue: number;
  totalSalesValue: number;
  totalChats: number;
  totalDemands: number;
  usersList: any[];
  listingsList: Listing[];
}

interface AdminDashboardProps {
  adminEmail: string;
  currency: Currency;
  onBackToApp: () => void;
}

export function AdminDashboard({ adminEmail, currency, onBackToApp }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"kpis" | "listings" | "users" | "broadcast">("kpis");

  // Filter and Search States
  const [listingsSearch, setListingsSearch] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  
  // Broadcast Notification Form States
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"system" | "announcement" | "transaction">("announcement");
  const [broadcastStatus, setBroadcastStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);

  // Fetch admin stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/stats?adminEmail=${encodeURIComponent(adminEmail)}`, {
        headers: {
          "x-admin-email": adminEmail
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setError("");
      } else {
        const errData = await res.json();
        setError(errData.error || "Impossible de charger les statistiques d'administration.");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [adminEmail]);

  // Handle delete listing
  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette annonce ?")) return;
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail
        }
      });
      if (res.ok) {
        fetchStats();
      } else {
        alert("Erreur lors de la suppression de l'annonce.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur lors de la suppression.");
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userEmail: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ainsi que toutes ses annonces et discussions associées ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userEmail)}`, {
        method: "DELETE",
        headers: {
          "x-admin-email": adminEmail
        }
      });
      if (res.ok) {
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression de l'utilisateur.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur.");
    }
  };

  // Toggle user Pro/Premium Status
  const handleToggleUserPro = async (userEmail: string, currentIsPro: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userEmail)}/pro`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail
        },
        body: JSON.stringify({ isPro: !currentIsPro })
      });
      if (res.ok) {
        fetchStats();
      } else {
        alert("Erreur lors de la mise à jour du statut.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    }
  };

  // Send system-wide notification
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    try {
      setBroadcasting(true);
      setBroadcastStatus(null);
      const res = await fetch("/api/admin/broadcast-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": adminEmail
        },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          type: notifType
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastStatus({
          type: "success",
          message: data.message || "Notification diffusée avec succès !"
        });
        setNotifTitle("");
        setNotifMessage("");
      } else {
        const data = await res.json();
        setBroadcastStatus({
          type: "error",
          message: data.error || "Erreur lors de la diffusion de la notification."
        });
      }
    } catch (err) {
      console.error(err);
      setBroadcastStatus({
        type: "error",
        message: "Erreur réseau de communication avec le serveur."
      });
    } finally {
      setBroadcasting(false);
    }
  };

  // Filter listings
  const filteredListings = stats?.listingsList.filter(l => 
    l.title.toLowerCase().includes(listingsSearch.toLowerCase()) ||
    l.sellerName.toLowerCase().includes(listingsSearch.toLowerCase()) ||
    l.sellerEmail.toLowerCase().includes(listingsSearch.toLowerCase())
  ) || [];

  // Filter users
  const filteredUsers = stats?.usersList.filter(u => 
    u.name.toLowerCase().includes(usersSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(usersSearch.toLowerCase())
  ) || [];

  // Calculate listing category counts for visual chart
  const getCategoryCounts = () => {
    if (!stats) return {};
    const counts: Record<string, number> = {};
    stats.listingsList.forEach(l => {
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();
  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Chargement des données administrateur...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-100">Accès Refusé / Erreur</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
        <button 
          onClick={onBackToApp} 
          className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
        >
          Retour à l'application
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button 
            onClick={onBackToApp} 
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition text-sm font-semibold mb-2 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'application
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-amber-500" />
              Console d'Administration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              Super Admin
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Connecté en tant que <span className="font-semibold text-slate-700 dark:text-slate-300">{adminEmail}</span>
          </p>
        </div>
        <button 
          onClick={fetchStats}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
        >
          Actualiser les données
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab("kpis")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "kpis" 
              ? "border-amber-500 text-amber-600 dark:text-amber-400" 
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Statistiques & KPIs
        </button>
        <button
          onClick={() => setActiveTab("listings")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "listings" 
              ? "border-amber-500 text-amber-600 dark:text-amber-400" 
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Modération Annonces ({stats?.listingsList.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "users" 
              ? "border-amber-500 text-amber-600 dark:text-amber-400" 
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Gestion Utilisateurs ({stats?.usersList.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("broadcast")}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "broadcast" 
              ? "border-amber-500 text-amber-600 dark:text-amber-400" 
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Alerte Globale (Broadcast)
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* KPI Panel */}
        {activeTab === "kpis" && stats && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Cards */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Utilisateurs</span>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{stats.totalUsers}</h3>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2 block flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  {stats.usersList.filter(u => u.isPro || u.is_pro).length} Membres Pro
                </span>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Annonces Actives</span>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{stats.activeListings}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2 block">
                  Sur {stats.totalListings} annonces créées
                </span>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Transactions Validées</span>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                  {formatPrice(stats.totalSalesValue, currency)}
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 block flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {stats.soldListings} ventes complétées
                </span>
              </div>
              <div className="p-4 bg-violet-50 dark:bg-violet-950/30 text-violet-500 dark:text-violet-400 rounded-xl group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Discussions Actives</span>
                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{stats.totalChats}</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2 block">
                  {stats.totalDemands} demandes citoyennes
                </span>
              </div>
              <div className="p-4 bg-sky-50 dark:bg-sky-950/30 text-sky-500 dark:text-sky-400 rounded-xl group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>

            {/* Visual Category Distribution */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm mt-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Répartition des Annonces par Catégorie
                </h3>
              </div>
              
              <div className="space-y-4">
                {Object.keys(categoryCounts).length === 0 ? (
                  <p className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">Aucune donnée disponible.</p>
                ) : (
                  Object.keys(categoryCounts).map(cat => {
                    const count = categoryCounts[cat];
                    const percent = (count / stats.listingsList.length) * 100;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                          <span className="text-slate-500 dark:text-slate-400">{count} ({percent.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Listings Moderation */}
        {activeTab === "listings" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Rechercher une annonce (titre, vendeur)..."
                value={listingsSearch}
                onChange={(e) => setListingsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4">Image / Titre</th>
                      <th className="px-6 py-4">Catégorie</th>
                      <th className="px-6 py-4">Prix</th>
                      <th className="px-6 py-4">Vendeur</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredListings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                          Aucune annonce ne correspond à votre recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredListings.map(listing => (
                        <tr key={listing.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img 
                              src={listing.imageUrl || "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=100"} 
                              alt={listing.title}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-100 dark:border-slate-800"
                            />
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{listing.title}</div>
                              <div className="text-xs text-slate-400 dark:text-slate-500">{listing.location}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {listing.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                            {formatPrice(listing.price, currency)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{listing.sellerName}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{listing.sellerEmail}</div>
                          </td>
                          <td className="px-6 py-4">
                            {listing.isSold ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Vendu
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
                                En ligne
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                              title="Supprimer définitivement l'annonce"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Management */}
        {activeTab === "users" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            {/* Search Input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Rechercher un utilisateur (nom, email)..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4">Avatar / Nom</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Compte Pro</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                          Aucun utilisateur trouvé.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(user => (
                        <tr key={user.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <img 
                              src={user.avatar || user.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
                              alt={user.name}
                              className="w-10 h-10 object-cover rounded-full border border-slate-100 dark:border-slate-800"
                            />
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleUserPro(user.email, user.isPro || user.is_pro)}
                              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition ${
                                user.isPro || user.is_pro
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              <Crown className="w-3.5 h-3.5" />
                              {user.isPro || user.is_pro ? "Oui (Membre Pro)" : "Non (Standard)"}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {user.email.toLowerCase().trim() !== adminEmail.toLowerCase().trim() ? (
                              <button
                                onClick={() => handleDeleteUser(user.email)}
                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                                title="Bannir et supprimer définitivement l'utilisateur"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic px-2">Vous-même</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Global System Broadcast */}
        {activeTab === "broadcast" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              Diffuser une alerte à l'ensemble du site
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Ce formulaire envoie une notification immédiate à tous les comptes d'utilisateurs inscrits sur l'application. Utilisez-le pour les annonces importantes ou les maintenances du site.
            </p>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Titre de l'alerte
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Maintenance du serveur ce soir à 23h"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Message détaillé
                </label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Écrivez le message de notification complet ici..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Type de notification
                </label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as any)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                >
                  <option value="announcement">Annonce Générale 📢</option>
                  <option value="system">Alerte Système ⚙️</option>
                  <option value="transaction">Transaction 💸</option>
                </select>
              </div>

              <AnimatePresence>
                {broadcastStatus && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-3 rounded-lg text-sm font-semibold ${
                      broadcastStatus.type === "success" 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400"
                    }`}
                  >
                    {broadcastStatus.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={broadcasting}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold rounded-xl transition shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                {broadcasting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4" />
                    Diffuser la notification
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
