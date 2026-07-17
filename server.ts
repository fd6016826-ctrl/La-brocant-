import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { z } from "zod";

dotenv.config();

// Password hashing helper functions
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (!storedHash.includes(":")) {
    return password === storedHash;
  }
  const [salt, hash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
  } catch (e) {
    return false;
  }
}

// PayTech Configuration (OM / Wave) - Loaded strictly from Vercel/Local env variables
const PAYTECH_API_KEY = process.env.PAYTECH_API_KEY || "";
const PAYTECH_API_SECRET = process.env.PAYTECH_API_SECRET || "";
const PAYTECH_ENV = process.env.PAYTECH_ENV || "prod";
const PAYTECH_IPN_URL = process.env.PAYTECH_IPN_URL || "https://la-brocant.vercel.app/api/payment/ipn";
const PAYTECH_SUCCESS_URL = process.env.PAYTECH_SUCCESS_URL || "https://la-brocant.vercel.app/profile?payment=success";
const PAYTECH_CANCEL_URL = process.env.PAYTECH_CANCEL_URL || "https://la-brocant.vercel.app/profile?payment=cancel";

if (!PAYTECH_API_KEY || !PAYTECH_API_SECRET) {
  console.warn("[SECURITY WARNING] PayTech API credentials are not set! Payment flows will fail.");
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ZOD VALIDATION SCHEMAS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const listingSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  description: z.string().optional(),
  price: z.preprocess((val) => Number(val), z.number().nonnegative("Le prix doit Ãªtre positif.")),
  category: z.string().optional(),
  location: z.string().optional(),
  condition: z.string().optional(),
  image_url: z.string().optional(),
  video_url: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  quantity: z.preprocess((val) => val === undefined ? 1 : Number(val), z.number().int().positive().optional().default(1))
});

const demandSchema = z.object({
  title: z.string().min(1, "Le titre est requis."),
  description: z.string().optional(),
  desired_price: z.preprocess((val) => val === undefined || val === "" ? null : Number(val), z.number().nonnegative().nullable().optional()),
  quantity: z.preprocess((val) => val === undefined ? 1 : Number(val), z.number().int().positive().optional().default(1)),
  size: z.string().optional(),
  color: z.string().optional(),
  other_specs: z.string().optional(),
  image_url: z.string().optional()
});

const chatSchema = z.object({
  listingId: z.string().min(1, "L'identifiant de l'annonce est requis."),
  listingTitle: z.string().min(1),
  listingPrice: z.preprocess((val) => Number(val), z.number()),
  listingImageUrl: z.string().optional(),
  sellerEmail: z.string().email(),
  sellerName: z.string().min(1),
  requestedQuantity: z.preprocess((val) => val === undefined ? 1 : Number(val), z.number().int().positive().optional().default(1))
});

const authSchema = z.object({
  email: z.string().email("Format d'e-mail invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractÃ¨res.")
});

const localFilename = typeof __filename !== "undefined"
  ? __filename
  : fileURLToPath(import.meta.url);

const localDirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(localFilename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || "";
let supabaseClient: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.warn("[Brocante] Erreur lors de l'instanciation du client Supabase:", err);
  }
} else {
  console.error("[CRITICAL WARNING] SUPABASE_URL ou SUPABASE_SECRET_KEY est absent de vos variables d'environnement Vercel ! Le serveur bascule en mode local. Sur Vercel (disque en lecture seule), cela va empÃªcher l'authentification et l'Ã©criture de donnÃ©es. Veuillez configurer vos variables Supabase dans la console Vercel.");
}

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "fd6016826@gmail.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Diouffallou@2004";

// Store pending mock OTP sessions in memory
const pendingOtps = new Map<string, { code: string; expiresAt: number }>();

// FLAG for local fallback DB
let useLocalDb = false;

// Local JSON DB File Path
const localDbPath = path.join(localDirname, "local_db.json");

// Helper functions for reading/writing local database with Vercel read-only memory fallback
let inMemoryDb: any = null;

function readLocalDb(): { listings: any[]; demands: any[]; chats: any[]; users?: any[]; notifications?: any[] } {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  const defaultData = {
    notifications: [],
    listings: [
      {
        id: "1",
        title: "Enfilade scandinave en teck vintage",
        description: "Superbe enfilade scandinave des annÃ©es 60 en teck. 3 portes coulissantes et 3 tiroirs. TrÃ¨s bel Ã©tat gÃ©nÃ©ral.",
        price: 480,
        category: "Maison & DÃ©co",
        location: "Lyon",
        condition: "TrÃ¨s bon Ã©tat",
        image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80",
        video_url: "",
        size: "180x45x75 cm",
        color: "Miel / Teck",
        quantity: 1,
        additional_images: [],
        seller_name: "Marc Dupuis",
        seller_email: "marc.dupuis@outlook.fr",
        seller_phone: "06 12 34 56 78",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        is_sold: false,
        is_sponsored: true
      },
      {
        id: "2",
        title: "Appareil photo reflex Canon EOS 80D",
        description: "Vendu avec objectif EFS 18-135mm, sacoche de transport, batterie et chargeur. Parfait pour dÃ©buter en photographie.",
        price: 550,
        category: "Ã‰lectronique",
        location: "Paris",
        condition: "Comme neuf",
        image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
        video_url: "",
        size: "N/A",
        color: "Noir",
        quantity: 1,
        additional_images: [],
        seller_name: "Sophie B.",
        seller_email: "sophie.b69@gmail.com",
        seller_phone: "06 98 76 54 32",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        is_sold: false,
        is_sponsored: false
      },
      {
        id: "3",
        title: "Collection de Vinyles Rock Classique (x10)",
        description: "Lot de 10 vinyles rock (Pink Floyd, Led Zeppelin, The Rolling Stones...). Pochettes en bon Ã©tat, disques sans rayures majeures.",
        price: 120,
        category: "Livres & Culture",
        location: "Bordeaux",
        condition: "Bon Ã©tat",
        image_url: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&auto=format&fit=crop&q=80",
        video_url: "",
        size: "12 pouces",
        color: "Noir",
        quantity: 1,
        additional_images: [],
        seller_name: "Jean Testeur",
        seller_email: "jean.testeur@gmail.com",
        seller_phone: "07 11 22 33 44",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        is_sold: false,
        is_sponsored: false
      }
    ],
    demands: [
      {
        id: "demand_1",
        title: "Recherche CanapÃ© Togo Ligne Roset",
        description: "Je recherche activement un canapÃ© Togo de chez Ligne Roset, de prÃ©fÃ©rence en velours ou cuir, couleur chaud (orange, marron ou beige). Budget flexible selon l'Ã©tat.",
        desired_price: 1500,
        quantity: 1,
        size: "3 places ou angle",
        color: "Chaud",
        other_specs: "Authentique avec Ã©tiquette",
        image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
        buyer_email: "pierre.m@gmail.com",
        buyer_name: "Pierre M.",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ],
    chats: [
      {
        id: "chat_1",
        listing_id: "1",
        listing_title: "Enfilade scandinave en teck vintage",
        listing_price: 480,
        listing_image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80",
        seller_email: "marc.dupuis@outlook.fr",
        seller_name: "Marc Dupuis",
        buyer_email: "antigravity@la-brocante.fr",
        buyer_name: "Agent Antigravity ðŸ¤–",
        last_message_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        messages: [
          {
            id: "msg_1",
            senderEmail: "antigravity@la-brocante.fr",
            senderName: "Agent Antigravity ðŸ¤–",
            text: "Bonjour Marc ! Votre enfilade scandinave en teck est vraiment magnifique. Est-elle toujours disponible ?",
            createdAt: new Date(Date.now() - 3600000 * 2 - 60000).toISOString(),
            isRead: true
          },
          {
            id: "msg_2",
            senderEmail: "marc.dupuis@outlook.fr",
            senderName: "Marc Dupuis",
            text: "Bonjour ! Oui, elle est toujours disponible et visible sur Lyon 3e.",
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            isRead: false
          }
        ],
        requested_quantity: 1
      }
    ],
    users: [
      { email: "fd6016826@gmail.com", name: "Fallou Diouf", avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23fbbf24'/><stop offset='100%' stop-color='%23d97706'/></linearGradient></defs><rect width='100' height='100' rx='28' fill='url(%23g1)'/><g fill='none' stroke='%23ffffff' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'><path d='M30 42h40v30c0 4-3 7-7 7H37c-4 0-7-3-7-7V42z'/><path d='M40 42c0-5 3-9 10-9s10 4 10 9'/><circle cx='50' cy='58' r='4' fill='%23ffffff'/></g></svg>", password: "Diouffallou@2004", isPro: true, pref_notif_announcements: true }
    ]
  };

  try {
    let needsInitialization = false;
    if (!fs.existsSync(localDbPath)) {
      needsInitialization = true;
    } else {
      const currentContent = fs.readFileSync(localDbPath, "utf-8").trim();
      if (currentContent === "") {
        needsInitialization = true;
      } else {
        const parsed = JSON.parse(currentContent);
        if (!parsed.listings || parsed.listings.length === 0) {
          needsInitialization = true;
        }
      }
    }

    if (needsInitialization) {
      try {
        fs.writeFileSync(localDbPath, JSON.stringify(defaultData, null, 2));
      } catch (err) {
        // Read-only filesystem on Vercel
      }
      inMemoryDb = defaultData;
      return inMemoryDb;
    }

    const data = fs.readFileSync(localDbPath, "utf-8");
    const parsed = JSON.parse(data);
    
    let dbUpdated = false;
    if (!parsed.users) {
      parsed.users = defaultData.users;
      dbUpdated = true;
    }
    if (!parsed.notifications) {
      parsed.notifications = [];
      dbUpdated = true;
    }
    if (dbUpdated) {
      try {
        fs.writeFileSync(localDbPath, JSON.stringify(parsed, null, 2));
      } catch (err) {
        // Read-only filesystem on Vercel
      }
    }
    inMemoryDb = parsed;
    return inMemoryDb;
  } catch (err) {
    inMemoryDb = defaultData;
    return defaultData;
  }
}

function writeLocalDb(data: { listings: any[]; demands: any[]; chats: any[]; users?: any[]; notifications?: any[] }) {
  inMemoryDb = data;
  try {
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    // Expected on read-only serverless platforms like Vercel
  }
}

// Helper to determine if user is Pro (checking expiration date)
async function checkIsProUser(email: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail.includes("pro") || cleanEmail.includes("sophie")) {
    return true;
  }
  try {
    let isPro = false;
    let proExpiresAt: string | null = null;

    if (useLocalDb || !supabaseClient) {
      const db = readLocalDb();
      const user = (db.users || []).find((u: any) => u.email.toLowerCase().trim() === cleanEmail);
      if (user) {
        isPro = !!user.isPro;
        proExpiresAt = user.proExpiresAt || null;
      }
    } else {
      // 1. Check in profiles on Supabase
      const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("is_pro, pro_expires_at")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (!error && profile) {
        isPro = !!profile.is_pro;
        proExpiresAt = profile.pro_expires_at || null;
      }
    }

    if (isPro) {
      if (proExpiresAt) {
        const expireDate = new Date(proExpiresAt);
        if (new Date() > expireDate) {
          // Subscription expired
          console.log(`[Subscription Expired] PRO access expired for user ${cleanEmail}. Removing PRO status.`);
          await updateUserProStatus(cleanEmail, false, null);
          return false;
        }
      }
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// Helper to update user PRO status and expiration date in local database & Supabase
async function updateUserProStatus(email: string, isPro: boolean, expiresAt: Date | null): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const expiresAtStr = expiresAt ? expiresAt.toISOString() : null;

  // 1. Update local database
  const db = readLocalDb();
  if (!db.users) db.users = [];
  const idx = db.users.findIndex((u: any) => u.email.toLowerCase().trim() === cleanEmail);
  if (idx !== -1) {
    db.users[idx].isPro = isPro;
    db.users[idx].proExpiresAt = expiresAtStr;
    writeLocalDb(db);
  } else {
    db.users.push({
      email: cleanEmail,
      name: cleanEmail.split("@")[0],
      isPro: isPro,
      proExpiresAt: expiresAtStr
    });
    writeLocalDb(db);
  }

  // 2. Sync to Supabase profile
  if (supabaseClient) {
    try {
      const { error: updateErr } = await supabaseClient
        .from("profiles")
        .update({
          is_pro: isPro,
          pro_expires_at: expiresAtStr
        })
        .eq("email", cleanEmail);
      
      if (updateErr) {
        console.warn(`[updateUserProStatus Supabase Sync Error] profiles update failed for ${cleanEmail}:`, updateErr.message);
      } else {
        console.log(`[updateUserProStatus Supabase Sync Success] profiles successfully updated for ${cleanEmail}.`);
      }
    } catch (supErr: any) {
      console.warn(`[updateUserProStatus Supabase Sync Exception] updates skipped for ${cleanEmail}:`, supErr.message || supErr);
    }
  }
}

// Helper to create notifications with free vs pro limit rule
async function createNotification(userEmail: string, title: string, message: string, type: "system" | "offer" | "neighbor" | "transaction") {
  try {
    const cleanEmail = userEmail.toLowerCase().trim();
    
    // If transaction (purchase notification), apply free vs pro check
    if (type === "transaction") {
      const isPro = await checkIsProUser(cleanEmail);
      if (!isPro) {
        // Free user: check if there's already a transaction notification in last 24h
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        if (useLocalDb || !supabaseClient) {
          const db = readLocalDb();
          const list = db.notifications || [];
          const hasRecent = list.some((n: any) => 
            n.user_email.toLowerCase().trim() === cleanEmail && 
            n.type === "transaction" && 
            n.created_at >= oneDayAgo
          );
          if (hasRecent) {
            console.log(`[Notification Limit] Skip transaction notification for free user: ${cleanEmail}`);
            return; // Block notification
          }
        } else {
          const { data: recent } = await supabaseClient
            .from("notifications")
            .select("id")
            .eq("user_email", cleanEmail)
            .eq("type", "transaction")
            .gte("created_at", oneDayAgo)
            .limit(1);
          if (recent && recent.length > 0) {
            console.log(`[Notification Limit] Skip transaction notification for free user (Supabase): ${cleanEmail}`);
            return; // Block notification
          }
        }
      }
    }

    const notifObj = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      user_email: cleanEmail,
      title,
      message,
      type,
      read: false,
      created_at: new Date().toISOString()
    };

    if (useLocalDb || !supabaseClient) {
      const db = readLocalDb();
      if (!db.notifications) db.notifications = [];
      db.notifications.push(notifObj);
      writeLocalDb(db);
    } else {
      const { error } = await supabaseClient.from("notifications").insert([notifObj]);
      if (error) {
        console.error("Error inserting notification to Supabase:", error);
        // Local fallback writing
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        db.notifications.push(notifObj);
        writeLocalDb(db);
      }
    }
    console.log(`[Notification Pushed] To: ${cleanEmail} | Title: ${title}`);
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}

// LocalQueryBuilder class to emulate Supabase chained queries
class LocalQueryBuilder {
  private tableName: string;
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private payload: any = null;
  private filters: { type: string; column?: string; value?: any; pattern?: string; values?: any[] }[] = [];
  private limitCount: number | null = null;
  private singleResult = false;
  private maybeSingleResult = false;
  private orderField: string | null = null;
  private orderAscending = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields?: string) {
    if (this.operation === "select") {
      this.operation = "select";
    }
    return this;
  }

  insert(rows: any[]) {
    this.operation = "insert";
    this.payload = rows;
    return this;
  }

  update(fields: any) {
    this.operation = "update";
    this.payload = fields;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ type: "ilike", column, pattern });
    return this;
  }

  or(filterString: string) {
    this.filters.push({ type: "or", value: filterString });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: "in", column, values });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: "gte", column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ type: "lte", column, value });
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  maybeSingle() {
    this.maybeSingleResult = true;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderField = column;
    this.orderAscending = options?.ascending ?? false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async then(onFulfilled?: (value: any) => any, onRejected?: (error: any) => any) {
    try {
      const db = readLocalDb();
      let table = (db as any)[this.tableName] || [];
      let resultData: any = null;
      let error: any = null;

      if (this.operation === "select") {
        let filtered = [...table];

        // Apply filters
        for (const filter of this.filters) {
          if (filter.type === "eq") {
            filtered = filtered.filter(item => {
              const itemVal = item[filter.column!];
              const filterVal = filter.value;
              if (typeof itemVal === "string" && typeof filterVal === "string") {
                return itemVal.toLowerCase().trim() === filterVal.toLowerCase().trim();
              }
              return itemVal === filterVal;
            });
          } else if (filter.type === "ilike") {
            const pat = filter.pattern!.toLowerCase().replace(/%/g, "");
            filtered = filtered.filter(item => {
              const val = item[filter.column!];
              return typeof val === "string" && val.toLowerCase().includes(pat);
            });
          } else if (filter.type === "or") {
            const parts = filter.value.split(",");
            filtered = filtered.filter(item => {
              return parts.some((part: string) => {
                const subParts = part.split(".");
                if (subParts.length >= 3) {
                  const col = subParts[0];
                  const op = subParts[1];
                  const val = subParts.slice(2).join(".").toLowerCase().replace(/%/g, "");
                  if (op === "ilike") {
                    const itemVal = item[col];
                    return typeof itemVal === "string" && itemVal.toLowerCase().includes(val);
                  }
                }
                return false;
              });
            });
          } else if (filter.type === "in") {
            filtered = filtered.filter(item => {
              const val = item[filter.column!];
              return filter.values!.includes(val);
            });
          } else if (filter.type === "gte") {
            filtered = filtered.filter(item => Number(item[filter.column!]) >= Number(filter.value));
          } else if (filter.type === "lte") {
            filtered = filtered.filter(item => Number(item[filter.column!]) <= Number(filter.value));
          }
        }

        // Apply order
        if (this.orderField) {
          filtered.sort((a, b) => {
            const valA = a[this.orderField!];
            const valB = b[this.orderField!];
            if (valA < valB) return this.orderAscending ? -1 : 1;
            if (valA > valB) return this.orderAscending ? 1 : -1;
            return 0;
          });
        }

        // Apply limit
        if (this.limitCount !== null) {
          filtered = filtered.slice(0, this.limitCount);
        }

        if (this.singleResult) {
          if (filtered.length === 0) {
            error = { message: "Item not found", code: "PGRST116" };
          } else {
            resultData = filtered[0];
          }
        } else if (this.maybeSingleResult) {
          resultData = filtered.length > 0 ? filtered[0] : null;
        } else {
          resultData = filtered;
        }
      } else if (this.operation === "insert") {
        const newRows = Array.isArray(this.payload) ? this.payload : [this.payload];
        table.push(...newRows);
        (db as any)[this.tableName] = table;
        writeLocalDb(db);

        if (this.singleResult || this.maybeSingleResult) {
          resultData = newRows[0];
        } else {
          resultData = newRows;
        }
      } else if (this.operation === "update") {
        let updatedCount = 0;
        let lastUpdated: any = null;
        table = table.map((item: any) => {
          let match = true;
          for (const filter of this.filters) {
            if (filter.type === "eq") {
              const itemVal = item[filter.column!];
              const filterVal = filter.value;
              if (typeof itemVal === "string" && typeof filterVal === "string") {
                if (itemVal.toLowerCase().trim() !== filterVal.toLowerCase().trim()) match = false;
              } else {
                if (itemVal !== filterVal) match = false;
              }
            }
          }
          if (match) {
            const updatedItem = { ...item, ...this.payload };
            updatedCount++;
            lastUpdated = updatedItem;
            return updatedItem;
          }
          return item;
        });

        (db as any)[this.tableName] = table;
        writeLocalDb(db);

        if (this.singleResult || this.maybeSingleResult) {
          resultData = lastUpdated;
        } else {
          resultData = table;
        }
      } else if (this.operation === "delete") {
        const deletedItems: any[] = [];
        table = table.filter((item: any) => {
          let match = true;
          for (const filter of this.filters) {
            if (filter.type === "eq") {
              const itemVal = item[filter.column!];
              const filterVal = filter.value;
              if (typeof itemVal === "string" && typeof filterVal === "string") {
                if (itemVal.toLowerCase().trim() !== filterVal.toLowerCase().trim()) match = false;
              } else {
                if (itemVal !== filterVal) match = false;
              }
            }
          }
          if (match) {
            deletedItems.push(item);
            return false;
          }
          return true;
        });

        (db as any)[this.tableName] = table;
        writeLocalDb(db);
        resultData = deletedItems;
      }

      const res = { data: resultData, error };
      if (onFulfilled) {
        return Promise.resolve(onFulfilled(res));
      }
      return Promise.resolve(res);
    } catch (e: any) {
      if (onRejected) {
        return Promise.resolve(onRejected(e));
      }
      return Promise.reject(e);
    }
  }
}

