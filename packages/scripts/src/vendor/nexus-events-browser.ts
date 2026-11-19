/**
 * nexus-events-browser.ts — browser-side client for CX Nexus (GPS):
 * event tracking + user-only recommendation fetching.
 *
 * Two ways to use it (same code, built from this one file):
 *   1. Vendor: copy this file into your web app. It is self-contained (no
 *      imports, native fetch).
 *   2. Hosted: load it from Nexus, e.g.
 *      https://nexus.webflow.com/sdk/nexus-events-browser@<version>.js
 *      (classic <script>, sets window.NexusEvents) or the `.mjs` ES module.
 *      Pin a version and use its integrity hash from /sdk/manifest.json.
 * Source of truth: the cx-nexus repo (docs/events-integration.md).
 *
 * Auth: use a PER-CONSUMER CLIENT KEY (`nxk_…`), issued via the Nexus admin
 * `/admin/api-consumers` page — NOT the server NEXUS_API_TOKEN. Client keys
 * are safe to embed in browser bundles: they can ingest events, and (when the
 * consumer's "allow item reads" flag is enabled) fetch user-only
 * recommendations — nothing else. They are only accepted from your registered
 * origins: your page's origin (e.g. https://university.webflow.com) must be
 * on your consumer record's allowed-origins list, or both the CORS preflight
 * and the request itself will be rejected.
 *
 * Key scopes (CXP-963): each key is limited to the surfaces on its consumer
 * record. A surface outside that list is refused (403, `surface_not_allowed`).
 * `userId` / `workspaceId` must be raw Webflow IDs (400 `invalid_request`
 * otherwise). A user Nexus has not seen is created when your key allows it;
 * otherwise their events are still recorded and item requests return the
 * surface's fallback list (`meta.fallback`).
 *
 * This client covers user-only recommendations (`getUserItems`). Workspace
 * recommendations (`/api/items/{workspaceId}/{userId}`) accept a client key
 * with item reads too, but have no method here: use nexus-events.ts
 * server-side, or call the endpoint directly.
 */

/**
 * Bump when this file changes. Sent as `clientVersion` on every event and
 * recorded in the impressions log, so a vendored copy that has drifted behind
 * cx-nexus is visible in a query instead of being guessed at.
 */
export const NEXUS_CLIENT_VERSION = '2026.11.09.1'

/**
 * Set to true only in the copy Nexus hosts at /sdk/ (scripts/build-sdk.mjs
 * defines it at build time). A vendored copy leaves it undefined.
 */
declare const __NEXUS_HOSTED__: boolean | undefined

/**
 * What this copy stamps as `clientVersion`: `2026.11.09.1` when vendored,
 * `2026.11.09.1-hosted` when loaded from Nexus, so the impressions log shows
 * which way each consumer integrates.
 */
export const NEXUS_CLIENT_VERSION_STAMP =
  typeof __NEXUS_HOSTED__ !== 'undefined' && __NEXUS_HOSTED__
    ? `${NEXUS_CLIENT_VERSION}-hosted`
    : NEXUS_CLIENT_VERSION

/** Hosted ES module only: its own URL, set by a banner in scripts/build-sdk.mjs. */
declare const __NEXUS_MODULE_URL__: string | undefined

/**
 * Hosted copy only: the origin this file was loaded from, e.g.
 * https://nexus.webflowtest.com. It is the default `baseUrl`, so the script
 * and the API always come from the same environment. Captured while the file
 * runs, because `document.currentScript` is null afterwards. Undefined in a
 * vendored copy.
 */
export const NEXUS_SCRIPT_ORIGIN: string | undefined = (() => {
  if (typeof __NEXUS_HOSTED__ === 'undefined' || !__NEXUS_HOSTED__) return undefined
  try {
    const moduleUrl = typeof __NEXUS_MODULE_URL__ !== 'undefined' ? __NEXUS_MODULE_URL__ : undefined
    const script = typeof document !== 'undefined' ? document.currentScript : null
    const src = moduleUrl || (script && 'src' in script ? (script as HTMLScriptElement).src : '')
    const origin = src ? new URL(src).origin : ''
    return origin && origin !== 'null' ? origin : undefined
  } catch {
    return undefined
  }
})()

// ── Errors ───────────────────────────────────────────────────────────────────

