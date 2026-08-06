export type TaskCategory = "local_verification" | "identity_action" | "physical_task" | "digital_task" | "compliance_check" | "errand";
export type ProofType = "screenshot" | "photo" | "url" | "timestamp" | "receipt" | "signature" | "notes";
export type FundingMode = "funded" | "test_no_payout";

export interface CreateTaskInput {
  title: string;
  description: string;
  category: TaskCategory;
  funding_mode: FundingMode;
  reward_usdc: number;
  deadline_hours: number;
  proof_requirements: ProofType[];
  location?: string;
  agent_name?: string;
  source?: Record<string, unknown>;
}

export interface AI2HumanOptions {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export class AI2HumanError extends Error {
  constructor(message: string, public status: number, public code: string, public details: unknown, public requestId?: string) {
    super(message);
    this.name = "AI2HumanError";
  }
}

class Transport {
  private baseUrl: string;
  private fetchImpl: typeof globalThis.fetch;
  constructor(private options: AI2HumanOptions) {
    this.baseUrl = (options.baseUrl || "https://ai2human.io").replace(/\/+$/, "");
    this.fetchImpl = options.fetch || globalThis.fetch;
  }
  async request(path: string, init: RequestInit = {}, auth: "apiKey" | "bearer" | "none" = "apiKey") {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    if (auth === "apiKey") {
      if (!this.options.apiKey) throw new AI2HumanError("AI2Human API key is required.", 401, "API_KEY_REQUIRED", null);
      headers.set("x-agent-api-key", this.options.apiKey);
    }
    if (auth === "bearer") {
      if (!this.options.accessToken) throw new AI2HumanError("AI2Human access token is required.", 401, "ACCESS_TOKEN_REQUIRED", null);
      headers.set("Authorization", `Bearer ${this.options.accessToken}`);
    }
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {...init, headers});
    const payload = await response.json().catch(() => ({error: `HTTP ${response.status}`}));
    if (!response.ok) throw new AI2HumanError(String(payload.error || `HTTP ${response.status}`), response.status, String(payload.code || "HTTP_ERROR"), payload.details ?? payload, response.headers.get("x-request-id") || undefined);
    return payload;
  }
}

export class AI2Human {
  private transport: Transport;
  constructor(options: AI2HumanOptions = {}) { this.transport = new Transport(options); }
  tasks = {
    create: (input: CreateTaskInput, options: {idempotencyKey?: string} = {}) => this.transport.request("/api/agent/tasks", {method:"POST", headers: options.idempotencyKey ? {"Idempotency-Key": options.idempotencyKey} : {}, body: JSON.stringify(input)}),
    get: (taskId: string) => this.transport.request(`/api/tasks/${encodeURIComponent(taskId)}`, {}, "none"),
    categories: () => this.transport.request("/api/agent/tasks/categories"),
    proof: (taskId: string) => this.transport.request(`/api/tasks/${encodeURIComponent(taskId)}/proof`, {}, "bearer")
  };
}