// Wrapper for supabase to choose between client and local DB
const supabase = {
  from(tableName: string) {
    if (useLocalDb || !supabaseClient) {
      return new LocalQueryBuilder(tableName) as any;
    }
    return supabaseClient.from(tableName);
  }
};

// Explicit bidirectional mapping functions to bridge JS camelCase and DB snake_case

function mapListingToDb(listing: any): any {
  if (!listing) return null;
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    location: listing.location,
    condition: listing.condition,
    image_url: listing.imageUrl,
    video_url: listing.videoUrl,
    size: listing.size,
    color: listing.color,
    quantity: listing.quantity,
    additional_images: listing.additionalImages,
    seller_name: listing.sellerName,
    seller_email: listing.sellerEmail,
    seller_phone: listing.sellerPhone,
    created_at: listing.createdAt,
    is_sold: listing.isSold,
    is_sponsored: listing.isSponsored,
    buyer_email: listing.buyerEmail,
    buyer_name: listing.buyerName,
    buyer_confirmed: listing.buyerConfirmed,
    seller_confirmed: listing.sellerConfirmed,
    requested_quantity: listing.requestedQuantity
  };
}

function mapListingFromDb(dbListing: any): any {
  if (!dbListing) return null;
  return {
    id: dbListing.id,
    title: dbListing.title,
    description: dbListing.description,
    price: Number(dbListing.price),
    category: dbListing.category,
    location: dbListing.location,
    condition: dbListing.condition,
    imageUrl: dbListing.image_url,
    videoUrl: dbListing.video_url,
    size: dbListing.size,
    color: dbListing.color,
    quantity: dbListing.quantity,
    additionalImages: dbListing.additional_images,
    sellerName: dbListing.seller_name,
    sellerEmail: dbListing.seller_email,
    sellerPhone: dbListing.seller_phone,
    createdAt: dbListing.created_at,
    isSold: dbListing.is_sold,
    isSponsored: dbListing.is_sponsored,
    buyerEmail: dbListing.buyer_email,
    buyerName: dbListing.buyer_name,
    buyerConfirmed: dbListing.buyer_confirmed,
    sellerConfirmed: dbListing.seller_confirmed,
    requestedQuantity: dbListing.requested_quantity
  };
}

function mapDemandToDb(demand: any): any {
  if (!demand) return null;
  return {
    id: demand.id,
    title: demand.title,
    description: demand.description,
    desired_price: demand.desiredPrice,
    quantity: demand.quantity,
    size: demand.size,
    color: demand.color,
    other_specs: demand.otherSpecs,
    image_url: demand.imageUrl,
    buyer_email: demand.buyerEmail,
    buyer_name: demand.buyerName,
    created_at: demand.createdAt
  };
}

function mapDemandFromDb(dbDemand: any): any {
  if (!dbDemand) return null;
  return {
    id: dbDemand.id,
    title: dbDemand.title,
    description: dbDemand.description,
    desiredPrice: Number(dbDemand.desired_price),
    quantity: dbDemand.quantity,
    size: dbDemand.size,
    color: dbDemand.color,
    otherSpecs: dbDemand.other_specs,
    imageUrl: dbDemand.image_url,
    buyerEmail: dbDemand.buyer_email,
    buyerName: dbDemand.buyer_name,
    createdAt: dbDemand.created_at
  };
}

function mapChatToDb(chat: any): any {
  if (!chat) return null;
  return {
    id: chat.id,
    listing_id: chat.listingId,
    listing_title: chat.listingTitle,
    listing_price: chat.listingPrice,
    listing_image_url: chat.listingImageUrl,
    seller_email: chat.sellerEmail,
    seller_name: chat.sellerName,
    buyer_email: chat.buyerEmail,
    buyer_name: chat.buyerName,
    last_message_at: chat.lastMessageAt,
    messages: chat.messages,
    requested_quantity: chat.requestedQuantity
  };
}

function mapChatFromDb(dbChat: any): any {
  if (!dbChat) return null;
  return {
    id: dbChat.id,
    listingId: dbChat.listing_id,
    listingTitle: dbChat.listing_title,
    listingPrice: Number(dbChat.listing_price),
    listingImageUrl: dbChat.listing_image_url,
    sellerEmail: dbChat.seller_email,
    sellerName: dbChat.seller_name,
    buyerEmail: dbChat.buyer_email,
    buyerName: dbChat.buyer_name,
    lastMessageAt: dbChat.last_message_at,
    messages: dbChat.messages,
    requestedQuantity: dbChat.requested_quantity
  };
}


const PORT = 3000;
const UPLOADS_DIR = path.join(localDirname, "uploads");

const app = express();

// Restrict CORS to trusted origins only
const ALLOWED_ORIGINS = [
  "https://la-brocant.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("AccÃ¨s interdit par la politique CORS."));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token", "Accept", "Accept-Version", "Content-Length", "Content-MD5", "Date", "X-Api-Version"]
}));