/**
 * Why a request failed. The browser client never throws: failures resolve to
 * `{ ok: false, error }` / `null` and are reported to `onError` if you set it.
 *
 *   invalid_request         400 — bad payload, or a userId/workspaceId that is
 *                           not a Webflow ID
 *   unauthorized            401 — wrong key, revoked key, or page origin not on
 *                           the key's allowed origins
 *   surface_not_allowed     403 — surface not in the key's allowed surfaces
 *   items_read_not_enabled  403 — key may send events but not read items
 *   forbidden               403 — any other refusal
 *   unknown_item            404 — itemId does not exist in Nexus (your bug)
 *   server_error            5xx — transient, safe to retry later
 *   network                 request never completed
 *   invalid_key             not an `nxk_` key: nothing was sent
 *   invalid_config          no baseUrl (vendored copies must pass one): nothing was sent
 */
export type NexusErrorCode =
  | 'invalid_request'
  | 'unauthorized'
  | 'surface_not_allowed'
  | 'items_read_not_enabled'
  | 'forbidden'
  | 'unknown_item'
  | 'server_error'
  | 'network'
  | 'invalid_key'
  | 'invalid_config'

export type NexusClientError = {
  code: NexusErrorCode
  /** HTTP status, or 0 when no response was received. */
  status: number
  /** Server message when there was one. */
  message: string
  /** Which call failed. */
  operation: 'sendEvent' | 'getUserItems'
}

/** Map an HTTP failure to a NexusErrorCode. */
export function classifyNexusError(status: number, message: string): NexusErrorCode {
  if (status === 400) return 'invalid_request'
  if (status === 401) return 'unauthorized'
  if (status === 403) {
    if (/^Surface .* not allowed/i.test(message)) return 'surface_not_allowed'
    if (/not enabled for item reads/i.test(message)) return 'items_read_not_enabled'
    return 'forbidden'
  }
  if (status === 404) return 'unknown_item'
  return 'server_error'
}

async function errorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => '')
  try {
    const parsed = JSON.parse(text) as { error?: unknown }
    if (typeof parsed?.error === 'string') return parsed.error
  } catch {
    // not JSON
  }
  return text
}

// ── Feedback types (mirror of the server client) ─────────────────────────────

// Only the types a consumer page or service sends. Opportunity, feature-usage,
// upgrade and support signals (and health_tier_reached) are produced by Nexus
// itself from CRM and usage data, so they are not part of this client. The
// server still accepts any catalogue type.

export type ReadFeedbackType =
  | 'view' // item rendered in front of the user
  | 'click_read' // clicked through to read the item content
  | 'uni_start' // started a University course/video
  | 'dismiss' // explicitly dismissed the item
  | 'snooze' // snoozed the item

export type PositiveFeedbackType =
  | 'click' // general click engagement on the item
  | 'uni_complete' // completed a University course/video
  | 'share' // shared the content
  | 'complete' // task/action finished. Also advances Nexus onboarding progress for the item.

export type FeedbackType = ReadFeedbackType | PositiveFeedbackType

// ── Page context ─────────────────────────────────────────────────────────────

/** The only campaign params Nexus reads. Everything else in a query string is dropped. */
export type NexusUtm = {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
}

export type NexusEventContext = {
  /** Page origin only, e.g. "https://university.webflow.com". Never a full href. */
  origin?: string
  /**
   * Page path, e.g. "/courses/intro-to-cms". Must already be sanitized by you:
   * strip any segment that names a customer (workspace slugs, account names).
   * Nexus cuts anything from `?` or `#` onward but cannot know which of your
   * path segments are identifying.
   */
  path?: string
  utm?: NexusUtm
}

export type NexusEvent = {
  feedbackType: FeedbackType
  /**
   * Raw Webflow workspace ID — no `w_` prefix. Optional: omit on user-only
   * surfaces (e.g. University) with no workspace context. Note `complete`
   * only advances onboarding progress when a workspaceId is provided.
   */
  workspaceId?: string
  /** Raw Webflow user ID — no `u_` prefix. */
  userId: string
  /** `item_`-prefixed item ID, e.g. `item_sso-setup-guide`. Use toItemId(). */
  itemId: string
  /** UI surface slug the event occurred on, e.g. `university-courses`. */
  surface?: string
  /**
   * Opaque ID grouping events from one visit — generate with
   * crypto.randomUUID(). Max 64 chars of [A-Za-z0-9._:-], dropped otherwise.
   * NOT an auth token, cookie value, or JWT: this lands in an append-only log.
   */
  sessionId?: string
  /** Where the event happened. Build it with buildEventContext(). */
  context?: NexusEventContext
  /** Set automatically by sendEvent(). You do not need to pass this. */
  clientVersion?: string
}

/** Convert a plain item slug to the API item ID: "sso-setup-guide" → "item_sso-setup-guide". */
export const toItemId = (slug: string): string =>
  slug.startsWith('item_') ? slug : `item_${slug}`

