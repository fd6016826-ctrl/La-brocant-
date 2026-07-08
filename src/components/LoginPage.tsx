import React, { useState } from "react";
import {
  ShoppingBag,
  Eye,
  EyeOff,
  Chrome,
  MapPin,
  Calendar,
  Star,
  CheckCircle2,
  FileText,
  ChevronRight,
  X,
  UserCheck,
  Upload,
  Link,
  Sparkles,
  User,
  ArrowLeft,
  RefreshCw,
  Facebook
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DEFAULT_AVATAR_PLACEHOLDER } from "../App";

const PRESET_AVATARS = [
  {
    id: "purse",
    name: "Transactions / Devises",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23fbbf24'/><stop offset='100%' stop-color='%23d97706'/></linearGradient></defs><rect width='100' height='100' rx='28' fill='url(%23g1)'/><g fill='none' stroke='%23ffffff' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'><path d='M30 42h40v30c0 4-3 7-7 7H37c-4 0-7-3-7-7V42z'/><path d='M40 42c0-5 3-9 10-9s10 4 10 9'/><circle cx='50' cy='58' r='4' fill='%23ffffff'/></g></svg>"
  },
  {
    id: "table",
    name: "Mobilier / Brocante",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g2' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23818cf8'/><stop offset='100%' stop-color='%234f46e5'/></linearGradient></defs><rect width='100' height='100' rx='28' fill='url(%23g2)'/><g fill='none' stroke='%23ffffff' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'><path d='M25 46h50M35 46v24M65 46v24M28 46l6-13h32l6 13'/></g></svg>"
  },
  {
    id: "shop",
    name: "Brocante & Ventes",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g3' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%232dd4bf'/><stop offset='100%' stop-color='%230d9488'/></linearGradient></defs><rect width='100' height='100' rx='28' fill='url(%23g3)'/><g fill='none' stroke='%23ffffff' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'><path d='M30 40h40M30 40l-5 12h50l-5-12M35 52v22h30V52'/><rect x='44' y='58' width='12' height='16' fill='%23ffffff' stroke='none'/></g></svg>"
  },
  {
    id: "package",
    name: "Expéditions & Stocks",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g4' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23fb7185'/><stop offset='100%' stop-color='%23e11d48'/></linearGradient></defs><rect width='100' height='100' rx='28' fill='url(%23g4)'/><g fill='none' stroke='%23ffffff' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'><path d='M50 25L24 37v26l26 12 26-12V37L50 25zM24 37l26 12 26-12M50 49v26'/></g></svg>"
  },
  {
    id: "shield",
    name: "Confiance & Qualité",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g5' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%2360a5fa'/><stop offset='100%' stop-color='%232563eb'/></linearGradient></defs><rect width='100' height='100' rx='28' fill='url(%23g5)'/><g fill='none' stroke='%23ffffff' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'><path d='M50 28s18 4 18 14c0 14-11 23-18 28-7-5-18-14-18-28 0-10 18-14 18-14zM42 48l5 5 11-11'/></g></svg>"
  },
  {
    id: "megaphone",
    name: "Alertes / Recherches",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g6' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23f472b6'/><stop offset='100%' stop-color='%23db2777'/></linearGradient></defs><rect width='100' height='100' rx='28' fill='url(%23g6)'/><g fill='none' stroke='%23ffffff' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'><path d='M32 40h12l18-12v44L44 60H32c-2.2 0-4-1.8-4-4V44c0-2.2 1.8-4 4-4zM48 60l-3 12h-6l3-12'/></g></svg>"
  }
];

export interface LoginPageProps {
  onSuccess: (email: string, name: string, avatar?: string) => void;
  onClose: () => void;
  initialEmail?: string;
  defaultSimulatedEmails?: string[];
}

