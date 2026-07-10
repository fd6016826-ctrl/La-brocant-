"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_url = require("url");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_supabase_js = require("@supabase/supabase-js");
var import_meta = {};
import_dotenv.default.config();
var localFilename = typeof __filename !== "undefined" ? __filename : (0, import_url.fileURLToPath)(import_meta.url);
var localDirname = typeof __dirname !== "undefined" ? __dirname : import_path.default.dirname(localFilename);
var supabaseUrl = process.env.SUPABASE_URL || "";
var supabaseKey = process.env.SUPABASE_SECRET_KEY || "";
if (!supabaseUrl || !supabaseKey) {
  console.warn("WARNING: Supabase URL or Secret Key is missing in environment variables.");
}
var supabaseClient = (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey);
var ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "fd6016826@gmail.com").trim().toLowerCase();
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin_temp_change_me";
var pendingOtps = /* @__PURE__ */ new Map();
var useLocalDb = false;
var localDbPath = import_path.default.join(localDirname, "local_db.json");
function readLocalDb() {
  try {
    let needsInitialization = false;
    if (!import_fs.default.existsSync(localDbPath)) {
      needsInitialization = true;
    } else {
      const currentContent = import_fs.default.readFileSync(localDbPath, "utf-8").trim();
      if (currentContent === "") {
        needsInitialization = true;
      } else {
        const parsed2 = JSON.parse(currentContent);
        if (!parsed2.listings || parsed2.listings.length === 0) {
          needsInitialization = true;
        }
      }
    }
    if (needsInitialization) {
      const defaultData = {
        notifications: [],
        listings: [
          {
            id: "1",
            title: "Enfilade scandinave en teck vintage",
            description: "Superbe enfilade scandinave des ann\xE9es 60 en teck. 3 portes coulissantes et 3 tiroirs. Tr\xE8s bel \xE9tat g\xE9n\xE9ral.",
            price: 480,
            category: "Maison & D\xE9co",
            location: "Lyon",
            condition: "Tr\xE8s bon \xE9tat",
            image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&auto=format&fit=crop&q=80",
            video_url: "",
            size: "180x45x75 cm",
            color: "Miel / Teck",
            quantity: 1,
            additional_images: [],
            seller_name: "Marc Dupuis",
            seller_email: "marc.dupuis@outlook.fr",
            seller_phone: "06 12 34 56 78",
            created_at: new Date(Date.now() - 36e5 * 2).toISOString(),
            is_sold: false,
            is_sponsored: true
          },
          {
            id: "2",
            title: "Appareil photo reflex Canon EOS 80D",
            description: "Vendu avec objectif EFS 18-135mm, sacoche de transport, batterie et chargeur. Parfait pour d\xE9buter en photographie.",
            price: 550,
            category: "\xC9lectronique",
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
            created_at: new Date(Date.now() - 36e5 * 12).toISOString(),
            is_sold: false,
            is_sponsored: false
          },
          {
            id: "3",
            title: "Collection de Vinyles Rock Classique (x10)",
            description: "Lot de 10 vinyles rock (Pink Floyd, Led Zeppelin, The Rolling Stones...). Pochettes en bon \xE9tat, disques sans rayures majeures.",
            price: 120,
            category: "Livres & Culture",
            location: "Bordeaux",
            condition: "Bon \xE9tat",
            image_url: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&auto=format&fit=crop&q=80",
            video_url: "",
            size: "12 pouces",
            color: "Noir",
            quantity: 1,
            additional_images: [],
            seller_name: "Jean Testeur",
            seller_email: "jean.testeur@gmail.com",
            seller_phone: "07 11 22 33 44",
            created_at: new Date(Date.now() - 36e5 * 24).toISOString(),
            is_sold: false,
            is_sponsored: false
          }
        ],
        demands: [
          {
            id: "demand_1",
            title: "Recherche Canap\xE9 Togo Ligne Roset",
            description: "Je recherche activement un canap\xE9 Togo de chez Ligne Roset, de pr\xE9f\xE9rence en velours ou cuir, couleur chaud (orange, marron ou beige). Budget flexible selon l'\xE9tat.",
            desired_price: 1500,
            quantity: 1,
            size: "3 places ou angle",
            color: "Chaud",
            other_specs: "Authentique avec \xE9tiquette",
            image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
            buyer_email: "pierre.m@gmail.com",
            buyer_name: "Pierre M.",
            created_at: new Date(Date.now() - 36e5 * 4).toISOString()
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
            buyer_name: "Agent Antigravity \u{1F916}",
            last_message_at: new Date(Date.now() - 36e5 * 2).toISOString(),
            messages: [
              {
                id: "msg_1",
                senderEmail: "antigravity@la-brocante.fr",
                senderName: "Agent Antigravity \u{1F916}",
                text: "Bonjour Marc ! Votre enfilade scandinave en teck est vraiment magnifique. Est-elle toujours disponible ?",
                createdAt: new Date(Date.now() - 36e5 * 2 - 6e4).toISOString(),
                isRead: true
              },
              {
                id: "msg_2",
                senderEmail: "marc.dupuis@outlook.fr",
                senderName: "Marc Dupuis",
                text: "Bonjour ! Oui, elle est toujours disponible et visible sur Lyon 3e.",
                createdAt: new Date(Date.now() - 36e5 * 2).toISOString(),
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
      import_fs.default.writeFileSync(localDbPath, JSON.stringify(defaultData, null, 2));
    }
    const data = import_fs.default.readFileSync(localDbPath, "utf-8");
    const parsed = JSON.parse(data);
    let dbUpdated = false;
    if (!parsed.users) {
      parsed.users = [
        { email: "jean.testeur@gmail.com", name: "Jean Testeur", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop", password: "123456", pref_notif_announcements: true },
        { email: "sophie.b69@gmail.com", name: "Sophie B.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop", password: "123456", pref_notif_announcements: true }
      ];
      dbUpdated = true;
    }
    if (!parsed.notifications) {
      parsed.notifications = [];
      dbUpdated = true;
    }
    if (dbUpdated) {
      import_fs.default.writeFileSync(localDbPath, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (err) {
    console.error("Error reading local_db.json, returning empty structure:", err);
    return { listings: [], demands: [], chats: [], users: [], notifications: [] };
  }
}
function writeLocalDb(data) {
  try {
    import_fs.default.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to local_db.json:", err);
  }
}
async function checkIsProUser(email) {
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail.includes("pro") || cleanEmail.includes("sophie")) {
    return true;
  }
  try {
    if (useLocalDb) {
      const db = readLocalDb();
      const user = (db.users || []).find((u) => u.email.toLowerCase().trim() === cleanEmail);
      return !!(user && user.isPro);
    } else {
      const { data: profile } = await supabaseClient.from("profiles").select("email").eq("email", cleanEmail).maybeSingle();
      const db = readLocalDb();
      const user = (db.users || []).find((u) => u.email.toLowerCase().trim() === cleanEmail);
      return !!(user && user.isPro);
    }
  } catch (e) {
    return false;
  }
}
async function createNotification(userEmail, title, message, type) {
  try {
    const cleanEmail = userEmail.toLowerCase().trim();
    if (type === "transaction") {
      const isPro = await checkIsProUser(cleanEmail);
      if (!isPro) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
        if (useLocalDb) {
          const db = readLocalDb();
          const list = db.notifications || [];
          const hasRecent = list.some(
            (n) => n.user_email.toLowerCase().trim() === cleanEmail && n.type === "transaction" && n.created_at >= oneDayAgo
          );
          if (hasRecent) {
            console.log(`[Notification Limit] Skip transaction notification for free user: ${cleanEmail}`);
            return;
          }
        } else {
          const { data: recent } = await supabaseClient.from("notifications").select("id").eq("user_email", cleanEmail).eq("type", "transaction").gte("created_at", oneDayAgo).limit(1);
          if (recent && recent.length > 0) {
            console.log(`[Notification Limit] Skip transaction notification for free user (Supabase): ${cleanEmail}`);
            return;
          }
        }
      }
    }
    const notifObj = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
      user_email: cleanEmail,
      title,
      message,
      type,
      read: false,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (useLocalDb) {
      const db = readLocalDb();
      if (!db.notifications) db.notifications = [];
      db.notifications.push(notifObj);
      writeLocalDb(db);
    } else {
      const { error } = await supabaseClient.from("notifications").insert([notifObj]);
      if (error) {
        console.error("Error inserting notification to Supabase:", error);
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
var LocalQueryBuilder = class {
  tableName;
  operation = "select";
  payload = null;
  filters = [];
  limitCount = null;
  singleResult = false;
  maybeSingleResult = false;
  orderField = null;
  orderAscending = false;
  constructor(tableName) {
    this.tableName = tableName;
  }
  select(fields) {
    if (this.operation === "select") {
      this.operation = "select";
    }
    return this;
  }
  insert(rows) {
    this.operation = "insert";
    this.payload = rows;
    return this;
  }
  update(fields) {
    this.operation = "update";
    this.payload = fields;
    return this;
  }
  delete() {
    this.operation = "delete";
    return this;
  }
  eq(column, value) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }
  ilike(column, pattern) {
    this.filters.push({ type: "ilike", column, pattern });
    return this;
  }
  or(filterString) {
    this.filters.push({ type: "or", value: filterString });
    return this;
  }
  in(column, values) {
    this.filters.push({ type: "in", column, values });
    return this;
  }
  gte(column, value) {
    this.filters.push({ type: "gte", column, value });
    return this;
  }
  lte(column, value) {
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
  order(column, options) {
    this.orderField = column;
    this.orderAscending = options?.ascending ?? false;
    return this;
  }
  limit(count) {
    this.limitCount = count;
    return this;
  }
  async then(onFulfilled, onRejected) {
    try {
      const db = readLocalDb();
      let table = db[this.tableName] || [];
      let resultData = null;
      let error = null;
      if (this.operation === "select") {
        let filtered = [...table];
        for (const filter of this.filters) {
          if (filter.type === "eq") {
            filtered = filtered.filter((item) => {
              const itemVal = item[filter.column];
              const filterVal = filter.value;
              if (typeof itemVal === "string" && typeof filterVal === "string") {
                return itemVal.toLowerCase().trim() === filterVal.toLowerCase().trim();
              }
              return itemVal === filterVal;
            });
          } else if (filter.type === "ilike") {
            const pat = filter.pattern.toLowerCase().replace(/%/g, "");
            filtered = filtered.filter((item) => {
              const val = item[filter.column];
              return typeof val === "string" && val.toLowerCase().includes(pat);
            });
          } else if (filter.type === "or") {
            const parts = filter.value.split(",");
            filtered = filtered.filter((item) => {
              return parts.some((part) => {
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
            filtered = filtered.filter((item) => {
              const val = item[filter.column];
              return filter.values.includes(val);
            });
          } else if (filter.type === "gte") {
            filtered = filtered.filter((item) => Number(item[filter.column]) >= Number(filter.value));
          } else if (filter.type === "lte") {
            filtered = filtered.filter((item) => Number(item[filter.column]) <= Number(filter.value));
          }
        }
        if (this.orderField) {
          filtered.sort((a, b) => {
            const valA = a[this.orderField];
            const valB = b[this.orderField];
            if (valA < valB) return this.orderAscending ? -1 : 1;
            if (valA > valB) return this.orderAscending ? 1 : -1;
            return 0;
          });
        }
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
        db[this.tableName] = table;
        writeLocalDb(db);
        if (this.singleResult || this.maybeSingleResult) {
          resultData = newRows[0];
        } else {
          resultData = newRows;
        }
      } else if (this.operation === "update") {
        let updatedCount = 0;
        let lastUpdated = null;
        table = table.map((item) => {
          let match = true;
          for (const filter of this.filters) {
            if (filter.type === "eq") {
              const itemVal = item[filter.column];
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
        db[this.tableName] = table;
        writeLocalDb(db);
        if (this.singleResult || this.maybeSingleResult) {
          resultData = lastUpdated;
        } else {
          resultData = table;
        }
      } else if (this.operation === "delete") {
        const deletedItems = [];
        table = table.filter((item) => {
          let match = true;
          for (const filter of this.filters) {
            if (filter.type === "eq") {
              const itemVal = item[filter.column];
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
        db[this.tableName] = table;
        writeLocalDb(db);
        resultData = deletedItems;
      }
      const res = { data: resultData, error };
      if (onFulfilled) {
        return Promise.resolve(onFulfilled(res));
      }
      return Promise.resolve(res);
    } catch (e) {
      if (onRejected) {
        return Promise.resolve(onRejected(e));
      }
      return Promise.reject(e);
    }
  }
};
var supabase = {
  from(tableName) {
    if (useLocalDb) {
      return new LocalQueryBuilder(tableName);
    }
    return supabaseClient.from(tableName);
  }
};
function mapListingToDb(listing) {
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
function mapListingFromDb(dbListing) {
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
function mapDemandToDb(demand) {
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
function mapDemandFromDb(dbDemand) {
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
function mapChatToDb(chat) {
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
function mapChatFromDb(dbChat) {
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
var PORT = 3e3;
var UPLOADS_DIR = import_path.default.join(localDirname, "uploads");
try {
  import_fs.default.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (err) {
  console.warn("Could not create uploads directory (expected on read-only serverless platforms like Vercel):", err);
}
var app = (0, import_express.default)();
var supabaseChecked = false;
async function checkSupabaseConnection() {
  if (supabaseChecked) return;
  try {
    const { error } = await supabaseClient.from("profiles").select("email").limit(1);
    if (error) {
      console.warn("[Brocante] \xC9chec de la connexion Supabase (profiles absent). Fallback local actif.");
      useLocalDb = true;
    } else {
      console.log("[Brocante] Connexion \xE0 Supabase r\xE9ussie ! Base de donn\xE9es en ligne active.");
      useLocalDb = false;
    }
  } catch (err) {
    console.warn("[Brocante] Exception lors du test de connexion Supabase. Fallback local actif. Erreur :", err.message || err);
    useLocalDb = true;
  }
  supabaseChecked = true;
}
app.use(async (req, res, next) => {
  await checkSupabaseConnection();
  next();
});
app.use(import_express.default.json({ limit: "15mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "15mb" }));
app.use("/uploads", import_express.default.static(UPLOADS_DIR));
async function start() {
  app.get("/api/listings", async (req, res) => {
    try {
      const { q, category, minPrice, maxPrice, location, condition, sellerEmail } = req.query;
      let query = supabase.from("listings").select("*");
      if (category && category !== "Toutes") {
        query = query.eq("category", category);
      }
      if (minPrice) {
        const min = Number(minPrice);
        if (!isNaN(min)) {
          query = query.gte("price", min);
        }
      }
      if (maxPrice) {
        const max = Number(maxPrice);
        if (!isNaN(max)) {
          query = query.lte("price", max);
        }
      }
      if (condition && condition !== "Toutes") {
        query = query.eq("condition", condition);
      }
      if (sellerEmail) {
        query = query.eq("seller_email", String(sellerEmail).toLowerCase().trim());
      }
      let { data: dbListings, error } = await query;
      if (error) throw error;
      let listings = (dbListings || []).map(mapListingFromDb);
      if (q) {
        const queryStr = String(q).toLowerCase().trim();
        listings = listings.filter(
          (item) => item.title.toLowerCase().includes(queryStr) || item.description.toLowerCase().includes(queryStr)
        );
      }
      if (location) {
        const locStr = String(location).toLowerCase().trim();
        listings = listings.filter(
          (item) => item.location.toLowerCase().includes(locStr)
        );
      }
      res.json(listings);
    } catch (err) {
      console.error("Error loading listings from Supabase:", err);
      res.status(500).json({ error: "Impossible de charger les annonces." });
    }
  });
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
      let finalImageUrl = imageUrl || "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800";
      if (imageUrl && imageUrl.startsWith("data:image/")) {
        const match = imageUrl.match(/^data:image\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = imageUrl.replace(/^data:image\/\w+;base64,/, "");
          const fileName = `annonce_${id}.${fileExtension}`;
          const filePath = import_path.default.join(UPLOADS_DIR, fileName);
          import_fs.default.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
          finalImageUrl = `/uploads/${fileName}`;
        }
      }
      let finalVideoUrl = videoUrl || "";
      if (videoUrl && videoUrl.startsWith("data:video/")) {
        const match = videoUrl.match(/^data:video\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = videoUrl.replace(/^data:video\/\w+;base64,/, "");
          const fileName = `video_${id}.${fileExtension}`;
          const filePath = import_path.default.join(UPLOADS_DIR, fileName);
          import_fs.default.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
          finalVideoUrl = `/uploads/${fileName}`;
        }
      }
      let finalAdditionalImages = [];
      if (additionalImages && Array.isArray(additionalImages)) {
        finalAdditionalImages = additionalImages.map((imgUrl, idx) => {
          if (imgUrl && imgUrl.startsWith("data:image/")) {
            const match = imgUrl.match(/^data:image\/(\w+);base64,/);
            if (match) {
              const fileExtension = match[1];
              const base64Content = imgUrl.replace(/^data:image\/\w+;base64,/, "");
              const fileName = `annonce_${id}_extra_${idx}.${fileExtension}`;
              const filePath = import_path.default.join(UPLOADS_DIR, fileName);
              import_fs.default.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
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
        condition: condition || "Bon \xE9tat",
        imageUrl: finalImageUrl,
        videoUrl: finalVideoUrl,
        size: size || "",
        color: color || "",
        quantity: quantity ? Number(quantity) : 1,
        additionalImages: finalAdditionalImages,
        sellerName,
        sellerEmail: sellerEmail.toLowerCase().trim(),
        sellerPhone: sellerPhone || "Non renseign\xE9",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        isSold: false,
        isSponsored: isSponsored === true || isSponsored === "true"
      };
      const dbListing = mapListingToDb(newListing);
      const { data, error } = await supabase.from("listings").insert([dbListing]).select().single();
      if (error) throw error;
      res.status(201).json(mapListingFromDb(data));
    } catch (err) {
      console.error("Error creating listing in Supabase:", err);
      res.status(500).json({ error: "Erreur lors de la cr\xE9ation de l'annonce." });
    }
  });
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
      let finalImageUrl = imageUrl || "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800";
      if (imageUrl && imageUrl.startsWith("data:image/")) {
        const match = imageUrl.match(/^data:image\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = imageUrl.replace(/^data:image\/\w+;base64,/, "");
          const fileName = `demande_${id}.${fileExtension}`;
          const filePath = import_path.default.join(UPLOADS_DIR, fileName);
          import_fs.default.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
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
        otherSpecs: otherSpecs || "Aucune sp\xE9cification suppl\xE9mentaire.",
        imageUrl: finalImageUrl,
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerName,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const dbDemand = mapDemandToDb(newDemand);
      const { data, error } = await supabase.from("demands").insert([dbDemand]).select().single();
      if (error) throw error;
      const bEmailClean = buyerEmail.toLowerCase().trim();
      const notifTitle = "Nouvel avis de recherche !";
      const notifMessage = `${buyerName} recherche activement : "${title}". Peut-\xEAtre avez-vous cet objet chez vous ?`;
      (async () => {
        try {
          let targets = [];
          if (useLocalDb) {
            const db = readLocalDb();
            targets = (db.users || []).filter((u) => u.email.toLowerCase().trim() !== bEmailClean && u.pref_notif_announcements !== false).map((u) => u.email);
          } else {
            const { data: profiles } = await supabaseClient.from("profiles").select("email").neq("email", bEmailClean);
            if (profiles) {
              targets = profiles.map((p) => p.email);
            }
          }
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
      res.status(500).json({ error: "Erreur lors du d\xE9p\xF4t de la demande d'achat." });
    }
  });
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
      const updates = { is_sold: newIsSold };
      if (!newIsSold) {
        updates.buyer_email = "";
        updates.buyer_name = "";
        updates.buyer_confirmed = false;
        updates.seller_confirmed = false;
        if (listing.quantity !== void 0 && listing.quantity <= 0) {
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
        const qty = listing.quantity !== void 0 ? Number(listing.quantity) : 1;
        if (qty > reqQty) {
          await supabase.from("listings").update({
            quantity: qty - reqQty,
            buyer_email: "",
            buyer_name: "",
            buyer_confirmed: false,
            seller_confirmed: false,
            requested_quantity: null
          }).eq("id", id);
          const soldClone = {
            ...listing,
            id: `${listing.id}_sold_${Date.now()}`,
            quantity: reqQty,
            isSold: true,
            buyerEmail: bEmail,
            buyerName: bName,
            buyerConfirmed: true,
            sellerConfirmed: true
          };
          delete soldClone.requestedQuantity;
          const { data: insertedDb, error: insertErr } = await supabase.from("listings").insert([mapListingToDb(soldClone)]).select().single();
          if (insertErr) throw insertErr;
          await createNotification(listing.sellerEmail, "Objet vendu !", `Votre objet "${listing.title}" a \xE9t\xE9 achet\xE9 par ${bName}.`, "transaction");
          await createNotification(bEmail, "Achat finalis\xE9 !", `Votre achat pour "${listing.title}" a \xE9t\xE9 valid\xE9 avec succ\xE8s.`, "transaction");
          res.json(mapListingFromDb(insertedDb));
          return;
        } else {
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
            sellerConfirmed: true
          };
          delete soldClone.requestedQuantity;
          const { data: insertedDb, error: insertErr } = await supabase.from("listings").insert([mapListingToDb(soldClone)]).select().single();
          if (insertErr) throw insertErr;
          await createNotification(listing.sellerEmail, "Objet vendu !", `Votre objet "${listing.title}" a \xE9t\xE9 achet\xE9 par ${bName}. Stock \xE9puis\xE9.`, "transaction");
          await createNotification(bEmail, "Achat finalis\xE9 !", `Votre achat pour "${listing.title}" a \xE9t\xE9 valid\xE9 avec succ\xE8s.`, "transaction");
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
        await createNotification(listing.sellerEmail, "Offre d'achat re\xE7ue !", `${bName} souhaite acheter "${listing.title}". Confirmez la transaction pour finaliser.`, "transaction");
        await createNotification(bEmail, "Demande d'achat enregistr\xE9e !", `Votre demande d'achat pour "${listing.title}" a bien \xE9t\xE9 enregistr\xE9e. En attente de confirmation du vendeur.`, "transaction");
        res.json(mapListingFromDb(updatedDb));
      }
    } catch (err) {
      console.error("Error confirming purchase:", err);
      res.status(500).json({ error: "Erreur lors de la confirmation d'achat." });
    }
  });
  app.post("/api/listings/:id/sell", async (req, res) => {
    try {
      const { id } = req.params;
      const { data: dbListing, error: fetchErr } = await supabase.from("listings").select("*").eq("id", id).single();
      if (fetchErr || !dbListing) {
        res.status(404).json({ error: "Annonce introuvable." });
        return;
      }
      const listing = mapListingFromDb(dbListing);
      const qty = listing.quantity !== void 0 ? Number(listing.quantity) : 1;
      const requestedQuantityVal = listing.requestedQuantity !== void 0 ? Number(listing.requestedQuantity) : 1;
      const bEmail = listing.buyerEmail;
      const bName = listing.buyerName;
      if (bEmail) {
        if (qty > requestedQuantityVal) {
          await supabase.from("listings").update({
            quantity: qty - requestedQuantityVal,
            buyer_email: "",
            buyer_name: "",
            buyer_confirmed: false,
            seller_confirmed: false,
            requested_quantity: null
          }).eq("id", id);
          const soldClone = {
            ...listing,
            id: `${listing.id}_sold_${Date.now()}`,
            quantity: requestedQuantityVal,
            isSold: true,
            buyerEmail: bEmail,
            buyerName: bName,
            buyerConfirmed: true,
            sellerConfirmed: true
          };
          delete soldClone.requestedQuantity;
          const { data: insertedDb, error: insertErr } = await supabase.from("listings").insert([mapListingToDb(soldClone)]).select().single();
          if (insertErr) throw insertErr;
          await createNotification(listing.sellerEmail, "Vente valid\xE9e !", `Votre vente pour "${listing.title}" \xE0 ${bName} a \xE9t\xE9 enregistr\xE9e.`, "transaction");
          await createNotification(bEmail, "Achat valid\xE9 !", `Le vendeur de "${listing.title}" a confirm\xE9 votre achat en mains propres.`, "transaction");
          res.json(mapListingFromDb(insertedDb));
          return;
        } else {
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
            sellerConfirmed: true
          };
          delete soldClone.requestedQuantity;
          const { data: insertedDb, error: insertErr } = await supabase.from("listings").insert([mapListingToDb(soldClone)]).select().single();
          if (insertErr) throw insertErr;
          await createNotification(listing.sellerEmail, "Vente valid\xE9e !", `Votre vente pour "${listing.title}" \xE0 ${bName} a \xE9t\xE9 enregistr\xE9e. Stock \xE9puis\xE9.`, "transaction");
          await createNotification(bEmail, "Achat valid\xE9 !", `Le vendeur de "${listing.title}" a confirm\xE9 votre achat en mains propres.`, "transaction");
          res.json(mapListingFromDb(insertedDb));
          return;
        }
      } else {
        const { data: updatedDb, error: updateErr } = await supabase.from("listings").update({
          seller_confirmed: true
        }).eq("id", id).select().single();
        if (updateErr) throw updateErr;
        await createNotification(listing.sellerEmail, "Vente pr\xE9-confirm\xE9e !", `Vous avez valid\xE9 la vente de "${listing.title}". En attente de confirmation de l'acheteur.`, "transaction");
        res.json(mapListingFromDb(updatedDb));
      }
    } catch (err) {
      console.error("Error validating sale:", err);
      res.status(500).json({ error: "Erreur lors de la validation de la vente." });
    }
  });
  app.delete("/api/listings/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from("listings").delete().eq("id", id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        res.status(404).json({ error: "Annonce introuvable." });
        return;
      }
      res.json({ success: true, message: "Annonce supprim\xE9e avec succ\xE8s." });
    } catch (err) {
      console.error("Error deleting listing in Supabase:", err);
      res.status(500).json({ error: "Impossible de supprimer l'annonce." });
    }
  });
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
      if (imageUrl && imageUrl.startsWith("data:image/") && imageUrl !== listing.imageUrl) {
        const match = imageUrl.match(/^data:image\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = imageUrl.replace(/^data:image\/\w+;base64,/, "");
          const fileName = `annonce_edit_${id}_${Date.now()}.${fileExtension}`;
          const filePath = import_path.default.join(UPLOADS_DIR, fileName);
          import_fs.default.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
          finalImageUrl = `/uploads/${fileName}`;
        }
      }
      let finalVideoUrl = videoUrl !== void 0 ? videoUrl : listing.videoUrl;
      if (videoUrl && videoUrl.startsWith("data:video/") && videoUrl !== listing.videoUrl) {
        const match = videoUrl.match(/^data:video\/(\w+);base64,/);
        if (match) {
          const fileExtension = match[1];
          const base64Content = videoUrl.replace(/^data:video\/\w+;base64,/, "");
          const fileName = `video_edit_${id}_${Date.now()}.${fileExtension}`;
          const filePath = import_path.default.join(UPLOADS_DIR, fileName);
          import_fs.default.writeFileSync(filePath, Buffer.from(base64Content, "base64"));
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
        quantity: quantity !== void 0 ? Number(quantity) : listing.quantity
      };
      const mergedListing = {
        ...listing,
        ...updatedFields
      };
      const { data: updatedDb, error: updateErr } = await supabase.from("listings").update(mapListingToDb(mergedListing)).eq("id", id).select().single();
      if (updateErr) throw updateErr;
      res.json(mapListingFromDb(updatedDb));
    } catch (err) {
      console.error("Error updating listing in Supabase:", err);
      res.status(500).json({ error: "Erreur lors de la modification de l'annonce." });
    }
  });
  app.get("/api/chats", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        res.status(400).json({ error: "Adresse email obligatoire." });
        return;
      }
      const emailStr = String(email).toLowerCase().trim();
      let { data: dbChats, error: fetchChatsErr } = await supabase.from("chats").select("*").or(`buyer_email.ilike.${emailStr},seller_email.ilike.${emailStr}`);
      if (fetchChatsErr) throw fetchChatsErr;
      let chats = (dbChats || []).map(mapChatFromDb);
      chats = chats.filter((c) => {
        if (c.messages && c.messages.length > 0) {
          const lastMsg = c.messages[c.messages.length - 1];
          if (lastMsg.senderEmail.toLowerCase().trim() === emailStr && lastMsg.isRead === true) {
            return false;
          }
        }
        return true;
      });
      const listingIds = Array.from(new Set(chats.map((c) => c.listingId)));
      let listings = [];
      if (listingIds.length > 0) {
        const { data: dbListings, error: fetchListingsErr } = await supabase.from("listings").select("*").in("id", listingIds);
        if (fetchListingsErr) {
          console.error("Error reading listings inside chats GET:", fetchListingsErr);
        } else if (dbListings) {
          listings = dbListings.map(mapListingFromDb);
        }
      }
      chats = chats.map((c) => {
        const item = listings.find((l) => l.id === c.listingId);
        if (item) {
          return {
            ...c,
            listingBuyerConfirmed: item.buyerConfirmed || false,
            listingSellerConfirmed: item.sellerConfirmed || false,
            listingIsSold: item.isSold || false,
            listingBuyerEmail: item.buyerEmail || null,
            listingBuyerName: item.buyerName || null
          };
        }
        return {
          ...c,
          listingBuyerConfirmed: false,
          listingSellerConfirmed: false,
          listingIsSold: false,
          listingBuyerEmail: null,
          listingBuyerName: null
        };
      });
      chats.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      res.json(chats);
    } catch (err) {
      console.error("Error loading chats from Supabase:", err);
      res.status(500).json({ error: "Impossible de charger les messages." });
    }
  });
  app.post("/api/chats/:threadId/read", async (req, res) => {
    try {
      const { threadId } = req.params;
      const { email } = req.body;
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
      thread.messages = thread.messages.map((m) => {
        if (m.senderEmail.toLowerCase().trim() !== readerEmailStr && !m.isRead) {
          m.isRead = true;
          modified = true;
        }
        return m;
      });
      if (modified) {
        const { data: updatedDb, error: updateErr } = await supabase.from("chats").update({ messages: thread.messages }).eq("id", threadId).select().single();
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
  async function queryAntigravityAgent(thread, listing, promptText) {
    const safeListing = listing || {
      title: thread.listingTitle || "Recherche d'achat",
      price: thread.listingPrice || 0,
      category: "Recherche",
      condition: "Inconnu",
      location: "En ligne",
      description: "Recherche de l'acheteur."
    };
    if (!process.env.GEMINI_API_KEY) {
      return `\u{1F916} *[Agent Antigravity en mode simul\xE9]* Bonjour ! Pour activer mes vraies capacit\xE9s d'agent de n\xE9gociation autonome (Antigravity-preview), veuillez ajouter votre cl\xE9 API dans les secrets d'AI Studio sous la variable **GEMINI_API_KEY**.

En attendant, voici une r\xE9ponse simul\xE9e : "Votre article m'int\xE9resse vivement pour un achat imm\xE9diat \xE0 ${safeListing.price} \u20AC !"`;
    }
    try {
      const ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const isUserSeller = thread.sellerEmail.toLowerCase().trim() === "antigravity@la-brocante.fr";
      const agentRole = isUserSeller ? "Vendeur" : "Acheteur";
      const userName = isUserSeller ? thread.buyerName : thread.sellerName;
      const userRole = isUserSeller ? "Acheteur" : "Vendeur";
      const conversationHistory = thread.messages.map((m) => {
        const senderLabel = m.senderEmail.toLowerCase().trim() === "antigravity@la-brocante.fr" ? "Agent (vous)" : `Utilisateur (${m.senderName})`;
        return `- ${senderLabel} : ${m.text}`;
      }).join("\n");
      const systemInstruction = `
Vous \xEAtes "Agent Antigravity \u{1F916}", un agent intelligent de n\xE9gociation int\xE9gr\xE9 dans une application fran\xE7aise de brocante en ligne nomm\xE9e "La Brocante".
Votre but est de n\xE9gocier avec un utilisateur humain de mani\xE8re polie, vivante, r\xE9aliste et typiquement fran\xE7aise (avec un ton chaleureux de brocanteur ou d'acheteur malin).

Contexte de l'annonce :
- Titre : ${safeListing.title}
- Cat\xE9gorie : ${safeListing.category}
- Prix initial : ${safeListing.price} \u20AC
- \xC9tat de l'objet : ${safeListing.condition}
- Localisation : ${safeListing.location}
- Description de l'objet : ${safeListing.description}

Votre r\xF4le actuel : vous \xEAtes le **${agentRole}** de cet objet (situ\xE9 \xE0 ${safeListing.location}).
L'utilisateur est le **${userRole}** (son nom de compte est ${userName}).

Consignes de comportement :
1. Saluez chaleureusement s'il s'agit du tout premier message de discussion. Des formules typiques comme "Salut !", "Fascinant objet !", "Bonjour, excellente affaire !" s'int\xE8grent admirablement.
2. N\xE9gociez d'une mani\xE8re raisonnable et amusante. Si vous \xEAtes acheteur, vous pouvez tenter de proposer un prix l\xE9g\xE8rement inf\xE9rieur de 10-20% pour marchander, ou poser des questions sur l'\xE9tat de l'objet. Si vous \xEAtes vendeur, d\xE9fendez la quality de votre objet mais restez ouvert \xE0 une petite baisse si l'acheteur n\xE9gocie bien.
3. Si la transaction ou un accord est obtenu, invitez l'utilisateur \xE0 cliquer sur le bouton de double-confirmation d'achat direct "Confirmer mon achat" ou "Valider la vente" propos\xE9 dans l'interface de conversation.
4. R\xE9pondez de mani\xE8re concise et directe en Fran\xE7ais (maximum 3-4 courtes phrases) pour garder le tchat dynamique. N'ins\xE9rez jamais de jargon technique d'IA ou de m\xE9tadonn\xE9es de conteneur d'ex\xE9cution Bash/Linux (par exemple, pas de mention d'Antigravity Agent, d'environnement de bac \xE0 salle ou d'API). Restez purement dans la peau du brocanteur ou acheteur.

Historique r\xE9cent de la discussion :
${conversationHistory}

Dernier message re\xE7u de l'utilisateur : "${promptText}"

G\xE9n\xE9rez votre r\xE9ponse directe en tant qu'Agent Antigravity \u{1F916} :
`;
      try {
        const interaction = await ai.interactions.create({
          agent: "antigravity-preview-05-2026",
          input: systemInstruction,
          environment: "remote"
        }, { timeout: 12e4 });
        let fullOutput = "";
        if (interaction.steps) {
          for (const step of interaction.steps) {
            if (step.type === "model_output") {
              const textContent = step.content?.find((c) => c.type === "text");
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
      } catch (interactionsErr) {
        console.warn("Interactions API failed or was rate limited, falling back to gemini-3.5-flash:", interactionsErr.message || interactionsErr);
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: systemInstruction
          });
          if (response && response.text) {
            return response.text.trim();
          }
        } catch (fallbackErr) {
          console.error("Gemini fallback model also failed:", fallbackErr.message || fallbackErr);
          const isUserSeller2 = thread.sellerEmail.toLowerCase().trim() === "antigravity@la-brocante.fr";
          if (isUserSeller2) {
            return `\u{1F916} *[Agent Antigravity]* Bonjour ! Des limites ou quotas temporaires sur l'API Gemini ne permettent pas d'obtenir une r\xE9ponse de l'I.A. en direct pour le moment.

En tant que vendeur, je vous propose cet objet vintage exceptionnel au prix convenu de ${listing.price} \u20AC ! L'achat direct est enti\xE8rement ouvert.`;
          } else {
            return `\u{1F916} *[Agent Antigravity]* Bonjour ! Des limites ou quotas temporaires sur l'API Gemini ne permettent pas d'obtenir une r\xE9ponse de l'I.A. en direct pour le moment.

En tant qu'acheteur int\xE9ress\xE9 par "${listing.title}", je vous propose un accord amical. Validons l'achat direct !`;
          }
        }
      }
      return "Je n'ai pas pu formuler de r\xE9ponse \xE0 l'instant, mais je suis l\xE0 pour n\xE9gocier !";
    } catch (err) {
      console.error("Error calling Antigravity Agent:", err);
      return `\u{1F916} D\xE9sol\xE9, j'ai rencontr\xE9 un probl\xE8me technique en contactant mon cerveau gyroscopique Antigravity : ${err.message || err}. Pouvez-vous r\xE9p\xE9ter ?`;
    }
  }
  app.post("/api/chats", async (req, res) => {
    try {
      const { listingId, text, senderEmail, senderName, recipientEmail, recipientName, buyerEmail, buyerName, lastImageUrl, requestedQuantity } = req.body;
      if (!listingId || !senderEmail || !senderName) {
        res.status(400).json({ error: "Donn\xE9es de message incompl\xE8tes." });
        return;
      }
      let currentListing = null;
      if (!listingId.startsWith("demand_ref_")) {
        const { data: dbListing } = await supabase.from("listings").select("*").eq("id", listingId).single();
        if (dbListing) {
          currentListing = mapListingFromDb(dbListing);
        }
      }
      let actualBuyerEmail = "";
      let actualBuyerName = "";
      let actualSellerEmail = "";
      let actualSellerName = "";
      let listingTitle = "";
      let listingPrice = 0;
      let listingImageUrl = "";
      if (listingId.startsWith("demand_ref_")) {
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
      const { data: dbChat } = await supabase.from("chats").select("*").eq("listing_id", listingId).ilike("buyer_email", actualBuyerEmail).maybeSingle();
      let thread = dbChat ? mapChatFromDb(dbChat) : null;
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      let newMsg = null;
      if (text !== void 0 && text !== null && String(text).trim() !== "") {
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
        const { error: updateErr } = await supabase.from("chats").update(mapChatToDb(thread)).eq("id", thread.id);
        if (updateErr) throw updateErr;
      } else {
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
        const { error: insertErr } = await supabase.from("chats").insert([mapChatToDb(thread)]);
        if (insertErr) throw insertErr;
      }
      const isAntigravityBuyer = actualBuyerEmail === "antigravity@la-brocante.fr";
      const isAntigravitySeller = actualSellerEmail === "antigravity@la-brocante.fr";
      const isSenderAntigravity = senderEmail.toLowerCase().trim() === "antigravity@la-brocante.fr";
      if ((isAntigravityBuyer || isAntigravitySeller) && !isSenderAntigravity && text) {
        const threadIdToUpdate = thread.id;
        queryAntigravityAgent(thread, currentListing, text).then(async (aiResponseText) => {
          const aiTimestamp = (/* @__PURE__ */ new Date()).toISOString();
          const aiMsg = {
            id: `msg_${Date.now() + 10}`,
            senderEmail: "antigravity@la-brocante.fr",
            senderName: isAntigravityBuyer ? "Chasseur Antigravity \u{1F916}" : "Agent Antigravity \u{1F916}",
            text: aiResponseText,
            createdAt: aiTimestamp,
            isRead: false
          };
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
      res.status(201).json(thread);
    } catch (err) {
      console.error("Error creating chat/message in Supabase:", err);
      res.status(500).json({ error: "Erreur lors de l'envoi du message." });
    }
  });
  app.delete("/api/chats/:threadId/messages/:messageId", async (req, res) => {
    try {
      const { threadId, messageId } = req.params;
      const { data: dbChat, error: fetchErr } = await supabase.from("chats").select("*").eq("id", threadId).single();
      if (fetchErr || !dbChat) {
        res.status(404).json({ error: "Fil de discussion introuvable." });
        return;
      }
      const thread = mapChatFromDb(dbChat);
      const messageIndex = thread.messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) {
        res.status(404).json({ error: "Message introuvable." });
        return;
      }
      thread.messages.splice(messageIndex, 1);
      if (thread.messages.length > 0) {
        thread.lastMessageAt = thread.messages[thread.messages.length - 1].createdAt;
      }
      const { error: updateErr } = await supabase.from("chats").update({
        messages: thread.messages,
        last_message_at: thread.lastMessageAt
      }).eq("id", threadId);
      if (updateErr) throw updateErr;
      res.json({ success: true, messages: thread.messages });
    } catch (err) {
      console.error("Error deleting message in Supabase:", err);
      res.status(500).json({ error: "Impossible de supprimer le message." });
    }
  });
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
          res.json(data.map((u) => ({ email: u.email, name: u.name, avatar: u.avatar_url || u.avatar })));
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
        const exists = db.users.some((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
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
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, name, avatar } = req.body;
      if (!email || !name) {
        res.status(400).json({ error: "Email et nom requis." });
        return;
      }
      const cleanEmail = email.trim().toLowerCase();
      const displayName = name.trim();
      const avatarUrl = avatar || "";
      const generatedPassword = `Broc-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      if (useLocalDb) {
        const db = readLocalDb();
        if (!db.users) db.users = [];
        const exists = db.users.some((u) => u.email.toLowerCase().trim() === cleanEmail);
        if (exists) {
          res.status(400).json({ error: "Cet e-mail est d\xE9j\xE0 enregistr\xE9." });
          return;
        }
        db.users.push({
          email: cleanEmail,
          name: displayName,
          avatar: avatarUrl,
          password: generatedPassword,
          isPro: cleanEmail.includes("pro") || cleanEmail.includes("sophie")
        });
        writeLocalDb(db);
      } else {
        const { data: existing } = await supabase.from("profiles").select("email").eq("email", cleanEmail).maybeSingle();
        if (existing) {
          res.status(400).json({ error: "Cet e-mail est d\xE9j\xE0 enregistr\xE9." });
          return;
        }
        const { error: insertErr } = await supabase.from("profiles").insert({
          email: cleanEmail,
          name: displayName,
          avatar_url: avatarUrl
        });
        if (insertErr) {
          console.warn("Supabase profiles insert error, falling back to local:", insertErr.message);
          const db2 = readLocalDb();
          if (!db2.users) db2.users = [];
          db2.users.push({ email: cleanEmail, name: displayName, avatar: avatarUrl, password: generatedPassword });
          writeLocalDb(db2);
        }
        const db = readLocalDb();
        if (!db.users) db.users = [];
        if (!db.users.some((u) => u.email.toLowerCase().trim() === cleanEmail)) {
          db.users.push({ email: cleanEmail, name: displayName, avatar: avatarUrl, password: generatedPassword });
          writeLocalDb(db);
        }
      }
      console.log(`
--- [SIGNUP] ${cleanEmail} | Password: ${generatedPassword} ---
`);
      res.json({
        success: true,
        message: "Compte cr\xE9\xE9 avec succ\xE8s.",
        password: generatedPassword
      });
    } catch (err) {
      console.error("Error during signup:", err);
      res.status(500).json({ error: err.message || "Erreur serveur lors de l'inscription." });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email et mot de passe requis." });
        return;
      }
      const cleanEmail = email.trim().toLowerCase();
      let finalUser = null;
      const sessionToken = `mock_jwt_${cleanEmail}_${Date.now()}`;
      if (cleanEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        let adminUser = {
          email: ADMIN_EMAIL,
          name: "Fallou Diouf",
          avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23fbbf24'/><stop offset='100%' stop-color='%23d97706'/></linearGradient></defs><rect width='100' height='100' rx='28' fill='url(%23g1)'/><g fill='none' stroke='%23ffffff' stroke-width='5.5' stroke-linecap='round' stroke-linejoin='round'><path d='M30 42h40v30c0 4-3 7-7 7H37c-4 0-7-3-7-7V42z'/><path d='M40 42c0-5 3-9 10-9s10 4 10 9'/><circle cx='50' cy='58' r='4' fill='%23ffffff'/></g></svg>",
          isPro: true,
          isAdmin: true
        };
        const db2 = readLocalDb();
        if (!db2.users) db2.users = [];
        const localIdx = db2.users.findIndex((u) => u.email.toLowerCase().trim() === ADMIN_EMAIL);
        if (localIdx === -1) {
          db2.users.push({
            email: ADMIN_EMAIL,
            name: "Fallou Diouf",
            avatar: adminUser.avatar,
            password: ADMIN_PASSWORD,
            pref_notif_announcements: true
          });
          writeLocalDb(db2);
        } else {
          db2.users[localIdx].password = ADMIN_PASSWORD;
          writeLocalDb(db2);
        }
        if (!useLocalDb) {
          try {
            const { data: existing } = await supabase.from("profiles").select("email").eq("email", ADMIN_EMAIL).maybeSingle();
            if (!existing) {
              await supabase.from("profiles").insert({
                email: ADMIN_EMAIL,
                name: "Fallou Diouf",
                avatar_url: adminUser.avatar
              });
            }
          } catch (e) {
            console.warn("Silent admin profile sync failed:", e);
          }
        }
        console.log(`
--- [ADMIN LOGIN] ${cleanEmail} authenticated ---
`);
        res.json({
          success: true,
          message: "Connexion r\xE9ussie.",
          token: sessionToken,
          user: adminUser
        });
        return;
      }
      const db = readLocalDb();
      const localUser = (db.users || []).find((u) => u.email.toLowerCase().trim() === cleanEmail);
      if (localUser) {
        if (localUser.password !== password) {
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
        const { data: profile, error: profileErr } = await supabase.from("profiles").select("*").eq("email", cleanEmail).maybeSingle();
        if (profileErr || !profile) {
          res.status(400).json({ error: "Aucun compte trouv\xE9 avec cet e-mail." });
          return;
        }
        if (profile.password !== password) {
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
        res.status(400).json({ error: "Aucun compte trouv\xE9 avec cet e-mail." });
        return;
      }
      console.log(`
--- [LOGIN] ${cleanEmail} authenticated ---
`);
      res.json({
        success: true,
        message: "Connexion r\xE9ussie.",
        token: sessionToken,
        user: finalUser
      });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ error: err.message || "Erreur serveur lors de la connexion." });
    }
  });
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      const cleanEmail = email.trim().toLowerCase();
      const newPassword = `Broc-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const db = readLocalDb();
      if (!db.users) db.users = [];
      const localIdx = db.users.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
      if (useLocalDb) {
        if (localIdx === -1) {
          res.status(404).json({ error: "Aucun compte associ\xE9 \xE0 cet e-mail." });
          return;
        }
        db.users[localIdx].password = newPassword;
        writeLocalDb(db);
      } else {
        const { data: profile } = await supabase.from("profiles").select("email").eq("email", cleanEmail).maybeSingle();
        if (!profile && localIdx === -1) {
          res.status(404).json({ error: "Aucun compte associ\xE9 \xE0 cet e-mail." });
          return;
        }
        if (localIdx !== -1) {
          db.users[localIdx].password = newPassword;
        } else {
          db.users.push({ email: cleanEmail, password: newPassword });
        }
        writeLocalDb(db);
      }
      console.log(`
--- [PASSWORD RESET] ${cleanEmail} | New Password: ${newPassword} ---
`);
      res.json({
        success: true,
        message: "Nouveau mot de passe g\xE9n\xE9r\xE9.",
        password: newPassword
      });
    } catch (err) {
      console.error("Error during forgot-password:", err);
      res.status(500).json({ error: err.message || "Erreur serveur." });
    }
  });
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      const cleanEmail = email.trim().toLowerCase();
      const mockCode = Math.floor(1e5 + Math.random() * 9e5).toString();
      if (useLocalDb) {
        pendingOtps.set(cleanEmail, { code: mockCode, expiresAt: Date.now() + 10 * 60 * 1e3 });
        res.json({ success: true, isMocked: true, code: mockCode });
      } else {
        const { error } = await supabaseClient.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true
          }
        });
        if (error) {
          console.warn("Supabase Auth OTP error, falling back to mock:", error.message);
          pendingOtps.set(cleanEmail, { code: mockCode, expiresAt: Date.now() + 10 * 60 * 1e3 });
          res.json({ success: true, isMocked: true, code: mockCode });
        } else {
          res.json({ success: true, isMocked: false });
        }
      }
    } catch (err) {
      console.error("Error in /api/auth/send-otp:", err);
      res.status(500).json({ error: "Erreur serveur lors de l'envoi du code." });
    }
  });
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res.status(400).json({ error: "Email et code requis." });
        return;
      }
      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.trim();
      const mockSession = pendingOtps.get(cleanEmail);
      if (mockSession && mockSession.code === cleanCode && mockSession.expiresAt > Date.now()) {
        pendingOtps.delete(cleanEmail);
        res.json({ success: true, message: "Code v\xE9rifi\xE9 avec succ\xE8s (mode simulation)." });
        return;
      }
      if (useLocalDb) {
        res.status(400).json({ error: "Code de validation incorrect." });
      } else {
        const { error } = await supabaseClient.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: "email"
        });
        if (error) {
          res.status(400).json({ error: "Code de validation incorrect ou expir\xE9." });
        } else {
          res.json({ success: true, message: "Code v\xE9rifi\xE9 avec succ\xE8s." });
        }
      }
    } catch (err) {
      console.error("Error in /api/auth/verify-otp:", err);
      res.status(500).json({ error: "Erreur serveur lors de la v\xE9rification." });
    }
  });
  app.get("/api/notifications", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      const cleanEmail = String(email).toLowerCase().trim();
      const isPro = await checkIsProUser(cleanEmail);
      let rawNotifs = [];
      if (useLocalDb) {
        const db = readLocalDb();
        rawNotifs = (db.notifications || []).filter((n) => n.user_email.toLowerCase().trim() === cleanEmail);
      } else {
        const { data, error } = await supabaseClient.from("notifications").select("*").eq("user_email", cleanEmail).order("created_at", { ascending: false });
        if (error) {
          console.warn("Supabase notifications fetch error, using local fallback:", error.message);
          const db = readLocalDb();
          rawNotifs = (db.notifications || []).filter((n) => n.user_email.toLowerCase().trim() === cleanEmail);
        } else {
          rawNotifs = data || [];
        }
      }
      rawNotifs.sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());
      let filteredNotifs = [...rawNotifs];
      if (!isPro) {
        let allowedTransactionFound = false;
        let lastAllowedTime = 0;
        filteredNotifs = rawNotifs.filter((n) => {
          if (n.type === "transaction") {
            const time = new Date(n.created_at || n.createdAt).getTime();
            if (!allowedTransactionFound) {
              allowedTransactionFound = true;
              lastAllowedTime = time;
              return true;
            }
            return false;
          }
          return true;
        });
      }
      const uiNotifs = filteredNotifs.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        time: n.created_at ? new Date(n.created_at).toLocaleString("fr-FR") : "\xC0 l'instant",
        type: n.type,
        read: n.read === true
      }));
      res.json(uiNotifs);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      res.status(500).json({ error: "Erreur lors du chargement des notifications." });
    }
  });
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const { read } = req.body;
      if (useLocalDb) {
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        const idx = db.notifications.findIndex((n) => n.id === id);
        if (idx !== -1) {
          db.notifications[idx].read = read === true;
          writeLocalDb(db);
          res.json({ success: true, notification: db.notifications[idx] });
        } else {
          res.status(404).json({ error: "Notification introuvable." });
        }
      } else {
        const { data, error } = await supabaseClient.from("notifications").update({ read: read === true }).eq("id", id).select().maybeSingle();
        if (error) throw error;
        if (!data) {
          const db = readLocalDb();
          if (!db.notifications) {
            db.notifications = [];
          }
          const idx = db.notifications.findIndex((n) => n.id === id);
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
    } catch (err) {
      console.error("Error updating notification read status:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (useLocalDb) {
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        const originalLength = db.notifications.length;
        db.notifications = db.notifications.filter((n) => n.id !== id);
        if (db.notifications.length < originalLength) {
          writeLocalDb(db);
          res.json({ success: true, message: "Notification supprim\xE9e." });
        } else {
          res.status(404).json({ error: "Notification introuvable." });
        }
      } else {
        const { error } = await supabaseClient.from("notifications").delete().eq("id", id);
        if (error) {
          console.warn("Supabase notification delete error, using local fallback:", error.message);
        }
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        const originalLength = db.notifications.length;
        db.notifications = db.notifications.filter((n) => n.id !== id);
        if (db.notifications.length < originalLength) {
          writeLocalDb(db);
        }
        res.json({ success: true, message: "Notification supprim\xE9e." });
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });
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
        db.notifications = (db.notifications || []).filter((n) => n.user_email.toLowerCase().trim() !== cleanEmail);
        writeLocalDb(db);
      } else {
        const { error } = await supabaseClient.from("notifications").delete().eq("user_email", cleanEmail);
        if (error) {
          console.warn("Supabase notifications delete error, clearing local cache:", error.message);
        }
        const db = readLocalDb();
        db.notifications = (db.notifications || []).filter((n) => n.user_email.toLowerCase().trim() !== cleanEmail);
        writeLocalDb(db);
      }
      res.json({ success: true, message: "Toutes les notifications ont \xE9t\xE9 supprim\xE9es." });
    } catch (err) {
      console.error("Error clearing notifications:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });
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
        db.notifications = (db.notifications || []).map((n) => {
          if (n.user_email.toLowerCase().trim() === cleanEmail) {
            return { ...n, read: true };
          }
          return n;
        });
        writeLocalDb(db);
      } else {
        const { error } = await supabaseClient.from("notifications").update({ read: true }).eq("user_email", cleanEmail);
        if (error) {
          console.warn("Supabase notifications update error, marking local cache:", error.message);
        }
        const db = readLocalDb();
        db.notifications = (db.notifications || []).map((n) => {
          if (n.user_email.toLowerCase().trim() === cleanEmail) {
            return { ...n, read: true };
          }
          return n;
        });
        writeLocalDb(db);
      }
      res.json({ success: true, message: "Toutes les notifications ont \xE9t\xE9 marqu\xE9es comme lues." });
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });
  app.patch("/api/users/preferences", async (req, res) => {
    try {
      const { email, prefNotifAnnouncements } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email requis." });
        return;
      }
      const cleanEmail = email.toLowerCase().trim();
      const updates = { pref_notif_announcements: prefNotifAnnouncements === true };
      const db = readLocalDb();
      if (!db.users) db.users = [];
      const userIdx = db.users.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
      if (userIdx !== -1) {
        db.users[userIdx].pref_notif_announcements = prefNotifAnnouncements === true;
        writeLocalDb(db);
      }
      if (!useLocalDb) {
        const { error } = await supabaseClient.from("profiles").update(updates).eq("email", cleanEmail);
        if (error) {
          console.warn("Supabase preferences update error:", error.message);
        }
      }
      res.json({ success: true, preferences: updates });
    } catch (err) {
      console.error("Error updating user preferences:", err);
      res.status(500).json({ error: "Erreur serveur lors de la mise \xE0 jour des pr\xE9f\xE9rences." });
    }
  });
  const adminAuthMiddleware = (req, res, next) => {
    const requesterEmail = req.headers["x-admin-email"] || req.query.adminEmail || req.body.adminEmail;
    if (requesterEmail && requesterEmail.toLowerCase().trim() === ADMIN_EMAIL) {
      next();
    } else {
      res.status(403).json({ error: "Acc\xE8s refus\xE9. Vous devez \xEAtre administrateur." });
    }
  };
  app.get("/api/admin/stats", adminAuthMiddleware, async (req, res) => {
    try {
      let users = [];
      let listings = [];
      let chats = [];
      let demands = [];
      if (useLocalDb) {
        const db = readLocalDb();
        users = db.users || [];
        listings = db.listings || [];
        chats = db.chats || [];
        demands = db.demands || [];
      } else {
        const { data: dbUsers } = await supabaseClient.from("profiles").select("*");
        const { data: dbListings } = await supabaseClient.from("listings").select("*");
        const { data: dbChats } = await supabaseClient.from("chats").select("*");
        const { data: dbDemands } = await supabaseClient.from("demands").select("*");
        users = dbUsers || [];
        listings = dbListings || [];
        chats = dbChats || [];
        demands = dbDemands || [];
      }
      const activeListings = listings.filter((l) => !l.is_sold && !l.isSold);
      const soldListings = listings.filter((l) => l.is_sold || l.isSold);
      const totalValue = activeListings.reduce((sum, l) => sum + Number(l.price || 0), 0);
      const totalSalesValue = soldListings.reduce((sum, l) => sum + Number(l.price || 0), 0);
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
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      res.status(500).json({ error: "Erreur serveur lors de la r\xE9cup\xE9ration des statistiques." });
    }
  });
  app.post("/api/admin/broadcast-notification", adminAuthMiddleware, async (req, res) => {
    try {
      const { title, message, type } = req.body;
      if (!title || !message) {
        res.status(400).json({ error: "Titre et message requis." });
        return;
      }
      let userEmails = [];
      if (useLocalDb) {
        const db = readLocalDb();
        userEmails = (db.users || []).map((u) => u.email);
      } else {
        const { data: profiles } = await supabaseClient.from("profiles").select("email");
        userEmails = (profiles || []).map((p) => p.email);
      }
      const newNotifs = userEmails.map((email) => ({
        id: `notif_sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        user_email: email,
        title,
        message,
        type: type || "announcement",
        read: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }));
      if (useLocalDb) {
        const db = readLocalDb();
        if (!db.notifications) db.notifications = [];
        db.notifications.push(...newNotifs);
        writeLocalDb(db);
      } else {
        const { error } = await supabaseClient.from("notifications").insert(newNotifs);
        if (error) {
          console.warn("Supabase notification broadcast error, using local fallback:", error.message);
          const db = readLocalDb();
          if (!db.notifications) db.notifications = [];
          db.notifications.push(...newNotifs);
          writeLocalDb(db);
        }
      }
      res.json({ success: true, message: `Notification diffus\xE9e \xE0 ${userEmails.length} utilisateurs.` });
    } catch (err) {
      console.error("Error broadcasting notification:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });
  app.delete("/api/admin/listings/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      if (useLocalDb) {
        const db = readLocalDb();
        db.listings = (db.listings || []).filter((l) => l.id !== id);
        writeLocalDb(db);
      } else {
        const { error } = await supabaseClient.from("listings").delete().eq("id", id);
        if (error) throw error;
      }
      res.json({ success: true, message: "Annonce supprim\xE9e par l'administrateur." });
    } catch (err) {
      console.error("Error admin deleting listing:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });
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
        db.users = (db.users || []).filter((u) => u.email.toLowerCase().trim() !== cleanEmail);
        db.listings = (db.listings || []).filter((l) => l.seller_email?.toLowerCase().trim() !== cleanEmail);
        db.chats = (db.chats || []).filter((c) => c.seller_email?.toLowerCase().trim() !== cleanEmail && c.buyer_email?.toLowerCase().trim() !== cleanEmail);
        writeLocalDb(db);
      } else {
        await supabaseClient.from("listings").delete().eq("seller_email", cleanEmail);
        await supabaseClient.from("profiles").delete().eq("email", cleanEmail);
      }
      res.json({ success: true, message: "Compte utilisateur supprim\xE9 avec succ\xE8s." });
    } catch (err) {
      console.error("Error admin deleting user:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });
  app.patch("/api/admin/users/:email/pro", adminAuthMiddleware, async (req, res) => {
    try {
      const { email } = req.params;
      const { isPro } = req.body;
      const cleanEmail = email.toLowerCase().trim();
      if (useLocalDb) {
        const db = readLocalDb();
        const idx = (db.users || []).findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
        if (idx !== -1) {
          db.users[idx].isPro = isPro === true;
          writeLocalDb(db);
        }
      } else {
        const db = readLocalDb();
        const idx = (db.users || []).findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
        if (idx !== -1) {
          db.users[idx].isPro = isPro === true;
          writeLocalDb(db);
        }
      }
      res.json({ success: true, isPro: isPro === true });
    } catch (err) {
      console.error("Error admin updating pro status:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  });
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } else {
      const distPath = import_path.default.join(process.cwd(), "dist");
      app.use(import_express.default.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(import_path.default.join(distPath, "index.html"));
      });
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Brocante Server] Running at http://localhost:${PORT}`);
    });
  }
}
start();
var server_default = app;
//# sourceMappingURL=server.cjs.map
