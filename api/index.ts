// server.cjs is compiled by the Vercel buildCommand (esbuild server.ts → server.cjs)
// and included in the function bundle via vercel.json includeFiles
import serverModule from "../server.cjs";
const app = serverModule.default || serverModule;
export default app;
