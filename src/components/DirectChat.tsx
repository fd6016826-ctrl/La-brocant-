import React, { useState, useEffect, useRef } from "react";
import { Send, Inbox, ArrowLeft, MessageCircle, HelpCircle, Tag, ShoppingBag, CheckCircle2, AlertTriangle, Star, X, Receipt, Trash2 } from "lucide-react";
import { ChatThread, Message, Listing } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { getAllReviews, getReviewsForUser, getRatingForUser, addReview } from "../utils/reviews";
import { Currency, CURRENCIES, formatPrice } from "../utils/currency";

interface DirectChatProps {
  currentUserEmail: string;
  currentUserName: string;
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (id: string) => void;
  onSendMessage: (listingId: string, text: string, buyerEmail?: string, buyerName?: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isDarkMode?: boolean;
  initialInputText?: string;
  onInputInjected?: () => void;
  listings?: Listing[];
  isProUser?: boolean;
  onUpgradePro?: () => void;
  currency?: Currency;
  onAddNotification?: (title: string, message: string, type: "system" | "offer" | "neighbor" | "transaction", customId?: string) => void;
  onNavigateToNotifications?: () => void;
  sessionToken?: string;
}

interface ThreadAvatarProps {
  imageUrl?: string;
  title: string;
  sizeClass?: string;
  badgeRole?: string;
}

const ThreadAvatar: React.FC<ThreadAvatarProps> = ({ imageUrl, title, sizeClass = "w-11 h-11", badgeRole }) => {
  const [error, setError] = useState(false);
  const letter = title ? title.trim().charAt(0).toUpperCase() : "?";

  return (
    <div className="relative shrink-0">
      {!imageUrl || error ? (
        <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-stone-900 font-serif font-extrabold shadow-3xs border border-amber-500/20`}>
          <span className="text-[12px] md:text-[13px] text-white font-serif leading-none drop-shadow-sm">{letter}</span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={title}
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
          className={`${sizeClass} object-cover rounded-xl border border-stone-250/15 bg-stone-950 shadow-3xs`}
        />
      )}
      {badgeRole && (
        <span 
          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center text-[7.5px] text-white font-extrabold leading-none shadow-3xs ${badgeRole === "Acheteur" ? "bg-sky-500" : "bg-teal-500"}`} 
          title={badgeRole}
        >
          {badgeRole.charAt(0)}
        </span>
      )}
    </div>
  );
};

