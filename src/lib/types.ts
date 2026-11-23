/** Shapes returned by the backend API (backend/app). SQLite returns booleans as 0/1, hence `Flag`. */

export type Role = "agent" | "broker";
export type Access = "agent" | "full" | "view";
export type BrokerAccess = Exclude<Access, "agent">;
export type Platform = "instagram" | "facebook" | "youtube" | "tiktok";
type Flag = boolean | number;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  brokerage: string | null;
}

export interface Me {
  user: User | null;
  csrf: string;
  local_only: boolean;
  can_show_window: boolean;
}

/** Login/sign-up/reset/recover/invite responses: the user is now logged in. */
export interface SessionResponse {
  user: User;
  csrf: string;
}

export interface PropertySummary {
  id: string;
  address: string;
  active: Flag;
  access: Access;
  agent_name: string | null;
  reel_count: number;
  total_views: number | null;
}

export interface PropertyBroker {
  id: string;
  name: string;
  email: string;
  brokerage: string | null;
  access: BrokerAccess;
  active: Flag;
}

export interface Property extends PropertySummary {
  brokers?: PropertyBroker[]; // only for the property's agent
}

export interface Metrics {
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
}

export interface Reel {
  id: string;
  platform: Platform;
  caption: string | null;
  permalink: string | null;
  embed_url: string | null;
  metrics: Metrics | null;
  metrics_updated_at: string | null;
}

/** Raw history row; `metrics_json` is a JSON string of Metrics. */
export interface SnapshotRow {
  fetched_at: string;
  metrics_json: string | null;
  source: string | null;
  source_detail: string | null;
}

export interface BrokerProperty {
  property_id: string;
  address: string;
  access: BrokerAccess;
}

export interface Broker {
  id: string;
  name: string;
  email: string;
  brokerage: string | null;
  active: boolean;
  properties: BrokerProperty[];
}

export interface InviteResult {
  ok: boolean;
  pending?: boolean;
  emailed: boolean;
  invite_link?: string; // only when the server has no SMTP settings
}

export type ApiKeyStatus = "active" | "expired" | "revoked";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  environment: "production" | "preview";
  status: ApiKeyStatus;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface ApiKeyWithSecret extends ApiKey {
  secret: string;
  previous_key_expires_at?: string | null;
}

export interface Account {
  name: string;
  email: string;
  role: Role;
  recovery_email: string | null;
  recovery_email_verified_at: string | null;
  pending_recovery_email: string | null;
  pending_login_email: string | null;
  same_domain?: boolean;
  user?: User; // after a login-email change
}

export interface JobLine {
  t: number;
  msg: string;
}

/** A dashboard fetch read inside the request: how many links were read, failed or are still to read. */
export interface FetchSummary {
  id: string;
  status: "queued" | "running" | "done" | "partial" | "failed" | "cancelled";
  ok: number;
  failed: number;
  pending: number;
}

export interface ScrapeJob {
  id: string;
  status: "running" | "done" | "error";
  current: string | null;
  elapsed: number;
  screenshot: string | null;
  log: JobLine[];
  results: { ok: boolean }[];
}

export interface Invite {
  email: string;
  name: string;
  brokerage: string | null;
  invited_by: string | null;
}
