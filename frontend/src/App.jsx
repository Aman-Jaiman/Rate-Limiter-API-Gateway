import { useEffect, useState } from "react";
import {
  API_BASE_URL,
  ApiError,
  checkApiHealth,
  createApiKey,
  sendRateLimitedRequest,
} from "./services/api.js";

const GITHUB_URL = "https://github.com/Aman-Jaiman/Rate-Limiter-API-Gateway";
const initialKey = window.sessionStorage.getItem("rateguard-api-key") || "";

function getInitialTheme() {
  const saved = window.localStorage.getItem("rateguard-theme");
  if (saved === "light" || saved === "dark") return saved;
  return "light";
}

function Navbar({ apiOnline, theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <a className="brand" href="#top" aria-label="RateGuard home">
        <span className="brand-mark" aria-hidden="true"><span /></span>
        <span>rate<span className="brand-accent">guard</span></span>
      </a>
      <nav className="nav-actions" aria-label="Main navigation">
        <span className={`api-indicator ${apiOnline ? "is-online" : "is-offline"}`}><span className="status-dot" />API {apiOnline ? "Online" : "Offline"}</span>
        <a className="nav-link github-link" href={GITHUB_URL} target="_blank" rel="noreferrer"><span aria-hidden="true">↗</span> GitHub</a>
        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}><span aria-hidden="true">{theme === "light" ? "◐" : "☼"}</span></button>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> LIVE SYSTEM DEMO</div>
        <h1>Protect your APIs from <span>excessive requests.</span></h1>
        <p>A production-style rate limiter built with Node.js, Express and Redis. Send real requests and watch the guard work.</p>
        <div className="hero-actions"><a className="button button-primary" href="#demo">Test rate limiter <span aria-hidden="true">↓</span></a><a className="button button-secondary" href="#api">View API <span aria-hidden="true">↗</span></a></div>
      </div>
      <div className="hero-flow" aria-label="Client to Express API to rate limiter to Redis and response">
        <div className="flow-topline"><span>REQUEST PIPELINE</span><span className="flow-live"><i /> LIVE</span></div>
        <div className="flow-nodes"><div className="flow-node"><span className="flow-icon client-icon">C</span><span>Client</span></div><span className="flow-arrow">→</span><div className="flow-node"><span className="flow-icon express-icon">Ex</span><span>Express</span></div><span className="flow-arrow">→</span><div className="flow-node flow-node-focus"><span className="flow-icon guard-icon">⇥</span><span>Guard</span></div></div>
        <div className="flow-branch"><span /><span className="branch-label">counter check</span><span /></div>
        <div className="flow-bottom"><div className="flow-node"><span className="flow-icon redis-icon">R</span><span>Redis</span></div><div className="flow-response"><span className="response-pulse" /> Response <span className="response-code">200</span></div></div>
      </div>
    </section>
  );
}

function Metric({ label, value, note, accent = "" }) {
  return <div className="metric"><span className="metric-label">{label}</span><strong className={accent}>{value}</strong><span className="metric-note">{note}</span></div>;
}

function RequestHistory({ history, onClear }) {
  return (
    <aside className="history-panel panel">
      <div className="history-heading"><div><span className="field-label">CLIENT LOG</span><h3>Request history</h3></div><button type="button" className="text-button clear-button" onClick={onClear} disabled={!history.length}>Clear</button></div>
      <div className="history-table-wrap"><table><thead><tr><th>#</th><th>TIME</th><th>STATUS</th><th>LATENCY</th><th>LEFT</th></tr></thead><tbody>{history.length ? history.map((item) => <tr key={item.id}><td className="history-number">#{item.number}</td><td>{item.time}</td><td><span className={`history-status ${item.status === 200 ? "status-ok" : item.status === 429 ? "status-blocked" : "status-error"}`}>{item.status}</span></td><td>{item.duration}ms</td><td>{item.remaining ?? "—"}</td></tr>) : <tr><td className="empty-history" colSpan="5"><span className="empty-mark">⌁</span><span>No requests yet</span><small>Traffic will appear here as you test.</small></td></tr>}</tbody></table></div>
      <div className="history-foot"><span className="status-dot" /> Stored in this session only <span className="history-count">{history.length} / 30</span></div>
    </aside>
  );
}

