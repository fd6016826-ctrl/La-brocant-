import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverModule from '../server.cjs';

const app = serverModule.default || serverModule;

export default function handler(req: VercelRequest, res: VercelResponse) {
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

  return app(req, res);
}