export function LoginPage({
  onSuccess,
  onClose,
  initialEmail = "jean.testeur@gmail.com",
  defaultSimulatedEmails = [
    "jean.testeur@gmail.com",
    "sophie.b69@gmail.com"
  ]
}: LoginPageProps) {
  const [activeView, setActiveView] = useState<"login" | "register" | "otp" | "forgot_password">("login");
  const [previousView, setPreviousView] = useState<"login" | "register" | "forgot_password">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState<number>(59);
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [isMockOtp, setIsMockOtp] = useState<boolean>(false);
  const [showOtpNotification, setShowOtpNotification] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeCalendarDay, setActiveCalendarDay] = useState(25);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [avatarTab, setAvatarTab] = useState<"preset" | "upload">("preset");

  // Handle countdown timer for OTP screen
  React.useEffect(() => {
    let interval: NodeJS.Timeout | number | null = null;
    if (activeView === "otp" && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval as any);
    };
  }, [activeView, otpTimer]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [isLoadingOtp, setIsLoadingOtp] = useState(false);

  const generateAndSendOtp = async (targetEmail: string, origin: "login" | "register" | "forgot_password") => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoadingOtp(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || "Impossible d'envoyer le code OTP.");
        setIsLoadingOtp(false);
        return;
      }

      setOtpValues(["", "", "", "", "", ""]);
      setOtpTimer(59);
      setPreviousView(origin);

      if (data.isMocked) {
        setIsMockOtp(true);
        setGeneratedOtp(data.code);
        setShowOtpNotification(true);
        setTimeout(() => {
          setShowOtpNotification(false);
        }, 15000);
      } else {
        setIsMockOtp(false);
        setGeneratedOtp("");
        // Show email sent notification
        setShowOtpNotification(true);
        setTimeout(() => {
          setShowOtpNotification(false);
        }, 15000);
      }

      setActiveView("otp");
    } catch (err) {
      console.error("Error sending OTP:", err);
      setErrorMsg("Erreur réseau lors de l'envoi du code.");
    } finally {
      setIsLoadingOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto focus next box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (activeView === "register") {
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Veuillez saisir une adresse email valide.");
        return;
      }
      if (!firstName.trim()) {
        setErrorMsg("Veuillez saisir votre prénom.");
        return;
      }
      if (!lastName.trim()) {
        setErrorMsg("Veuillez saisir votre nom.");
        return;
      }
      if (!password || password.length < 4) {
        setErrorMsg("Le mot de passe doit contenir au moins 4 caractères.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Les deux mots de passe ne correspondent pas.");
        return;
      }
      if (!acceptedTerms) {
        setErrorMsg("Vous devez accepter les conditions d'utilisation.");
        return;
      }

      // Transition to OTP verification
      generateAndSendOtp(email.trim(), "register");
    } else if (activeView === "login") {
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Veuillez saisir une adresse email valide.");
        return;
      }
      if (!password || password.length < 4) {
        setErrorMsg("Le mot de passe doit contenir au moins 4 caractères.");
        return;
      }

      // Transition to OTP verification for maximum completeness/security demo
      generateAndSendOtp(email.trim(), "login");
    } else if (activeView === "forgot_password") {
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Veuillez saisir une adresse email valide.");
        return;
      }

      // Transition to OTP verification to verify identity
      generateAndSendOtp(email.trim(), "forgot_password");
    }
  };

  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsVerifyingOtp(true);

    const enteredCode = otpValues.join("");
    if (enteredCode.length < 6) {
      setErrorMsg("Veuillez remplir les 6 chiffres du code de validation.");
      setIsVerifyingOtp(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: enteredCode })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || "Code de validation incorrect.");
        setIsVerifyingOtp(false);
        return;
      }

      // Success transition
      setShowOtpNotification(false);

      if (previousView === "register") {
        onSuccess(email.trim().toLowerCase(), `${firstName.trim()} ${lastName.trim()}`, selectedAvatar);
      } else if (previousView === "login") {
        const inferredName = email.split("@")[0];
        const displayName = inferredName.charAt(0).toUpperCase() + inferredName.slice(1);

        let autoAvatar = selectedAvatar;
        if (email.includes("jean")) autoAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop";
        else if (email.includes("marc")) autoAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop";
        else if (email.includes("pierre")) autoAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop";
        else if (email.includes("sophie")) autoAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop";

        onSuccess(email.trim().toLowerCase(), displayName, autoAvatar);
      } else if (previousView === "forgot_password") {
        setSuccessMsg("Votre mot de passe a été réinitialisé avec succès ! Vous pouvez maintenant vous connecter.");
        setActiveView("login");
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setErrorMsg("Erreur réseau lors de la vérification.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const selectSimulated = (emailAddr: string) => {
    const rawName = emailAddr.split("@")[0];
    const capitalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    let autoAvatar = DEFAULT_AVATAR_PLACEHOLDER;
    if (emailAddr.includes("jean")) autoAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop";
    else if (emailAddr.includes("marc")) autoAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop";
    else if (emailAddr.includes("pierre")) autoAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop";
    else if (emailAddr.includes("sophie")) autoAvatar = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop";

    onSuccess(emailAddr, capitalizedName, autoAvatar);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4">

      <div className="relative bg-[#ebece8] w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-stone-200/80 min-h-[580px] max-h-[92vh]" style={{ borderColor: '#dbc6c6' }}>

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-40 p-2.5 bg-stone-950/10 hover:bg-stone-950/20 text-stone-700 hover:text-stone-950 rounded-full transition-colors font-medium cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        {/* LEFT COLUMN: THE AUTH FORM (Inspired by Mockups - Clean, High Contrast design) */}
        <div className="w-full md:w-[45%] bg-white p-6 sm:p-8 flex flex-col justify-between overflow-y-auto" style={{ borderColor: '#e1dbdb' }}>

          <div className="flex flex-col h-full justify-between gap-6">

            {/* Header section with back button and logo */}
            <div className="flex items-center justify-between">
              {activeView !== "login" ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setSuccessMsg("");
                    setActiveView(activeView === "otp" ? previousView : "login");
                  }}
                  className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition duration-150 flex items-center justify-center text-stone-700 hover:text-stone-950 cursor-pointer"
                  title="Retour"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full border border-stone-200 bg-stone-50 text-[11px] font-mono tracking-wider font-semibold text-stone-850 shadow-3xs flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                    <span>LaBrocante</span>
                  </div>
                </div>
              )}

              <div className="text-[10px] font-mono text-stone-400 font-bold uppercase tracking-widest">
                {activeView === "login" && "Connexion"}
                {activeView === "register" && "Inscription"}
                {activeView === "otp" && "Code OTP"}
                {activeView === "forgot_password" && "Récupération"}
              </div>
            </div>

            {/* OTP Toast Notification helper */}
            {showOtpNotification && (
              <div className="bg-emerald-50 border-2 border-emerald-500/20 text-emerald-950 text-xs p-3 rounded-xl flex items-center justify-between gap-3 shadow-md animate-pulse">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="leading-tight">
                    {isMockOtp ? (
                      <>
                        <span className="font-extrabold block text-[9.5px] tracking-wider text-emerald-800 font-mono uppercase">🔑 CODE OTP DE DÉMONSTRATION</span>
                        <span className="text-[11px] text-stone-850 font-mono">Saisissez le code : <strong className="text-emerald-700 text-[13px] font-black tracking-widest">{generatedOtp}</strong></span>
                      </>
                    ) : (
                      <>
                        <span className="font-extrabold block text-[9.5px] tracking-wider text-emerald-800 font-mono uppercase">📧 CODE OTP ENVOYÉ</span>
                        <span className="text-[11px] text-stone-850 font-mono">Un vrai code de validation à 6 chiffres a été envoyé à votre adresse e-mail.</span>
                      </>
                    )}
                  </div>
                </div>
                <button type="button" onClick={() => setShowOtpNotification(false)} className="text-emerald-800 hover:text-emerald-950 text-xs font-black p-1">✕</button>
              </div>
            )}

            {/* View Containers switcher */}
            <div className="flex-1 my-auto py-2">
              <AnimatePresence mode="wait">

                {/* 1. LOGIN VIEW */}
                {activeView === "login" && (
                  <motion.div
                    key="login-pane"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5 text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                        Connexion
                      </h2>
                      <p className="text-xs sm:text-[13px] text-stone-500 leading-snug">
                        Saisissez votre e-mail et votre mot de passe pour vous connecter.
                      </p>
                    </div>

                    {successMsg && (
                      <div className="bg-emerald-50 text-emerald-800 text-[11px] font-mono p-2.5 rounded-xl border border-emerald-200">
                        ✓ {successMsg}
                      </div>
                    )}

                    {errorMsg && (
                      <div className="bg-red-50 text-red-700 text-[11px] font-mono p-2.5 rounded-xl border border-red-200">
                        ⚠️ {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      <div className="space-y-1 text-left">
                        <label className="block text-xs font-semibold text-stone-700">
                          Adresse e-mail
                        </label>
                        <input
                          type="email"
                          placeholder="jamesbon@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-xs border border-stone-250 rounded-lg px-3.5 py-3.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-900 shadow-3xs"
                          required
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-semibold text-stone-700">
                            Mot de passe
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMsg("");
                              setSuccessMsg("");
                              setPreviousView("login");
                              setActiveView("forgot_password");
                            }}
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                          >
                            Mot de passe oublié ?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-xs border border-stone-250 rounded-lg pl-3.5 pr-10 py-3.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-900 shadow-3xs"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-stone-400 hover:text-stone-700"
                          >
                            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoadingOtp}
                        className="w-full bg-[#42a85f] hover:bg-[#37944e] active:scale-98 text-white font-bold text-[13px] py-3.5 rounded-lg transition-all tracking-wide shadow-md hover:shadow-lg cursor-pointer mt-2 disabled:opacity-50"
                      >
                        {isLoadingOtp ? "Envoi du code..." : "Continuer"}
                      </button>
                    </form>

                    {/* Simulated Social login block as requested */}
                    <div className="space-y-3.5">
                      <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-stone-200"></div>
                        <span className="flex-shrink mx-3 text-[10.5px] font-medium text-stone-400">Ou connectez-vous avec</span>
                        <div className="flex-grow border-t border-stone-200"></div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => selectSimulated("sophie.b69@gmail.com")}
                          className="border border-stone-250 hover:bg-stone-50 rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 transition duration-200 cursor-pointer text-stone-750 font-medium text-xs shadow-3xs hover:border-stone-300"
                        >
                          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 shrink-0" />
                          <span>Google</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => selectSimulated("marc.dupuis@outlook.fr")}
                          className="border border-stone-250 hover:bg-stone-50 rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 transition duration-200 cursor-pointer text-stone-750 font-medium text-xs shadow-3xs hover:border-stone-300"
                        >
                          <Facebook className="w-4 h-4 text-[#1877F2] shrink-0 fill-[#1877F2]" />
                          <span>Facebook</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Simulated swappers */}
                    <div className="pt-2 bg-stone-50 p-3 rounded-xl border border-stone-200/60 text-left">
                      <span className="block text-[10px] font-mono text-emerald-800 uppercase tracking-wider font-bold mb-1.5">
                        💡 ACCÈS DE TEST DIRECT :
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                        {defaultSimulatedEmails.map((simEmail) => (
                          <button
                            key={simEmail}
                            type="button"
                            onClick={() => selectSimulated(simEmail)}
                            className="bg-white hover:bg-emerald-50 hover:border-emerald-250 border border-stone-200 px-2 py-1.5 rounded-md text-left truncate font-mono text-stone-600 transition"
                          >
                            ⚡ {simEmail.split("@")[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. REGISTER VIEW */}
                {activeView === "register" && (
                  <motion.div
                    key="register-pane"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5 text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                        Inscription
                      </h2>
                      <p className="text-xs sm:text-[13px] text-stone-500 leading-snug">
                        Créez votre compte citoyen LaBrocante.
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 text-red-700 text-[11px] font-mono p-2.5 rounded-xl border border-red-200 text-left">
                        ⚠️ {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-3.5">
                      <div className="space-y-1 text-left">
                        <label className="block text-xs font-semibold text-stone-700">
                          Adresse e-mail
                        </label>
                        <input
                          type="email"
                          placeholder="jamesbon@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-xs border border-stone-250 rounded-lg px-3.5 py-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-900 shadow-3xs"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-stone-700">
                            Prénom
                          </label>
                          <input
                            type="text"
                            placeholder="James"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full text-xs border border-stone-250 rounded-lg px-3.5 py-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-900 shadow-3xs"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-stone-700">
                            Nom
                          </label>
                          <input
                            type="text"
                            placeholder="Bon"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full text-xs border border-stone-250 rounded-lg px-3.5 py-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-900 shadow-3xs"
                            required
                          />
                        </div>
                      </div>

                      {/* Photo / Portrait choice section */}
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 space-y-2 mt-1 text-left">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={selectedAvatar}
                            alt="Aperçu"
                            className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500 shadow-xs bg-stone-50"
                            referrerPolicy="no-referrer"
                          />
                          <div className="leading-tight">
                            <span className="text-[10px] font-mono text-emerald-700 uppercase font-black tracking-wider block">Photo de profil active</span>
                            <span className="text-[10.5px] font-bold text-stone-800">
                              {selectedAvatar === DEFAULT_AVATAR_PLACEHOLDER
                                ? "Avatar Anonyme"
                                : "Visuel sélectionné"}
                            </span>
                          </div>
                        </div>

                        {/* Interactive toggle tabs for Recommended vs Upload */}
                        <div className="flex bg-stone-200/50 p-0.5 rounded-lg border border-stone-250/30">
                          <button
                            type="button"
                            onClick={() => setAvatarTab("preset")}
                            className={`flex-1 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${avatarTab === "preset" ? "bg-white text-stone-900 shadow-3xs" : "text-stone-500 hover:text-stone-700"
                              }`}
                          >
                            🌟 Choisir
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarTab("upload")}
                            className={`flex-1 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${avatarTab === "upload" ? "bg-white text-stone-900 shadow-3xs" : "text-stone-500 hover:text-stone-700"
                              }`}
                          >
                            📤 Importer
                          </button>
                        </div>

                        {avatarTab === "preset" ? (
                          <div className="grid grid-cols-6 gap-1 justify-items-center py-0.5">
                            {PRESET_AVATARS.map((avatar) => {
                              const isSelected = selectedAvatar === avatar.url;
                              return (
                                <button
                                  key={avatar.id}
                                  type="button"
                                  onClick={() => setSelectedAvatar(avatar.url)}
                                  className={`relative transition-all duration-150 cursor-pointer ${isSelected ? "scale-105" : "hover:scale-105 opacity-80"
                                    }`}
                                  title={avatar.name}
                                >
                                  <img
                                    src={avatar.url}
                                    alt={avatar.name}
                                    className={`w-7 h-7 rounded-full object-cover ${isSelected ? "border-2 border-emerald-500 shadow-3xs" : "border border-stone-200"}`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-left pt-1">
                            <div className="relative border border-dashed border-stone-300 rounded-lg p-2 hover:bg-stone-100 transition-colors text-center cursor-pointer relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <p className="text-[9.5px] font-bold text-stone-600">Glisser ou cliquer pour importer</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="block text-xs font-semibold text-stone-700">
                          Mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-xs border border-stone-250 rounded-lg pl-3.5 pr-10 py-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-900 shadow-3xs"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="block text-xs font-semibold text-stone-700">
                          Confirmer le mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Saisissez le mot de passe à nouveau"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full text-xs border border-stone-250 rounded-lg pl-3.5 pr-10 py-3 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-900 shadow-3xs"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-700"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 pt-0.5 text-left">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-0.5 w-3.5 h-3.5 text-emerald-600 border-stone-300 focus:ring-emerald-500 rounded-sm cursor-pointer"
                          id="check-terms"
                        />
                        <span className="text-[10px] text-stone-500 leading-normal">
                          J'accepte les {" "}
                          <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-emerald-600 font-bold underline hover:text-emerald-700 cursor-pointer"
                          >
                            Conditions d'Utilisation
                          </button>{" "}
                          et d'éthique citoyenne.
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoadingOtp}
                        className="w-full bg-[#42a85f] hover:bg-[#37944e] active:scale-98 text-white font-bold text-[13px] py-3 rounded-lg transition-all tracking-wide shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                      >
                        {isLoadingOtp ? "Envoi du code..." : "Confirmer"}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* 3. ENTER OTP VIEW */}
                {activeView === "otp" && (
                  <motion.div
                    key="otp-pane"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-1.5 text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                        Saisir le code OTP
                      </h2>
                      <p className="text-xs sm:text-[13px] text-stone-500 leading-relaxed">
                        Saisissez le code de validation à 4 chiffres envoyé à <strong className="text-stone-800 break-all">{email || "alexander.johnston@gmail.com"}</strong>
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 text-red-700 text-[11px] font-mono p-2.5 rounded-xl border border-red-200 text-left animate-shake">
                        ⚠️ {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="space-y-6">

                      {/* OTP Inputs Layout strictly matching Image 3 (Updated to 6 digits) */}
                      <div className="flex justify-center gap-1.5 sm:gap-2.5 py-2">
                        {otpValues.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-input-${index}`}
                            type="text"
                            maxLength={1}
                            pattern="[0-9]*"
                            inputMode="numeric"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold border border-stone-250 rounded-xl bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-900 shadow-3xs"
                            required
                          />
                        ))}
                      </div>

                      {/* Cool SVG real circular progress timer built just for this */}
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              className="stroke-stone-150"
                              strokeWidth="2.5"
                            />
                            <motion.circle
                              cx="18"
                              cy="18"
                              r="16"
                              fill="none"
                              className="stroke-emerald-500"
                              strokeWidth="2.5"
                              strokeDasharray="100 100"
                              initial={{ strokeDashoffset: 100 }}
                              animate={{ strokeDashoffset: 100 - (otpTimer / 59) * 100 }}
                              transition={{ duration: 0.4 }}
                            />
                          </svg>
                          <span className="absolute text-[11px] font-mono font-extrabold text-stone-600">
                            {otpTimer > 0 ? `00:${otpTimer < 10 ? `0${otpTimer}` : otpTimer}` : "00:00"}
                          </span>
                        </div>

                        {otpTimer === 0 ? (
                          <button
                            type="button"
                            onClick={() => generateAndSendOtp(email, previousView)}
                            className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 hover:underline py-1 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Renvoyer le code par e-mail</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-medium">Veuillez patienter pour renvoyer</span>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="w-full bg-[#42a85f] hover:bg-[#37944e] active:scale-98 text-white font-bold text-[13px] py-3.5 rounded-lg transition-all tracking-wide shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                      >
                        {isVerifyingOtp ? "Vérification..." : "Confirmer"}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* 4. FORGOT PASSWORD VIEW */}
                {activeView === "forgot_password" && (
                  <motion.div
                    key="forgot-pane"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5 text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                        Mot de passe oublié ?
                      </h2>
                      <p className="text-xs sm:text-[13px] text-stone-500 leading-relaxed">
                        Si vous avez oublié votre mot de passe, saisissez votre adresse e-mail pour le réinitialiser.
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 text-red-700 text-[11px] font-mono p-2.5 rounded-xl border border-red-200 text-left">
                        ⚠️ {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-5">
                      <div className="space-y-1 text-left">
                        <label className="block text-xs font-semibold text-stone-700">
                          Adresse e-mail
                        </label>
                        <input
                          type="email"
                          placeholder="jamesbon@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-xs border border-stone-250 rounded-lg px-3.5 py-3.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-stone-900 shadow-3xs"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoadingOtp}
                        className="w-full bg-[#42a85f] hover:bg-[#37944e] active:scale-98 text-white font-bold text-[13px] py-3.5 rounded-lg transition-all tracking-wide shadow-md hover:shadow-lg cursor-pointer mt-1 disabled:opacity-50"
                      >
                        {isLoadingOtp ? "Envoi du code..." : "Confirmer"}
                      </button>
                    </form>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Bottom switcher footer precisely matching bottom layout */}
            <div className="border-t border-stone-150 pt-4 flex items-center justify-between text-xs text-stone-500">
              <span>
                {activeView === "login" ? (
                  <>
                    Vous n'avez pas de compte ?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg("");
                        setSuccessMsg("");
                        setActiveView("register");
                      }}
                      className="text-[#42a85f] hover:text-[#37944e] font-extrabold underline ml-0.5 cursor-pointer"
                    >
                      S'inscrire.
                    </button>
                  </>
                ) : activeView === "register" ? (
                  <>
                    Vous avez déjà un compte ?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg("");
                        setSuccessMsg("");
                        setActiveView("login");
                      }}
                      className="text-[#42a85f] hover:text-[#37944e] font-extrabold underline ml-0.5 cursor-pointer"
                    >
                      Se connecter.
                    </button>
                  </>
                ) : (
                  <>
                    Retour à la{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg("");
                        setSuccessMsg("");
                        setActiveView("login");
                      }}
                      className="text-[#42a85f] hover:text-[#37944e] font-extrabold underline ml-0.5 cursor-pointer"
                    >
                      Connexion.
                    </button>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-stone-400 hover:text-stone-700 underline font-medium"
              >
                Charte éthique
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE TEAM / SERVICE WORKSPACE GRAPHICS (Inspired by Image 2 right pane) */}
        <div className="hidden md:block md:w-[55%] relative overflow-hidden bg-stone-900">

          {/* Main Backdrop Image */}
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800"
            alt="Sourire et chiner en équipe"
            className="w-full h-full object-cover opacity-85 filter contrast-105 saturate-95"
            referrerPolicy="no-referrer"
          />

          {/* Glass Gradient filter overlay */}
          <div className="absolute inset-0 bg-radial-gradient from-amber-900/10 via-stone-900/50 to-stone-950/80 pointer-events-none" />

          {/* OVERLAY WIDGETS (Exactly as seen in Image 2) */}

          {/* 1. Yellow Task review item (Top Left-ish) */}
          <div className="absolute top-8 left-8 bg-[#fcd462] text-stone-950 p-3 rounded-xl shadow-lg max-w-[240px] border-b border-yellow-300">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-650 rounded-full animate-ping" />
              <span className="text-[9px] font-mono uppercase tracking-widest font-bold">Rendez-vous</span>
            </div>
            <p className="text-xs font-serif font-bold text-stone-950 leading-tight mt-1">
              Remise en propre du canapé
            </p>
            <p className="text-[10px] font-mono text-stone-800 mt-1">
              📍 Métro Bastille — 14H30
            </p>
          </div>

          {/* 2. Grey overlay card with stars (Lower Right) */}
          <div className="absolute top-26 right-8 bg-stone-950/70 backdrop-blur-md text-white p-3.5 rounded-2xl border border-white/10 shadow-xl max-w-[210px]">
            <p className="text-[8px] font-mono text-amber-400 uppercase tracking-widest font-bold">
              Évaluation Communauté
            </p>
            <div className="flex items-center gap-1 text-xs font-bold font-serif text-white mt-1">
              <span>99.8% de confiance</span>
            </div>
            <div className="flex text-amber-400 mt-1">
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
              <Star className="w-3 h-3 fill-amber-400" />
            </div>
            <p className="text-[9px] text-stone-300 mt-1.5 font-medium leading-relaxed">
              Rencontrez des passionnés d'objets anciens et négociez en toute amitié.
            </p>
          </div>

          {/* 3. Interactive calender strip (Bottom Center) */}
          <div className="absolute bottom-28 left-8 right-8 bg-[#ffffff]/10 backdrop-blur-md rounded-2xl border border-white/10 p-3 shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-mono text-amber-200 uppercase tracking-widest font-bold flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Calendrier des Brocantes
              </span>
              <span className="text-[8px] font-mono text-stone-300">À PROXIMITÉ</span>
            </div>

            {/* Days list selector tab */}
            <div className="grid grid-cols-7 gap-1">
              {[
                { label: "Dim", d: 22 },
                { label: "Lun", d: 23 },
                { label: "Mar", d: 24 },
                { label: "Mer", d: 25 },
                { label: "Jeu", d: 26 },
                { label: "Ven", d: 27 },
                { label: "Sam", d: 28 }
              ].map((item) => (
                <button
                  key={item.d}
                  type="button"
                  onClick={() => setActiveCalendarDay(item.d)}
                  className={`py-1 rounded-lg text-center transition-all ${activeCalendarDay === item.d
                      ? "bg-[#fcd462] text-stone-900 font-bold scale-103 shadow-xs"
                      : "text-stone-300 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <p className="text-[8px] uppercase tracking-wider leading-none">{item.label}</p>
                  <p className="text-xs font-bold mt-1">{item.d}</p>
                </button>
              ))}
            </div>

            {/* Mini event description inside calendar */}
            <div className="mt-2 text-[10px] text-white p-1.5 bg-black/3c rounded-lg border border-white/5">
              {activeCalendarDay === 22 && "🏕️ Puces de Clignancourt de 10:00 à 18:00"}
              {activeCalendarDay === 23 && "🌿 Pas d'événements prévus de proximité"}
              {activeCalendarDay === 24 && "🚚 Vide Grenier de la Marie — Bastille"}
              {activeCalendarDay === 25 && "✨ Foire à la ferraille et aux antiquités — Chatou"}
              {activeCalendarDay === 26 && "📚 Marché du livre ancien de Georges Brassens"}
              {activeCalendarDay === 27 && "🎒 Braderie d'objets Vintage, Lyon 03"}
              {activeCalendarDay === 28 && "📻 Brocante de quartier et friperies de Paris 11°"}
            </div>
          </div>

          {/* 4. White meetings pill (Bottom left corner-ish) */}
          <div className="absolute bottom-8 left-8 right-8 bg-white/95 rounded-xl p-3.5 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-stone-800 text-[8px] flex items-center justify-center font-bold text-white">M</div>
                <div className="w-5 h-5 rounded-full bg-amber-500 text-[8px] flex items-center justify-center font-bold text-white">S</div>
                <div className="w-5 h-5 rounded-full bg-red-600 text-[8px] flex items-center justify-center font-bold text-white">P</div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-900 leading-none">
                  Foire à Chatou
                </p>
                <p className="text-[9px] text-stone-500 mt-0.5">
                  12 négociations en cours aujourd'hui
                </p>
              </div>
            </div>
            <button
              onClick={() => selectSimulated("sophie.b69@gmail.com")}
              className="bg-stone-900 hover:bg-stone-850 p-1.5 rounded-lg text-white font-bold transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* FULL DETAILED CONDITIONS D'UTILISATION MODAL */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-xl w-full rounded-2xl p-6 shadow-2xl border border-stone-200 text-left flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-stone-100 flex-shrink-0">
                <div className="flex items-center gap-2 text-stone-800">
                  <FileText className="w-5 h-5 text-amber-500 leading-none shrink-0" />
                  <h3 className="font-serif text-lg font-bold">Conditions de la Brocante</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Terms Content */}
              <div className="flex-1 overflow-y-auto p-2 py-4 space-y-4 text-xs text-stone-600 leading-relaxed font-sans">
                <section className="space-y-1.5">
                  <h4 className="font-bold text-stone-950 text-xs">1. Charte de Proximité et de Confiance</h4>
                  <p>
                    La Brocante s'engage à maintenir une plateforme locale décentralisée. Les transactions s'effectuent principalement de gré à gré, favorisant la rencontre humaine et réduisant le bilan carbone lié aux expéditions internationales. Bien que l'expédition reste possible aux risques des adhérents, vous êtes invités à privilégier la remise en direct.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-stone-950 text-xs">2. Zéro Commission de Courtage</h4>
                  <p>
                    Aucun intermédiaire financier ou retenue n'est appliqué sur notre bourse de petite annonce de proximité. 100% de la somme convenue revient directement au vendeur. La plateforme ne sert qu'à mettre en contact les parties. Les paiements doivent être gérés de manière responsable par les utilisateurs à l'échange.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-stone-950 text-xs">3. Obligation de Bonne Foi des Vendeurs</h4>
                  <p>
                    Toute annonce déposée doit correspondre à un objet réellement détenu par le vendeur. Les descriptions d'état (Neuf, Bon État, etc.) se doivent d'être les plus complètes possible. Si une vidéo ou des photos supplémentaires sont mises en ligne, elles doivent retranscrire fidèlement l'état fonctionnel actuel de l'objet.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-stone-950 text-xs text-xs">4. Politique de Contenu et de Vidéo</h4>
                  <p>
                    Les images et vidéos importées sont stockées localement via notre serveur de test sécurisé. Tout contenu à caractère injurieux, commercial abusif, dangereux ou pornographique est strictement proscrit. Nos administrateurs de test locaux se réservent le droit d'épurer instantanément toute annonce litigieuse.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-bold text-stone-950 text-xs text-xs">5. Simulateurs de Troc & Discussions</h4>
                  <p>
                    La Brocante fournit des simulateurs d'utilisateurs par courriel pour tester les deux rôles (Acheteur / Vendeur) sans authentification par mot de passe externe coûteuse. Les messages envoyés sont instantanément visibles par le compte co-destinataire. Les données de tests saisies doivent rester d'ordre fictif.
                  </p>
                </section>

                <p className="text-[10px] text-stone-400 border-t border-stone-100 pt-3">
                  Mis à jour le 11 juin 2026. L'acte d'inscription vaut acceptation entière et sans rétraction possible des présentes directives.
                </p>
              </div>

              {/* Close CTAs */}
              <div className="pt-3 border-t border-stone-150 flex-shrink-0 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 border border-stone-250 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-lg"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAcceptedTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg"
                >
                  Accepter et Continuer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
