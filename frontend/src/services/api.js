const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(message, { status = null, kind = "request", retryAfter = null, headers = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    this.retryAfter = retryAfter;
    this.headers = headers;
  }
}

async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new ApiError("VITE_API_URL is not configured for this frontend build.", {
      kind: "configuration",
    });
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    const rawBody = await response.text();
    let body;

    try {
      body = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      throw new ApiError("The API returned an unreadable response.", {
        status: response.status,
        kind: "invalid-response",
      });
    }

    if (!body || typeof body !== "object") {
      throw new ApiError("The API returned an unexpected response format.", {
        status: response.status,
        kind: "invalid-response",
      });
    }

    const headers = {
      limit: Number(response.headers.get("x-ratelimit-limit")) || null,
      remaining: response.headers.has("x-ratelimit-remaining")
        ? Number(response.headers.get("x-ratelimit-remaining"))
        : null,
      window: Number(response.headers.get("x-ratelimit-window")) || null,
      retryAfter: Number(response.headers.get("retry-after")) || null,
    };

    if (!response.ok) {
      throw new ApiError(body.message || `Request failed with HTTP ${response.status}.`, {
        status: response.status,
        kind: "http",
        retryAfter: headers.retryAfter,
        headers,
      });
    }

    return { body, headers, status: response.status };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "AbortError") {
      throw new ApiError("The API did not respond in time. Check the server and try again.", {
        kind: "timeout",
      });
    }
    throw new ApiError("Could not reach the API. Check that the backend is running.", {
      kind: "network",
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function checkApiHealth() {
  return request("/");
}

export function createApiKey(plan = "free") {
  return request("/api/keys/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
}

export function sendRateLimitedRequest(apiKey) {
  return request("/api/test", {
    headers: { "x-api-key": apiKey },
  });
}

export { API_BASE_URL };
