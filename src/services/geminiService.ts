// Frontend client for the server-side Gemini Copilot.
// The actual GoogleGenAI call lives on the server (see /api/copilot/suggest in server.ts)
// to avoid leaking the API key into the public bundle.

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "/api";

export const getCopilotSuggestion = async (
  history: { role: string; content: string }[],
  lastMessage: string
): Promise<string | null> => {
  try {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    const res = await fetch(`${API_BASE}/copilot/suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ history, lastMessage }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.text ?? null;
  } catch (error) {
    console.error("Copilot client error:", error);
    return null;
  }
};
