import React, { useEffect, useState } from "react";
import {
  Assessment,
  AssessmentResult,
  BenchmarkMetric,
  createAssessment,
  listAssessments,
  login,
  register,
  setAuthToken,
} from "../api";

type View = "auth" | "dashboard";

export const App: React.FC = () => {
  const [view, setView] = useState<View>("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selected, setSelected] = useState<Assessment | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [locale, setLocale] = useState("en");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("fh_token");
    if (stored) {
      setToken(stored);
      setAuthToken(stored);
      setView("dashboard");
      void refreshAssessments();
    }
  }, []);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      }
      const t = await login(email, password);
      setToken(t);
      setAuthToken(t);
      window.localStorage.setItem("fh_token", t);
      setView("dashboard");
      await refreshAssessments();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAssessments() {
    try {
      const data = await listAssessments();
      setAssessments(data);
      setSelected(data[0] ?? null);
    } catch {
      // ignore for now
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const a = await createAssessment(
        {
          business_name: businessName || undefined,
          industry: industry || undefined,
          locale: locale || undefined,
        },
        file,
      );
      const updated = [a, ...assessments];
      setAssessments(updated);
      setSelected(a);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setAuthToken(null);
    window.localStorage.removeItem("fh_token");
    setView("auth");
  }

  function renderBenchmarks(benchmarks?: BenchmarkMetric[]) {
    if (!benchmarks || benchmarks.length === 0) return null;

    return (
      <div className="benchmark-section">
        <h3 className="benchmark-title">Industry comparison</h3>
        <ul className="benchmark-list">
          {benchmarks.map((b) => (
            <li key={b.key} className="benchmark-row">
              <div className="benchmark-main">
                <span className="benchmark-label">{b.label}</span>
                <span className="benchmark-values">
                  {b.business_value !== null && b.business_value !== undefined
                    ? b.business_value.toFixed(2)
                    : "Insufficient data"}
                  {b.key === "margin_vs_industry" ? " %" : ""}
                </span>
              </div>
              <div
                className={
                  "benchmark-pill " +
                  (b.status === "good"
                    ? "benchmark-pill--good"
                    : b.status === "risk"
                    ? "benchmark-pill--risk"
                    : "benchmark-pill--ok")
                }
              >
                {b.status === "good" && "Above typical"}
                {b.status === "ok" && "In typical range"}
                {b.status === "risk" && "Below typical"}
                {b.status !== "good" && b.status !== "ok" && b.status !== "risk" && "—"}
              </div>
              {b.note && <p className="benchmark-note">{b.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  function renderMetrics(result: AssessmentResult) {
    return (
      <div className="metrics-grid">
        {result.metrics.map((m) => (
          <div key={m.key} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">
              {m.value !== null && m.value !== undefined ? m.value.toFixed(2) : "N/A"}{" "}
              {m.unit ?? ""}
            </div>
            {m.interpretation && <div className="metric-note">{m.interpretation}</div>}
          </div>
        ))}
      </div>
    );
  }

  if (view === "auth") {
    return (
      <div className="page page-auth">
        <div className="card auth-card">
          <h1 className="app-title">Financial Health Assessment</h1>
          <p className="app-subtitle">Secure insights for growing SMEs</p>
          <form onSubmit={handleAuthSubmit} className="form">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button className="primary-btn" disabled={loading}>
              {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>
          <button
            type="button"
            className="link-btn"
            onClick={() => setIsRegister((v) => !v)}
          >
            {isRegister ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-dashboard">
      <header className="topbar">
        <div>
          <h1 className="app-title">Financial Health Assessment</h1>
          <p className="app-subtitle">Upload your statements and get instant insights.</p>
        </div>
        <button className="ghost-btn" onClick={logout}>
          Log out
        </button>
      </header>

      <main className="layout">
        <section className="card upload-card">
          <h2>New assessment</h2>
          <form onSubmit={handleUpload} className="form">
            <div className="grid-2">
              <label className="field">
                <span>Business name</span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Traders"
                />
              </label>
              <label className="field">
                <span>Industry</span>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Retail, Manufacturing, Services..."
                />
              </label>
            </div>
            <label className="field">
              <span>Language</span>
              <select value={locale} onChange={(e) => setLocale(e.target.value)}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </label>
            <label className="field">
              <span>Financial file (CSV, XLSX, PDF export)</span>
              <input
                type="file"
                accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button className="primary-btn" disabled={loading}>
              {loading ? "Analyzing..." : "Upload & analyze"}
            </button>
          </form>
          <p className="help-text">
            We never store raw files unencrypted. All uploads are encrypted at rest and processed
            securely.
          </p>
        </section>

        <section className="card results-card">
          <h2>Insights</h2>
          {!selected ? (
            <p className="muted">Upload a file to see your financial health score.</p>
          ) : !selected.summary ? (
            <p className="muted">This assessment has no summary yet.</p>
          ) : (
            <>
              <div className="summary-header">
                <div>
                  <div className="pill">
                    {selected.summary.overall_score.toFixed(1)}/100 ·{" "}
                    {selected.summary.risk_level} risk
                  </div>
                  <h3>{selected.business_name || "Unnamed business"}</h3>
                  {selected.industry && <p className="muted">{selected.industry}</p>}
                </div>
                <div className="score-circle">
                  <span>{selected.summary.overall_score.toFixed(0)}</span>
                </div>
              </div>
              <p className="narrative">{selected.summary.narrative}</p>
              {renderBenchmarks(selected.summary.benchmarks)}
              <p className="help-text">
                <strong>Improve cash cushion:</strong> Aim to keep at least 1–2 months of
                expenses in the bank to handle slow sales or unexpected bills.
              </p>
              {renderMetrics(selected.summary)}
            </>
          )}
        </section>

        <section className="card history-card">
          <h2>Previous assessments</h2>
          {assessments.length === 0 ? (
            <p className="muted">No assessments yet.</p>
          ) : (
            <ul className="assessment-list">
              {assessments.map((a) => (
                <li
                  key={a.id}
                  className={
                    "assessment-row" + (selected?.id === a.id ? " assessment-row--active" : "")
                  }
                  onClick={() => setSelected(a)}
                >
                  <div className="assessment-main">
                    <div className="assessment-title">
                      {a.business_name || "Unnamed business"}
                    </div>
                    <div className="assessment-meta">
                      {a.industry && <span>{a.industry}</span>}
                      <span>
                        {new Date(a.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  {a.summary && (
                    <div className="assessment-score">
                      {a.summary.overall_score.toFixed(0)}/100
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

