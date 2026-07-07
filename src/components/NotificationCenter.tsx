import React, { useState } from "react";
import { 
  Bell, 
  Trash2, 
  CheckCheck, 
  Info, 
  MapPin, 
  Coins, 
  Tag, 
  ShoppingBag, 
  MessageCircle,
  Sparkles,
  ArrowLeft,
  X,
  BellRing
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "system" | "offer" | "neighbor" | "transaction";
  read: boolean;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onToggleRead: (id: string) => void;
  onClearNotification: (id: string) => void;
  onClearAll: () => void;
  isDarkMode: boolean;
  onBackToMarketplace: () => void;
}

export function NotificationCenter({
  notifications,
  onMarkAllAsRead,
  onToggleRead,
  onClearNotification,
  onClearAll,
  isDarkMode,
  onBackToMarketplace
}: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "neighbor" | "offer" | "transaction" | "system">("all");

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === "all") return true;
    return notif.type === activeFilter;
  });

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "neighbor":
        return <MapPin className="w-4 h-4 text-emerald-500" />;
      case "offer":
        return <Tag className="w-4 h-4 text-amber-500" />;
      case "transaction":
        return <Coins className="w-4 h-4 text-blue-500" />;
      case "system":
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
      default:
        return <Info className="w-4 h-4 text-stone-500" />;
    }
  };

  const getTypeLabel = (type: NotificationItem["type"]) => {
    switch (type) {
      case "neighbor":
        return "Voisinage";
      case "offer":
        return "Annonces";
      case "transaction":
        return "Transactions";
      case "system":
        return "Système";
      default:
        return "Autre";
    }
  };

  const getBgColor = (type: NotificationItem["type"]) => {
    switch (type) {
      case "neighbor":
        return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30";
      case "offer":
        return "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30";
      case "transaction":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30";
      case "system":
        return "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30";
      default:
        return "bg-stone-50 dark:bg-stone-900 border-stone-100 dark:border-stone-800";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMarketplace}
            className={`p-2 rounded-xl transition-colors cursor-pointer border ${
              isDarkMode 
                ? "bg-stone-900 border-stone-800 hover:bg-stone-800 text-stone-300" 
                : "bg-white border-stone-200/80 hover:bg-stone-50 text-stone-700"
            }`}
            title="Retour au Marché"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500 rounded-xl text-white shadow-xs">
              <Bell className="w-5 h-5 animate-swing" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-black tracking-tight text-stone-900 dark:text-white leading-none">
                Notifications de la Brocante
              </h2>
              <p className="text-[10px] sm:text-xs font-mono text-stone-400 dark:text-stone-500 mt-1">
                Suivi en temps réel de votre espace de vie et de vos échanges
              </p>
            </div>
          </div>
        </div>

        {/* UTILITY BUTTONS */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 border border-amber-900/40" 
                  : "bg-amber-50 text-amber-950 hover:bg-amber-100/80 border border-amber-200/50"
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout marquer lu</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-400" 
                  : "bg-white hover:bg-stone-50 border border-stone-200 text-stone-600"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider</span>
            </button>
          )}
        </div>
      </div>

      {/* TABS / FILTERS */}
      <div className={`flex items-center gap-1 overflow-x-auto pb-2 mb-6 border-b no-scrollbar ${
        isDarkMode ? "border-stone-800" : "border-stone-200/60"
      }`}>
        {[
          { key: "all", label: "Toutes" },
          { key: "neighbor", label: "Voisins" },
          { key: "offer", label: "Annonces/Objets" },
          { key: "transaction", label: "Transactions" },
          { key: "system", label: "Système" }
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          const count = tab.key === "all" 
            ? notifications.length 
            : notifications.filter(n => n.type === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-amber-500 text-white font-bold shadow-xs scale-[1.02]"
                  : isDarkMode
                    ? "bg-stone-900 border border-stone-800 text-stone-400 hover:bg-stone-800/60 hover:text-stone-200"
                    : "bg-stone-50 border border-stone-200/60 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-stone-205 dark:bg-stone-800 text-stone-505"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* NOTIFICATION SPREAD / LIST LISTING */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative overflow-hidden border p-4 rounded-xl flex items-start gap-3.5 transition-all outline-hidden group select-none ${
                  notif.read 
                    ? isDarkMode 
                      ? "bg-stone-900/40 border-stone-850/60 opacity-60 hover:opacity-100" 
                      : "bg-white/40 border-stone-150/70 opacity-75 hover:opacity-100"
                    : getBgColor(notif.type)
                }`}
                style={{ contentVisibility: 'auto' }}
              >
                {/* Type Badge Highlight Left Bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  notif.read ? "bg-stone-300 dark:bg-stone-800" : (
                    notif.type === "neighbor" ? "bg-emerald-500" :
                    notif.type === "offer" ? "bg-amber-500" :
                    notif.type === "transaction" ? "bg-blue-500" : "bg-indigo-500"
                  )
                }`} />

                {/* Left side type specific visual token */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    notif.read 
                      ? "bg-stone-100 dark:bg-stone-850 border-stone-200 dark:border-stone-800/80" 
                      : "bg-white dark:bg-stone-900 border-stone-200/50"
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                </div>

                {/* Content body */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-mono uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-sm ${
                      notif.read 
                        ? "bg-stone-200/65 text-stone-500 dark:bg-stone-800" 
                        : (
                          notif.type === "neighbor" ? "bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-400" :
                          notif.type === "offer" ? "bg-amber-100 dark:bg-amber-950/45 text-amber-800 dark:text-amber-400" :
                          notif.type === "transaction" ? "bg-blue-100 dark:bg-blue-950/45 text-blue-800 dark:text-blue-400" :
                          "bg-indigo-100 dark:bg-indigo-950/45 text-indigo-800 dark:text-indigo-400"
                        )
                    }`}>
                      {getTypeLabel(notif.type)}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                      {notif.time}
                    </span>
                  </div>

                  <h4 className={`text-sm tracking-tight mt-1 px-0.5 leading-snug cursor-pointer ${
                    notif.read
                      ? "text-stone-600 dark:text-stone-400 font-semibold"
                      : "text-stone-900 dark:text-white font-black"
                  }`}
                  onClick={() => onToggleRead(notif.id)}
                  >
                    {notif.title}
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 px-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {/* Interactive State Toggle Actions rightmost */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onToggleRead(notif.id)}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isDarkMode ? "hover:bg-stone-805 text-stone-400" : "hover:bg-stone-100 text-stone-500"
                    }`}
                    title={notif.read ? "Marquer comme non lu" : "Marquer comme lu"}
                  >
                    <CheckCheck className={`w-3.5 h-3.5 ${notif.read ? "text-amber-500" : "text-stone-400"}`} />
                  </button>
                  <button
                    onClick={() => onClearNotification(notif.id)}
                    className={`p-1 rounded-md hover:text-red-500 transition-colors cursor-pointer ${
                      isDarkMode ? "hover:bg-stone-805 text-stone-400" : "hover:bg-stone-100 text-stone-500"
                    }`}
                    title="Supprimer cette notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 bg-stone-100 dark:bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-200/80 dark:border-stone-800">
                <BellRing className="w-6 h-6 text-stone-300 dark:text-stone-600" />
              </div>
              <h3 className="font-serif text-base font-bold text-stone-800 dark:text-stone-200">
                Rien de nouveau ici !
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-450 mt-1.5 max-w-sm mx-auto">
                {activeFilter === "all" 
                  ? "Vous n'avez pas de notifications pour le moment." 
                  : `Aucune notification de type "${getTypeLabel(activeFilter as any)}" n'a été reçue.`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUICK STATS INFOBAR */}
      <div className={`mt-8 p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold ${
        isDarkMode 
          ? "bg-stone-900/20 border-stone-850 text-stone-400" 
          : "bg-stone-50/50 border-stone-200/60 text-stone-600"
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Vos interactions soutiennent la consommation locale de seconde main !</span>
        </div>
        <button 
          onClick={onBackToMarketplace}
          className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 self-start md:self-auto cursor-pointer"
        >
          <span>Continuer à chiner sur la Brocante</span>
          <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>
    </div>
  );
}