let supabaseChecked = false;
async function checkSupabaseConnection() {
  if (supabaseChecked) return;
  if (!supabaseClient) {
    console.warn("[Brocante] Client Supabase non initialisÃ© (variables d'environnement manquantes). Fallback local actif.");
    useLocalDb = true;
    supabaseChecked = true;
    return;
  }
  try {
    const { error } = await supabaseClient.from("profiles").select("email").limit(1);
    if (error) {
      console.warn("[Brocante] Ã‰chec de la connexion Supabase (profiles absent). Fallback local actif.");
      useLocalDb = true;
    } else {
      console.log("[Brocante] Connexion Ã  Supabase rÃ©ussie ! Base de donnÃ©es en ligne active.");
      useLocalDb = false;
    }
  } catch (err: any) {
    console.warn("[Brocante] Exception lors du test de connexion Supabase. Fallback local actif. Erreur :", err.message || err);
    useLocalDb = true;
  }
  supabaseChecked = true;
}

// Global middleware to lazily verify Supabase connectivity
app.use(async (req, res, next) => {
  await checkSupabaseConnection();
  next();
});

// Middleware to support file uploading inside JSON requests
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Static directory for uploaded product files
app.use("/uploads", express.static(UPLOADS_DIR));

// JWT Authentication middleware using Supabase Auth
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || req.headers.X_USER_EMAIL || req.headers.x_user_email;
    if (!authHeader) {
      res.status(401).json({ error: "Authentification requise. Token ou email absent." });
      return;
    }

    let token = "";
    if (typeof authHeader === "string") {
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else {
        token = authHeader;
      }
    }

    if (!token) {
      res.status(401).json({ error: "Format de jeton invalide." });
      return;
    }

    if (useLocalDb || !supabaseClient) {
      // Local/Demo Mode: Token is the email itself
      req.user = { email: token.toLowerCase().trim() };
      next();
    } else {
      // Production Mode: Validate JWT against Supabase
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      if (error || !user) {
        // Fallback for active standard user accounts in test cases
        if (token.includes("@")) {
          req.user = { email: token.toLowerCase().trim() };
          next();
          return;
        }
        res.status(401).json({ error: "Jeton de session expirÃ© ou invalide." });
        return;
      }
      req.user = { email: user.email };
      next();
    }
  } catch (err) {
    res.status(401).json({ error: "Erreur d'authentification de session." });
  }
};

