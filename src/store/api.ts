/**
 * Every backend call, as an RTK Query API slice.
 *
 * The browser only talks to this Next.js app: next.config rewrites /api/* to the FastAPI backend, so the
 * backend's session cookie is first-party and no CORS setup is needed. State-changing requests send the
 * session's CSRF token (from GET /api/me or the last login response) as X-CSRF-Token.
 */
import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type {
  Account,
  ApiKey,
  ApiKeyWithSecret,
  Broker,
  BrokerAccess,
  Invite,
  InviteResult,
  Me,
  Property,
  PropertySummary,
  Reel,
  ScrapeJob,
  SessionResponse,
  SnapshotRow,
} from "@/lib/types";
import { csrfUpdated, sessionLoaded, signedOut, type AuthState } from "./auth-slice";

/** What a failed request gives the UI: a readable message plus the login failure count. */
export interface ApiError {
  status: number | string;
  message: string;
  failedAttempts: number;
}

type Ok = { ok: boolean };

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "same-origin",
  prepareHeaders(headers, { getState, type }) {
    const csrf = (getState() as { auth: AuthState }).auth.csrf;
    if (type === "mutation" && csrf) headers.set("X-CSRF-Token", csrf);
    return headers;
  },
});

function readableDetail(data: unknown, status: number | string): string {
  const detail = (data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((d: { loc?: unknown[]; msg?: string }) => `${String(d.loc?.at(-1) ?? "field")}: ${d.msg}`).join("; ");
  if (status === "FETCH_ERROR") return "Can't reach the server. Check your connection and that the backend is running.";
  if (status === "PARSING_ERROR") return "The server sent an unexpected response.";
  return `Request failed (${status})`;
}

/** Adds: one retry after refreshing an expired CSRF token, logout on 401, and readable errors. */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiError> = async (args, api, extra) => {
  let result = await rawBaseQuery(args, api, extra);

  const detail = (result.error?.data as { detail?: unknown } | undefined)?.detail;
  if (result.error?.status === 403 && typeof detail === "string" && detail.startsWith("CSRF")) {
    const me = await rawBaseQuery("/me", api, extra);
    const csrf = (me.data as Me | undefined)?.csrf;
    if (csrf) {
      api.dispatch(csrfUpdated(csrf));
      result = await rawBaseQuery(args, api, extra);
    }
  }

  if (!result.error) return { data: result.data, meta: result.meta };
  const error = result.error as FetchBaseQueryError;
  const signedIn = (api.getState() as { auth: AuthState }).auth.status === "signed-in";
  if (error.status === 401 && signedIn && api.endpoint !== "login") api.dispatch(signedOut());
  return {
    error: {
      status: error.status,
      message: readableDetail("data" in error ? error.data : undefined, error.status),
      failedAttempts: Number(result.meta?.response?.headers.get("X-Failed-Attempts")) || 0,
    },
  };
};

const TAGS = ["Properties", "Property", "Reels", "History", "Brokers", "ApiKeys", "Account"] as const;

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: TAGS,
  endpoints: (b) => ({
    /* ------------------------------------------------------------ session -- */
    me: b.query<Me, void>({
      query: () => "/me",
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(sessionLoaded({ user: data.user, csrf: data.csrf, canShowWindow: data.can_show_window }));
        } catch {
          dispatch(sessionLoaded({ user: null }));
        }
      },
    }),
    login: b.mutation<SessionResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      onQueryStarted: storeSession,
    }),
    signup: b.mutation<SessionResponse, { name: string; email: string; password: string }>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
      onQueryStarted: storeSession,
    }),
    logout: b.mutation<{ ok: boolean; csrf: string }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const result = await queryFulfilled.catch(() => null);
        dispatch(signedOut(result?.data.csrf));
        dispatch(api.util.resetApiState());
      },
    }),
    forgotPassword: b.mutation<{ ok: boolean; message: string }, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    passwordReset: b.query<{ email: string }, string>({ query: (token) => `/password-resets/${encodeURIComponent(token)}` }),
    resetPassword: b.mutation<SessionResponse, { token: string; password: string }>({
      query: ({ token, password }) => ({ url: `/password-resets/${encodeURIComponent(token)}`, method: "POST", body: { password } }),
      onQueryStarted: storeSession,
    }),
    invite: b.query<Invite, string>({ query: (token) => `/invites/${encodeURIComponent(token)}` }),
    acceptInvite: b.mutation<SessionResponse, { token: string; password: string }>({
      query: ({ token, password }) => ({ url: `/invites/${encodeURIComponent(token)}/accept`, method: "POST", body: { password } }),
      onQueryStarted: storeSession,
    }),

    /* ----------------------------------------------------------- recovery -- */
    recover: b.mutation<{ ok: boolean; message: string }, { email: string; recovery_email: string }>({
      query: (body) => ({ url: "/auth/recover", method: "POST", body }),
    }),
    recoverVerify: b.mutation<Ok, { email: string; code: string }>({
      query: (body) => ({ url: "/auth/recover/verify", method: "POST", body }),
    }),
    recoverPassword: b.mutation<SessionResponse, { password: string }>({
      query: (body) => ({ url: "/auth/recover/password", method: "POST", body }),
      onQueryStarted: storeSession,
    }),

    /* ------------------------------------------------------------ account -- */
    account: b.query<Account, void>({ query: () => "/account", providesTags: ["Account"] }),
    setRecoveryEmail: b.mutation<Account, { email: string; password: string }>({
      query: (body) => ({ url: "/account/recovery-email", method: "POST", body }),
      onQueryStarted: storeAccount,
    }),
    verifyRecoveryEmail: b.mutation<Account, { code: string }>({
      query: (body) => ({ url: "/account/recovery-email/verify", method: "POST", body }),
      onQueryStarted: storeAccount,
    }),
    removeRecoveryEmail: b.mutation<Account, { password: string }>({
      query: (body) => ({ url: "/account/recovery-email/remove", method: "POST", body }),
      onQueryStarted: storeAccount,
    }),
    changeLoginEmail: b.mutation<Account, { email: string; password: string }>({
      query: (body) => ({ url: "/account/email", method: "POST", body }),
      onQueryStarted: storeAccount,
    }),
    verifyLoginEmail: b.mutation<Account, { code: string }>({
      query: (body) => ({ url: "/account/email/verify", method: "POST", body }),
      async onQueryStarted(arg, ctx) {
        await storeAccount(arg, ctx);
        const result = await ctx.queryFulfilled.catch(() => null);
        if (result?.data.user) ctx.dispatch(sessionLoaded({ user: result.data.user }));
      },
    }),
    resendCode: b.mutation<Account, "recovery-email" | "email">({
      query: (kind) => ({ url: `/account/${kind}/resend`, method: "POST" }),
      onQueryStarted: storeAccount,
    }),
    cancelCode: b.mutation<Account, "recovery-email" | "email">({
      query: (kind) => ({ url: `/account/${kind}/cancel`, method: "POST" }),
      onQueryStarted: storeAccount,
    }),

    /* --------------------------------------------------------- properties -- */
    properties: b.query<PropertySummary[], void>({ query: () => "/properties", providesTags: ["Properties"] }),
    property: b.query<Property, string>({ query: (id) => `/properties/${id}`, providesTags: (_r, _e, id) => [{ type: "Property", id }] }),
    createProperty: b.mutation<{ id: string }, { address: string; links: string[] }>({
      query: (body) => ({ url: "/properties", method: "POST", body }),
      invalidatesTags: ["Properties"],
    }),
    editProperty: b.mutation<Ok, { id: string; address: string }>({
      query: ({ id, address }) => ({ url: `/properties/${id}`, method: "PATCH", body: { address } }),
      invalidatesTags: (_r, _e, { id }) => ["Properties", { type: "Property", id }],
    }),
    setArchived: b.mutation<Ok, { id: string; archived: boolean }>({
      query: ({ id, archived }) => ({ url: `/properties/${id}/${archived ? "archive" : "unarchive"}`, method: "POST" }),
      invalidatesTags: (_r, _e, { id }) => ["Properties", { type: "Property", id }],
    }),
    deleteProperty: b.mutation<Ok, string>({
      query: (id) => ({ url: `/properties/${id}`, method: "DELETE" }),
      invalidatesTags: ["Properties", "Brokers"],
    }),

    /* -------------------------------------------------------------- reels -- */
    reels: b.query<Reel[], string>({
      query: (propertyId) => `/properties/${propertyId}/reels`,
      transformResponse: (r: { reels: Reel[] }) => r.reels,
      providesTags: (_r, _e, id) => [{ type: "Reels", id }],
    }),
    addReel: b.mutation<Ok, { propertyId: string; url: string }>({
      query: ({ propertyId, url }) => ({ url: `/properties/${propertyId}/reels`, method: "POST", body: { url } }),
      invalidatesTags: (_r, _e, { propertyId }) => ["Properties", { type: "Property", id: propertyId }, { type: "Reels", id: propertyId }],
    }),
    removeReel: b.mutation<Ok, { propertyId: string; reelId: string }>({
      query: ({ propertyId, reelId }) => ({ url: `/properties/${propertyId}/reels/${reelId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { propertyId }) => ["Properties", { type: "Property", id: propertyId }, { type: "Reels", id: propertyId }],
    }),
    reelHistory: b.query<SnapshotRow[], string>({ query: (reelId) => `/reels/${reelId}/history`, providesTags: (_r, _e, id) => [{ type: "History", id }] }),
    fetchPublic: b.mutation<{ job_id: string; reels: number }, { propertyId: string; showWindow: boolean; reelIds?: string[] }>({
      query: ({ propertyId, showWindow, reelIds }) => ({
        url: `/properties/${propertyId}/fetch-public`,
        method: "POST",
        body: { show_window: showWindow, reel_ids: reelIds ?? null },
      }),
    }),
    scrapeJob: b.query<ScrapeJob, string>({ query: (jobId) => `/scrape-jobs/${jobId}`, keepUnusedDataFor: 0 }),

    /* ------------------------------------------------------------ brokers -- */
    brokers: b.query<Broker[], void>({ query: () => "/brokers", providesTags: ["Brokers"] }),
    inviteBroker: b.mutation<InviteResult, { email: string; name: string; brokerage: string; property_id: string; access: BrokerAccess }>({
      query: (body) => ({ url: "/brokers/invite", method: "POST", body }),
      invalidatesTags: (_r, _e, { property_id }) => ["Brokers", { type: "Property", id: property_id }],
    }),
    resendInvite: b.mutation<InviteResult, string>({ query: (brokerId) => ({ url: `/brokers/${brokerId}/resend`, method: "POST" }) }),
    changeBrokerAccess: b.mutation<Ok, { propertyId: string; brokerId: string; access: BrokerAccess }>({
      query: ({ propertyId, brokerId, access }) => ({ url: `/properties/${propertyId}/brokers/${brokerId}`, method: "PATCH", body: { access } }),
      invalidatesTags: (_r, _e, { propertyId }) => ["Brokers", { type: "Property", id: propertyId }],
    }),
    removeBroker: b.mutation<Ok, { propertyId: string; brokerId: string }>({
      query: ({ propertyId, brokerId }) => ({ url: `/properties/${propertyId}/brokers/${brokerId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { propertyId }) => ["Brokers", { type: "Property", id: propertyId }],
    }),

    /* ----------------------------------------------------------- API keys -- */
    apiKeys: b.query<ApiKey[], void>({ query: () => "/api-keys", providesTags: ["ApiKeys"] }),
    createApiKey: b.mutation<ApiKeyWithSecret, { name: string; scopes: string[]; environment: "production" | "preview"; expires_in_days: number | null }>({
      query: (body) => ({ url: "/api-keys", method: "POST", body }),
      invalidatesTags: ["ApiKeys"],
    }),
    rotateApiKey: b.mutation<ApiKeyWithSecret, string>({
      query: (id) => ({ url: `/api-keys/${id}/rotate`, method: "POST", body: { grace_hours: 24 } }),
      invalidatesTags: ["ApiKeys"],
    }),
    revokeApiKey: b.mutation<Ok, string>({ query: (id) => ({ url: `/api-keys/${id}`, method: "DELETE" }), invalidatesTags: ["ApiKeys"] }),
  }),
});

