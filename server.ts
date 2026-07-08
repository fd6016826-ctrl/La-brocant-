import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const localFilename = typeof __filename !== "undefined"
  ? __filename
  : fileURLToPath(new Function("return import.meta.url")());

const localDirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(localFilename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || "";
if (!supabaseUrl || !supabaseKey) {
  console.warn("WARNING: Supabase URL or Secret Key is missing in environment variables.");
}
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// FLAG for local fallback DB
let useLocalDb = false;

// Local JSON DB File Path
const localDbPath = path.join(localDirname, "local_db.json");

// Helper functions for reading/writing local database
function readLocalDb(): { listings: any[]; demands: any[]; chats: any[]; users?: any[] } {
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
      const defaultData = {
        listings: [
          {
            id: "1",
            title: "Enfilade scandinave en teck vintage",
            description: "Superbe enfilade scandinave des années 60 en teck. 3 portes coulissantes et 3 tiroirs. Très bel état général.",
            price: 480,
            category: "Maison & Déco",
            location: "Lyon",
            condition: "Très bon état",
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
            description: "Vendu avec objectif EFS 18-135mm, sacoche de transport, batterie et chargeur. Parfait pour débuter en photographie.",
            price: 550,
            category: "Électronique",
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
            description: "Lot de 10 vinyles rock (Pink Floyd, Led Zeppelin, The Rolling Stones...). Pochettes en bon état, disques sans rayures majeures.",
            price: 120,
            category: "Livres & Culture",
            location: "Bordeaux",
            condition: "Bon état",
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
            title: "Recherche Canapé Togo Ligne Roset",
            description: "Je recherche activement un canapé Togo de chez Ligne Roset, de préférence en velours ou cuir, couleur chaud (orange, marron ou beige). Budget flexible selon l'état.",
            desired_price: 1500,
            quantity: 1,
            size: "3 places ou angle",
            color: "Chaud",
            other_specs: "Authentique avec étiquette",
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
            buyer_name: "Agent Antigravity 🤖",
            last_message_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            messages: [
              {
                id: "msg_1",
                senderEmail: "antigravity@la-brocante.fr",
                senderName: "Agent Antigravity 🤖",
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
          { email: "jean.testeur@gmail.com", name: "Jean Testeur", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" },
          { email: "sophie.b69@gmail.com", name: "Sophie B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" }
        ]
      };
      fs.writeFileSync(localDbPath, JSON.stringify(defaultData, null, 2));
    }
    const data = fs.readFileSync(localDbPath, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.users) {
      parsed.users = [
        { email: "jean.testeur@gmail.com", name: "Jean Testeur", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" },
        { email: "sophie.b69@gmail.com", name: "Sophie B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" }
      ];
      fs.writeFileSync(localDbPath, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (err) {
    console.error("Error reading local_db.json, returning empty structure:", err);
    return { listings: [], demands: [], chats: [], users: [] };
  }
}

function writeLocalDb(data: { listings: any[]; demands: any[]; chats: any[]; users?: any[] }) {
  try {
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to local_db.json:", err);
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
    if (useLocalDb) {
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

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

async function start() {
  // Test Supabase connection
  try {
    console.log("[Brocante] Testing connection to Supabase...");
    const { error } = await supabaseClient.from("listings").select("id").limit(1);
    if (error) {
      console.warn("[Brocante] Supabase check returned error, using local fallback DB:", error);
      useLocalDb = true;
    } else {
      console.log("[Brocante] Connected to Supabase successfully.");
    }
  } catch (e) {
    console.warn("[Brocante] Failed to connect to Supabase, using local fallback DB:", e);
    useLocalDb = true;
  }

  const app = express();

  // Middleware to support file uploading inside JSON requests
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Static directory for uploaded product files
  app.use("/uploads", express.static(UPLOADS_DIR));

  // --- API DEFINITIONS ---

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
      console.error("Error loading listings from Supabase:", err);
      res.status(500).json({ error: "Impossible de charger les annonces." });
    }
  });

  // 2. Create standard Listing with local file conversion
  app.post("/api/listings", async (req, res) => {
    try {
      const {
        title,
        description,
        price,
        category,
        location,
        condition,
        imageUrl,
        videoUrl,
        sellerName,
        sellerEmail,
        sellerPhone,
        size,
        color,
        quantity,
        additionalImages,
        isSponsored
      } = req.body;

      if (!title || !price || !category || !sellerName || !sellerEmail) {
        res.status(400).json({ error: "Veuillez remplir les informations requises." });
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

          fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
          finalImageUrl = `/uploads/${fileName}`;
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

          fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
          finalVideoUrl = `/uploads/${fileName}`;
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

              fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
              return `/uploads/${fileName}`;
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
        condition: condition || "Bon état",
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
        size: size || "",
        color: color || "",
        quantity: quantity ? Number(quantity) : 1,
        additionalImages: finalAdditionalImages,
        sellerName,
        sellerEmail: sellerEmail.toLowerCase().trim(),
        sellerPhone: sellerPhone || "Non renseigné",
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
      res.status(500).json({ error: "Erreur lors de la création de l'annonce." });
    }
  });

  // --- API FOR BUYER DEMANDS & ANNOUNCEMENTS ---

  // Get all Buyer Demands/Announcements
  app.get("/api/demands", async (req, res) => {
    try {
      const { data: dbDemands, error } = await supabase.from("demands").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      res.json((dbDemands || []).map(mapDemandFromDb));
    } catch (err) {
      console.error("Error loading demands from Supabase:", err);
      res.status(500).json({ error: "Impossible de charger les demandes d'achat." });
    }
  });

  // Create a new Buyer Demand/Announcement
  app.post("/api/demands", async (req, res) => {
    try {
      const {
        title,
        description,
        desiredPrice,
        quantity,
        size,
        color,
        otherSpecs,
        imageUrl,
        buyerName,
        buyerEmail
      } = req.body;

      if (!title || !desiredPrice || !buyerName || !buyerEmail) {
        res.status(400).json({ error: "Champs obligatoires manquants." });
        return;
      }

      const id = `demand_${Date.now()}`;
      let finalImageUrl = imageUrl || "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800"; // default fallback placeholder

      // Detect and handle base64 image data url
      if (imageUrl && imageUrl.startsWith("data:image/")) {
        const match = imageUrl.match(/^data:image\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = imageUrl.replace(/^data:image\/\w+;base64,/, "");
          const fileName = `demande_${id}.${fileExtension}`;
          const filePath = path.join(UPLOADS_DIR, fileName);

          fs.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
          finalImageUrl = `/uploads/${fileName}`;
        }
      }

      const newDemand = {
        id,
        title,
        description: description || "Je recherche activement cet article.",
        desiredPrice: Number(desiredPrice),
        quantity: quantity ? Number(quantity) : 1,
        size: size || "N/A",
        color: color || "N/A",
        otherSpecs: otherSpecs || "Aucune spécification supplémentaire.",
        imageUrl: finalImageUrl,
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerName,
        createdAt: new Date().toISOString()
      };

      const dbDemand = mapDemandToDb(newDemand);
      const { data, error } = await supabase.from("demands").insert([dbDemand]).select().single();
      if (error) throw error;

      res.status(201).json(mapDemandFromDb(data));
    } catch (err) {
      console.error("Error creating buyer demand in Supabase:", err);
      res.status(500).json({ error: "Erreur lors du dépôt de la demande d'achat." });
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

          res.json(mapListingFromDb(insertedDb));
          return;
        }
      } else {
        const { data: updatedDb, error: updateErr } = await supabase.from("listings").update({
          seller_confirmed: true
        }).eq("id", id).select().single();
        if (updateErr) throw updateErr;

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

      res.json({ success: true, message: "Annonce supprimée avec succès." });
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
      return `🤖 *[Agent Antigravity en mode simulé]* Bonjour ! Pour activer mes vraies capacités d'agent de négociation autonome (Antigravity-preview), veuillez ajouter votre clé API dans les secrets d'AI Studio sous la variable **GEMINI_API_KEY**.\n\nEn attendant, voici une réponse simulée : "Votre article m'intéresse vivement pour un achat immédiat à ${safeListing.price} € !"`;
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
Vous êtes "Agent Antigravity 🤖", un agent intelligent de négociation intégré dans une application française de brocante en ligne nommée "La Brocante".
Votre but est de négocier avec un utilisateur humain de manière polie, vivante, réaliste et typiquement française (avec un ton chaleureux de brocanteur ou d'acheteur malin).

Contexte de l'annonce :
- Titre : ${safeListing.title}
- Catégorie : ${safeListing.category}
- Prix initial : ${safeListing.price} €
- État de l'objet : ${safeListing.condition}
- Localisation : ${safeListing.location}
- Description de l'objet : ${safeListing.description}

Votre rôle actuel : vous êtes le **${agentRole}** de cet objet (situé à ${safeListing.location}).
L'utilisateur est le **${userRole}** (son nom de compte est ${userName}).

Consignes de comportement :
1. Saluez chaleureusement s'il s'agit du tout premier message de discussion. Des formules typiques comme "Salut !", "Fascinant objet !", "Bonjour, excellente affaire !" s'intègrent admirablement.
2. Négociez d'une manière raisonnable et amusante. Si vous êtes acheteur, vous pouvez tenter de proposer un prix légèrement inférieur de 10-20% pour marchander, ou poser des questions sur l'état de l'objet. Si vous êtes vendeur, défendez la quality de votre objet mais restez ouvert à une petite baisse si l'acheteur négocie bien.
3. Si la transaction ou un accord est obtenu, invitez l'utilisateur à cliquer sur le bouton de double-confirmation d'achat direct "Confirmer mon achat" ou "Valider la vente" proposé dans l'interface de conversation.
4. Répondez de manière concise et directe en Français (maximum 3-4 courtes phrases) pour garder le tchat dynamique. N'insérez jamais de jargon technique d'IA ou de métadonnées de conteneur d'exécution Bash/Linux (par exemple, pas de mention d'Antigravity Agent, d'environnement de bac à salle ou d'API). Restez purement dans la peau du brocanteur ou acheteur.

Historique récent de la discussion :
${conversationHistory}

Dernier message reçu de l'utilisateur : "${promptText}"

Générez votre réponse directe en tant qu'Agent Antigravity 🤖 :
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
            return `🤖 *[Agent Antigravity]* Bonjour ! Des limites ou quotas temporaires sur l'API Gemini ne permettent pas d'obtenir une réponse de l'I.A. en direct pour le moment.\n\nEn tant que vendeur, je vous propose cet objet vintage exceptionnel au prix convenu de ${listing.price} € ! L'achat direct est entièrement ouvert.`;
          } else {
            return `🤖 *[Agent Antigravity]* Bonjour ! Des limites ou quotas temporaires sur l'API Gemini ne permettent pas d'obtenir une réponse de l'I.A. en direct pour le moment.\n\nEn tant qu'acheteur intéressé par "${listing.title}", je vous propose un accord amical. Validons l'achat direct !`;
          }
        }
      }

      return "Je n'ai pas pu formuler de réponse à l'instant, mais je suis là pour négocier !";

    } catch (err: any) {
      console.error("Error calling Antigravity Agent:", err);
      return `🤖 Désolé, j'ai rencontré un problème technique en contactant mon cerveau gyroscopique Antigravity : ${err.message || err}. Pouvez-vous répéter ?`;
    }
  }

  // 6. Post message or Create Chat
  app.post("/api/chats", async (req, res) => {
    try {
      const { listingId, text, senderEmail, senderName, recipientEmail, recipientName, buyerEmail, buyerName, lastImageUrl, requestedQuantity } = req.body;

      if (!listingId || !senderEmail || !senderName) {
        res.status(400).json({ error: "Données de message incomplètes." });
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
            senderName: isAntigravityBuyer ? "Chasseur Antigravity 🤖" : "Agent Antigravity 🤖",
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

  // GET /api/users - Fetch users from database
  app.get("/api/users", async (req, res) => {
    try {
      if (useLocalDb) {
        const db = readLocalDb();
        res.json(db.users || []);
      } else {
        const { data, error } = await supabase.from("profiles").select("*");
        if (error || !data || data.length === 0) {
          res.json([
            { email: "jean.testeur@gmail.com", name: "Jean Testeur", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop" },
            { email: "sophie.b69@gmail.com", name: "Sophie B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" }
          ]);
        } else {
          res.json(data.map((u: any) => ({ email: u.email, name: u.name, avatar: u.avatar_url || u.avatar })));
        }
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

  // --- INTEGRATION OF VITE AS DEV OR PROD MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
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
}

start();