/**
 * Build the optional context block.
 *
 * `path` is required and has no default on purpose: this function will NOT read
 * window.location.pathname for you, because only you know which of your path
 * segments identify a customer. Pass your own sanitized path — in the
 * Enterprise Portal that is getDashboardPageForAnalytics(usePathname()).
 *
 * `search` and `origin` default to the current page. Note that UTMs live on the
 * URL the user landed on, so in a single-page app they are usually gone by the
 * time a component renders — snapshot them at first load and pass them here.
 */
export function buildEventContext(input: {
  path: string
  /** Query string to read UTMs from. Defaults to window.location.search. */
  search?: string
  /** Defaults to window.location.origin. */
  origin?: string
}): NexusEventContext {
  const loc = typeof window !== 'undefined' ? window.location : undefined
  const context: NexusEventContext = {}

  const origin = input.origin ?? loc?.origin
  if (origin) context.origin = origin

  let path = input.path
  if (path.includes('://') || path.includes('?') || path.includes('#')) {
    console.warn(
      '[nexus-events] buildEventContext: `path` must be a bare path, not a URL. ' +
        'Stripping query/fragment — check you are not passing window.location.href.'
    )
    const cut = path.search(/[?#]/)
    if (cut !== -1) path = path.slice(0, cut)
    if (path.includes('://')) path = ''
  }
  if (path.startsWith('/')) context.path = path

  const search = input.search ?? loc?.search
  if (search) {
    const params = new URLSearchParams(search)
    const utm: NexusUtm = {}
    for (const key of ['source', 'medium', 'campaign', 'term', 'content'] as const) {
      const value = params.get(`utm_${key}`)?.trim()
      if (value) utm[key] = value.slice(0, 128)
    }
    if (Object.keys(utm).length > 0) context.utm = utm
  }

  return context
}

// ── Recommendations (user-only surfaces) ─────────────────────────────────────

export type UserItemsRequest = {
  /** Raw Webflow user ID — no `u_` prefix. */
  userId: string
  /** Surface slug, e.g. `university-courses`. */
  surface: string
  /**
   * `user` (default): personalized recommendations for the surface, e.g.
   * frontpage recommended courses. `related`: item-to-item "try these next"
   * for the item currently being viewed — requires `itemId`.
   */
  type?: 'user' | 'related'
  /** How many items (default 4, server caps at 12). */
  n?: number
  /** The item the user is on (for type=related). `item_` prefix or plain slug. */
  itemId?: string
}

export type NexusItem = {
  itemId: string
  slug: string
  title: string | null
  type: string | null
  description: string | null
  body: string | null
  icon: string | null
  imageUrl: string | null
  buttonText: string | null
  buttonUrl: string | null
  buttonUrlType: string | null
  documentationLink: string | null
}

/**
 * Why the surface fallback list was served instead of personalised results:
 *   unknown_user  Nexus has not seen the user and your key may not create users
 *   new_user      this request created the user, so there is no history yet
 *   gorse_failed  the recommender was unavailable
 *   gorse_empty   the recommender had nothing for this surface
 */
export type FallbackReason = 'unknown_user' | 'new_user' | 'gorse_failed' | 'gorse_empty'

/** The surface's configured fallback: a fixed list, a playbook, or newest items. */
export type FallbackSource = 'items' | 'playbook' | 'latest'

export type UserItemsResponse = {
  surface: string
  type: 'user' | 'related'
  /** May be empty, including when `meta.fallback` is true and no fallback is configured. */
  items: NexusItem[]
  meta: {
    userId: string
    requested: number
    governanceApplied: string[]
    /** True when these are the surface's fallback items, not personalised results. */
    fallback: boolean
    /** Set when `fallback` is true. */
    fallbackReason: FallbackReason | null
    /** The fallback that produced the items; null when the surface has none. */
    fallbackSource: FallbackSource | null
  }
}

// ── Client ───────────────────────────────────────────────────────────────────

export type NexusBrowserClientOptions = {
  /**
   * https://nexus.webflow.com (prod), https://nexus.webflowtest.com
   * (acceptance), or http://localhost:3001 (local). Optional when the file is
   * loaded from Nexus (/sdk/): it defaults to the origin the file came from.
   * Required in a vendored copy.
   */
  baseUrl?: string
  /** Per-consumer client key (`nxk_…`) from the Nexus admin API-consumers page. */
  clientKey: string
  /**
   * Called for every failed request, e.g. to send to your own error tracking.
   * Must not throw; if it does, the error is caught and logged.
   */
  onError?: (error: NexusClientError) => void
}

export function createNexusBrowserClient({ baseUrl, clientKey, onError }: NexusBrowserClientOptions) {
  const base = (baseUrl ?? NEXUS_SCRIPT_ORIGIN ?? '').replace(/\/$/, '')

  function report(error: NexusClientError): NexusClientError {
    console.warn(`[nexus-events] ${error.operation} failed: ${error.code} (${error.status})`, error.message)
    try {
      onError?.(error)
    } catch (err) {
      console.warn('[nexus-events] onError threw', err)
    }
    return error
  }

  async function httpError(res: Response, operation: NexusClientError['operation']): Promise<NexusClientError> {
    const message = await errorMessage(res)
    return report({ code: classifyNexusError(res.status, message), status: res.status, message, operation })
  }

  function networkError(err: unknown, operation: NexusClientError['operation']): NexusClientError {
    return report({ code: 'network', status: 0, message: err instanceof Error ? err.message : String(err), operation })
  }

  // The server token (NEXUS_API_TOKEN) grants every Nexus endpoint and must
  // never reach a browser bundle. Consumer keys are the only browser-safe
  // credential and always start `nxk_`, so anything else here is a
  // misconfiguration worth failing loudly rather than shipping.
  // Configuration problems are reported once here and make every call a no-op.
  let configError: NexusClientError | null = null
  if (!clientKey.startsWith('nxk_')) {
    console.error(
      '[nexus-events] clientKey must be an `nxk_…` consumer key from /admin/api-consumers, ' +
        'never NEXUS_API_TOKEN. Refusing to send.'
    )
    configError = { code: 'invalid_key', status: 0, message: 'clientKey is not an nxk_ key', operation: 'sendEvent' }
  } else if (!base) {
    console.error('[nexus-events] baseUrl is required when this file is not loaded from Nexus. Refusing to send.')
    configError = { code: 'invalid_config', status: 0, message: 'baseUrl is missing', operation: 'sendEvent' }
  }

  return {
    /**
     * Record a user interaction with a Nexus item.
     *
     * Fire-and-forget: never throws into UI code — failures are logged with
     * console.warn and resolve to { ok: false }. `keepalive: true` lets the
     * request survive page navigation (e.g. a click event right before the
     * browser follows a link).
     *
     * `error.code` says why it failed. `unknown_item` (404) means the item slug
     * does not exist in Nexus — a bug in the identifier you passed, not an
     * outage: check you sent toItemId(item.slug). Only `server_error` and
     * `network` are worth retrying.
     */
    async sendEvent(event: NexusEvent): Promise<{ ok: true } | { ok: false; error: NexusClientError }> {
      if (configError) return { ok: false, error: { ...configError, operation: 'sendEvent' } }
      try {
        const res = await fetch(`${base}/api/events`, {
          method: 'POST',
          keepalive: true,
          headers: {
            Authorization: `Bearer ${clientKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...event, clientVersion: NEXUS_CLIENT_VERSION_STAMP }),
        })
        if (!res.ok) return { ok: false, error: await httpError(res, 'sendEvent') }
        return { ok: true }
      } catch (err) {
        return { ok: false, error: networkError(err, 'sendEvent') }
      }
    },

    /**
     * Fetch recommendations for a user-only surface.
     *
     * Requires the consumer's "allow item reads" flag
     * (`items_read_not_enabled` otherwise) and a surface in the key's scope
     * (`surface_not_allowed`). Never throws — returns null on any failure so
     * the UI can fall back to its default content; set `onError` to see why.
     *
     * A successful response can still be a fallback: check `meta.fallback`
     * before treating the items as personalised.
     */
    async getUserItems(req: UserItemsRequest): Promise<UserItemsResponse | null> {
      if (configError) return null
      try {
        const qs = new URLSearchParams({ surface: req.surface })
        if (req.type) qs.set('type', req.type)
        if (req.n) qs.set('n', String(req.n))
        if (req.itemId) qs.set('itemId', req.itemId)
        const res = await fetch(
          `${base}/api/items/user/${encodeURIComponent(req.userId)}?${qs}`,
          { headers: { Authorization: `Bearer ${clientKey}` } }
        )
        if (!res.ok) {
          await httpError(res, 'getUserItems')
          return null
        }
        return (await res.json()) as UserItemsResponse
      } catch (err) {
        networkError(err, 'getUserItems')
        return null
      }
    },
  }
}

export type NexusBrowserClient = ReturnType<typeof createNexusBrowserClient>
