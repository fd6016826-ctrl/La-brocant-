// Vercel serverless function entry point
// This file imports the compiled Express server from server.cjs

import type { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

// Lazy load the server on first request
async function loadServer() {
  if (!app) {
    try {
      const serverModule = await import('../server.cjs');
      app = serverModule.default || serverModule;
      console.log('[API] Server loaded successfully');
    } catch (err: any) {
      console.error('[API] Failed to load server:', err);
      throw err;
    }
  }
  return app;
}

// Handle all API requests
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const server = await loadServer();
    
    // Set CORS headers if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-email');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Route to Express server
    return server(req, res);
  } catch (error: any) {
    console.error('[API] Error:', error);
    res.status(500).json({
      error: 'Erreur serveur interne',
      message: error?.message || 'Une erreur est survenue lors du traitement de votre demande'
    });
  }
};