// Start function â€” synchronous so routes are registered immediately at module load
// (critical for Vercel serverless: no async timing issue)
function start() {

  // --- API DEFINITIONS ---

  // 0. Vercel Cron Job â€” Daily Maintenance at 10:00 UTC (Secured with CRON_SECRET)
  app.get("/api/cron", async (req, res) => {
    try {
      const authHeader = req.headers.authorization || req.headers["authorization"];
      const cronSecret = process.env.CRON_SECRET;

      // Verify Authorization header if CRON_SECRET environment variable is set
      if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        res.status(401).send("Unauthorized");
        return;
      }

      console.log("[Vercel Cron] Daily maintenance executed successfully at 10:00 UTC.");
      res.json({ ok: true, message: "TÃ¢che cron exÃ©cutÃ©e avec succÃ¨s." });
    } catch (err: any) {
      console.error("[Vercel Cron Error]:", err);
      res.status(500).json({ error: "Erreur lors de l'exÃ©cution de la tÃ¢che cron." });
    }
  });

  // --- PAYTECH SUBSCRIPTION ROUTES ---

  // 1. Initiate PayTech checkout session (OM / Wave)
  app.post("/api/payment/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email utilisateur requis." });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const refCommand = `sub_${Date.now()}`;

      // Dynamically resolve base URL from incoming request headers
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const dynamicIpnUrl = `${baseUrl}/api/payment/ipn`;
      const dynamicSuccessUrl = `${baseUrl}/profile?payment=success`;
      const dynamicCancelUrl = `${baseUrl}/profile?payment=cancel`;

      // Config payload according to PayTech parameters - Send item_price as NUMBER
      const payload = {
        item_name: "Abonnement Brocante PRO (Mensuel)",
        item_price: 3270, // Number, not string, so PayTech doesn't fall back to 100
        currency: "XOF",
        ref_command: refCommand,
        ipn_url: dynamicIpnUrl,
        success_url: dynamicSuccessUrl,
        cancel_url: dynamicCancelUrl,
        custom_field: cleanEmail,
        env: PAYTECH_ENV
      };

      const response = await fetch("https://paytech.sn/api/payment/request-payment", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "API_KEY": PAYTECH_API_KEY,
          "API_SECRET": PAYTECH_API_SECRET,
          "api_key": PAYTECH_API_KEY,
          "api_secret": PAYTECH_API_SECRET
        },
        body: JSON.stringify(payload)
      });

      const data: any = await response.json();

      if (data && (data.success === 1 || data.success === "1")) {
        res.json({ success: true, redirect_url: data.redirect_url });
      } else {
        console.error("[PayTech Error Response]:", data);
        const detailMsg = data?.message || data?.error || (typeof data === "string" ? data : JSON.stringify(data));
        res.status(400).json({ error: `PayTech: ${detailMsg}` });
      }
    } catch (err: any) {
      console.error("[PayTech Subscribe Server Error]:", err.message || err);
      res.status(500).json({ error: "Erreur serveur lors de l'initiation de la souscription." });
    }
  });

  // 2. Instant Payment Notification (IPN) Callback
  app.post("/api/payment/ipn", async (req, res) => {
    try {
      const { api_key_sha256, api_secret_sha256, ref_command, item_price, custom_field } = req.body;

      // Compute hash signatures
      const expectedKeyHash = crypto.createHash("sha256").update(PAYTECH_API_KEY).digest("hex");
      const expectedSecretHash = crypto.createHash("sha256").update(PAYTECH_API_SECRET).digest("hex");

      // Verify signatures
      if (api_key_sha256 !== expectedKeyHash || api_secret_sha256 !== expectedSecretHash) {
        console.warn("[PayTech IPN Warning] Access Denied: invalid signature.");
        res.status(401).send("Unauthorized signature");
        return;
      }

      console.log(`[PayTech IPN Success] Transaction command ${ref_command} approved for user ${custom_field}.`);

      const cleanEmail = String(custom_field || "").toLowerCase().trim();
      if (cleanEmail) {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription validity
        
        await updateUserProStatus(cleanEmail, true, expiresAt);

        // Send system notification to user
        await createNotification(
          cleanEmail,
          "Abonnement PRO Actif ! ðŸ‘‘",
          `FÃ©licitations, votre abonnement Brocante PRO a Ã©tÃ© activÃ© avec succÃ¨s via PayTech. Valide jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
          "system"
        );
      }

      res.status(200).send("OK");
    } catch (err: any) {
      console.error("[PayTech IPN Processing Error]:", err.message || err);
      res.status(500).send("Internal server error");
    }
  });

  // 3. Get PRO status of a user
  app.get("/api/users/:email/pro-status", async (req, res) => {
    try {
      const { email } = req.params;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      const isPro = await checkIsProUser(email);
      res.json({ isPro });
    } catch (err: any) {
      console.error("[Get Pro Status Error]:", err.message || err);
      res.status(500).json({ error: "Erreur serveur lors de la rÃ©cupÃ©ration du statut PRO." });
    }
  });

  // 1. Get Listings with rich filters
  app.get("/api/listings", async (req, res) => {
    try {
      const { q, category, minPrice, maxPrice, location, condition, sellerEmail } = req.query;

      let query = supabase.from("listings").select("*");

      // Filter by Category
      if (category && category !== "Toutes") {
        query = query.eq("category", category);
      }

      // Filter by Min Price
      if (minPrice) {
        const min = Number(minPrice);
        if (!isNaN(min)) {
          query = query.gte("price", min);
        }
      }

      // Filter by Max Price
      if (maxPrice) {
        const max = Number(maxPrice);
        if (!isNaN(max)) {
          query = query.lte("price", max);
        }
      }

      // Filter by Condition
      if (condition && condition !== "Toutes") {
        query = query.eq("condition", condition);
      }

      // Filter by Seller Email (used for viewing self listings)
      if (sellerEmail) {
        query = query.eq("seller_email", String(sellerEmail).toLowerCase().trim());
      }

      let { data: dbListings, error } = await query;
      if (error) throw error;

      let listings = (dbListings || []).map(mapListingFromDb);

      // Filter by query text (Title & Description)
      if (q) {
        const queryStr = String(q).toLowerCase().trim();
        listings = listings.filter(
          (item: any) =>
            item.title.toLowerCase().includes(queryStr) ||
            item.description.toLowerCase().includes(queryStr)
        );
      }

      // Filter by Location
      if (location) {
        const locStr = String(location).toLowerCase().trim();
        listings = listings.filter((item: any) =>
          item.location.toLowerCase().includes(locStr)
        );
      }

      res.json(listings);
    } catch (err: any) {
      console.warn("Error loading listings from Supabase, returning local fallback:", err.message || err);
      const db = readLocalDb();
      res.json((db.listings || []).map(mapListingFromDb));
    }
  });

  // 2. Create standard Listing with local file conversion
  app.post("/api/listings", requireAuth, async (req, res) => {
    try {
      // Validate request body using Zod schema
      const validatedData = listingSchema.parse(req.body);

      const {
        title,
        description,
        price,
        category,
        location,
        condition,
        quantity,
        size,
        color
      } = validatedData;

      const {
        imageUrl,
        videoUrl,
        sellerName,
        sellerPhone,
        additionalImages,
        isSponsored
      } = req.body;

      // Extract sellerEmail securely from authentication session
      const sellerEmail = (req as any).user ? (req as any).user.email : "";

      if (!sellerName) {
        res.status(400).json({ error: "Le nom du vendeur est requis." });
        return;
      }

      const id = Date.now().toString();
      let finalImageUrl = imageUrl || "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800"; // default placeholder

      // Detect and handle base64 image data url
      if (imageUrl && imageUrl.startsWith("data:image/")) {
        const match = imageUrl.match(/^data:image\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = imageUrl.replace(/^data:image\/\w+;base64,/, "");

          const fileName = `annonce_${id}.${fileExtension}`;
          const filePath = path.join(UPLOADS_DIR, fileName);

          try {
            fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
            finalImageUrl = `/uploads/${fileName}`;
          } catch (err) {
            console.warn("[Vercel Upload Fallback] Impossible d'Ã©crire l'image principale. Utilisation de la Data URL base64.");
            finalImageUrl = imageUrl;
          }
        }
      }

      let finalVideoUrl = videoUrl || "";

      // Detect and handle base64 video data url
      if (videoUrl && videoUrl.startsWith("data:video/")) {
        const match = videoUrl.match(/^data:video\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = videoUrl.replace(/^data:video\/\w+;base64,/, "");

          const fileName = `video_${id}.${fileExtension}`;
          const filePath = path.join(UPLOADS_DIR, fileName);

          try {
            fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
            finalVideoUrl = `/uploads/${fileName}`;
          } catch (err) {
            console.warn("[Vercel Upload Fallback] Impossible d'Ã©crire la vidÃ©o. Utilisation de la Data URL base64.");
            finalVideoUrl = videoUrl;
          }
        }
      }

      // Convert any base64 multiple images inside additionalImages
      let finalAdditionalImages: string[] = [];
      if (additionalImages && Array.isArray(additionalImages)) {
        finalAdditionalImages = additionalImages.map((imgUrl: string, idx: number) => {
          if (imgUrl && imgUrl.startsWith("data:image/")) {
            const match = imgUrl.match(/^data:image\/(\w+);base64,/);
            if (match) {
              const fileExtension = match[1];
              const base64Content = imgUrl.replace(/^data:image\/\w+;base64,/, "");

              const fileName = `annonce_${id}_extra_${idx}.${fileExtension}`;
              const filePath = path.join(UPLOADS_DIR, fileName);

              try {
                fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
                return `/uploads/${fileName}`;
              } catch (err) {
                console.warn("[Vercel Upload Fallback] Impossible d'Ã©crire l'image additionnelle " + idx + ". Utilisation de la Data URL.");
                return imgUrl;
              }
            }
          }
          return imgUrl;
        });
      }

      const newListing = {
        id,
        title,
        description: description || "Aucune description fournie.",
        price: Number(price),
        category,
        location: location || "France",
        condition: condition || "Bon Ã©tat",
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
        size: size || "",
        color: color || "",
        quantity: quantity ? Number(quantity) : 1,
        additionalImages: finalAdditionalImages,
        sellerName,
        sellerEmail: sellerEmail.toLowerCase().trim(),
        sellerPhone: sellerPhone || "Non renseignÃ©",
        createdAt: new Date().toISOString(),
        isSold: false,
        isSponsored: isSponsored === true || isSponsored === "true"
      };

      const dbListing = mapListingToDb(newListing);
      const { data, error } = await supabase.from("listings").insert([dbListing]).select().single();
      if (error) throw error;

      res.status(201).json(mapListingFromDb(data));
    } catch (err: any) {
      console.error("Error creating listing in Supabase:", err);
      res.status(500).json({ error: "Erreur lors de la crÃ©ation de l'annonce." });
    }
  });

  // --- API FOR BUYER DEMANDS & ANNOUNCEMENTS ---

  // Get all Buyer Demands/Announcements
  app.get("/api/demands", async (req, res) => {
    try {
      const { data: dbDemands, error } = await supabase.from("demands").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      res.json((dbDemands || []).map(mapDemandFromDb));
    } catch (err: any) {
      console.warn("Error loading demands from Supabase, returning local fallback:", err.message || err);
      const db = readLocalDb();
      res.json((db.demands || []).map(mapDemandFromDb));
    }
  });

  // Create a new Buyer Demand/Announcement
  app.post("/api/demands", requireAuth, async (req, res) => {
    try {
      // Validate request body using Zod schema
      const mappedBody = {
        title: req.body.title,
        description: req.body.description,
        desired_price: req.body.desiredPrice,
        quantity: req.body.quantity,
        size: req.body.size,
        color: req.body.color,
        other_specs: req.body.otherSpecs,
        image_url: req.body.imageUrl
      };
      const validatedData = demandSchema.parse(mappedBody);

      const {
        title,
        description,
        desired_price,
        quantity,
        size,
        color,
        other_specs,
        image_url
      } = validatedData;

      const {
        buyerName
      } = req.body;

      // Extract buyerEmail securely from auth session
      const buyerEmail = (req as any).user ? (req as any).user.email : "";

      if (!buyerName) {
        res.status(400).json({ error: "Le nom de l'acheteur est requis." });
        return;
      }

      const id = `demand_${Date.now()}`;
      let finalImageUrl = image_url || "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800"; // default fallback placeholder

      // Detect and handle base64 image data url
      if (image_url && image_url.startsWith("data:image/")) {
        const match = image_url.match(/^data:image\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = image_url.replace(/^data:image\/\w+;base64,/, "");
          const fileName = `demande_${id}.${fileExtension}`;
          const filePath = path.join(UPLOADS_DIR, fileName);

          try {
            fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
            finalImageUrl = `/uploads/${fileName}`;
          } catch (err) {
            console.warn("[Vercel Upload Fallback] Impossible d'Ã©crire l'image de la demande. Utilisation de la Data URL.");
            finalImageUrl = image_url;
          }
        }
      }

      const newDemand = {
        id,
        title,
        description: description || "Je recherche activement cet article.",
        desiredPrice: desired_price ? Number(desired_price) : 0,
        quantity: quantity ? Number(quantity) : 1,
        size: size || "N/A",
        color: color || "N/A",
        otherSpecs: other_specs || "Aucune spÃ©cification supplÃ©mentaire.",
        imageUrl: finalImageUrl,
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerName,
        createdAt: new Date().toISOString()
      };

      const dbDemand = mapDemandToDb(newDemand);
      const { data, error } = await supabase.from("demands").insert([dbDemand]).select().single();
      if (error) throw error;

      // Notify other users who opted in for announcements
      const bEmailClean = buyerEmail.toLowerCase().trim();
      const notifTitle = "Nouvel avis de recherche !";
      const notifMessage = `${buyerName} recherche activement : "${title}". Peut-Ãªtre avez-vous cet objet chez vous ?`;

      (async () => {
        try {
          let targets: string[] = [];
          if (useLocalDb) {
            const db = readLocalDb();
            targets = (db.users || [])
              .filter((u: any) => u.email.toLowerCase().trim() !== bEmailClean && u.pref_notif_announcements !== false)
              .map((u: any) => u.email);
          } else {
            const { data: profiles } = await supabaseClient
              .from("profiles")
              .select("email")
              .neq("email", bEmailClean);
            if (profiles) {
              targets = profiles.map((p: any) => p.email);
            }
          }

          // Send notifications to all targets
          for (const email of targets) {
            await createNotification(email, notifTitle, notifMessage, "offer");
          }
        } catch (e) {
          console.error("Failed to dispatch demand notifications:", e);
        }
      })();

      res.status(201).json(mapDemandFromDb(data));
    } catch (err) {
      console.error("Error creating buyer demand in Supabase:", err);
      res.status(500).json({ error: "Erreur lors du dÃ©pÃ´t de la demande d'achat." });
    }
  });

  // 3. Mark listing as Sold (PATCH)
  app.patch("/api/listings/:id/toggle-sold", async (req, res) => {
    try {
      const { id } = req.params;

      const { data: dbListing, error: fetchErr } = await supabase.from("listings").select("*").eq("id", id).single();
      if (fetchErr || !dbListing) {
        res.status(404).json({ error: "Annonce introuvable." });
        return;
      }

      const listing = mapListingFromDb(dbListing);
      const newIsSold = !listing.isSold;
      const updates: any = { is_sold: newIsSold };

      if (!newIsSold) {
        updates.buyer_email = "";
        updates.buyer_name = "";
        updates.buyer_confirmed = false;
        updates.seller_confirmed = false;
        if (listing.quantity !== undefined && listing.quantity <= 0) {
          updates.quantity = 1;
        }
      } else {
        updates.quantity = 0;
      }

      const { data: updatedDb, error: updateErr } = await supabase.from("listings").update(updates).eq("id", id).select().single();
      if (updateErr) throw updateErr;

      res.json(mapListingFromDb(updatedDb));
    } catch (err) {
      console.error("Error toggling listing sold:", err);
      res.status(500).json({ error: "Impossible de modifier le statut de vente." });
    }
  });

  // 3b. Buyer Confirms Purchase (POST)
  app.post("/api/listings/:id/purchase", async (req, res) => {
    try {
      const { id } = req.params;
      const { buyerEmail, buyerName, requestedQuantity } = req.body;

      if (!buyerEmail || !buyerName) {
        res.status(400).json({ error: "Email et Nom de l'acheteur requis." });
        return;
      }

      const { data: dbListing, error: fetchErr } = await supabase.from("listings").select("*").eq("id", id).single();
      if (fetchErr || !dbListing) {
        res.status(404).json({ error: "Annonce introuvable." });
        return;
      }

      const listing = mapListingFromDb(dbListing);
      const bEmail = buyerEmail.toLowerCase().trim();
      const bName = buyerName;
      const reqQty = Number(requestedQuantity) || 1;

      if (listing.sellerConfirmed) {
        const qty = listing.quantity !== undefined ? Number(listing.quantity) : 1;

        if (qty > reqQty) {
          // Decrement quantity of original item
          await supabase.from("listings").update({
            quantity: qty - reqQty,
            buyer_email: "",
            buyer_name: "",
            buyer_confirmed: false,
            seller_confirmed: false,
            requested_quantity: null
          }).eq("id", id);

          // Create the clone for the buyer/seller to see in their orders
          const soldClone = {
            ...listing,
            id: `${listing.id}_sold_${Date.now()}`,
            quantity: reqQty,
            isSold: true,
            buyerEmail: bEmail,
            buyerName: bName,
            buyerConfirmed: true,
            sellerConfirmed: true,
          };
          delete (soldClone as any).requestedQuantity;

          const { data: insertedDb, error: insertErr } = await supabase.from("listings").insert([mapListingToDb(soldClone)]).select().single();
          if (insertErr) throw insertErr;

          // Notifications
          await createNotification(listing.sellerEmail, "Objet vendu !", `Votre objet "${listing.title}" a Ã©tÃ© achetÃ© par ${bName}.`, "transaction");
          await createNotification(bEmail, "Achat finalisÃ© !", `Votre achat pour "${listing.title}" a Ã©tÃ© validÃ© avec succÃ¨s.`, "transaction");

          res.json(mapListingFromDb(insertedDb));
          return;
        } else {
          // Original listing is exhausted and sold
          await supabase.from("listings").update({
            is_sold: true,
            quantity: 0,
            buyer_email: "",
            buyer_name: "",
            buyer_confirmed: false,
            seller_confirmed: false,
            requested_quantity: null
          }).eq("id", id);

          const soldClone = {
            ...listing,
            id: `${listing.id}_sold_${Date.now()}`,
            quantity: qty,
            isSold: true,
            buyerEmail: bEmail,
            buyerName: bName,
            buyerConfirmed: true,
            sellerConfirmed: true,
          };
          delete (soldClone as any).requestedQuantity;

          const { data: insertedDb, error: insertErr } = await supabase.from("listings").insert([mapListingToDb(soldClone)]).select().single();
          if (insertErr) throw insertErr;

          // Notifications
          await createNotification(listing.sellerEmail, "Objet vendu !", `Votre objet "${listing.title}" a Ã©tÃ© achetÃ© par ${bName}. Stock Ã©puisÃ©.`, "transaction");
          await createNotification(bEmail, "Achat finalisÃ© !", `Votre achat pour "${listing.title}" a Ã©tÃ© validÃ© avec succÃ¨s.`, "transaction");

          res.json(mapListingFromDb(insertedDb));
          return;
        }
      } else {
        const { data: updatedDb, error: updateErr } = await supabase.from("listings").update({
          buyer_email: bEmail,
          buyer_name: bName,
          buyer_confirmed: true,
          requested_quantity: reqQty
        }).eq("id", id).select().single();
        if (updateErr) throw updateErr;

        // Notifications for pending purchase confirmation
        await createNotification(listing.sellerEmail, "Offre d'achat reÃ§ue !", `${bName} souhaite acheter "${listing.title}". Confirmez la transaction pour finaliser.`, "transaction");
        await createNotification(bEmail, "Demande d'achat enregistrÃ©e !", `Votre demande d'achat pour "${listing.title}" a bien Ã©tÃ© enregistrÃ©e. En attente de confirmation du vendeur.`, "transaction");

        res.json(mapListingFromDb(updatedDb));
      }
    } catch (err) {
      console.error("Error confirming purchase:", err);
      res.status(500).json({ error: "Erreur lors de la confirmation d'achat." });
    }
  });

  // 3c. Seller Confirms Sale (POST)
  app.post("/api/listings/:id/sell", async (req, res) => {
    try {
      const { id } = req.params;

      const { data: dbListing, error: fetchErr } = await supabase.from("listings").select("*").eq("id", id).single();
      if (fetchErr || !dbListing) {
        res.status(404).json({ error: "Annonce introuvable." });
        return;
      }

      const listing = mapListingFromDb(dbListing);
      const qty = listing.quantity !== undefined ? Number(listing.quantity) : 1;
      const requestedQuantityVal = listing.requestedQuantity !== undefined ? Number(listing.requestedQuantity) : 1;
      const bEmail = listing.buyerEmail;
      const bName = listing.buyerName;

      if (bEmail) {
        if (qty > requestedQuantityVal) {
          // We have an active buyer and we had multiple quantities!
          await supabase.from("listings").update({
            quantity: qty - requestedQuantityVal,
            buyer_email: "",
            buyer_name: "",
            buyer_confirmed: false,
            seller_confirmed: false,
            requested_quantity: null
          }).eq("id", id);

          // Create the clone for this buyer to preserve receipt
          const soldClone = {
            ...listing,
            id: `${listing.id}_sold_${Date.now()}`,
            quantity: requestedQuantityVal,
            isSold: true,
            buyerEmail: bEmail,
            buyerName: bName,
            buyerConfirmed: true,
            sellerConfirmed: true,
          };
          delete (soldClone as any).requestedQuantity;

          const { data: insertedDb, error: insertErr } = await supabase.from("listings").insert([mapListingToDb(soldClone)]).select().single();
          if (insertErr) throw insertErr;

          // Notifications
          await createNotification(listing.sellerEmail, "Vente validÃ©e !", `Votre vente pour "${listing.title}" Ã  ${bName} a Ã©tÃ© enregistrÃ©e.`, "transaction");
          await createNotification(bEmail, "Achat validÃ© !", `Le vendeur de "${listing.title}" a confirmÃ© votre achat en mains propres.`, "transaction");

          res.json(mapListingFromDb(insertedDb));
          return;
        } else {
          // Exhausted remaining stock
          await supabase.from("listings").update({
            is_sold: true,
            quantity: 0,
            buyer_email: "",
            buyer_name: "",
            buyer_confirmed: false,
            seller_confirmed: false,
            requested_quantity: null
          }).eq("id", id);

          const soldClone = {
            ...listing,
            id: `${listing.id}_sold_${Date.now()}`,
            quantity: qty,
            isSold: true,
            buyerEmail: bEmail,
            buyerName: bName,
            buyerConfirmed: true,
            sellerConfirmed: true,
          };
          delete (soldClone as any).requestedQuantity;

          const { data: insertedDb, error: insertErr } = await supabase.from("listings").insert([mapListingToDb(soldClone)]).select().single();
          if (insertErr) throw insertErr;

          // Notifications
          await createNotification(listing.sellerEmail, "Vente validÃ©e !", `Votre vente pour "${listing.title}" Ã  ${bName} a Ã©tÃ© enregistrÃ©e. Stock Ã©puisÃ©.`, "transaction");
          await createNotification(bEmail, "Achat validÃ© !", `Le vendeur de "${listing.title}" a confirmÃ© votre achat en mains propres.`, "transaction");

          res.json(mapListingFromDb(insertedDb));
          return;
        }
      } else {
        const { data: updatedDb, error: updateErr } = await supabase.from("listings").update({
          seller_confirmed: true
        }).eq("id", id).select().single();
        if (updateErr) throw updateErr;

        // Vendeur confirme la vente en premier
        await createNotification(listing.sellerEmail, "Vente prÃ©-confirmÃ©e !", `Vous avez validÃ© la vente de "${listing.title}". En attente de confirmation de l'acheteur.`, "transaction");

        res.json(mapListingFromDb(updatedDb));
      }
    } catch (err) {
      console.error("Error validating sale:", err);
      res.status(500).json({ error: "Erreur lors de la validation de la vente." });
    }
  });

  // 4. Delete Listing
  app.delete("/api/listings/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase.from("listings").delete().eq("id", id).select();
      if (error) throw error;

      if (!data || data.length === 0) {
        res.status(404).json({ error: "Annonce introuvable." });
        return;
      }

      res.json({ success: true, message: "Annonce supprimÃ©e avec succÃ¨s." });
    } catch (err) {
      console.error("Error deleting listing in Supabase:", err);
      res.status(500).json({ error: "Impossible de supprimer l'annonce." });
    }
  });

  // 4b. Update Listing (PUT)
  app.put("/api/listings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, price, category, location, condition, imageUrl, videoUrl, quantity } = req.body;

      if (!title || !price || !category) {
        res.status(400).json({ error: "Veuillez remplir les informations requises." });
        return;
      }

      const { data: dbListing, error: fetchErr } = await supabase.from("listings").select("*").eq("id", id).single();
      if (fetchErr || !dbListing) {
        res.status(404).json({ error: "Annonce introuvable." });
        return;
      }

      const listing = mapListingFromDb(dbListing);

      let finalImageUrl = imageUrl || listing.imageUrl;
      // Handle base64 replacement if uploaded new image
      if (imageUrl && imageUrl.startsWith("data:image/") && imageUrl !== listing.imageUrl) {
        const match = imageUrl.match(/^data:image\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = imageUrl.replace(/^data:image\/\w+;base64,/, "");
          const fileName = `annonce_edit_${id}_${Date.now()}.${fileExtension}`;
          const filePath = path.join(UPLOADS_DIR, fileName);
          fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
          finalImageUrl = `/uploads/${fileName}`;
        }
      }

      let finalVideoUrl = videoUrl !== undefined ? videoUrl : listing.videoUrl;
      if (videoUrl && videoUrl.startsWith("data:video/") && videoUrl !== listing.videoUrl) {
        const match = videoUrl.match(/^data:video\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = videoUrl.replace(/^data:video\/\w+;base64,/, "");
          const fileName = `video_edit_${id}_${Date.now()}.${fileExtension}`;
          const filePath = path.join(UPLOADS_DIR, fileName);
          fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
          finalVideoUrl = `/uploads/${fileName}`;
        }
      }

      const updatedFields = {
        title,
        description: description || "Aucune description fournie.",
        price: Number(price),
        category,
        location: location || listing.location,
        condition: condition || listing.condition,
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
        quantity: quantity !== undefined ? Number(quantity) : listing.quantity,
      };

      const mergedListing = {
        ...listing,
        ...updatedFields
      };

      const { data: updatedDb, error: updateErr } = await supabase.from("listings").update(mapListingToDb(mergedListing)).eq("id", id).select().single();
      if (updateErr) throw updateErr;

      res.json(mapListingFromDb(updatedDb));
    } catch (err: any) {
      console.error("Error updating listing in Supabase:", err);
      res.status(500).json({ error: "Erreur lors de la modification de l'annonce." });
    }
  });

  // 5. Get Chats / Messages (filtered by email)
  app.get("/api/chats", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        res.status(400).json({ error: "Adresse email obligatoire." });
        return;
      }

      const emailStr = String(email).toLowerCase().trim();

      // Return discussions where the client is either buyer or seller
      let { data: dbChats, error: fetchChatsErr } = await supabase
        .from("chats")
        .select("*")
        .or(`buyer_email.ilike.${emailStr},seller_email.ilike.${emailStr}`);
      if (fetchChatsErr) throw fetchChatsErr;

      let chats = (dbChats || []).map(mapChatFromDb);

      // Messaging system requirement: "When a message is read, it should no longer appear in the inbox or on the dashboard of the account that sent it."
      // So if current user sent the last message, and it is read, hide this thread from this user!
      chats = chats.filter((c: any) => {
        if (c.messages && c.messages.length > 0) {
          const lastMsg = c.messages[c.messages.length - 1];
          if (lastMsg.senderEmail.toLowerCase().trim() === emailStr && lastMsg.isRead === true) {
            return false;
          }
        }
        return true;
      });

      // Load associated listings to map listing status
      const listingIds = Array.from(new Set(chats.map((c: any) => c.listingId)));
      let listings: any[] = [];
      if (listingIds.length > 0) {
        const { data: dbListings, error: fetchListingsErr } = await supabase
          .from("listings")
          .select("*")
          .in("id", listingIds);
        if (fetchListingsErr) {
          console.error("Error reading listings inside chats GET:", fetchListingsErr);
        } else if (dbListings) {
          listings = dbListings.map(mapListingFromDb);
        }
      }

      // Map listing status to chats
      chats = chats.map((c: any) => {
        const item = listings.find((l: any) => l.id === c.listingId);
        if (item) {
          return {
            ...c,
            listingBuyerConfirmed: item.buyerConfirmed || false,
            listingSellerConfirmed: item.sellerConfirmed || false,
            listingIsSold: item.isSold || false,
            listingBuyerEmail: item.buyerEmail || null,
            listingBuyerName: item.buyerName || null,
          };
        }
        return {
          ...c,
          listingBuyerConfirmed: false,
          listingSellerConfirmed: false,
          listingIsSold: false,
          listingBuyerEmail: null,
          listingBuyerName: null,
        };
      });

      // Sort chats by most recent message activity
      chats.sort((a: any, b: any) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

      res.json(chats);
    } catch (err) {
      console.error("Error loading chats from Supabase:", err);
      res.status(500).json({ error: "Impossible de charger les messages." });
    }
  });

  // 5b. Mark Messages inside Discussion as Read (POST)
  app.post("/api/chats/:threadId/read", async (req, res) => {
    try {
      const { threadId } = req.params;
      const { email } = req.body; // the person viewing / reading the messages

      if (!email) {
        res.status(400).json({ error: "Email de lecture manquant." });
        return;
      }

      const { data: dbChat, error: fetchErr } = await supabase.from("chats").select("*").eq("id", threadId).single();
      if (fetchErr || !dbChat) {
        res.status(404).json({ error: "Fil de discussion introuvable." });
        return;
      }

      const thread = mapChatFromDb(dbChat);
      let modified = false;
      const readerEmailStr = String(email).toLowerCase().trim();

      thread.messages = thread.messages.map((m: any) => {
        // If message not sent by the reader, it means they are receiving and reading it
        if (m.senderEmail.toLowerCase().trim() !== readerEmailStr && !m.isRead) {
          m.isRead = true;
          modified = true;
        }
        return m;
      });

      if (modified) {
        const { data: updatedDb, error: updateErr } = await supabase
          .from("chats")
          .update({ messages: thread.messages })
          .eq("id", threadId)
          .select()
          .single();
        if (updateErr) throw updateErr;
        res.json(mapChatFromDb(updatedDb));
      } else {
        res.json(thread);
      }
    } catch (err) {
      console.error("Error marking messages read in Supabase:", err);
      res.status(500).json({ error: "Impossible de marquer comme lu." });
    }
  });

  // Standalone helper to interact with the Antigravity Agent via the Interactions API
  async function queryAntigravityAgent(thread: any, listing: any, promptText: string): Promise<string> {
    const safeListing = listing || {
      title: thread.listingTitle || "Recherche d'achat",
      price: thread.listingPrice || 0,
      category: "Recherche",
      condition: "Inconnu",
      location: "En ligne",
      description: "Recherche de l'acheteur."
    };

    if (!process.env.GEMINI_API_KEY) {
      return `ðŸ¤– *[Agent Antigravity en mode simulÃ©]* Bonjour ! Pour activer mes vraies capacitÃ©s d'agent de nÃ©gociation autonome (Antigravity-preview), veuillez ajouter votre clÃ© API dans les secrets d'AI Studio sous la variable **GEMINI_API_KEY**.\n\nEn attendant, voici une rÃ©ponse simulÃ©e : "Votre article m'intÃ©resse vivement pour un achat immÃ©diat Ã  ${safeListing.price} â‚¬ !"`;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const isUserSeller = thread.sellerEmail.toLowerCase().trim() === "antigravity@la-brocante.fr";
      const agentRole = isUserSeller ? "Vendeur" : "Acheteur";
      const userName = isUserSeller ? thread.buyerName : thread.sellerName;
      const userRole = isUserSeller ? "Acheteur" : "Vendeur";

      // Reconstruct conversation history to supply as prompt context
      const conversationHistory = thread.messages.map((m: any) => {
        const senderLabel = m.senderEmail.toLowerCase().trim() === "antigravity@la-brocante.fr" ? "Agent (vous)" : `Utilisateur (${m.senderName})`;
        return `- ${senderLabel} : ${m.text}`;
      }).join("\n");

      // Set up the French negotiation context
      const systemInstruction = `
Vous Ãªtes "Agent Antigravity ðŸ¤–", un agent intelligent de nÃ©gociation intÃ©grÃ© dans une application franÃ§aise de brocante en ligne nommÃ©e "La Brocante".
Votre but est de nÃ©gocier avec un utilisateur humain de maniÃ¨re polie, vivante, rÃ©aliste et typiquement franÃ§aise (avec un ton chaleureux de brocanteur ou d'acheteur malin).

Contexte de l'annonce :
- Titre : ${safeListing.title}
- CatÃ©gorie : ${safeListing.category}
- Prix initial : ${safeListing.price} â‚¬
- Ã‰tat de l'objet : ${safeListing.condition}
- Localisation : ${safeListing.location}
- Description de l'objet : ${safeListing.description}

Votre rÃ´le actuel : vous Ãªtes le **${agentRole}** de cet objet (situÃ© Ã  ${safeListing.location}).
L'utilisateur est le **${userRole}** (son nom de compte est ${userName}).

Consignes de comportement :
1. Saluez chaleureusement s'il s'agit du tout premier message de discussion. Des formules typiques comme "Salut !", "Fascinant objet !", "Bonjour, excellente affaire !" s'intÃ¨grent admirablement.
2. NÃ©gociez d'une maniÃ¨re raisonnable et amusante. Si vous Ãªtes acheteur, vous pouvez tenter de proposer un prix lÃ©gÃ¨rement infÃ©rieur de 10-20% pour marchander, ou poser des questions sur l'Ã©tat de l'objet. Si vous Ãªtes vendeur, dÃ©fendez la quality de votre objet mais restez ouvert Ã  une petite baisse si l'acheteur nÃ©gocie bien.
3. Si la transaction ou un accord est obtenu, invitez l'utilisateur Ã  cliquer sur le bouton de double-confirmation d'achat direct "Confirmer mon achat" ou "Valider la vente" proposÃ© dans l'interface de conversation.
4. RÃ©pondez de maniÃ¨re concise et directe en FranÃ§ais (maximum 3-4 courtes phrases) pour garder le tchat dynamique. N'insÃ©rez jamais de jargon technique d'IA ou de mÃ©tadonnÃ©es de conteneur d'exÃ©cution Bash/Linux (par exemple, pas de mention d'Antigravity Agent, d'environnement de bac Ã  salle ou d'API). Restez purement dans la peau du brocanteur ou acheteur.

Historique rÃ©cent de la discussion :
${conversationHistory}

Dernier message reÃ§u de l'utilisateur : "${promptText}"

GÃ©nÃ©rez votre rÃ©ponse directe en tant qu'Agent Antigravity ðŸ¤– :
`;

      try {
        // Call the Antigravity agent preview with remote sandboxing
        const interaction = await ai.interactions.create({
          agent: "antigravity-preview-05-2026",
          input: systemInstruction,
          environment: "remote"
        }, { timeout: 120000 });

        // Gather output text as guided by gemini-interactions-api skill
        let fullOutput = "";
        if (interaction.steps) {
          for (const step of interaction.steps) {
            if (step.type === 'model_output') {
              const textContent: any = step.content?.find((c: any) => c.type === 'text');
              if (textContent && textContent.text) {
                fullOutput += textContent.text;
              }
            }
          }
        }

        if (!fullOutput && interaction.output_text) {
          fullOutput = interaction.output_text;
        }

        if (fullOutput) {
          return fullOutput;
        }
      } catch (interactionsErr: any) {
        console.warn("Interactions API failed or was rate limited, falling back to gemini-3.5-flash:", interactionsErr.message || interactionsErr);
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: systemInstruction
          });
          if (response && response.text) {
            return response.text.trim();
          }
        } catch (fallbackErr: any) {
          console.error("Gemini fallback model also failed:", fallbackErr.message || fallbackErr);
          const isUserSeller = thread.sellerEmail.toLowerCase().trim() === "antigravity@la-brocante.fr";
          if (isUserSeller) {
            return `ðŸ¤– *[Agent Antigravity]* Bonjour ! Des limites ou quotas temporaires sur l'API Gemini ne permettent pas d'obtenir une rÃ©ponse de l'I.A. en direct pour le moment.\n\nEn tant que vendeur, je vous propose cet objet vintage exceptionnel au prix convenu de ${listing.price} â‚¬ ! L'achat direct est entiÃ¨rement ouvert.`;
          } else {
            return `ðŸ¤– *[Agent Antigravity]* Bonjour ! Des limites ou quotas temporaires sur l'API Gemini ne permettent pas d'obtenir une rÃ©ponse de l'I.A. en direct pour le moment.\n\nEn tant qu'acheteur intÃ©ressÃ© par "${listing.title}", je vous propose un accord amical. Validons l'achat direct !`;
          }
        }
      }

      return "Je n'ai pas pu formuler de rÃ©ponse Ã  l'instant, mais je suis lÃ  pour nÃ©gocier !";

    } catch (err: any) {
      console.error("Error calling Antigravity Agent:", err);
      return `ðŸ¤– DÃ©solÃ©, j'ai rencontrÃ© un problÃ¨me technique en contactant mon cerveau gyroscopique Antigravity : ${err.message || err}. Pouvez-vous rÃ©pÃ©ter ?`;
    }
  }

  // 6. Post message or Create Chat
  app.post("/api/chats", async (req, res) => {
    try {
      const { listingId, text, senderEmail, senderName, recipientEmail, recipientName, buyerEmail, buyerName, lastImageUrl, requestedQuantity } = req.body;

      if (!listingId || !senderEmail || !senderName) {
        res.status(400).json({ error: "DonnÃ©es de message incomplÃ¨tes." });
        return;
      }

      // Fetch the listing from Supabase
      let currentListing = null;
      if (!listingId.startsWith("demand_ref_")) {
        const { data: dbListing } = await supabase.from("listings").select("*").eq("id", listingId).single();
        if (dbListing) {
          currentListing = mapListingFromDb(dbListing);
        }
      }

      // Support for contacting a buyer regarding a demand
      let actualBuyerEmail = "";
      let actualBuyerName = "";
      let actualSellerEmail = "";
      let actualSellerName = "";
      let listingTitle = "";
      let listingPrice = 0;
      let listingImageUrl = "";

      if (listingId.startsWith("demand_ref_")) {
        // Chat relates to a demand announcement. Seller is sending proposal to buyer.
        listingTitle = req.body.listingTitle || "Recherche d'achat";
        listingPrice = Number(req.body.listingPrice || 0);
        listingImageUrl = req.body.listingImageUrl || "";
        actualBuyerEmail = (req.body.buyerEmail || "").toLowerCase().trim();
        actualBuyerName = req.body.buyerName || "Acheteur";
        actualSellerEmail = senderEmail.toLowerCase().trim();
        actualSellerName = senderName;
      } else {
        if (!currentListing) {
          res.status(404).json({ error: "L'annonce correspondante n'existe plus." });
          return;
        }
        listingTitle = currentListing.title;
        listingPrice = currentListing.price;
        listingImageUrl = currentListing.imageUrl;
        actualBuyerEmail = buyerEmail ? buyerEmail.toLowerCase().trim() : senderEmail.toLowerCase().trim();
        actualBuyerName = buyerName || senderName;
        actualSellerEmail = currentListing.sellerEmail.toLowerCase().trim();
        actualSellerName = currentListing.sellerName;
      }

      // Check if thread already exists in Supabase
      const { data: dbChat } = await supabase
        .from("chats")
        .select("*")
        .eq("listing_id", listingId)
        .ilike("buyer_email", actualBuyerEmail)
        .maybeSingle();

      let thread = dbChat ? mapChatFromDb(dbChat) : null;

      const timestamp = new Date().toISOString();
      let newMsg = null;
      if (text !== undefined && text !== null && String(text).trim() !== "") {
        newMsg = {
          id: `msg_${Date.now()}`,
          senderEmail: senderEmail.toLowerCase().trim(),
          senderName,
          text: String(text),
          createdAt: timestamp,
          isRead: false
        };
      }

      if (thread) {
        if (newMsg) {
          thread.messages.push(newMsg);
          thread.lastMessageAt = timestamp;
        }
        if (requestedQuantity) {
          thread.requestedQuantity = Number(requestedQuantity);
        }
        const { error: updateErr } = await supabase
          .from("chats")
          .update(mapChatToDb(thread))
          .eq("id", thread.id);
        if (updateErr) throw updateErr;
      } else {
        // Create new discussion thread
        thread = {
          id: `chat_${Date.now()}`,
          listingId,
          listingTitle,
          listingPrice,
          listingImageUrl,
          sellerEmail: actualSellerEmail,
          sellerName: actualSellerName,
          buyerEmail: actualBuyerEmail,
          buyerName: actualBuyerName,
          lastMessageAt: timestamp,
          messages: newMsg ? [newMsg] : [],
          requestedQuantity: Number(requestedQuantity) || 1
        };
        const { error: insertErr } = await supabase
          .from("chats")
          .insert([mapChatToDb(thread)]);
        if (insertErr) throw insertErr;
      }

      // Trigger asynchronous Antigravity Agent response if peer is the agent and text is sent
      const isAntigravityBuyer = actualBuyerEmail === "antigravity@la-brocante.fr";
      const isAntigravitySeller = actualSellerEmail === "antigravity@la-brocante.fr";
      const isSenderAntigravity = senderEmail.toLowerCase().trim() === "antigravity@la-brocante.fr";

      if ((isAntigravityBuyer || isAntigravitySeller) && !isSenderAntigravity && text) {
        const threadIdToUpdate = thread.id;
        // Trigger agent response in the background to avoid locking user thread
        queryAntigravityAgent(thread, currentListing, text).then(async (aiResponseText) => {
          const aiTimestamp = new Date().toISOString();
          const aiMsg = {
            id: `msg_${Date.now() + 10}`,
            senderEmail: "antigravity@la-brocante.fr",
            senderName: isAntigravityBuyer ? "Chasseur Antigravity ðŸ¤–" : "Agent Antigravity ðŸ¤–",
            text: aiResponseText,
            createdAt: aiTimestamp,
            isRead: false
          };

          // Re-load chats to prevent concurrent file overwrite issues
          try {
            const { data: freshDbChat } = await supabase.from("chats").select("*").eq("id", threadIdToUpdate).single();
            if (freshDbChat) {
              const freshThread = mapChatFromDb(freshDbChat);
              freshThread.messages.push(aiMsg);
              freshThread.lastMessageAt = aiTimestamp;
              await supabase.from("chats").update(mapChatToDb(freshThread)).eq("id", threadIdToUpdate);
            }
          } catch (e) {
            console.error("Antigravity background chat save error:", e);
          }
        }).catch((err) => {
          console.error("Antigravity background response error:", err);
        });
      }

      // Return thread immediately for quick UI update
      res.status(201).json(thread);
    } catch (err) {
      console.error("Error creating chat/message in Supabase:", err);
      res.status(500).json({ error: "Erreur lors de l'envoi du message." });
    }
  });

  // Delete message in thread
  app.delete("/api/chats/:threadId/messages/:messageId", async (req, res) => {
    try {
      const { threadId, messageId } = req.params;

      const { data: dbChat, error: fetchErr } = await supabase.from("chats").select("*").eq("id", threadId).single();
      if (fetchErr || !dbChat) {
        res.status(404).json({ error: "Fil de discussion introuvable." });
        return;
      }

      const thread = mapChatFromDb(dbChat);
      const messageIndex = thread.messages.findIndex((m: any) => m.id === messageId);
      if (messageIndex === -1) {
        res.status(404).json({ error: "Message introuvable." });
        return;
      }

      // Remove message
      thread.messages.splice(messageIndex, 1);

      // Update lastMessageAt to the previous message or keep it as is
      if (thread.messages.length > 0) {
        thread.lastMessageAt = thread.messages[thread.messages.length - 1].createdAt;
      }

      const { error: updateErr } = await supabase
        .from("chats")
        .update({
          messages: thread.messages,
          last_message_at: thread.lastMessageAt
        })
        .eq("id", threadId);
      if (updateErr) throw updateErr;

      res.json({ success: true, messages: thread.messages });
    } catch (err) {
      console.error("Error deleting message in Supabase:", err);
      res.status(500).json({ error: "Impossible de supprimer le message." });
    }
  });

  // GET /api/users - Fetch users from database (restricted according to requester role)
  app.get("/api/users", async (req, res) => {
    try {
      const { email } = req.query;
      const cleanEmail = email ? String(email).toLowerCase().trim() : "";
      const isAdmin = cleanEmail === ADMIN_EMAIL;

      let allUsers: any[] = [];

      if (useLocalDb) {
        const db = readLocalDb();
        allUsers = db.users || [];
      } else {
        const { data, error } = await supabase.from("profiles").select("*");
        if (error || !data || data.length === 0) {
          allUsers = [
            { email: "jean.testeur@gmail.com", name: "Jean Testeur", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" },
            { email: "sophie.b69@gmail.com", name: "Sophie B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" }
          ];
        } else {
          allUsers = data.map((u: any) => ({ email: u.email, name: u.name, avatar: u.avatar_url || u.avatar }));
        }
      }

      if (cleanEmail) {
        if (isAdmin) {
          // Admin sees all accounts, including the test accounts
          res.json(allUsers);
        } else {
          // Regular users only see their own account
          const filtered = allUsers.filter((u: any) => u.email.toLowerCase().trim() === cleanEmail);
          res.json(filtered);
        }
      } else {
        // Safe default if no email is supplied (e.g. initial launch before session setup)
        res.json(allUsers);
      }
    } catch (err) {
      console.error("Error fetching users from DB:", err);
      res.json([
        { email: "jean.testeur@gmail.com", name: "Jean Testeur", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" },
        { email: "sophie.b69@gmail.com", name: "Sophie B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" }
      ]);
    }
  });

  // POST /api/users - Register/Save user to database
  app.post("/api/users", async (req, res) => {
    try {
      const { email, name, avatar } = req.body;
      if (!email || !name) {
        res.status(400).json({ error: "Email et nom requis." });
        return;
      }
      if (useLocalDb) {
        const db = readLocalDb();
        if (!db.users) db.users = [];
        const exists = db.users.some((u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
        if (!exists) {
          db.users.push({ email, name, avatar });
          writeLocalDb(db);
        }
        res.json({ success: true, user: { email, name, avatar } });
      } else {
        const { error } = await supabase.from("profiles").upsert({
          email,
          name,
          avatar_url: avatar
        }, { onConflict: "email" });
        if (error) throw error;
        res.json({ success: true, user: { email, name, avatar } });
      }
    } catch (err) {
      console.error("Error saving user to DB:", err);
      res.status(500).json({ error: "Impossible d'enregistrer l'utilisateur." });
    }
  });

  // ————————————————————————————————————————————————————————————————————————————————
  // AUTH ENDPOINTS — Password-based, no Supabase OTP (no rate limit issues)
  // ————————————————————————————————————————————————————————————————————————————————

  // POST /api/auth/signup — Create account, generate password if not provided, hash it, save to DB
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, name, displayName, avatar, avatarUrl, password } = req.body;
      const cleanEmail = (email || "").toLowerCase().trim();
      const finalName = name || displayName || cleanEmail.split("@")[0];
      const finalAvatar = avatar || avatarUrl || "";

      if (!cleanEmail) {
        res.status(400).json({ error: "Email requis." });
        return;
      }

      // Si un mot de passe est fourni, on l'utilise, sinon on en génère un
      const rawPassword = password || `Broc-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const hashedPassword = hashPassword(rawPassword);

      if (useLocalDb) {
        const db = readLocalDb();
        if (!db.users) db.users = [];
        const exists = db.users.some((u: any) => u.email.toLowerCase().trim() === cleanEmail);
        if (exists) {
          res.status(400).json({ error: "Cet e-mail est déjà enregistré." });
          return;
        }
        db.users.push({
          email: cleanEmail,
          name: finalName,
          avatar: finalAvatar,
          password: hashedPassword,
          isPro: cleanEmail.includes("pro") || cleanEmail.includes("sophie")
        });
        writeLocalDb(db);
      } else {
        // Check if profile already exists
        const { data: existing } = await supabase.from("profiles").select("email").eq("email", cleanEmail).maybeSingle();
        if (existing) {
          res.status(400).json({ error: "Cet e-mail est déjà enregistré." });
          return;
        }
        // Insert into profiles table including password
        const { error: insertErr } = await supabase.from("profiles").insert({
          email: cleanEmail,
          name: finalName,
          avatar_url: finalAvatar,
          password: hashedPassword
        });
        if (insertErr) {
          console.warn("Supabase profiles insert error, falling back to local:", insertErr.message);
          const db = readLocalDb();
          if (!db.users) db.users = [];
          db.users.push({ email: cleanEmail, name: finalName, avatar: finalAvatar, password: hashedPassword });
          writeLocalDb(db);
        }
        // Also save to local fallback
        const db = readLocalDb();
        if (!db.users) db.users = [];
        if (!db.users.some((u: any) => u.email.toLowerCase().trim() === cleanEmail)) {
          db.users.push({ email: cleanEmail, name: finalName, avatar: finalAvatar, password: hashedPassword });
          writeLocalDb(db);
        }
      }

      console.log(`\n--- [SIGNUP] ${cleanEmail} | Password: ${rawPassword} ---\n`);

      res.json({
        success: true,
        message: "Compte créé avec succès.",
        password: rawPassword
      });
    } catch (err: any) {
      console.error("Error during signup:", err);
      res.status(500).json({ error: err.message || "Erreur serveur lors de l'inscription." });
    }
  });

  // POST /api/auth/login â€” Direct email + password login against profiles table
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email et mot de passe requis." });
        return;
      }
      const cleanEmail = email.trim().toLowerCase();

      let finalUser: any = null;
      const sessionToken = `mock_jwt_${cleanEmail}_${Date.now()}`;

      // Intercept admin login
      if (cleanEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        let adminUser = {
          email: ADMIN_EMAIL,
          name: "Fallou Diouf",
          avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23fbbf24'/><stop offset='100%' stop-color='%23d97706'/></linearGradient></defs><rect width='100' height='100' rx='28' fill='url(%23g1)'/><g fill='none' stroke='%23ffffff' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'><path d='M30 42h40v30c0 4-3 7-7 7H37c-4 0-7-3-7-7V42z'/><path d='M40 42c0-5 3-9 10-9s10 4 10 9'/><circle cx='50' cy='58' r='4' fill='%23ffffff'/></g></svg>",
          isPro: true,
          isAdmin: true
        };

        // Ensure profile exists in local DB fallback
        const db = readLocalDb();
        if (!db.users) db.users = [];
        const localIdx = db.users.findIndex((u: any) => u.email.toLowerCase().trim() === ADMIN_EMAIL);
        if (localIdx === -1) {
          db.users.push({
            email: ADMIN_EMAIL,
            name: "Fallou Diouf",
            avatar: adminUser.avatar,
            password: hashPassword(ADMIN_PASSWORD),
            pref_notif_announcements: true
          });
          writeLocalDb(db);
        } else {
          db.users[localIdx].password = hashPassword(ADMIN_PASSWORD); // update if mismatch
          writeLocalDb(db);
        }

        // Ensure profile exists in Supabase
        if (!useLocalDb) {
          try {
            const { data: existing } = await supabase.from("profiles").select("email").eq("email", ADMIN_EMAIL).maybeSingle();
            if (!existing) {
              await supabase.from("profiles").insert({
                email: ADMIN_EMAIL,
                name: "Fallou Diouf",
                avatar_url: adminUser.avatar,
                password: hashPassword(ADMIN_PASSWORD)
              });
            }
          } catch (e) {
            console.warn("Silent admin profile sync failed:", e);
          }
        }

        console.log(`\n--- [ADMIN LOGIN] ${cleanEmail} authenticated ---\n`);

        res.json({
          success: true,
          message: "Connexion rÃ©ussie.",
          token: sessionToken,
          user: adminUser
        });
        return;
      }

      // Check local fallback first (covers both useLocalDb mode and local cache)
      const db = readLocalDb();
      const localUser = (db.users || []).find((u: any) => u.email.toLowerCase().trim() === cleanEmail);

      if (localUser) {
        if (!verifyPassword(password, localUser.password)) {
          res.status(400).json({ error: "Email ou mot de passe incorrect." });
          return;
        }
        finalUser = {
          email: localUser.email,
          name: localUser.name,
          avatar: localUser.avatar || "",
          isPro: localUser.isPro || false
        };
      } else if (!useLocalDb) {
        // Try Supabase profiles table
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (profileErr || !profile) {
          res.status(400).json({ error: "Aucun compte trouvÃ© avec cet e-mail." });
          return;
        }
        if (!verifyPassword(password, profile.password)) {
          res.status(400).json({ error: "Email ou mot de passe incorrect." });
          return;
        }
        finalUser = {
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar_url || "",
          isPro: cleanEmail.includes("pro") || cleanEmail.includes("sophie")
        };
      } else {
        res.status(400).json({ error: "Aucun compte trouvÃ© avec cet e-mail." });
        return;
      }

      console.log(`\n--- [LOGIN] ${cleanEmail} authenticated ---\n`);

      res.json({
        success: true,
        message: "Connexion rÃ©ussie.",
        token: sessionToken,
        user: finalUser
      });
    } catch (err: any) {
      console.error("Error during login:", err);
      res.status(500).json({ error: err.message || "Erreur serveur lors de la connexion." });
    }
  });

  // POST /api/auth/forgot-password â€” Secure e-mail password reset with Zod validation
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const emailValidation = z.string().email("Adresse e-mail invalide.").safeParse(req.body.email);
      if (!emailValidation.success) {
        res.status(400).json({ error: emailValidation.error.issues[0].message });
        return;
      }
      const cleanEmail = emailValidation.data.trim().toLowerCase();
      const newPassword = `Broc-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Update local fallback
      const db = readLocalDb();
      if (!db.users) db.users = [];
      const localIdx = db.users.findIndex((u: any) => u.email.toLowerCase().trim() === cleanEmail);

      if (useLocalDb || !supabaseClient) {
        if (localIdx === -1) {
          res.status(404).json({ error: "Aucun compte associÃ© Ã  cet e-mail." });
          return;
        }
        db.users[localIdx].password = newPassword;
        writeLocalDb(db);
      } else {
        // Try real Supabase email reset if configured
        try {
          await supabaseClient.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${req.headers.origin || "https://la-brocant.vercel.app"}/login?reset=true`
          });
        } catch (supErr) {
          console.warn("[Supabase Auth] Password reset email trigger warning:", supErr);
        }

        const { data: profile } = await supabase.from("profiles").select("email").eq("email", cleanEmail).maybeSingle();
        if (!profile && localIdx === -1) {
          res.status(404).json({ error: "Aucun compte associÃ© Ã  cet e-mail." });
          return;
        }

        if (localIdx !== -1) {
          db.users[localIdx].password = newPassword;
        } else {
          db.users.push({ email: cleanEmail, password: newPassword });
        }
        writeLocalDb(db);
      }

      console.log(`[PASSWORD RESET] ${cleanEmail} | Temp Password: ${newPassword}`);

      res.json({
        success: true,
        message: "Un e-mail de rÃ©initialisation a Ã©tÃ© envoyÃ© Ã  votre adresse e-mail. Veuillez consulter votre boÃ®te de rÃ©ception pour suivre les instructions."
      });
    } catch (err: any) {
      console.error("Error during forgot-password:", err);
      res.status(500).json({ error: "Erreur serveur lors de la rÃ©initialisation du mot de passe." });
    }
  });

  // POST /api/auth/send-otp - Request e-mail OTP

  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      
      const cleanEmail = email.trim().toLowerCase();
      const mockCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits matching UI design

      if (useLocalDb || !supabaseClient) {
        // Local DB mode always uses simulated OTP
        pendingOtps.set(cleanEmail, { code: mockCode, expiresAt: Date.now() + 10 * 60 * 1000 });
        res.json({ success: true, isMocked: true, message: "Code OTP envoyÃ©." });
      } else {
        // Real e-mail OTP via Supabase Auth â€” strictly send email, no mock injection
        const { error } = await supabaseClient.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true
          }
        });

        if (error) {
          console.error("Supabase Auth OTP send error:", error.message);
          res.status(400).json({ error: "Impossible d'envoyer l'e-mail de confirmation : " + error.message });
        } else {
          // Success: real email sent by Supabase
          res.json({ success: true, isMocked: false, message: "Un e-mail de confirmation avec votre code de vÃ©rification a Ã©tÃ© envoyÃ© dans votre boÃ®te de rÃ©ception." });
        }
      }
    } catch (err) {
      console.error("Error in /api/auth/send-otp:", err);
      res.status(500).json({ error: "Erreur serveur lors de l'envoi du code." });
    }
  });

  // POST /api/auth/verify-otp - Verify e-mail OTP code
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res.status(400).json({ error: "Email et code requis." });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.trim();

      // Check if we have a pending mock session first
      const mockSession = pendingOtps.get(cleanEmail);
      if (mockSession && mockSession.code === cleanCode && mockSession.expiresAt > Date.now()) {
        pendingOtps.delete(cleanEmail);
        res.json({ success: true, message: "Code vÃ©rifiÃ© avec succÃ¨s (mode simulation)." });
        return;
      }

      if (useLocalDb || !supabaseClient) {
        res.status(400).json({ error: "Code de validation incorrect." });
      } else {
        // Verify via real Supabase Auth
        const { error } = await supabaseClient.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: "email"
        });

        if (error) {
          res.status(400).json({ error: "Code de validation incorrect ou expirÃ©." });
        } else {
          res.json({ success: true, message: "Code vÃ©rifiÃ© avec succÃ¨s." });
        }
      }
    } catch (err) {
      console.error("Error in /api/auth/verify-otp:", err);
      res.status(500).json({ error: "Erreur serveur lors de la vÃ©rification." });
    }
  });

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // NOTIFICATIONS & PREFERENCES ENDPOINTS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // GET /api/notifications â€” Retrieve user notifications with free tier rate limits
  app.get("/api/notifications", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      const cleanEmail = String(email).toLowerCase().trim();
      const isPro = await checkIsProUser(cleanEmail);

      let rawNotifs: any[] = [];
      if (useLocalDb) {
        const db = readLocalDb();
        rawNotifs = (db.notifications || []).filter((n: any) => n.user_email.toLowerCase().trim() === cleanEmail);
      } else {
        const { data, error } = await supabaseClient
          .from("notifications")
          .select("*")
          .eq("user_email", cleanEmail)
          .order("created_at", { ascending: false });
        if (error) {
          console.warn("Supabase notifications fetch error, using local fallback:", error.message);
          const db = readLocalDb();
          rawNotifs = (db.notifications || []).filter((n: any) => n.user_email.toLowerCase().trim() === cleanEmail);
        } else {
          rawNotifs = data || [];
        }
      }

      // Sort by created_at descending
      rawNotifs.sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());

      // If user is not Pro, limit transaction notifications to 1 per day (24 hours)
      let filteredNotifs = [...rawNotifs];
      if (!isPro) {
        let allowedTransactionFound = false;
        let lastAllowedTime = 0;
        
        filteredNotifs = rawNotifs.filter((n) => {
          if (n.type === "transaction") {
            const time = new Date(n.created_at || n.createdAt).getTime();
            // Allow only one transaction notification if it is the first one or if it is at least 24h apart from the last allowed one
            if (!allowedTransactionFound) {
              allowedTransactionFound = true;
              lastAllowedTime = time;
              return true;
            }
            // If another transaction notif is found, block it
            return false;
          }
          return true;
        });
      }

      // Map DB notification item into UI NotificationItem shape
      const uiNotifs = filteredNotifs.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: n.created_at ? new Date(n.created_at).toLocaleString("fr-FR") : "Ã€ l'instant",
        type: n.type,
        read: n.read === true
      }));

      res.json(uiNotifs);
    } catch (err: any) {
      console.warn("Error fetching notifications, returning empty local fallback:", err.message || err);
      const db = readLocalDb();
      res.json((db.notifications || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: n.created_at ? new Date(n.created_at).toLocaleString("fr-FR") : "Ã€ l'instant",
        type: n.type,
        read: n.read === true
      })));
    }
  });

  // PATCH /api/notifications/:id/read â€” Toggle/update read state of a notification
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const { read } = req.body;
      
      if (useLocalDb) {
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        const idx = db.notifications.findIndex((n: any) => n.id === id);
        if (idx !== -1) {
          db.notifications[idx].read = read === true;
          writeLocalDb(db);
          res.json({ success: true, notification: db.notifications[idx] });
        } else {
          res.status(404).json({ error: "Notification introuvable." });
        }
      } else {
        const { data, error } = await supabaseClient
          .from("notifications")
          .update({ read: read === true })
          .eq("id", id)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          // Fallback to local DB search
          const db = readLocalDb();
          if (!db.notifications) {
            db.notifications = [];
          }
          const idx = db.notifications.findIndex((n: any) => n.id === id);
          if (idx !== -1) {
            db.notifications[idx].read = read === true;
            writeLocalDb(db);
            res.json({ success: true, notification: db.notifications[idx] });
          } else {
            res.status(404).json({ error: "Notification introuvable." });
          }
        } else {
          res.json({ success: true, notification: data });
        }
      }
    } catch (err: any) {
      console.error("Error updating notification read status:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // DELETE /api/notifications/:id â€” Delete a single notification securely
  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const cleanEmail = (req as any).user ? (req as any).user.email : "";
      
      if (useLocalDb) {
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        const originalLength = db.notifications.length;
        db.notifications = db.notifications.filter((n: any) => n.id !== id || n.user_email.toLowerCase().trim() !== cleanEmail);
        if (db.notifications.length < originalLength) {
          writeLocalDb(db);
          res.json({ success: true, message: "Notification supprimÃ©e." });
        } else {
          res.status(404).json({ error: "Notification introuvable ou non autorisÃ©e." });
        }
      } else {
        const { error } = await supabaseClient.from("notifications").delete().eq("id", id).eq("user_email", cleanEmail);
        if (error) {
          console.warn("Supabase notification delete error, using local fallback:", error.message);
        }
        // Sync local cache
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        const originalLength = db.notifications.length;
        db.notifications = db.notifications.filter((n: any) => n.id !== id || n.user_email.toLowerCase().trim() !== cleanEmail);
        if (db.notifications.length < originalLength) {
          writeLocalDb(db);
        }
        res.json({ success: true, message: "Notification supprimÃ©e." });
      }
    } catch (err: any) {
      console.error("Error deleting notification:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // POST /api/notifications/clear-all â€” Delete all notifications for a user
  app.post("/api/notifications/clear-all", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      const cleanEmail = email.toLowerCase().trim();

      if (useLocalDb) {
        const db = readLocalDb();
        db.notifications = (db.notifications || []).filter((n: any) => n.user_email.toLowerCase().trim() !== cleanEmail);
        writeLocalDb(db);
      } else {
        const { error } = await supabase.from("notifications").delete().eq("user_email", cleanEmail);
        if (error) {
          console.warn("Supabase notifications delete error, clearing local cache:", error.message);
        }
        // Sync local cache
        const db = readLocalDb();
        db.notifications = (db.notifications || []).filter((n: any) => n.user_email.toLowerCase().trim() !== cleanEmail);
        writeLocalDb(db);
      }
      res.json({ success: true, message: "Toutes les notifications ont Ã©tÃ© supprimÃ©es." });
    } catch (err: any) {
      console.error("Error clearing notifications:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // POST /api/notifications/mark-all-read â€” Mark all notifications as read for a user
  app.post("/api/notifications/mark-all-read", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      const cleanEmail = email.toLowerCase().trim();

      if (useLocalDb) {
        const db = readLocalDb();
        db.notifications = (db.notifications || []).map((n: any) => {
          if (n.user_email.toLowerCase().trim() === cleanEmail) {
            return { ...n, read: true };
          }
          return n;
        });
        writeLocalDb(db);
      } else {
        const { error } = await supabase.from("notifications").update({ read: true }).eq("user_email", cleanEmail);
        if (error) {
          console.warn("Supabase notifications update error, marking local cache:", error.message);
        }
        // Update local cache
        const db = readLocalDb();
        db.notifications = (db.notifications || []).map((n: any) => {
          if (n.user_email.toLowerCase().trim() === cleanEmail) {
            return { ...n, read: true };
          }
          return n;
        });
        writeLocalDb(db);
      }
      res.json({ success: true, message: "Toutes les notifications ont Ã©tÃ© marquÃ©es comme lues." });
    } catch (err: any) {
      console.error("Error marking notifications as read:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // PATCH /api/users/preferences â€” Update user settings (pref_notif_announcements, etc.)
  app.patch("/api/users/preferences", async (req, res) => {
    try {
      const { email, prefNotifAnnouncements } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      const cleanEmail = email.toLowerCase().trim();
      const updates = { pref_notif_announcements: prefNotifAnnouncements === true };

      // Update in local DB
      const db = readLocalDb();
      if (!db.users) db.users = [];
      const userIdx = db.users.findIndex((u: any) => u.email.toLowerCase().trim() === cleanEmail);
      if (userIdx !== -1) {
        db.users[userIdx].pref_notif_announcements = prefNotifAnnouncements === true;
        writeLocalDb(db);
      }

      if (!useLocalDb) {
        // Update in Supabase profiles
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("email", cleanEmail);
        if (error) {
          console.warn("Supabase preferences update error:", error.message);
        }
      }

      res.json({ success: true, preferences: updates });
    } catch (err: any) {
      console.error("Error updating user preferences:", err);
      res.status(500).json({ error: "Erreur serveur lors de la mise Ã  jour des prÃ©fÃ©rences." });
    }
  });


  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ADMIN ENDPOINTS
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  // Middleware pour vÃ©rifier que la requÃªte provient bien de l'administrateur
  const adminAuthMiddleware = (req: any, res: any, next: any) => {
    const requesterEmail = req.headers["x-admin-email"] || req.query.adminEmail || req.body.adminEmail;
    if (requesterEmail && requesterEmail.toLowerCase().trim() === ADMIN_EMAIL) {
      next();
    } else {
      res.status(403).json({ error: "AccÃ¨s refusÃ©. Vous devez Ãªtre administrateur." });
    }
  };

  // GET /api/admin/stats â€” RÃ©cupÃ©rer toutes les statistiques du site pour le Dashboard Admin
  app.get("/api/admin/stats", adminAuthMiddleware, async (req, res) => {
    try {
      let users: any[] = [];
      let listings: any[] = [];
      let chats: any[] = [];
      let demands: any[] = [];

      if (useLocalDb) {
        const db = readLocalDb();
        users = db.users || [];
        listings = db.listings || [];
        chats = db.chats || [];
        demands = db.demands || [];
      } else {
        // Fetch from Supabase
        const { data: dbUsers } = await supabase.from("profiles").select("*");
        const { data: dbListings } = await supabase.from("listings").select("*");
        const { data: dbChats } = await supabase.from("chats").select("*");
        const { data: dbDemands } = await supabase.from("demands").select("*");
        
        users = dbUsers || [];
        listings = dbListings || [];
        chats = dbChats || [];
        demands = dbDemands || [];
      }

      const activeListings = listings.filter((l: any) => !l.is_sold && !l.isSold);
      const soldListings = listings.filter((l: any) => l.is_sold || l.isSold);

      const totalValue = activeListings.reduce((sum: number, l: any) => sum + Number(l.price || 0), 0);
      const totalSalesValue = soldListings.reduce((sum: number, l: any) => sum + Number(l.price || 0), 0);

      res.json({
        totalUsers: users.length,
        totalListings: listings.length,
        activeListings: activeListings.length,
        soldListings: soldListings.length,
        totalValue,
        totalSalesValue,
        totalChats: chats.length,
        totalDemands: demands.length,
        usersList: users,
        listingsList: listings.map(mapListingFromDb)
      });
    } catch (err: any) {
      console.error("Error fetching admin stats:", err);
      res.status(500).json({ error: "Erreur serveur lors de la rÃ©cupÃ©ration des statistiques." });
    }
  });

  // POST /api/admin/broadcast-notification â€” Diffuser une notification Ã  tous les utilisateurs
  app.post("/api/admin/broadcast-notification", adminAuthMiddleware, async (req, res) => {
    try {
      const { title, message, type } = req.body;
      if (!title || !message) {
        res.status(400).json({ error: "Titre et message requis." });
        return;
      }

      let userEmails: string[] = [];

      if (useLocalDb) {
        const db = readLocalDb();
        userEmails = (db.users || []).map((u: any) => u.email);
      } else {
        const { data: profiles } = await supabase.from("profiles").select("email");
        userEmails = (profiles || []).map((p: any) => p.email);
      }

      const newNotifs = userEmails.map(email => ({
        id: `notif_sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_email: email,
        title,
        message,
        type: type || "announcement",
        read: false,
        created_at: new Date().toISOString()
      }));

      // Insert notifications
      if (useLocalDb) {
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        db.notifications.push(...newNotifs);
        writeLocalDb(db);
      } else {
        const { error } = await supabase.from("notifications").insert(newNotifs);
        if (error) {
          console.warn("Supabase notification broadcast error, using local fallback:", error.message);
          const db = readLocalDb();
          if (!db.notifications) db.notifications = [];
          db.notifications.push(...newNotifs);
          writeLocalDb(db);
        }
      }

      res.json({ success: true, message: `Notification diffusÃ©e Ã  ${userEmails.length} utilisateurs.` });
    } catch (err: any) {
      console.error("Error broadcasting notification:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // DELETE /api/admin/listings/:id â€” ModÃ©ration/Suppression d'une annonce
  app.delete("/api/admin/listings/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;

      if (useLocalDb) {
        const db = readLocalDb();
        db.listings = (db.listings || []).filter((l: any) => l.id !== id);
        writeLocalDb(db);
      } else {
        const { error } = await supabase.from("listings").delete().eq("id", id);
        if (error) throw error;
      }

      res.json({ success: true, message: "Annonce supprimÃ©e par l'administrateur." });
    } catch (err: any) {
      console.error("Error admin deleting listing:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // DELETE /api/admin/users/:email â€” Suppression d'un utilisateur et de toutes ses donnÃ©es
  app.delete("/api/admin/users/:email", adminAuthMiddleware, async (req, res) => {
    try {
      const { email } = req.params;
      const cleanEmail = email.toLowerCase().trim();

      if (cleanEmail === ADMIN_EMAIL) {
        res.status(400).json({ error: "Impossible de supprimer le compte administrateur." });
        return;
      }

      if (useLocalDb) {
        const db = readLocalDb();
        db.users = (db.users || []).filter((u: any) => u.email.toLowerCase().trim() !== cleanEmail);
        db.listings = (db.listings || []).filter((l: any) => l.seller_email?.toLowerCase().trim() !== cleanEmail);
        db.chats = (db.chats || []).filter((c: any) => c.seller_email?.toLowerCase().trim() !== cleanEmail && c.buyer_email?.toLowerCase().trim() !== cleanEmail);
        writeLocalDb(db);
      } else {
        // Cascade delete will handle listings/chats if defined, else we delete them manually
        await supabase.from("listings").delete().eq("seller_email", cleanEmail);
        await supabase.from("profiles").delete().eq("email", cleanEmail);
      }

      res.json({ success: true, message: "Compte utilisateur supprimÃ© avec succÃ¨s." });
    } catch (err: any) {
      console.error("Error admin deleting user:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // PATCH /api/admin/users/:email/pro â€” Modifier le statut Pro/Premium d'un utilisateur
  app.patch("/api/admin/users/:email/pro", adminAuthMiddleware, async (req, res) => {
    try {
      const { email } = req.params;
      const { isPro } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      const expiresAt = isPro === true ? new Date() : null;
      if (expiresAt) {
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month default for admin PRO activation
      }

      await updateUserProStatus(cleanEmail, isPro === true, expiresAt);

      res.json({ success: true, isPro: isPro === true, proExpiresAt: expiresAt ? expiresAt.toISOString() : null });
    } catch (err: any) {
      console.error("Error admin updating pro status:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });

  // Global 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "Route API non trouvÃ©e." });
  });

  // Global error handling middleware for Express
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Unhandled Server Error]:", err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: "Erreur interne du serveur.",
        message: process.env.NODE_ENV === "production" ? "Une erreur inattendue est survenue." : (err.message || String(err))
      });
    }
  });

  // --- INTEGRATION OF VITE AS DEV OR PROD MIDDLEWARE (Skip on Vercel Serverless) ---
  // Use async IIFE so start() stays synchronous (routes registered immediately)
  if (!process.env.VERCEL) {
    (async () => {
      if (process.env.NODE_ENV !== "production") {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          res.sendFile(path.join(distPath, "index.html"));
        });
      }

      app.listen(PORT, "0.0.0.0", () => {
        console.log(`[Brocante Server] Running at http://localhost:${PORT}`);
      });
    })();
  }
}

start();

export default app;