function RateLimiterDemo({ apiOnline, apiKey, setApiKey }) {
  const [history, setHistory] = useState([]);
  const [limit, setLimit] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [windowSeconds, setWindowSeconds] = useState(null);
  const [latestStatus, setLatestStatus] = useState(null);
  const [retryAfter, setRetryAfter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyDraft, setKeyDraft] = useState(apiKey);

  useEffect(() => setKeyDraft(apiKey), [apiKey]);

  async function handleCreateKey() {
    setKeyLoading(true);
    setError(null);
    try {
      const result = await createApiKey("free");
      const generatedKey = result.body?.data?.apiKey;
      const generatedLimit = Number(result.body?.data?.limit);
      if (!generatedKey || !Number.isFinite(generatedLimit)) throw new ApiError("The API key response did not include a key and limit.", { kind: "invalid-response" });
      setApiKey(generatedKey);
      setLimit(generatedLimit);
      setRemaining(generatedLimit);
      setWindowSeconds(null);
      setLatestStatus(null);
      setRetryAfter(null);
      setHistory([]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setKeyLoading(false);
    }
  }

  function handleUseKey(event) {
    event.preventDefault();
    const trimmedKey = keyDraft.trim();
    if (!trimmedKey) { setError("Enter an API key or create a free demo key."); return; }
    setApiKey(trimmedKey);
    setLimit(null);
    setRemaining(null);
    setWindowSeconds(null);
    setLatestStatus(null);
    setRetryAfter(null);
    setHistory([]);
    setError(null);
  }

  function handleClearKey() {
    setApiKey("");
    setKeyDraft("");
    setLimit(null);
    setRemaining(null);
    setWindowSeconds(null);
    setLatestStatus(null);
    setRetryAfter(null);
    setHistory([]);
  }

  async function handleSendRequest() {
    if (loading || !apiKey || !apiOnline) return;
    setLoading(true);
    setError(null);
    setRetryAfter(null);
    const startedAt = performance.now();
    const requestedAt = new Date();
    try {
      const result = await sendRateLimitedRequest(apiKey);
      const duration = Math.round(performance.now() - startedAt);
      setLimit(result.headers.limit || limit);
      if (result.headers.remaining !== null) setRemaining(result.headers.remaining);
      if (result.headers.window !== null) setWindowSeconds(result.headers.window);
      setLatestStatus(result.status);
      setHistory((items) => [{ id: `${requestedAt.getTime()}-${items.length}`, number: items.length + 1, time: requestedAt.toLocaleTimeString([], { hour12: false }), status: result.status, duration, remaining: result.headers.remaining }, ...items].slice(0, 30));
    } catch (requestError) {
      const duration = Math.round(performance.now() - startedAt);
      const status = requestError.status;
      setLatestStatus(status);
      setRetryAfter(requestError.retryAfter);
      if (requestError.headers?.limit) setLimit(requestError.headers.limit);
      if (requestError.headers?.remaining !== null && requestError.headers?.remaining !== undefined) setRemaining(requestError.headers.remaining);
      if (requestError.headers?.window !== null && requestError.headers?.window !== undefined) setWindowSeconds(requestError.headers.window);
      if (status === 429) setRemaining(requestError.headers?.remaining ?? 0);
      setHistory((items) => [{ id: `${requestedAt.getTime()}-${items.length}`, number: items.length + 1, time: requestedAt.toLocaleTimeString([], { hour12: false }), status: status || "ERR", duration, remaining: status === 429 ? 0 : remaining }, ...items].slice(0, 30));
      setError(status === 429 ? "Too many requests. Please try again later." : requestError.message);
    } finally {
      setLoading(false);
    }
  }

  const used = limit !== null && remaining !== null ? Math.max(0, limit - remaining) : null;
  const percentUsed = limit && used !== null ? Math.min(100, (used / limit) * 100) : 0;
  const limited = latestStatus === 429;

  return (
    <section className="demo-section section-anchor" id="demo">
      <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> INTERACTIVE PLAYGROUND</div><h2>Put the limiter to work.</h2></div><span className="section-caption">Requests hit your running API</span></div>
      <div className="demo-layout">
        <div className="demo-main panel">
          <div className="panel-topline"><div className="endpoint-pill"><span className="method-tag">GET</span><code>/api/test</code></div><span className="auth-tag"><span aria-hidden="true">⌑</span> API key required</span></div>
          <div className="key-area">{apiKey ? <div className="active-key-row"><div><span className="field-label">ACTIVE DEMO KEY</span><code className="active-key">{apiKey}</code></div><button className="text-button" type="button" onClick={handleClearKey}>Change key</button></div> : <div className="key-setup"><div className="key-setup-heading"><div><span className="field-label">CONNECT A CLIENT</span><p>Create a real free key or use one you already have.</p></div><button className="button button-outline" type="button" onClick={handleCreateKey} disabled={keyLoading || !apiOnline}>{keyLoading ? "Creating…" : "Create free key"}</button></div><form className="key-form" onSubmit={handleUseKey}><label className="sr-only" htmlFor="api-key">API key</label><input id="api-key" value={keyDraft} onChange={(event) => setKeyDraft(event.target.value)} placeholder="rl_your_api_key" autoComplete="off" /><button type="submit" className="text-button">Use key <span aria-hidden="true">→</span></button></form></div>}</div>
          <div className="metrics-grid"><Metric label="REQUEST LIMIT" value={limit ?? "—"} note="per key" /><Metric label="REMAINING" value={remaining ?? "—"} note={remaining === null ? "awaiting response" : remaining === 0 ? "limit reached" : "server-reported"} accent={remaining === 0 ? "metric-danger" : "metric-good"} /><Metric label="REQUESTS MADE" value={history.length} note="this session" /><Metric label="WINDOW" value={windowSeconds ? `${windowSeconds}s` : "—"} note={windowSeconds ? "server-reported" : history.length ? "not reported" : "awaiting response"} /><Metric label="HTTP STATUS" value={latestStatus === null ? "—" : `${latestStatus} ${latestStatus === 429 ? "LIMIT" : latestStatus >= 500 ? "ERROR" : "OK"}`} note={latestStatus === null ? "awaiting response" : "last response"} accent={latestStatus === 429 || latestStatus >= 500 ? "metric-danger" : latestStatus ? "metric-good" : ""} /></div>
          <div className="quota-block"><div className="quota-copy"><span>Rate-limit capacity used</span><strong>{used !== null && limit ? `${used} / ${limit}` : "Awaiting rate-limit headers"}</strong></div><div className={`progress-track ${limited ? "progress-limited" : ""}`} role="progressbar" aria-label="Requests used" aria-valuemin="0" aria-valuemax={limit || 100} aria-valuenow={used ?? 0}><span style={{ width: `${percentUsed}%` }} /></div></div>
          {limited && <div className="limit-alert" role="alert"><span className="alert-icon">!</span><div><strong>Rate limit exceeded <span>HTTP 429</span></strong><p>Too many requests. Please try again later.</p></div><div className="retry-value">Retry after <strong>{retryAfter !== null ? `${retryAfter}s` : "not provided"}</strong></div></div>}
          {error && !limited && <div className="inline-error" role="alert"><span>!</span>{error}</div>}
          <div className="demo-bottom"><p><span className={`status-dot ${apiOnline ? "" : "offline-dot"}`} />{apiOnline ? "Connected to API" : "Backend is unreachable"}<span className="host-label">{API_BASE_URL}</span></p><button type="button" className="button button-primary send-button" onClick={handleSendRequest} disabled={!apiKey || loading || !apiOnline}>{loading ? <><span className="spinner" /> Sending request…</> : <>Send request <span aria-hidden="true">→</span></>}</button></div>
        </div>
        <RequestHistory history={history} onClear={() => setHistory([])} />
      </div>
    </section>
  );
}

const architecture = [
  { title: "Client", detail: "Application sends an authenticated request", icon: "C", tone: "tone-blue" },
  { title: "Express API", detail: "Routes and validates incoming traffic", icon: "Ex", tone: "tone-green" },
  { title: "Limiter middleware", detail: "Applies the selected rate-limit algorithm", icon: "⇥", tone: "tone-coral" },
  { title: "Redis", detail: "Stores fast counters and bucket state", icon: "R", tone: "tone-amber" },
  { title: "Response", detail: "Returns data or HTTP 429 with metadata", icon: "↩", tone: "tone-slate" },
];

function Architecture() {
  return <section className="architecture-section"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> UNDER THE HOOD</div><h2>Every request has a path.</h2></div><span className="section-caption">One guard between your app and overload</span></div><div className="architecture-flow">{architecture.map((item, index) => <div className="architecture-step" key={item.title}><article className="architecture-node"><span className={`architecture-icon ${item.tone}`}>{item.icon}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div></article>{index < architecture.length - 1 && <span className="architecture-arrow" aria-hidden="true">→</span>}</div>)}</div><div className="architecture-note"><span className="note-symbol">i</span><span>The configured algorithm runs in middleware. Redis holds the live state; MongoDB records usage and request logs.</span></div></section>;
}

function ApiSection() {
  return <section className="api-section section-anchor" id="api"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> API REFERENCE</div><h2>Small surface. Real protection.</h2></div><a className="docs-link" href={`${GITHUB_URL}/blob/main/docs/API.md`} target="_blank" rel="noreferrer">Full API docs <span aria-hidden="true">↗</span></a></div><div className="api-layout"><div className="endpoint-detail panel"><div className="endpoint-title"><span className="method-tag">GET</span><code>/api/test</code></div><p>Protected test endpoint. Requires a valid key created through the key management API.</p><dl><div><dt>Authentication</dt><dd><code>x-api-key</code></dd></div><div><dt>Success</dt><dd><span className="status-chip success-chip">200 OK</span></dd></div><div><dt>Rate limited</dt><dd><span className="status-chip danger-chip">429 Too Many Requests</span></dd></div><div><dt>Rate limit</dt><dd>Per API key · actual limit in response headers</dd></div></dl></div><div className="response-panel"><div className="code-heading"><span><i /> ACTUAL SUCCESS RESPONSE</span><span>application/json</span></div><pre><code>{`{
  "success": true,
  "message": "Rate Limiter Test API"
}`}</code></pre><div className="code-foot">429 response: <code>{`{ "success": false, "algorithm": "fixed", "message": "Too Many Requests" }`}</code><span>Algorithm value depends on server configuration.</span></div></div></div></section>;
}

function RelatedEndpoints() {
  return <div className="route-strip" aria-label="Other API endpoints"><div><span className="route-method method-post">POST</span><code>/api/keys/generate</code><span>Create demo keys</span></div><div><span className="route-method">GET</span><code>/</code><span>Health check</span></div></div>;
}

function TechStack() {
  const groups = [{ label: "RUNTIME", items: ["Node.js", "Express 5"] }, { label: "STATE & DATA", items: ["Redis", "MongoDB", "Mongoose"] }, { label: "ALGORITHMS", items: ["Fixed window", "Sliding log", "Sliding window", "Token bucket", "Leaky bucket"] }, { label: "DEMO CLIENT", items: ["React 19", "Vite"] }];
  return <section className="stack-section"><div className="stack-title"><div className="eyebrow"><span className="eyebrow-line" /> STACK</div><h2>Built with familiar parts.</h2></div><div className="stack-groups">{groups.map((group) => <div className="stack-group" key={group.label}><span className="field-label">{group.label}</span><div>{group.items.map((item) => <span className="tech-tag" key={item}>{item}</span>)}</div></div>)}</div></section>;
}

function Footer() {
  return <footer className="footer"><a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true"><span /></span><span>rate<span className="brand-accent">guard</span></span></a><p>Built to demonstrate production-style API rate limiting.</p><a href={GITHUB_URL} target="_blank" rel="noreferrer">Source on GitHub <span aria-hidden="true">↗</span></a></footer>;
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [apiOnline, setApiOnline] = useState(false);
  const [apiKey, setApiKeyState] = useState(initialKey);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("rateguard-theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    const refreshHealth = async () => {
      try {
        const result = await checkApiHealth();
        if (active) setApiOnline(result.body.success === true);
      } catch {
        if (active) setApiOnline(false);
      }
    };
    refreshHealth();
    const intervalId = window.setInterval(refreshHealth, 15000);
    return () => { active = false; window.clearInterval(intervalId); };
  }, []);

  function setApiKey(key) {
    setApiKeyState(key);
    if (key) window.sessionStorage.setItem("rateguard-api-key", key);
    else window.sessionStorage.removeItem("rateguard-api-key");
  }

  return <><Navbar apiOnline={apiOnline} theme={theme} onToggleTheme={() => setTheme((current) => current === "light" ? "dark" : "light")} /><main><Hero /><RateLimiterDemo apiOnline={apiOnline} apiKey={apiKey} setApiKey={setApiKey} /><Architecture /><ApiSection /><RelatedEndpoints /><TechStack /></main><Footer /></>;
}
