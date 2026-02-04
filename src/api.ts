import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export interface Metric {
  key: string;
  label: string;
  value: number | null;
  unit?: string | null;
  interpretation?: string | null;
}

export interface AssessmentResult {
  overall_score: number;
  risk_level: string;
  metrics: Metric[];
  narrative: string;
  benchmarks?: BenchmarkMetric[];
}

export interface BenchmarkMetric {
  key: string;
  label: string;
  business_value: number | null;
  benchmark_value: number | null;
  status: "good" | "ok" | "risk" | string;
  note?: string | null;
}

export interface Assessment {
  id: number;
  business_name?: string | null;
  industry?: string | null;
  locale?: string | null;
  created_at: string;
  summary?: AssessmentResult | null;
}

export async function register(email: string, password: string, fullName?: string) {
  const res = await api.post("/auth/register", {
    email,
    password,
    full_name: fullName,
  });
  return res.data;
}

export async function login(email: string, password: string): Promise<string> {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const res = await api.post("/auth/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data.access_token;
}

export async function listAssessments(): Promise<Assessment[]> {
  const res = await api.get("/assessments");
  return res.data;
}

export async function createAssessment(
  meta: { business_name?: string; industry?: string; locale?: string },
  file: File,
): Promise<Assessment> {
  const form = new FormData();
  form.append("meta", JSON.stringify(meta));
  form.append("file", file);

  const res = await api.post("/assessments", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