export const DirectChat: React.FC<DirectChatProps> = ({
  currentUserEmail,
  currentUserName,
  threads,
  activeThreadId,
  onSelectThread,
  onSendMessage,
  onRefresh,
  isDarkMode = false,
  initialInputText,
  onInputInjected,
  listings = [],
  isProUser = false,
  onUpgradePro,
  currency,
  onAddNotification,
  onNavigateToNotifications,
  sessionToken,
}) => {
  const chatCurrency = currency || CURRENCIES[0];
  const [typedMessage, setTypedMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(true);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [profileModalUser, setProfileModalUser] = useState<{ name: string; email: string } | null>(null);
  const [interactiveRating, setInteractiveRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);
  const [reviewsVersion, setReviewsVersion] = useState(0); // Trigger re-render of local rating calculations

  const [isInvoiceUpgradeOpen, setIsInvoiceUpgradeOpen] = useState(false);
  const [invoiceAlertMessage, setInvoiceAlertMessage] = useState<string | null>(null);
  const [msgIdToDelete, setMsgIdToDelete] = useState<string | null>(null);

  // Clear alert after some time
  useEffect(() => {
    if (invoiceAlertMessage) {
      const timer = setTimeout(() => {
        setInvoiceAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [invoiceAlertMessage]);

  const handleSendInvoice = async () => {
    if (!activeThread) return;

    // 1. Verify that the user is the seller
    const isSeller = currentUserEmail.toLowerCase().trim() === activeThread.sellerEmail.toLowerCase().trim();
    if (!isSeller) {
      setInvoiceAlertMessage("⚠️ Seul le vendeur est autorisé à générer et envoyer la facture d'achat.");
      return;
    }

    // 2. Verify double-confirmation (both buyer and seller confirmed)
    const isDoubleConfirmed = activeThread.listingBuyerConfirmed === true && activeThread.listingSellerConfirmed === true;
    if (!isDoubleConfirmed) {
      setInvoiceAlertMessage("⚠️ La facture ne peut pas être émise tant que la transaction n'est pas entièrement double-confirmée de votre part et de celle de l'acheteur.");
      return;
    }

    if (!isProUser) {
      setIsInvoiceUpgradeOpen(true);
      return;
    }

    try {
      setSending(true);
      const invoiceId = `FAC-${Math.floor(100000 + Math.random() * 900000)}`;
      const todayString = new Date().toLocaleDateString("fr-FR");
      const invoiceText = `🧾 FACTURE D'ACHAT #${invoiceId}
**Article** : ${activeThread.listingTitle}
**Réf article** : ${activeThread.listingId.substring(0, 8).toUpperCase()}
**Vendeur** : ${activeThread.sellerName}
**Acheteur** : ${activeThread.buyerName}
**Quantité** : 1
**Total Payé** : ${formatPrice(activeThread.listingPrice, chatCurrency)}
**Date d'émission** : ${todayString}
**Statut** : Payé & Enregistré via Brocante Pro`;

      await onSendMessage(activeThread.listingId, invoiceText);
      setInvoiceAlertMessage("🧾 Facture officielle émise et enregistrée !");
    } catch (err) {
      console.error("Failed to send invoice:", err);
      setInvoiceAlertMessage("⚠️ Échec de la génération de la facture.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeThread) return;
    try {
      const res = await fetch(`/api/chats/${activeThread.id}/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${sessionToken}`
        }
      });
      if (res.ok) {
        onRefresh();
      } else {
        alert("Impossible de supprimer le message.");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // Collapse double-confirmation workspace on chat selection or change, and reset rating
  useEffect(() => {
    setIsWorkspaceCollapsed(true);
    setIsDetailsExpanded(false);
    setInteractiveRating(0);
    setRatingComment("");
    setIsRatingSubmitted(false);
  }, [activeThreadId]);

  // Filter and inject custom initial message
  useEffect(() => {
    if (initialInputText !== undefined && initialInputText !== null && activeThreadId) {
      setTypedMessage(initialInputText);
      if (onInputInjected) {
        onInputInjected();
      }
    }
  }, [initialInputText, activeThreadId, onInputInjected]);

  // Filters
  const [threadFilter, setThreadFilter] = useState<"all" | "received" | "sent" | "to-confirm-sales" | "to-confirm-purchases">("all");
  const [messageFilter, setMessageFilter] = useState<"all" | "received" | "sent">("all");

  // Poll for message updates every 4 seconds in the background
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 4500);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const [finalPurchaseQty, setFinalPurchaseQty] = useState(1);

  useEffect(() => {
    if (activeThread) {
      setFinalPurchaseQty(activeThread.requestedQuantity || 1);
    }
  }, [activeThread?.id, activeThread?.requestedQuantity]);

  // Send rating notifications once transaction is double-confirmed
  useEffect(() => {
    if (!activeThread) return;
    const isBuyer = (currentUserEmail || "").toLowerCase().trim() === (activeThread.buyerEmail || "").toLowerCase().trim();
    const buyerConfirmed = activeThread.listingBuyerConfirmed || false;
    const sellerConfirmed = activeThread.listingSellerConfirmed || false;
    const isSold = activeThread.listingIsSold || false;

    if (isBuyer && (isSold || (buyerConfirmed && sellerConfirmed))) {
      if (onAddNotification) {
        onAddNotification(
          "⭐️ Évaluer le produit acheté",
          `Merci pour votre achat de l'article "${activeThread.listingTitle}". N'hésitez pas à lui attribuer une note !`,
          "transaction",
          `rate-product-${activeThread.id}`
        );
        onAddNotification(
          "👤 Évaluer le vendeur de l'article",
          `Comment s'est passée la transaction avec ${activeThread.sellerName} ? Évaluez son profil.`,
          "transaction",
          `rate-seller-${activeThread.id}`
        );
      }
    }
  }, [activeThread?.listingBuyerConfirmed, activeThread?.listingSellerConfirmed, activeThread?.listingIsSold, currentUserEmail, onAddNotification]);

  // Filter threads based on role and confirmation status
  const filteredThreads = threads.filter((thread) => {
    const sellerMail = (thread.sellerEmail || "").toLowerCase().trim();
    const buyerMail = (thread.buyerEmail || "").toLowerCase().trim();
    const myMail = currentUserEmail.toLowerCase().trim();

    if (threadFilter === "received") {
      return sellerMail === myMail;
    }
    if (threadFilter === "sent") {
      return buyerMail === myMail;
    }
    if (threadFilter === "to-confirm-sales") {
      // I am seller, and buyer has confirmed, but I haven't confirmed yet
      return (
        sellerMail === myMail &&
        thread.listingBuyerConfirmed === true &&
        thread.listingSellerConfirmed !== true
      );
    }
    if (threadFilter === "to-confirm-purchases") {
      // I am buyer, and I have not confirmed my purchase yet
      return (
        buyerMail === myMail &&
        thread.listingBuyerConfirmed !== true
      );
    }
    return true;
  });

  // Filter messages in the active thread
  const filteredMessages = activeThread
    ? activeThread.messages.filter((msg) => {
        const isMe = msg.senderEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
        if (messageFilter === "received") {
          return !isMe;
        }
        if (messageFilter === "sent") {
          return isMe;
        }
        return true;
      })
    : [];

  // Helper to determine if a thread exceeds the free/standard limit of 10 sale discussions
  const getThreadCreationTime = (t: ChatThread) => {
    if (t.messages && t.messages.length > 0) {
      return new Date(t.messages[0].createdAt).getTime();
    }
    return new Date(t.lastMessageAt).getTime();
  };

  const saleThreads = threads
    .filter((t) => (t.sellerEmail || "").toLowerCase().trim() === currentUserEmail.toLowerCase().trim())
    .sort((a, b) => getThreadCreationTime(a) - getThreadCreationTime(b));

  const isThreadExceedingLimit = (threadId: string) => {
    if (isProUser) return false;
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return false;
    const isSeller = currentUserEmail.toLowerCase().trim() === (thread.sellerEmail || "").toLowerCase().trim();
    if (!isSeller) return false;
    const idx = saleThreads.findIndex((t) => t.id === threadId);
    return idx >= 10;
  };

  // Auto scroll to bottom of active message box
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.messages, messageFilter]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeThread) return;

    if (isThreadExceedingLimit(activeThread.id)) {
      if (onUpgradePro) {
        onUpgradePro();
      }
      return;
    }

    setSending(true);
    try {
      // Send message using parent handler
      await onSendMessage(
        activeThread.listingId,
        typedMessage,
        activeThread.buyerEmail,
        activeThread.buyerName
      );
      setTypedMessage("");
    } catch {
      alert("Erreur lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  const confirmPurchase = async () => {
    if (!activeThread) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/listings/${activeThread.listingId}/purchase`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ 
          buyerEmail: currentUserEmail, 
          buyerName: currentUserName,
          requestedQuantity: finalPurchaseQty 
        }),
      });
      if (res.ok) {
        // Automatically send a system message in the chat
        await onSendMessage(
          activeThread.listingId,
          `📢 [SYSTÈME] J'ai de mon côté validé l'achat direct de **${finalPurchaseQty}** exemplaire(s) (**${formatPrice(activeThread.listingPrice * finalPurchaseQty, chatCurrency)}**) ! L'objet est bien reçu, validé et l'enclenchement de la diminution de stock est prêt d'être finalisé de mon côté.`,
          activeThread.buyerEmail,
          activeThread.buyerName
        );
        await onRefresh();
      } else {
        alert("Une erreur est survenue lors de la confirmation d'achat.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  const confirmSale = async () => {
    if (!activeThread) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/listings/${activeThread.listingId}/sell`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sessionToken}`
        }
      });
      if (res.ok) {
        // Automatically send a system message in the chat
        await onSendMessage(
          activeThread.listingId,
          `📢 [SYSTÈME] J'ai officiellement validé la vente et l'envoi de l'article de mon côté. Le colis a été expédié, le paiement est encaissé et la transaction est désormais entièrement double-confirmée et l'article est vendu !`,
          activeThread.buyerEmail,
          activeThread.buyerName
        );
        await onRefresh();
      } else {
        alert("Une erreur est survenue lors de la validation de la vente.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  const renderMessageText = (text: string, isFromMe: boolean) => {
    if (!text) return null;

    if (text.startsWith("🧾")) {
      const lines = text.split("\n");
      
      // Extract details
      const getFieldVal = (keyword: string, fallback: string) => {
        const line = lines.find(l => l.toLowerCase().includes(keyword.toLowerCase()));
        if (line) {
          const colonIdx = line.indexOf(":");
          if (colonIdx > -1) {
            return line.substring(colonIdx + 1).replace(/\*/g, "").trim();
          }
        }
        return fallback;
      };

      const bName = getFieldVal("Acheteur", activeThread?.buyerName || "Sophie.b69");
      const sName = getFieldVal("Vendeur", activeThread?.sellerName || "Marc Dupuis");
      const listingTitle = getFieldVal("Article", activeThread?.listingTitle || "Vélo de course vintage Peugeot (198...)");
      const rawPriceStr = getFieldVal("Total Payé", String(activeThread?.listingPrice || "120.00"));
      const rawPrice = parseFloat(rawPriceStr.replace(/[^0-9.]/g, "")) || activeThread?.listingPrice || 120.00;
      const formattedPrice = rawPrice.toFixed(2);
      
      let invoiceId = "CMD-1";
      const firstLine = lines[0] || "";
      const idMatch = firstLine.match(/#([A-Za-z0-9-]+)/);
      if (idMatch) {
        invoiceId = idMatch[1];
      } else {
        const refLine = lines.find(l => l.includes("Réf article"));
        if (refLine) {
          const colonIdx = refLine.indexOf(":");
          const val = colonIdx > -1 ? refLine.substring(colonIdx + 1).replace(/\*/g, "").trim() : "";
          if (val) {
            invoiceId = `CMD-${val.substring(0, 5).toUpperCase()}`;
          }
        }
      }

      const dateString = getFieldVal("Date d'émission", "18/06/2026 03:31:43");

      const activeListingObj = listings.find(l => l.id === activeThread?.listingId);
      const listingCondition = activeListingObj?.condition || "Bon état";
      const buyerEmailVal = activeThread?.buyerEmail || `${bName.toLowerCase().replace(/[^a-z0-9]/g, "")}@gmail.com`;
      const sellerRole = activeListingObj?.category ? `Spécialiste ${activeListingObj.category}` : "Marchand de Biens Vintage";

      const handleDownloadPrint = () => {
        const printContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Facture La Brocante ${invoiceId}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      serif: ['"Playfair Display"', 'Georgia', 'serif'],
                      sans: ['"Space Grotesk"', 'sans-serif'],
                      mono: ['"JetBrains Mono"', 'monospace'],
                    }
                  }
                }
              }
            </script>
            <style>
              body {
                font-family: "Space Grotesk", sans-serif;
              }
              @media print {
                body {
                  background-color: white !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
                .print-container {
                  border: none !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  max-width: 100% !important;
                  width: 100% !important;
                }
              }
            </style>
          </head>
          <body class="bg-stone-50 font-sans min-h-screen flex flex-col items-center justify-start p-4 sm:p-8">
            <!-- Floating Toolbar -->
            <div class="no-print mb-6 max-w-2xl w-full flex justify-between items-center bg-white p-3.5 rounded-2xl border border-stone-200 shadow-md">
              <span class="text-xs font-mono font-bold text-amber-600 flex items-center gap-1.5 p-1 px-2.5 bg-amber-50 rounded-lg">
                🧾 FACTURE #${invoiceId}
              </span>
              <div class="flex gap-2">
                <button onclick="window.print()" class="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition duration-150 shadow-sm flex items-center gap-1">
                  🖨️ Imprimer ou Enregistrer en PDF
                </button>
                <button onclick="window.close()" class="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-2 px-3.5 rounded-xl cursor-pointer transition duration-150">
                  Fermer
                </button>
              </div>
            </div>

            <!-- Authentic Printed Receipt Box -->
            <div class="print-container bg-white text-stone-900 border border-stone-200/90 shadow-xl p-8 sm:p-12 max-w-2xl w-full rounded-2xl relative space-y-8 text-left">
              <!-- Header -->
              <div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-stone-200 pb-6">
                <div>
                  <h2 class="font-serif text-3xl font-extrabold tracking-wider text-stone-900 uppercase">LA BROCANTE</h2>
                  <p class="text-[9px] uppercase tracking-widest font-mono text-stone-500 mt-1">PROVENCE-ALPES-CÔTE D'AZUR</p>
                  <p class="text-[10px] italic font-serif text-stone-400 mt-0.5">Plateforme Libre de Remise en Mains Propres</p>
                </div>
                <div class="text-[10px] space-y-1 font-mono text-stone-400 text-left sm:text-right mt-1">
                  <div class="flex sm:justify-end gap-2">
                    <span class="uppercase">JUSTIFICATIF N°:</span>
                    <span class="font-mono font-bold text-stone-800">${invoiceId}</span>
                  </div>
                  <div class="flex sm:justify-end gap-2">
                    <span class="uppercase">DATE D'ACHAT:</span>
                    <span class="font-mono font-bold text-stone-750">${dateString}</span>
                  </div>
                </div>
              </div>

              <!-- Buyer & Seller Rows -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-stone-150 pb-6">
                <div class="space-y-1.5">
                  <p class="text-[9px] uppercase tracking-widest font-mono text-stone-400">ACHETEUR</p>
                  <h4 class="font-serif text-base font-bold text-stone-900">${bName}</h4>
                  <p class="text-xs text-stone-500 font-mono">(${buyerEmailVal})</p>
                </div>
                <div class="space-y-1.5">
                  <p class="text-[9px] uppercase tracking-widest font-mono text-stone-400">VENDEUR</p>
                  <h4 class="font-serif text-base font-bold text-stone-900">${sName}</h4>
                  <p class="text-xs text-stone-500 font-serif italic">${sellerRole}</p>
                </div>
              </div>

              <!-- Transaction Item Information -->
              <div class="space-y-3">
                <div class="grid grid-cols-[1fr_auto_auto] gap-4 text-[9px] uppercase tracking-widest font-mono text-stone-400 border-b border-stone-200 pb-2">
                  <div>ARTICLE TRANSACTIONNÉ</div>
                  <div class="text-center w-12">QTÉ</div>
                  <div class="text-right w-24">MONTANT</div>
                </div>
                <div class="grid grid-cols-[1fr_auto_auto] gap-4 py-1.5 items-baseline">
                  <div>
                    <h4 class="font-serif text-base font-bold text-stone-900 leading-snug">${listingTitle}</h4>
                    <p class="text-[10px] text-stone-500 mt-1 uppercase font-mono tracking-wider">ÉTAT : <span class="font-bold text-stone-700">${listingCondition}</span></p>
                  </div>
                  <div class="text-center font-mono text-sm text-stone-500 w-12">1x</div>
                  <div class="text-right font-serif text-base font-bold text-stone-900 w-24">${formattedPrice} €</div>
                </div>
              </div>

              <!-- Calculations block -->
              <div class="flex flex-col items-end border-t border-stone-200 pt-5">
                <div class="w-full sm:w-72 space-y-1.5 text-xs">
                  <div class="flex justify-between items-center text-stone-500 font-mono text-[11px]">
                    <span>SOUS-TOTAL</span>
                    <span>${formattedPrice} €</span>
                  </div>
                  <div class="flex justify-between items-center text-stone-500 font-mono text-[11px]">
                    <span>FRAIS DE SERVICE BROCANTE</span>
                    <span class="text-emerald-600 font-bold">0.00 € <span class="text-[9px] font-extrabold">(GRATUIT)</span></span>
                  </div>
                  <div class="flex justify-between items-center text-stone-500 font-mono text-[11px] pb-1 border-b border-stone-100">
                    <span>TAXES LOCALES (TVA)</span>
                    <span>0.00 €</span>
                  </div>
                  <div class="flex justify-between items-center pt-3 text-stone-900 font-serif">
                    <span class="text-sm font-black tracking-wide">TOTAL</span>
                    <span class="text-xl font-black">${formattedPrice} €</span>
                  </div>
                </div>
              </div>

              <!-- Double validation block -->
              <div class="rounded-xl border border-stone-200 p-4 bg-stone-50/50 flex gap-4 items-center justify-between">
                <div class="flex gap-4 items-center">
                  <div class="w-10 h-10 rounded-full bg-stone-950 flex items-center justify-center shrink-0 shadow-xs">
                    <svg class="w-5 h-5 text-stone-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  </div>
                  <div>
                    <h5 class="text-[12px] font-bold text-stone-850 leading-snug">Double validation validée</h5>
                    <p class="text-[10px] text-stone-500 leading-snug mt-0.5">Le vendeur et l'acheteur attestent avoir échangé cet objet en conformité locale. La remise en mains propres a été authentifiée par les deux parties.</p>
                  </div>
                </div>
                <div class="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold border border-emerald-100 rounded-md px-2 py-0.5 uppercase tracking-wider shrink-0 select-none">
                  Vérifié
                </div>
              </div>

              <!-- Final Status Block -->
              <div class="border border-dashed border-rose-250 bg-rose-50/30 rounded-xl py-3 px-4 text-center">
                <div class="text-xs font-serif font-black tracking-widest text-rose-800 uppercase flex items-center justify-center gap-2">
                  <span>★</span>
                  <span>STATUT FINAL : VENDU & ÉPUISÉ</span>
                  <span>★</span>
                </div>
              </div>

              <!-- Footnote details -->
              <div class="text-[8.5px] text-center text-stone-400 space-y-1 font-mono uppercase tracking-wider pt-4">
                <p>Document généré électroniquement par le système central de LA BROCANTE.</p>
                <div class="flex justify-center items-center gap-1.5 text-[8.5px]">
                  <span>Conditions Générales</span>
                  <span>•</span>
                  <span>Politique de Confidentialité</span>
                  <span>•</span>
                  <span>Assistance</span>
                </div>
                <p class="text-[8px] text-stone-350">© 2026 LA BROCANTE. TOUTES LES TRANSACTIONS SONT DÉFINITIVES.</p>
              </div>
            </div>

            <!-- Auto print prompt -->
            <script>
              setTimeout(() => {
                window.print();
              }, 600);
            </script>
          </body>
          </html>
        `;

        // Direct printable iframe approach
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "none";
        document.body.appendChild(iframe);
        iframe.contentDocument?.write(printContent);
        iframe.contentDocument?.close();

        // Download backup file
        const blob = new Blob([printContent], { type: "text/html" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `Brocante_Facture_${invoiceId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        // Notify user
        setInvoiceAlertMessage("🧾 Impression lancée & fichier de facture téléchargé !");
        
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      };

      return (
        <div className="w-full space-y-4 max-w-xl mx-auto my-2 select-text">
          {/* Main Display Receipt matching screenshot */}
          <div className="bg-white text-stone-900 border border-stone-250 shadow-md p-5 sm:p-7 rounded-2xl relative space-y-5 text-left font-sans transition-all">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b border-stone-200 pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-extrabold tracking-wider text-stone-900 uppercase leading-none">LA BROCANTE</h2>
                <p className="text-[7.5px] uppercase tracking-widest font-mono text-stone-500 mt-1">PROVENCE-ALPES-CÔTE D'AZUR</p>
                <p className="text-[8.5px] italic font-serif text-stone-400">Plateforme Libre de Remise en Mains Propres</p>
              </div>
              <div className="text-[8.5px] space-y-0.5 font-mono text-stone-400 text-left sm:text-right">
                <div className="flex sm:justify-end gap-1.5">
                  <span className="uppercase">JUSTIFICATIF N°:</span>
                  <span className="font-bold text-stone-800">{invoiceId}</span>
                </div>
                <div className="flex sm:justify-end gap-1.5">
                  <span className="uppercase">DATE D'ACHAT:</span>
                  <span className="font-bold text-stone-700">{dateString}</span>
                </div>
              </div>
            </div>

            {/* Buyer & Seller Cols */}
            <div className="grid grid-cols-2 gap-4 border-b border-stone-150 pb-4">
              <div className="space-y-0.5">
                <p className="text-[8px] uppercase tracking-wider font-mono text-stone-400">ACHETEUR</p>
                <h4 className="font-serif text-xs font-bold text-stone-900 truncate">{bName}</h4>
                <p className="text-[10px] text-stone-450 truncate">({buyerEmailVal})</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] uppercase tracking-wider font-mono text-stone-400">VENDEUR</p>
                <h4 className="font-serif text-xs font-bold text-stone-900 truncate">{sName}</h4>
                <p className="text-[10px] text-stone-450 italic truncate">{sellerRole}</p>
              </div>
            </div>

            {/* Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-[8px] uppercase tracking-wider font-mono text-stone-400 border-b border-stone-150 pb-1">
                <div>ARTICLE TRANSACTIONNÉ</div>
                <div className="text-center w-10">QTÉ</div>
                <div className="text-right w-20">MONTANT</div>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 py-0.5 items-baseline">
                <div>
                  <h4 className="font-serif text-xs font-bold text-stone-900 leading-tight">{listingTitle}</h4>
                  <p className="text-[9px] text-stone-450 mt-0.5 uppercase font-mono tracking-wider">ÉTAT : <span className="font-bold text-stone-700">{listingCondition}</span></p>
                </div>
                <div className="text-center font-mono text-[11px] text-stone-450 w-10">1x</div>
                <div className="text-right font-serif text-xs font-bold text-stone-900 w-20">{formatPrice(rawPrice, chatCurrency)}</div>
              </div>
            </div>

            {/* Financial math */}
            <div className="flex flex-col items-end border-t border-stone-205 pt-3.5">
              <div className="w-full sm:w-60 space-y-1 text-[10px]">
                <div className="flex justify-between items-center text-stone-450 font-mono">
                  <span>SOUS-TOTAL</span>
                  <span>{formatPrice(rawPrice, chatCurrency)}</span>
                </div>
                <div className="flex justify-between items-center text-stone-450 font-mono">
                  <span>FRAIS DE SERVICE BROCANTE</span>
                  <span className="text-emerald-600 font-bold">{formatPrice(0, chatCurrency)} <span className="text-[8px] font-extrabold">(GRATUIT)</span></span>
                </div>
                <div className="flex justify-between items-center text-stone-450 font-mono pb-1 border-b border-stone-100">
                  <span>TAXES LOCALES (TVA)</span>
                  <span>{formatPrice(0, chatCurrency)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 text-stone-900 font-serif">
                  <span className="text-xs font-black tracking-wide">TOTAL</span>
                  <span className="text-sm font-black text-stone-950">{formatPrice(rawPrice, chatCurrency)}</span>
                </div>
              </div>
            </div>

            {/* Verification Block */}
            <div className="rounded-xl border border-stone-200/80 p-3 bg-stone-50/60 flex gap-3 items-center justify-between">
              <div className="flex gap-2.5 items-center">
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center shrink-0 shadow-3xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-stone-800 leading-tight">Double validation validée</h5>
                  <p className="text-[8.5px] text-stone-450 leading-snug mt-0.5">La remise en mains propres a été authentifiée par les deux parties en conformité locale.</p>
                </div>
              </div>
              <div className="bg-emerald-50 text-emerald-700 text-[7px] font-extrabold border border-emerald-100 rounded-md px-1.5 py-0.5 uppercase tracking-wider shrink-0 select-none">
                Vérifié
              </div>
            </div>

            {/* final status */}
            <div className="border border-dashed border-rose-200 bg-rose-50/20 rounded-xl py-2 px-3 text-center">
              <div className="text-[10px] font-serif font-black tracking-wider text-rose-800 uppercase flex items-center justify-center gap-1.5">
                <span>★</span>
                <span>STATUT FINAL : VENDU & ÉPUISÉ</span>
                <span>★</span>
              </div>
            </div>

            {/* Small Footer notes */}
            <div className="text-[8px] text-center text-stone-400 space-y-0.5 font-mono uppercase tracking-wider pt-2 border-t border-stone-100">
              <p>Document généré électroniquement par le système central de LA BROCANTE.</p>
              <p>© 2026 LA BROCANTE. TOUTES LES TRANSACTIONS SONT DÉFINITIVES.</p>
            </div>
          </div>

          {/* Interactive Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleDownloadPrint}
              className="text-[10px] sm:text-xs font-mono font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 flex items-center justify-center gap-1.5 px-4 py-2 border border-dashed border-amber-600/30 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-all cursor-pointer active:scale-95"
            >
              <Receipt className="w-3.5 h-3.5 animate-pulse" />
              <span>Télécharger Facture PDF Officielle</span>
            </button>
          </div>
        </div>
      );
    }

    // Auto-detect a system message
    const isSystemMessage = text.includes("[SYSTÈME]");
    if (isSystemMessage) {
      return (
        <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-[11px] leading-relaxed my-1 ${
          isDarkMode 
            ? "bg-amber-955/20 border-amber-800/40 text-amber-200" 
            : "bg-amber-50/70 border-amber-200 text-stone-900"
        }`}>
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="flex-1 font-sans">{text.replace("📢 [SYSTÈME]", "").trim()}</p>
        </div>
      );
    }

    const lines = text.split("\n");
    return (
      <div className="space-y-1.5 text-left select-text">
        {lines.map((line, lineIdx) => {
          let trimmedLine = line.trim();
          if (!trimmedLine) {
            return <div key={lineIdx} className="h-2" />;
          }
          
          const isBullet = trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ");
          const numberMatch = trimmedLine.match(/^(\d+)\.\s(.*)/);
          
          const parseFormatting = (input: string) => {
            const parts = [];
            let currentStr = input;
            
            while (currentStr.length > 0) {
              const boldStartIndex = currentStr.indexOf("**");
              if (boldStartIndex === -1) {
                parts.push(currentStr);
                break;
              }
              
              if (boldStartIndex > 0) {
                parts.push(currentStr.substring(0, boldStartIndex));
              }
              
              const boldEndIndex = currentStr.indexOf("**", boldStartIndex + 2);
              if (boldEndIndex === -1) {
                parts.push(currentStr.substring(boldStartIndex));
                break;
              }
              
              const boldText = currentStr.substring(boldStartIndex + 2, boldEndIndex);
              parts.push(
                <strong 
                  key={boldStartIndex} 
                  className={`font-black ${isFromMe ? "text-amber-100" : isDarkMode ? "text-amber-400" : "text-amber-800"}`}
                >
                  {boldText}
                </strong>
              );
              
              currentStr = currentStr.substring(boldEndIndex + 2);
            }
            return parts;
          };

          if (isBullet) {
            const bulletText = trimmedLine.substring(2);
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-1 py-0.5 animate-fadeIn">
                <span className={`text-[12px] mt-0.5 shrink-0 select-none ${isFromMe ? "text-amber-300" : "text-amber-600"}`}>•</span>
                <p className="flex-1 leading-relaxed text-xs">{parseFormatting(bulletText)}</p>
              </div>
            );
          } else if (numberMatch) {
            const num = numberMatch[1];
            const rest = numberMatch[2];
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-1 py-0.5 animate-fadeIn">
                <span className={`font-mono font-bold text-[10px] shrink-0 select-none ${isFromMe ? "text-amber-305" : "text-amber-600"}`}>{num}.</span>
                <p className="flex-1 leading-relaxed text-xs">{parseFormatting(rest)}</p>
              </div>
            );
          } else if (trimmedLine.includes(":") && !trimmedLine.toLowerCase().startsWith("http") && trimmedLine.indexOf(":") < 25) {
            const colonIdx = line.indexOf(":");
            const key = line.substring(0, colonIdx).trim();
            const val = line.substring(colonIdx + 1).trim();
            if (key.length > 0 && key.length < 30 && val.length > 0 && val.length < 120) {
              return (
                <div key={lineIdx} className={`my-1 px-3 py-1.5 rounded-xl border flex flex-wrap justify-between items-center gap-1.5 text-[11px] font-sans shadow-4xs animate-fadeIn ${
                  isFromMe 
                    ? "bg-amber-700/50 border-amber-500/20 text-stone-100" 
                    : isDarkMode
                      ? "bg-stone-900 border-stone-800 text-stone-300"
                      : "bg-[#fafafa] border-stone-155 text-stone-700"
                }`}>
                  <span className={`font-bold tracking-tight select-none ${isFromMe ? "text-amber-105" : "text-stone-400"}`}>{key}</span>
                  <span className="font-mono text-[10.5px] font-medium">{parseFormatting(val)}</span>
                </div>
              );
            }
          }
          
          return (
            <p key={lineIdx} className="leading-relaxed text-xs break-words">
              {parseFormatting(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const formattedTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Determine other user details
  const getThreadPeerName = (thread: ChatThread) => {
    const isSeller = currentUserEmail.toLowerCase().trim() === thread.sellerEmail.toLowerCase().trim();
    return isSeller ? thread.buyerName : thread.sellerName;
  };

  const getThreadPeerRoleLabel = (thread: ChatThread) => {
    const isSeller = currentUserEmail.toLowerCase().trim() === thread.sellerEmail.toLowerCase().trim();
    return isSeller ? "Acheteur" : "Vendeur";
  };

  return (
    <div className={`flex h-full w-full overflow-hidden transition-colors duration-300 ${isDarkMode ? "bg-stone-900 text-stone-100" : "bg-white text-stone-900"}`}>
      {/* 1. Threads Sidebar */}
      <div className={`w-full md:w-[320px] flex flex-col h-full border-r shrink-0 ${isDarkMode ? "border-stone-800 bg-stone-900" : "border-stone-200 bg-stone-50/15"} ${activeThreadId ? "hidden md:flex" : "flex"}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? "border-stone-850 bg-stone-950/40" : "border-stone-150 bg-stone-50/40"}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"}`}>
              <Inbox className="w-4 h-4" />
            </div>
            <span className={`font-bold text-sm ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>Discussions</span>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDarkMode ? "bg-stone-800 text-stone-300" : "bg-amber-55 text-amber-800 border border-amber-150"}`}>
            {filteredThreads.length} actif{filteredThreads.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Filters Toggles based on user request */}
        <div className={`p-3 border-b ${isDarkMode ? "bg-stone-955/45 border-stone-850" : "bg-stone-50/30 border-stone-100"}`}>
          <div className="flex gap-1.5 overflow-x-auto scroller-none py-0.5 scrollbar-thin">
            <button
              type="button"
              id="thread-filter-all"
              onClick={() => setThreadFilter("all")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                threadFilter === "all"
                  ? "bg-amber-500 text-stone-950 border-amber-500 shadow-3xs"
                  : isDarkMode
                    ? "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                    : "bg-white text-stone-605 border-stone-200 hover:bg-stone-50"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              id="thread-filter-received"
              onClick={() => setThreadFilter("received")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                threadFilter === "received"
                  ? "bg-amber-500 text-stone-950 border-amber-500 shadow-3xs"
                  : isDarkMode
                    ? "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                    : "bg-white text-stone-605 border-stone-200 hover:bg-stone-50"
              }`}
            >
              Ventes
            </button>
            <button
              type="button"
              id="thread-filter-sent"
              onClick={() => setThreadFilter("sent")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                threadFilter === "sent"
                  ? "bg-amber-500 text-stone-950 border-amber-500 shadow-3xs"
                  : isDarkMode
                    ? "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                    : "bg-white text-stone-605 border-stone-200 hover:bg-stone-50"
              }`}
            >
              Achats
            </button>
            <button
              type="button"
              id="thread-filter-to-confirm-sales"
              onClick={() => setThreadFilter("to-confirm-sales")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer whitespace-nowrap border shrink-0 flex items-center gap-1 ${
                threadFilter === "to-confirm-sales"
                  ? "bg-amber-500 text-stone-950 border-amber-500 shadow-3xs"
                  : isDarkMode
                    ? "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                    : "bg-white text-stone-605 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-amber-600 inline-block animate-ping"></span>
              À valider (Ventes)
            </button>
            <button
              type="button"
              id="thread-filter-to-confirm-purchases"
              onClick={() => setThreadFilter("to-confirm-purchases")}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all cursor-pointer whitespace-nowrap border shrink-0 flex items-center gap-1 ${
                threadFilter === "to-confirm-purchases"
                  ? "bg-amber-500 text-stone-950 border-amber-500 shadow-3xs"
                  : isDarkMode
                    ? "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                    : "bg-white text-stone-605 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span>
              À valider (Achats)
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto pb-[82px] sm:pb-[86px] divide-y ${isDarkMode ? "divide-stone-850" : "divide-stone-100"}`}>
          {filteredThreads.length === 0 ? (
            <div className={`p-8 text-center mt-12 ${isDarkMode ? "bg-stone-900 text-stone-400" : "bg-white text-stone-400"}`}>
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-stone-400 stroke-[1.5px]" />
              <p className="text-xs font-semibold text-stone-500">Aucune discussion</p>
              <p className="text-[10px] mt-1 text-stone-400 max-w-[200px] mx-auto">Aucune conversation ne correspond à ce filtre pour le moment.</p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const lastMsg = thread.messages[thread.messages.length - 1];
              const isSelected = thread.id === activeThreadId;
              const peerName = getThreadPeerName(thread);
              const peerRole = getThreadPeerRoleLabel(thread);
              
              const isSeller = currentUserEmail.toLowerCase().trim() === (thread.sellerEmail || "").toLowerCase().trim();
              const peerMail = isSeller ? thread.buyerEmail : thread.sellerEmail;

              const unreadCount = thread.messages.filter(
                (m) => m.senderEmail.toLowerCase().trim() !== currentUserEmail.toLowerCase().trim() && !m.isRead
              ).length;

              return (
                <div
                  key={thread.id}
                  onClick={() => onSelectThread(thread.id)}
                  className={`p-3.5 flex gap-3 cursor-pointer items-start transition-all duration-155 relative border-l-2 ${
                    isSelected 
                      ? (isDarkMode ? "bg-stone-800/60 border-l-amber-500" : "bg-amber-50/30 border-l-amber-500 shadow-3xs") 
                      : (isDarkMode ? "hover:bg-stone-800/30 border-l-transparent" : "hover:bg-stone-100/45 border-l-transparent")
                  }`}
                >
                  <ThreadAvatar
                    imageUrl={thread.listingImageUrl}
                    title={thread.listingTitle}
                    badgeRole={peerRole}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfileModalUser({ name: peerName, email: peerMail || "" });
                        }}
                        title="Voir le profil du citadin"
                        className={`text-xs font-bold truncate hover:underline cursor-pointer flex items-center gap-1 ${isDarkMode ? "text-stone-100 hover:text-amber-400" : "text-stone-800 hover:text-amber-700"} ${unreadCount > 0 ? "font-extrabold" : "font-semibold"}`}
                      >
                        {peerName}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {isThreadExceedingLimit(thread.id) && (
                          <span className="text-[8px] bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 px-1 py-0.2 rounded-md font-bold shrink-0">
                            🔒 Limite
                          </span>
                        )}
                        <span className="text-[9px] text-stone-400 font-mono">
                          {formattedTime(thread.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-amber-600 font-serif font-semibold truncate mb-0.5 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>{thread.listingTitle}</span>
                      <span className="text-stone-400/80 font-mono">• {formatPrice(thread.listingPrice, chatCurrency)}</span>
                    </p>

                    <p className={`text-xs truncate ${unreadCount > 0 ? "font-semibold text-stone-900" : "text-stone-450"}`}>
                      {lastMsg ? lastMsg.text : "Démarrez l'échange..."}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <span className="self-center bg-amber-600 text-white font-mono font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Messages Core Window */}
      <div className={`flex-1 flex flex-col bg-stone-50/20 ${
        activeThreadId 
          ? "fixed inset-0 z-50 md:relative md:inset-auto md:z-auto bg-stone-50/20 flex w-full h-full" 
          : "hidden md:flex flex-col h-full items-center justify-center p-8 text-center"
      }`}>
        {activeThread ? (
          <>
            {/* Header: Peer info & Back action for mobile */}
            <div className={`sticky top-0 z-35 shadow-xs border-b px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 transition-colors ${isDarkMode ? "bg-stone-900 border-stone-800" : "bg-white border-stone-200"}`}>
              {/* Left Side Group: Back, Avatar, Text info */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Back Button for mobile */}
                <button
                  type="button"
                  onClick={() => onSelectThread("")}
                  className={`md:hidden p-2 rounded-xl shrink-0 transition-transform active:scale-95 flex items-center justify-center ${
                    isDarkMode 
                      ? "bg-stone-800 text-stone-200 hover:bg-stone-700" 
                      : "bg-stone-105 text-stone-605 hover:text-stone-900 border border-stone-200/60"
                  }`}
                  aria-label="Retour aux discussions"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
                </button>

                <ThreadAvatar
                  imageUrl={activeThread.listingImageUrl}
                  title={activeThread.listingTitle}
                  sizeClass="w-10 h-10 rounded-xl shrink-0 object-cover"
                />

                <div className="min-w-0 flex-1 text-left">
                  {/* Main Chat Name: The Person's Name */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      onClick={() => {
                        const isSeller = currentUserEmail.toLowerCase().trim() === (activeThread.sellerEmail || "").toLowerCase().trim();
                        const peerMail = isSeller ? activeThread.buyerEmail : activeThread.sellerEmail;
                        setProfileModalUser({ name: getThreadPeerName(activeThread), email: peerMail || "" });
                      }}
                      title="Voir le profil"
                      className={`text-base font-bold tracking-tight cursor-pointer hover:underline transition-colors ${
                        isDarkMode ? "text-stone-100 hover:text-amber-400" : "text-stone-900 hover:text-amber-700"
                      }`}
                    >
                      {getThreadPeerName(activeThread)}
                    </span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                      getThreadPeerRoleLabel(activeThread) === "Vendeur"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                        : "bg-sky-500/10 text-sky-500 border border-sky-500/15"
                    }`}>
                      {getThreadPeerRoleLabel(activeThread)}
                    </span>
                  </div>

                  {/* Context Subtitle: Listing Title */}
                  <p className="text-xs text-stone-400 dark:text-stone-500 truncate mt-1 flex items-center gap-1">
                    <span className="opacity-70">Sujet :</span>
                    <span className={`font-semibold ${isDarkMode ? "text-stone-300" : "text-stone-705"}`} title={activeThread.listingTitle}>
                      {activeThread.listingTitle}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right Side Group: Options + Price tag */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-stone-100 dark:border-stone-850">
                <div className="text-right font-mono text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl text-emerald-805 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 shrink-0">
                  {formatPrice(activeThread.listingPrice, chatCurrency)}
                </div>

                <button
                  type="button"
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                    isDetailsExpanded
                      ? "bg-amber-500 border-amber-500 text-stone-950"
                      : isDarkMode
                        ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
                        : "bg-stone-50 border-stone-250/60 text-stone-605 hover:bg-stone-100"
                  }`}
                  title="Afficher les détails de l'article"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isDetailsExpanded ? "Masquer" : "Détails"}</span>
                </button>

                {activeThread && currentUserEmail.toLowerCase().trim() === (activeThread.sellerEmail || "").toLowerCase().trim() && (
                  <button
                    type="button"
                    onClick={handleSendInvoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                      isDarkMode
                        ? "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
                        : "bg-stone-50 border-stone-250/60 text-stone-700 hover:bg-stone-100"
                    }`}
                    title="Générer et envoyer la facture d'achat"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Facture</span>
                    {!isProUser && (
                      <span className="text-[7.5px] font-mono tracking-wider px-1 py-0.5 rounded-md bg-amber-500 text-stone-950 font-extrabold ml-0.5 leading-none shadow-3xs uppercase shrink-0">
                        Pro
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Premium collapsible Listing details card block (The "merchandise" details) */}
            {(() => {
              const activeListing = listings.find(l => l.id === activeThread.listingId) || null;
              if (!isDetailsExpanded) return null;
              
              return (
                <div className={`mx-2 sm:mx-4 mt-1.5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all text-[11px] sm:text-xs space-y-2.5 sm:space-y-3.5 shadow-3xs text-left ${
                  isDarkMode 
                    ? "bg-stone-900 border-stone-800 text-stone-300" 
                    : "bg-[#fdfdfd] border-stone-200 text-stone-850 animate-fadeIn"
                }`}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-serif font-bold text-xs uppercase tracking-wider text-amber-600 flex items-center gap-1.5 select-none">
                      <ShoppingBag className="w-4 h-4" />
                      Fiche de l'Article & Descriptif
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDetailsExpanded(false)}
                      className="p-1 text-stone-400 hover:text-stone-605 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-xs font-bold leading-none cursor-pointer"
                      title="Masquer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-3 select-none">
                    <div 
                      style={isDarkMode ? {} : { backgroundColor: "#676767" }}
                      className="p-2.5 rounded-xl bg-stone-50/70 dark:bg-stone-850/20 border border-stone-155 dark:border-stone-850/60"
                    >
                      <p 
                        style={isDarkMode ? {} : { color: "#000000" }}
                        className="text-[9px] uppercase tracking-wider font-mono text-stone-400"
                      >
                        État
                      </p>
                      <p className={`font-serif font-bold text-[11px] mt-0.5 ${
                        isDarkMode ? "text-amber-400" : "text-amber-700"
                      }`}>
                        ✨ {activeListing?.condition || "Bon état"}
                      </p>
                    </div>

                    <div 
                      style={isDarkMode ? {} : { backgroundColor: "#676767" }}
                      className="p-2.5 rounded-xl bg-stone-50/70 dark:bg-stone-850/20 border border-stone-155 dark:border-stone-850/60"
                    >
                      <p 
                        style={isDarkMode ? {} : { color: "#000000" }}
                        className="text-[9px] uppercase tracking-wider font-mono text-stone-400"
                      >
                        Localisation
                      </p>
                      <p 
                        style={isDarkMode ? {} : { color: "#ffffff" }}
                        className="font-serif font-bold text-[11px] mt-0.5 text-stone-700 dark:text-stone-300 truncate"
                      >
                        📍 {activeListing?.location || "En France"}
                      </p>
                    </div>

                    <div 
                      style={isDarkMode ? {} : { backgroundColor: "#676767" }}
                      className="p-2.5 rounded-xl bg-stone-50/70 dark:bg-stone-850/20 border border-stone-155 dark:border-stone-850/60"
                    >
                      <p 
                        style={isDarkMode ? {} : { color: "#000000" }}
                        className="text-[9px] uppercase tracking-wider font-mono text-stone-400 font-semibold"
                      >
                        Catégorie
                      </p>
                      <p 
                        style={isDarkMode ? {} : { color: "#ffffff" }}
                        className="font-serif font-bold text-[11px] mt-0.5 text-stone-700 dark:text-stone-300"
                      >
                        🏷️ {activeListing?.category || "Divers"}
                      </p>
                    </div>

                    <div 
                      style={isDarkMode ? {} : { backgroundColor: "#676767" }}
                      className="p-2.5 rounded-xl bg-stone-50/70 dark:bg-stone-850/20 border border-stone-155 dark:border-stone-850/60"
                    >
                      <p 
                        style={isDarkMode ? {} : { color: "#000000" }}
                        className="text-[9px] uppercase tracking-wider font-mono text-stone-400"
                      >
                        Prix demandé
                      </p>
                      <p className="font-serif font-extrabold text-[11px] mt-0.5 text-emerald-600 dark:text-emerald-400">
                        💰 {formatPrice(activeListing?.price || activeThread.listingPrice, chatCurrency)}
                      </p>
                    </div>
                  </div>

                  {/* Add size/color details if they exist on the listing */}
                  {(activeListing?.size || activeListing?.color || (activeListing?.quantity && activeListing?.quantity > 1) || activeThread?.requestedQuantity) && (
                    <div className="p-2.5 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 flex flex-wrap gap-2 text-[10px] select-none">
                      {activeListing?.size && (
                        <span className="bg-stone-105/50 dark:bg-stone-800 text-stone-605 dark:text-stone-300 px-2.5 py-1 rounded-md font-medium border border-stone-155 dark:border-stone-800">
                          Taille : <strong>{activeListing.size}</strong>
                        </span>
                      )}
                      {activeListing?.color && (
                        <span className="bg-stone-105/50 dark:bg-stone-800 text-stone-605 dark:text-stone-300 px-2.5 py-1 rounded-md font-medium border border-stone-155 dark:border-stone-805">
                          Couleur : <strong>{activeListing.color}</strong>
                        </span>
                      )}
                      {activeListing?.quantity && activeListing.quantity > 1 && (
                        <span className="bg-stone-105/50 dark:bg-stone-800 text-stone-605 dark:text-stone-300 px-2.5 py-1 rounded-md font-medium border border-stone-155 dark:border-stone-805">
                          Quantité dispo : <strong>{activeListing.quantity}</strong>
                        </span>
                      )}
                      {activeThread?.requestedQuantity && (
                        <span className="bg-amber-500/10 dark:bg-amber-950/40 text-amber-705 dark:text-amber-400 px-2.5 py-1 rounded-md font-bold border border-amber-500/15">
                          Quantité demandée : <strong className="font-mono text-[11px]">{activeThread.requestedQuantity}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Styled Description box - matches Sophie's brand description design! */}
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase tracking-wider font-mono text-stone-400 select-none">Descriptif de la marchandise</p>
                    <p className={`text-xs whitespace-pre-line leading-relaxed p-3.5 rounded-xl border transition-colors select-text ${
                      isDarkMode 
                        ? "bg-stone-105/50 text-stone-300" 
                        : "bg-[#fafafa] border-stone-155 text-stone-605"
                    }`}>
                      {activeListing?.description || "Aucune description de la marchandise n'a été rédigée."}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Unified Controls: Message Filters & Transaction Status */}
            {/* Unified Controls: Message Filters & Transaction Status */}
            <div className={`px-4 sm:px-6 py-2 border-b flex flex-row items-center justify-between gap-3 flex-wrap flex-shrink-0 transition-colors ${
              isDarkMode ? "bg-stone-900/40 border-stone-850" : "bg-stone-50/40 border-stone-150"
            }`}>
              {/* Message Filters (Tous, Reçus, Envoyés) */}
              <div className="flex items-center select-none font-sans max-w-[210px] w-full shrink-0">
                <div className={`flex p-0.5 rounded-lg border w-full ${isDarkMode ? "bg-stone-950 border-stone-850" : "bg-stone-105 border-stone-200"}`}>
                  <button
                    type="button"
                    id="msg-filter-all"
                    onClick={() => setMessageFilter("all")}
                    className={`flex-1 px-1.5 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                      messageFilter === "all"
                        ? (isDarkMode ? "bg-stone-800 text-amber-400 font-bold shadow-sm" : "bg-white text-stone-950 font-bold shadow-3xs")
                        : "text-stone-400 hover:text-stone-705"
                    }`}
                  >
                    Tous ({activeThread.messages.length})
                  </button>
                  
                  <button
                    type="button"
                    id="msg-filter-received"
                    onClick={() => setMessageFilter("received")}
                    className={`flex-1 px-1.5 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                      messageFilter === "received"
                        ? (isDarkMode ? "bg-stone-800 text-emerald-450 font-bold shadow-sm" : "bg-white text-emerald-950 font-bold shadow-3xs")
                        : "text-stone-400 hover:text-stone-705"
                    }`}
                  >
                    Reçus ({activeThread.messages.filter(m => m.senderEmail.toLowerCase().trim() !== currentUserEmail.toLowerCase().trim()).length})
                  </button>

                  <button
                    type="button"
                    id="msg-filter-sent"
                    onClick={() => setMessageFilter("sent")}
                    className={`flex-1 px-1.5 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                      messageFilter === "sent"
                        ? (isDarkMode ? "bg-stone-800 text-sky-450 font-bold shadow-sm" : "bg-white text-sky-950 font-bold shadow-3xs")
                        : "text-stone-400 hover:text-stone-705"
                    }`}
                  >
                    Envoyés ({activeThread.messages.filter(m => m.senderEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()).length})
                  </button>
                </div>
              </div>

              {/* Bottom part: Double-confirmation Status Button (placed side-by-side with message filters) */}
              <div className="flex justify-end shrink-0">
                {(() => {
                  const isSeller = (currentUserEmail || "").toLowerCase().trim() === (activeThread?.sellerEmail || "").toLowerCase().trim();
                  const isBuyer = (currentUserEmail || "").toLowerCase().trim() === (activeThread?.buyerEmail || "").toLowerCase().trim();
                  
                  const buyerConfirmed = activeThread.listingBuyerConfirmed || false;
                  const sellerConfirmed = activeThread.listingSellerConfirmed || false;
                  const isSold = activeThread.listingIsSold || false;

                  let statusLabel = "";
                  let statusColorClass = "";
                  let hasAlert = false;

                  if (isBuyer) {
                    if (isSold || (buyerConfirmed && sellerConfirmed)) {
                      statusLabel = "Achat Finalisé";
                      statusColorClass = isDarkMode ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-emerald-50 text-emerald-705 border-emerald-250";
                    } else if (buyerConfirmed) {
                      statusLabel = "Attente Envoi";
                      statusColorClass = isDarkMode ? "bg-amber-500/15 text-amber-400 border-amber-500/25" : "bg-amber-50/70 text-amber-805 border-amber-200";
                    } else {
                      statusLabel = "Confirmer Achat";
                      statusColorClass = isDarkMode ? "bg-amber-500/25 text-amber-300 border-amber-500/40 font-bold animate-pulse" : "bg-amber-100 text-amber-900 border-amber-300 font-bold";
                      hasAlert = true;
                    }
                  } else if (isSeller) {
                    if (isSold || (buyerConfirmed && sellerConfirmed)) {
                      statusLabel = "Vente Finalisée";
                      statusColorClass = isDarkMode ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-emerald-50 text-emerald-705 border-emerald-250";
                    } else if (buyerConfirmed) {
                      statusLabel = "Confirmer Envoi";
                      statusColorClass = isDarkMode ? "bg-rose-500/25 text-rose-300 border-rose-500/40 font-bold animate-pulse" : "bg-rose-50 text-rose-900 border-rose-300 font-bold";
                      hasAlert = true;
                    } else {
                      statusLabel = "Attente Acheteur";
                      statusColorClass = isDarkMode ? "bg-stone-800 text-stone-400 border-stone-750" : "bg-stone-105 text-stone-500 border-stone-200/60";
                    }
                  }

                  return (
                    <button
                      type="button"
                      onClick={() => setIsWorkspaceCollapsed(!isWorkspaceCollapsed)}
                      className={`flex items-center justify-between gap-1.5 py-1 px-2.5 text-[9px] sm:text-[10px] font-bold rounded-lg border transition-all hover:brightness-95 active:scale-98 cursor-pointer shadow-3xs ${statusColorClass}`}
                    >
                      <span className="flex items-center gap-1 min-w-0">
                        {hasAlert ? (
                           <span className="relative flex h-1.5 w-1.5 shrink-0">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                           </span>
                        ) : (
                          <span className="w-1 h-1 rounded-full bg-current shrink-0"></span>
                        )}
                        <span className="truncate">🤝 Statut : {statusLabel}</span>
                      </span>
                      <span className="text-[8px] font-semibold opacity-70 ml-1.5 shrink-0">
                        {isWorkspaceCollapsed ? "Ouvrir actions ▼" : "Fermer actions ▲"}
                      </span>
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Double-confirmation interactive workspace */}
            {(() => {
              const isSeller = (currentUserEmail || "").toLowerCase().trim() === (activeThread?.sellerEmail || "").toLowerCase().trim();
              const isBuyer = (currentUserEmail || "").toLowerCase().trim() === (activeThread?.buyerEmail || "").toLowerCase().trim();
              
              const buyerConfirmed = activeThread.listingBuyerConfirmed || false;
              const sellerConfirmed = activeThread.listingSellerConfirmed || false;
              const isSold = activeThread.listingIsSold || false;

              if (isWorkspaceCollapsed) {
                return null;
              }

              if (isBuyer) {
                if (isSold || (buyerConfirmed && sellerConfirmed)) {
                  return (
                    <div className={`px-4 sm:px-6 py-4 border-b text-[11px] sm:text-xs space-y-3 transition-colors ${isDarkMode ? "bg-stone-900/40 border-stone-850 text-stone-200" : "bg-emerald-50/40 border-emerald-150 text-emerald-900"}`}>
                      <div className="flex gap-2.5 items-center justify-between">
                        <div className="flex gap-2.5 items-center flex-1">
                          <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold leading-tight">✓ Achat Finalisé !</p>
                            <p className={`text-[10px] mt-0.5 leading-tight ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                              Félicitations ! La transaction est maintenant double-confirmée. Cet objet vous appartient désormais.
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setIsWorkspaceCollapsed(true)} className="p-1 text-stone-400 hover:text-stone-605 font-bold ml-1 cursor-pointer" title="Masquer">✕</button>
                      </div>

                      {/* Interactive Rating Form */}
                      <div className={`p-3 rounded-xl border border-dashed text-left space-y-2.5 ${isDarkMode ? "bg-stone-950/40 border-stone-800" : "bg-white border-stone-200"}`}>
                        <h5 className="font-bold text-[10px] uppercase tracking-wide text-stone-400 font-mono leading-tight">
                          Évaluez votre expérience avec le vendeur ({activeThread.sellerName}) :
                        </h5>

                        {(() => {
                          const allReviews = getAllReviews();
                          const existingReview = allReviews.find(
                            r => r.orderId === activeThread.listingId && r.senderEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()
                          );

                          if (existingReview || isRatingSubmitted) {
                            const ratingToDisplay = existingReview ? existingReview.rating : interactiveRating;
                            const commentToDisplay = existingReview ? existingReview.text : ratingComment;
                            return (
                              <div className="space-y-1.5 py-1 animate-fadeIn">
                                <p className="text-emerald-605 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                                  <span>🌟 Merci ! Votre évaluation a bien été enregistrée.</span>
                                </p>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < ratingToDisplay ? "fill-amber-400 text-amber-500" : "text-stone-300 dark:text-stone-700"}`} />
                                  ))}
                                  <span className="text-[11px] font-mono font-bold text-stone-400 ml-1">({ratingToDisplay}/5)</span>
                                </div>
                                {commentToDisplay && (
                                  <p className="text-[11px] italic text-stone-400 border-l-2 border-stone-300 pl-2 mt-1">
                                    "{commentToDisplay}"
                                  </p>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3 flex flex-col pt-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => {
                                    const score = i + 1;
                                    const isLit = interactiveRating >= score;
                                    return (
                                      <button
                                        type="button"
                                        key={score}
                                        onClick={() => setInteractiveRating(score)}
                                        className="text-stone-300 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                                      >
                                        <Star className={`w-5 h-5 ${isLit ? "fill-amber-400 text-amber-500" : "text-stone-300 dark:text-stone-750"}`} />
                                      </button>
                                    );
                                  })}
                                </div>
                                <span className={`text-[10px] font-mono font-bold ${interactiveRating > 0 ? "text-amber-500" : "text-stone-400"}`}>
                                  {interactiveRating > 0 ? `${interactiveRating} / 5` : "Cliquez sur une étoile"}
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <textarea
                                  value={ratingComment}
                                  onChange={(e) => setRatingComment(e.target.value)}
                                  placeholder="Mettez un petit mot sur son sérieux, sa ponctualité ou sa gentillesse..."
                                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-amber-400 transition-colors ${
                                    isDarkMode 
                                      ? "bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-600" 
                                      : "bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400"
                                  }`}
                                  rows={2}
                                />
                                
                                <button
                                  type="button"
                                  disabled={interactiveRating === 0}
                                  onClick={() => {
                                    if (interactiveRating === 0) return;
                                    addReview({
                                      orderId: activeThread.listingId,
                                      senderEmail: currentUserEmail,
                                      senderName: currentUserName || "Acheteur anonyme",
                                      targetEmail: activeThread.sellerEmail,
                                      rating: interactiveRating,
                                      text: ratingComment.trim() || "Transaction validée avec succès !"
                                    });
                                    setIsRatingSubmitted(true);
                                    setReviewsVersion(prev => prev + 1);
                                  }}
                                  className={`w-full sm:w-auto px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider font-extrabold shadow-3xs transition-transform transform active:scale-98 cursor-pointer ${
                                    interactiveRating > 0
                                      ? "bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
                                      : "bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-600 cursor-not-allowed"
                                  }`}
                                >
                                  Soumettre la note
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Direct shortcut rating button inside div:nth-of-type(3) */}
                      <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-stone-950/40 border-stone-800 text-stone-200" : "bg-[#fdfdfd] border-amber-200/60 text-stone-900"} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                        <div className="text-left space-y-0.5">
                          <p className="font-bold text-[11px] flex items-center gap-1.5 leading-tight">
                            <span className="text-amber-500 animate-pulse text-xs">★</span>
                            <span>Besoin d'évaluer le vendeur ou l'article plus tard ?</span>
                          </p>
                          <p className={`text-[10px] ${isDarkMode ? "text-stone-400" : "text-stone-500"} leading-snug`}>
                            Retrouvez vos formulaires d'évaluation à tout moment dans votre Centre de Notifications.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToNotifications) {
                              onNavigateToNotifications();
                            }
                          }}
                          className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold bg-amber-500 hover:bg-amber-600 active:scale-98 transition-all hover:brightness-105 text-stone-950 shadow-3xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
                        >
                          <span>Accéder aux évaluations</span>
                          <ArrowLeft className="w-3 h-3 rotate-180" />
                        </button>
                      </div>
                    </div>
                  );
                } else if (buyerConfirmed) {
                  return (
                    <div className={`px-4 sm:px-6 py-3.5 border-b text-[11px] sm:text-xs flex gap-2 sm:gap-2.5 items-start justify-between ${isDarkMode ? "bg-amber-955/20 border-stone-850 text-stone-300" : "bg-amber-50/40 border-amber-150 text-stone-850"}`}>
                      <div className="flex gap-2.5 items-start flex-1 text-left">
                        <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-ping"></span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold leading-tight bg-transparent text-amber-900 dark:text-amber-400">Votre confirmation d'achat et de réception a été enregistrée !</p>
                          <p className={`text-[10.5px] mt-0.5 leading-relaxed ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
                            Vous avez confirmé votre achat et la bonne réception de l'article payé (<strong>{formatPrice(activeThread.listingPrice, chatCurrency)}</strong>). Veuillez attendre que le vendeur ({activeThread.sellerName}) valide la vente et l'envoi du colis de son côté.
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setIsWorkspaceCollapsed(true)} className="p-1 text-stone-400 hover:text-stone-600 font-bold ml-1 cursor-pointer" title="Masquer">✕</button>
                    </div>
                  );
                } else {
                  const associatedListing = listings.find((l) => l.id === activeThread.listingId) || null;
                  const maxLimit = associatedListing?.quantity !== undefined && associatedListing.quantity >= 1 ? associatedListing.quantity : 1;

                  return (
                    <div className={`px-4 sm:px-6 py-4 border-b text-[11px] sm:text-xs space-y-3 shadow-2xs ${isDarkMode ? "bg-stone-900/50 border-stone-850 text-stone-300" : "bg-amber-50/20 border-amber-150 text-stone-850"}`}>
                      {/* Header block with close button */}
                      <div className="flex items-start gap-2.5 justify-between">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0 text-left">
                          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-705 mt-0.5 shrink-0">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-serif font-bold text-xs sm:text-sm leading-tight text-amber-900 dark:text-amber-400">
                              Achat direct avec Double-Confirmation
                            </p>
                            <p className={`text-[10px] mt-1 leading-relaxed ${isDarkMode ? "text-stone-400" : "text-stone-605"}`}>
                              Achetez et déclarez la bonne réception de cet article en toute sécurité. Une fois votre achat et votre réception validés, le vendeur ({activeThread.sellerName}) devra confirmer de son côté l'envoi pour clore définitivement la transaction.
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setIsWorkspaceCollapsed(true)} className="p-1 text-stone-400 hover:text-stone-600 font-bold shrink-0 ml-1 cursor-pointer transition-colors" title="Masquer">✕</button>
                      </div>

                      {/* Controls Row */}
                      <div className="pt-3 border-t border-amber-205 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/50 dark:bg-stone-950/20 p-3 rounded-xl">
                        <div className="text-left flex-1">
                          <p className={`text-[10.5px] font-bold ${isDarkMode ? "text-amber-400" : "text-amber-800"}`}>
                            Sélectionnez la quantité à acheter :
                          </p>
                          <p className={`text-[9.5px] ${isDarkMode ? "text-stone-400" : "text-stone-500"} mt-0.5 leading-snug`}>
                            Prix unitaire : {formatPrice(activeThread.listingPrice, chatCurrency)} | Total : <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{formatPrice(activeThread.listingPrice * finalPurchaseQty, chatCurrency)}</span> (Stock : {maxLimit})
                          </p>
                        </div>
                        
                        {/* Stepper & Action button nested flex container */}
                        <div className="flex flex-wrap items-center gap-2.5 justify-start sm:justify-end w-full sm:w-auto">
                          {/* Stepper component */}
                          <div className="flex items-center gap-1 bg-white dark:bg-stone-950 px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-800 shadow-3xs shrink-0 select-none">
                            <button
                              type="button"
                              onClick={() => setFinalPurchaseQty(Math.max(1, finalPurchaseQty - 1))}
                              disabled={finalPurchaseQty <= 1}
                              className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-900 text-xs font-bold leading-none flex items-center justify-center disabled:opacity-30 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-800 select-none"
                            >
                              -
                            </button>
                            <span className="w-7 text-center text-xs font-mono font-extrabold text-stone-850 dark:text-stone-100">
                              {finalPurchaseQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFinalPurchaseQty(Math.min(maxLimit, finalPurchaseQty + 1));
                              }}
                              disabled={finalPurchaseQty >= maxLimit}
                              className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-900 text-xs font-bold leading-none flex items-center justify-center disabled:opacity-30 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-800 select-none"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={confirmPurchase}
                            disabled={confirming}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-serif font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-3xs cursor-pointer flex-1 sm:flex-initial shrink-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{confirming ? "Confirmation..." : "Confirmer mon achat"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              }

              if (isSeller) {
                if (isSold || (buyerConfirmed && sellerConfirmed)) {
                  return (
                    <div className={`px-4 sm:px-6 py-3.5 border-b text-[11px] sm:text-xs flex gap-2 sm:gap-2.5 items-center justify-between ${isDarkMode ? "bg-emerald-955/25 border-stone-850 text-stone-200" : "bg-emerald-50/40 border-emerald-150 text-emerald-900"}`}>
                      <div className="flex gap-2.5 items-center flex-1 text-left">
                        <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold leading-tight">Vente Double-Confirmée !</p>
                          <p className={`text-[10px] mt-0.5 leading-tight ${isDarkMode ? "text-stone-400" : "text-stone-505"}`}>
                            Cette vente est finalisée. Le paiement a été validé par vous et par l'acheteur {activeThread.buyerName}.
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setIsWorkspaceCollapsed(true)} className="p-1 text-stone-400 hover:text-stone-605 font-bold ml-1 cursor-pointer" title="Masquer">✕</button>
                    </div>
                  );
                } else if (buyerConfirmed) {
                  return (
                    <div className={`px-4 sm:px-6 py-4 border-b text-[11px] sm:text-xs space-y-3 relative overflow-hidden ${isDarkMode ? "bg-rose-950/20 border-stone-800 text-stone-300" : "bg-rose-50/20 border-rose-100 text-stone-800"}`}>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100/35 rounded-full translate-x-4 -translate-y-4 pointer-events-none"></div>
                      
                      {/* Flex Header with warning icon and action text */}
                      <div className="flex items-start gap-2.5 justify-between relative z-10">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0 text-left">
                          <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 mt-0.5 shrink-0 animate-pulse">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-serif font-bold text-rose-950 dark:text-rose-450 text-xs sm:text-sm leading-tight uppercase tracking-wider">
                              📥 Action requise : Valider l'Envoi
                            </p>
                            <p className={`text-[10px] mt-1 leading-relaxed ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>
                              L'acheteur <strong>{activeThread.buyerName}</strong> ({activeThread.buyerEmail}) a fait sa double-confirmation de cet achat. Veuillez confirmer de votre côté que la transaction est finalisée et l'objet remis/envoyé.
                            </p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setIsWorkspaceCollapsed(true)} className="p-1 text-stone-400 hover:text-stone-700 font-bold shrink-0 ml-1 cursor-pointer transition-colors" title="Masquer">✕</button>
                      </div>

                      {/* Actions row */}
                      <div className="pt-3 border-t border-rose-200/50 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/50 dark:bg-stone-900/20 p-3 rounded-xl relative z-10">
                        <div className="text-left">
                          <p className={`text-[10px] uppercase font-mono tracking-wider ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>Gains de la vente</p>
                          <p className={`font-mono text-base font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>{formatPrice(activeThread.listingPrice, chatCurrency)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={confirmSale}
                          disabled={confirming}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-serif font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-3xs cursor-pointer flex-1 sm:flex-initial shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{confirming ? "Validation..." : "Confirmer la vente & l'envoi effectué"}</span>
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className={`px-4 sm:px-6 py-3.5 border-b text-[11px] sm:text-xs flex gap-2 sm:gap-2.5 items-start justify-between ${isDarkMode ? "bg-stone-900/30 border-stone-850 text-stone-350" : "bg-stone-50 border-stone-200 text-stone-800"}`}>
                      <div className="flex gap-2.5 items-start flex-1 text-left">
                        <div className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-400 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600 inline-block animate-pulse"></span>
                        </div>
                        <div className="flex-1">
                          <p className="font-serif font-bold leading-tight">En attente de l'acheteur</p>
                          <p className={`text-[10px] mt-1 leading-relaxed ${isDarkMode ? "text-stone-400" : "text-stone-500"}`}>
                            L'acheteur ({activeThread.buyerName}) n'a pas encore validé l'achat direct. Lorsqu'il aura cliqué sur sa confirmation d'achat et de réception, vous recevrez une notification ici pour confirmer la vente et l'envoi de votre côté.
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setIsWorkspaceCollapsed(true)} className="p-1 text-stone-400 hover:text-stone-600 font-bold shrink-0 ml-1 cursor-pointer transition-colors" title="Masquer">✕</button>
                    </div>
                  );
                }
              }

              return null;
            })()}



            {/* Message bubble stream */}
            <div
              ref={scrollRef}
              className={`flex-1 overflow-y-auto px-2 sm:px-6 py-2 sm:py-4 space-y-2.5 sm:space-y-3.5 flex flex-col ${isDarkMode ? "bg-stone-900/20" : "bg-stone-50/15"}`}
            >
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-stone-400 my-auto">
                  <p className="text-xs italic">Aucun message ne correspond à ce filtre.</p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMe = msg.senderEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();

                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[90%] sm:max-w-[75%] rounded-xl sm:rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2.5 text-xs relative group ${
                        isMe
                          ? "bg-amber-600 text-white self-end rounded-br-none shadow-3xs"
                          : isDarkMode
                            ? "bg-stone-800 text-stone-100 border border-stone-700 shadow-3xs self-start rounded-bl-none"
                            : "bg-stone-100 text-stone-900 border border-stone-200 shadow-3xs self-start rounded-bl-none"
                      }`}
                    >
                      {/* Delete button option from choices */}
                      {msgIdToDelete === msg.id ? (
                        <div className={`absolute -top-3 p-1 px-1.5 rounded-lg border flex items-center gap-1.5 shadow-3xs text-[9px] font-bold z-20 whitespace-nowrap ${
                          isMe
                            ? "-left-4 bg-stone-900 border-stone-800 text-white"
                            : "-right-4 bg-white border-stone-200 text-stone-900"
                        }`}>
                          <span className={`${isMe ? "text-stone-300" : "text-stone-500"}`}>Supprimer le message ?</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id);
                              setMsgIdToDelete(null);
                            }}
                            className="text-white bg-rose-600 hover:bg-rose-700 px-1.5 py-0.5 rounded cursor-pointer leading-none text-[8.5px]"
                          >
                            Oui
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMsgIdToDelete(null);
                            }}
                            className="text-stone-700 bg-stone-100 hover:bg-stone-200 px-1.5 py-0.5 rounded cursor-pointer leading-none text-[8.5px]"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMsgIdToDelete(msg.id);
                          }}
                          className={`absolute -top-1.5 p-1 rounded-full border opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer shadow-3xs ${
                            isMe
                              ? "-left-1.5 bg-stone-950 border-stone-800 text-stone-400 hover:text-rose-400 hover:bg-stone-900"
                              : "-right-1.5 bg-white border-stone-200 text-stone-450 hover:text-rose-600 hover:bg-stone-50"
                          }`}
                          title="Supprimer ce message"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {!isMe && (
                        <p 
                          onClick={() => setProfileModalUser({ name: msg.senderName, email: msg.senderEmail })}
                          title="Voir le profil"
                          className={`text-[9px] font-bold uppercase tracking-wide mb-1 cursor-pointer hover:underline select-none transition-colors ${
                            isDarkMode ? "text-amber-400 hover:text-amber-300" : "text-amber-700 hover:text-amber-600"
                          }`}
                        >
                          {msg.senderName}
                        </p>
                      )}
                      {renderMessageText(msg.text, isMe)}
                      
                      <p className={`text-[8px] font-mono text-right mt-1.5 ${isMe ? "text-stone-250" : "text-stone-400"} flex items-center justify-end gap-1 select-none`}>
                        <span>{formattedTime(msg.createdAt)}</span>
                        {isMe && (
                          <span className={msg.isRead ? "text-emerald-300 font-bold" : "text-stone-300"}>
                            {msg.isRead ? "✓✓ Lu" : "✓ Envoyé"}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })
              )}

              {(() => {
                if (activeThread) {
                  const myMail = currentUserEmail.toLowerCase().trim();
                  const sellerMail = (activeThread.sellerEmail || "").toLowerCase().trim();
                  const buyerMail = (activeThread.buyerEmail || "").toLowerCase().trim();
                  const peerMail = myMail === sellerMail ? buyerMail : sellerMail;
                  const lastMsg = activeThread.messages[activeThread.messages.length - 1];
                  const isPeerAntigravity = peerMail === "antigravity@la-brocante.fr";
                  const isLastMessageFromMe = lastMsg && lastMsg.senderEmail.toLowerCase().trim() === myMail;

                  if (isPeerAntigravity && isLastMessageFromMe) {
                    return (
                      <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-500/5 dark:bg-stone-850/60 border border-amber-500/10 text-[11px] text-stone-500 dark:text-stone-400 max-w-[85%] self-start animate-pulse mb-3 mt-1 shadow-3xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="font-medium font-serif italic text-amber-800 dark:text-amber-400/90">Agent Antigravity est en train de réfléchir...</span>
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>

            {/* Input message form bottom bar */}
            <div className={`sticky bottom-0 z-35 px-4 pt-3 pb-[82px] sm:pb-[86px] border-t transition-colors ${isDarkMode ? "bg-stone-900 border-stone-850" : "bg-white border-stone-150"}`}>
              {isThreadExceedingLimit(activeThread.id) && (
                <div className="mb-2.5 max-w-2xl mx-auto flex items-center justify-between p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10.5px]">
                  <span className="text-stone-600 dark:text-stone-300">
                    ⚠️ <strong>Forfait Standard :</strong> Limite de 10 discussions de vente atteinte. Vous ne pouvez pas répondre à cette discussion.
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpgradePro?.()}
                    className="text-[#d2783c] hover:underline bg-transparent border-0 p-0 cursor-pointer text-[10.5px] font-bold"
                  >
                    Débloquer l'illimité 🚀
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSend}
                className="w-full max-w-2xl mx-auto flex gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder={sending ? "Envoi..." : isThreadExceedingLimit(activeThread.id) ? "Discussions de vente limitées (compte gratuit)" : `Répondre à ${getThreadPeerName(activeThread)}...`}
                  disabled={isThreadExceedingLimit(activeThread.id)}
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  className={`flex-1 text-xs border rounded-full py-2 px-4 focus:outline-hidden focus:border-amber-605 focus:ring-1 focus:ring-amber-605 transition-all shadow-3xs ${
                    isDarkMode 
                      ? "bg-stone-950 border-stone-800 text-stone-100 placeholder-stone-500" 
                      : "bg-stone-50 text-stone-900 border-stone-200 placeholder-stone-450"
                  }`}
                  required
                />
                <button
                  type="submit"
                  disabled={sending || !typedMessage.trim() || isThreadExceedingLimit(activeThread.id)}
                  className={`p-2.5 rounded-full border transition-all flex items-center justify-center shrink-0 cursor-pointer active:scale-95 ${
                    sending || !typedMessage.trim() || isThreadExceedingLimit(activeThread.id)
                      ? (isDarkMode ? "bg-stone-800 border-stone-800 text-stone-600" : "bg-stone-100 border-stone-200 text-stone-350")
                      : "bg-amber-605/5 border-[#e58e2e] text-[#d2783c] hover:bg-amber-605/10 shadow-xs"
                  }`}
                >
                  <Send className="w-4 h-4 text-[#d2783c]" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-stone-400 flex flex-col items-center justify-center space-y-3 p-8">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600">
              <MessageCircle className="w-8 h-8 stroke-[1.5px]" />
            </div>
            <p className="text-sm font-bold text-stone-700 leading-none">Messagerie Privée</p>
            <p className="text-[11px] text-stone-400 max-w-[280px]">
              Sélectionnez une discussion dans la liste de gauche pour échanger avec le vendeur ou l'acheteur.
            </p>
          </div>
        )}
      </div>

      {/* Seller/User Profile Dialog Overlay popup */}
      <AnimatePresence>
        {profileModalUser && (
          <React.Fragment key="user-profile-overlay">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileModalUser(null)}
              className="fixed inset-0 bg-stone-950/80 z-60 cursor-pointer"
            />
            
            {/* Profile Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 max-w-md w-full rounded-2xl shadow-2xl border p-6 z-65 text-left flex flex-col focus:outline-hidden transition-colors duration-300 ${isDarkMode ? "bg-stone-900 border-stone-850 text-stone-100" : "bg-white border-stone-200 text-stone-900"}`}
            >
              {/* Header Close */}
              <div className={`flex items-center justify-between pb-3.5 border-b ${isDarkMode ? "border-stone-800" : "border-stone-150"}`}>
                <div className="flex items-center gap-1.5">
                  <span className="bg-amber-100 text-amber-950 border border-amber-200 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                    Certifié CITOYEN
                  </span>
                </div>
                <button
                  onClick={() => setProfileModalUser(null)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${isDarkMode ? "text-stone-400 hover:text-white hover:bg-stone-800" : "text-stone-400 hover:text-stone-850 hover:bg-stone-100"}`}
                  title="Fermer le profil"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile card core info */}
              {(() => {
                const { rating, count } = getRatingForUser(profileModalUser.email);
                const userReviews = getReviewsForUser(profileModalUser.email);

                return (
                  <>
                    <div className={`py-5 flex flex-col items-center text-center space-y-3 rounded-xl border p-4 mt-3 transition-colors ${isDarkMode ? "bg-stone-950/40 border-stone-850" : "bg-gradient-to-b from-stone-50 to-white border-stone-100"}`}>
                      <div className="w-14 h-14 rounded-full bg-[#fcd462] text-stone-950 font-serif font-bold text-2xl flex items-center justify-center shadow-md">
                        {profileModalUser.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className={`font-serif text-lg font-bold ${isDarkMode ? "text-stone-100" : "text-stone-900"}`}>{profileModalUser.name}</h3>
                        <p className="text-[11px] text-stone-400 font-mono mt-0.5">{profileModalUser.email}</p>
                      </div>
                      
                      {/* Note details */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className={`border rounded-xl px-3 py-1.5 text-center ${isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-amber-50 border-amber-200/50"}`}>
                          <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest leading-none">Note Globale</p>
                          <p className="font-mono text-base font-bold text-amber-500 mt-1">
                            ⭐ {rating} / 5
                          </p>
                        </div>
                        <div className={`border rounded-xl px-3 py-1.5 text-center ${isDarkMode ? "bg-stone-900/60 border-stone-800" : "bg-stone-50 border-stone-200/40"}`}>
                          <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest leading-none">Avis Reçus</p>
                          <p className={`font-mono text-base font-bold mt-1 ${isDarkMode ? "text-stone-100" : "text-stone-850"}`}>
                            {count} retours
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold">
                          ✓ Identité Validée
                        </span>
                        <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold">
                          👥 Membre Recommandé
                        </span>
                      </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="mt-5 space-y-3 overflow-y-auto max-h-[220px] pr-1">
                      <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold">
                        Dernières évaluations ({Math.min(3, userReviews.length)} affichées)
                      </h4>
                      
                      <div className="space-y-2.5">
                        {userReviews.length === 0 ? (
                          <div className={`p-4 rounded-xl border text-center text-xs text-stone-400 border-dashed ${isDarkMode ? "border-stone-800" : "border-stone-200"}`}>
                            Aucun commentaire n'a encore été soumis pour ce membre.
                          </div>
                        ) : (
                          userReviews.slice(0, 3).map((r) => (
                            <div key={r.id} className={`p-2.5 rounded-xl border text-xs transition-colors ${isDarkMode ? "bg-stone-950/30 border-stone-850" : "bg-stone-50 border-stone-150"}`}>
                              <div className="flex justify-between items-baseline mb-1">
                                <span className={`font-semibold ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>{r.senderName}</span>
                                <span className="text-[9px] text-stone-400 font-mono font-medium">{r.date}</span>
                              </div>
                              <div className="text-amber-500 text-[10px] mb-1 font-mono">
                                {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} ({r.rating.toFixed(1)})
                              </div>
                              <p className={`font-medium italic ${isDarkMode ? "text-stone-300" : "text-stone-600"}`}>
                                "{r.text}"
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Close footer button */}
              <button
                onClick={() => setProfileModalUser(null)}
                className={`mt-5 w-full font-semibold text-xs py-2.5 rounded-xl transition duration-150 cursor-pointer text-center ${
                  isDarkMode 
                    ? "bg-amber-600 hover:bg-amber-700 text-white" 
                    : "bg-stone-900 hover:bg-stone-850 text-white"
                }`}
              >
                Fermer
              </button>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Premium Upgrade Modal for Invoice Feature */}
      <AnimatePresence>
        {isInvoiceUpgradeOpen && (
          <React.Fragment key="invoice-upgrade-overlay">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInvoiceUpgradeOpen(false)}
              className="fixed inset-0 bg-stone-950/80 z-60 cursor-pointer"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 max-w-sm w-full rounded-2xl shadow-2xl border p-6 z-65 text-left flex flex-col focus:outline-hidden transition-colors duration-300 ${isDarkMode ? "bg-stone-900 border-stone-850 text-stone-100" : "bg-white border-stone-200 text-stone-900"}`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3.5 rounded-full bg-amber-500/10 text-amber-500 animate-bounce">
                  <Receipt className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    Version Pro uniquement
                  </span>
                  <h3 className="font-serif text-[17px] font-bold mt-2.5">Facturation Instantanée</h3>
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-400 leading-relaxed max-w-[270px]">
                  La génération de factures d'achat certifiées PDF et leur partage en un clic sont des fonctionnalités d'élite réservées aux membres **La Brocante Pro**.
                </p>

                <div className={`w-full divide-y border rounded-xl text-left text-xs ${isDarkMode ? "bg-stone-950/30 border-stone-800 divide-stone-800" : "bg-[#fafafa] border-stone-150 divide-stone-150"}`}>
                  <div className="p-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Facture PDF certifiée prête à l'emploi</span>
                  </div>
                  <div className="p-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Calcul automatique de la TVA d'occasion</span>
                  </div>
                  <div className="p-2.5 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Badge PRO exclusif sur votre profil</span>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpgradePro) onUpgradePro();
                      setIsInvoiceUpgradeOpen(false);
                      setInvoiceAlertMessage("⚡ Félicitations, vous êtes désormais membre PRO !");
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl transition duration-150 cursor-pointer text-center shadow-md shadow-amber-600/10"
                  >
                    Essayer l'accès PRO instantané (Gratuit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInvoiceUpgradeOpen(false)}
                    className={`w-full font-medium text-xs py-2 rounded-xl transition duration-150 cursor-pointer text-center ${isDarkMode ? "bg-stone-800 hover:bg-stone-750 text-stone-300" : "bg-stone-100 hover:bg-stone-200 text-stone-500"}`}
                  >
                    Peut-être plus tard
                  </button>
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Slide-in Simple Toast alert */}
      <AnimatePresence>
        {invoiceAlertMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold z-100 shadow-xl border flex items-center gap-2 ${
              isDarkMode 
                ? "bg-stone-900 border-amber-500/30 text-amber-400" 
                : "bg-stone-950 border-stone-800 text-stone-200"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{invoiceAlertMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
