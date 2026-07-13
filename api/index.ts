import type { VercelRequest, VercelResponse } from '@vercel/node';

let appInstance: any;

async function loadServer() {
  if (!appInstance) {
    const serverModule = await import('../server.cjs');
    appInstance = serverModule.default || serverModule;
  }
  return appInstance;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure CORS headers are attached on all Vercel responses
  const origin = (req.headers as any)?.origin || "*";
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-admin-email"
  );

  // Directly answer HTTP OPTIONS preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const app = await loadServer();
    return await app(req, res);
  } catch (error: any) {
    console.error("[Vercel Serverless Handler Error]:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Erreur du serveur Vercel Serverless.",
        message: process.env.NODE_ENV === "production" ? "Une erreur inattendue est survenue." : (error.message || String(error))
      });
    }
  }
}