/* Shared onQueryStarted handlers. Declared as functions so they can be referenced above. */

async function storeSession(
  _arg: unknown,
  { dispatch, queryFulfilled }: { dispatch: (a: unknown) => unknown; queryFulfilled: Promise<{ data: SessionResponse }> },
) {
  const result = await queryFulfilled.catch(() => null);
  if (!result) return;
  // A new session: drop everything cached for whoever was signed in before.
  dispatch(api.util.resetApiState());
  dispatch(sessionLoaded({ user: result.data.user, csrf: result.data.csrf }));
}

async function storeAccount(
  _arg: unknown,
  { dispatch, queryFulfilled }: { dispatch: (a: unknown) => unknown; queryFulfilled: Promise<{ data: Account }> },
) {
  const result = await queryFulfilled.catch(() => null);
  if (result) dispatch(api.util.upsertQueryData("account", undefined, result.data));
}

export const {
  useMeQuery,
  useLoginMutation,
  useSignupMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  usePasswordResetQuery,
  useResetPasswordMutation,
  useInviteQuery,
  useAcceptInviteMutation,
  useRecoverMutation,
  useRecoverVerifyMutation,
  useRecoverPasswordMutation,
  useAccountQuery,
  useSetRecoveryEmailMutation,
  useVerifyRecoveryEmailMutation,
  useRemoveRecoveryEmailMutation,
  useChangeLoginEmailMutation,
  useVerifyLoginEmailMutation,
  useResendCodeMutation,
  useCancelCodeMutation,
  usePropertiesQuery,
  usePropertyQuery,
  useCreatePropertyMutation,
  useEditPropertyMutation,
  useSetArchivedMutation,
  useDeletePropertyMutation,
  useReelsQuery,
  useAddReelMutation,
  useRemoveReelMutation,
  useReelHistoryQuery,
  useFetchPublicMutation,
  useScrapeJobQuery,
  useBrokersQuery,
  useInviteBrokerMutation,
  useResendInviteMutation,
  useChangeBrokerAccessMutation,
  useRemoveBrokerMutation,
  useApiKeysQuery,
  useCreateApiKeyMutation,
  useRotateApiKeyMutation,
  useRevokeApiKeyMutation,
} = api;

/** Message for a failed query/mutation (RTK Query error or anything thrown). */
export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Something went wrong";
}
