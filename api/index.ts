import app, { startPromise } from "../server";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await startPromise;
  } catch (err: any) {
    console.error("[Vercel] Echec initialisation du serveur:", err);
    (res as any).writeHead(500, { "Content-Type": "application/json" });
    (res as any).end(JSON.stringify({ error: "Erreur initialisation serveur: " + (err?.message || String(err)) }));
    return;
  }
  (app as any)(req, res);
}
