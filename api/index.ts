import app, { startPromise } from "../server";
import type { IncomingMessage, ServerResponse } from "http";

// On Vercel serverless, we must ensure all Express routes are registered
// before handling any request. startPromise resolves once start() completes.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await startPromise;
  (app as any)(req, res);
}
