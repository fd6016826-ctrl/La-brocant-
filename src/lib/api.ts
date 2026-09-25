// Helper auth frontend : récupère le token de session et construit les headers
export function getSessionToken(): string {
  try {
    return sessionStorage.getItem("brocante_session_token") || localStorage.getItem("brocante_session_token") || "";
  } catch {
    return "";
  }
}

export function setSessionToken(token: string): void {
  try {
    if (token) {
      sessionStorage.setItem("brocante_session_token", token);
      localStorage.setItem("brocante_session_token", token);
    } else {
      sessionStorage.removeItem("brocante_session_token");
      localStorage.removeItem("brocante_session_token");
    }
  } catch {
    // ignore
  }
}

// Headers d'authentification standard (Authorization: Bearer <token signé>)
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getSessionToken();
  const headers: Record<string, string> = { ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}
