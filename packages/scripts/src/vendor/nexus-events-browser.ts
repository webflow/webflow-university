/**
 * nexus-events-browser.ts — browser-side client for CX Nexus (GPS):
 * event tracking + user-only recommendation fetching.
 *
 * Copy/vendor this file into your web app — it is self-contained (no imports,
 * native fetch). Source of truth: the cx-nexus repo
 * (docs/events-integration.md). Check back there for updates.
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
 * Workspace-scoped recommendations (`/api/items/{workspaceId}/{userId}`)
 * require the server token and must stay server-side (see nexus-events.ts).
 */

/**
 * Bump when this file changes. Sent as `clientVersion` on every event and
 * recorded in the impressions log, so a vendored copy that has drifted behind
 * cx-nexus is visible in a query instead of being guessed at.
 */
export const NEXUS_CLIENT_VERSION = '2026.08.14'

// ── Feedback types (mirror of the server client) ─────────────────────────────

export type ReadFeedbackType =
  | 'view' // item rendered in front of the user
  | 'click_read' // clicked through to read the item content
  | 'opportunity' // opportunity-related view/interaction
  | 'feature_usage' // interacted with the related feature
  | 'uni_start' // started a University course/video
  | 'support' // support-related view
  | 'dismiss' // explicitly dismissed the item
  | 'snooze' // snoozed the item

export type PositiveFeedbackType =
  | 'click' // general click engagement on the item
  | 'opportunity_won' // related opportunity closed-won
  | 'feature_usage_task' // completed a feature-usage task
  | 'uni_complete' // completed a University course/video
  | 'support_positive' // positive support outcome
  | 'upgrade' // initiated/completed an upgrade
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

export type UserItemsResponse = {
  surface: string
  type: 'user' | 'related'
  items: NexusItem[]
  meta: { userId: string; requested: number; governanceApplied: string[] }
}

// ── Client ───────────────────────────────────────────────────────────────────

export type NexusBrowserClientOptions = {
  /** https://nexus.webflow.com (prod), https://nexus.webflowtest.com (acceptance), or http://localhost:3001 (local). */
  baseUrl: string
  /** Per-consumer client key (`nxk_…`) from the Nexus admin API-consumers page. */
  clientKey: string
}

export function createNexusBrowserClient({ baseUrl, clientKey }: NexusBrowserClientOptions) {
  const base = baseUrl.replace(/\/$/, '')

  // The server token (NEXUS_API_TOKEN) grants every Nexus endpoint and must
  // never reach a browser bundle. Consumer keys are the only browser-safe
  // credential and always start `nxk_`, so anything else here is a
  // misconfiguration worth failing loudly rather than shipping.
  const keyIsValid = clientKey.startsWith('nxk_')
  if (!keyIsValid) {
    console.error(
      '[nexus-events] clientKey must be an `nxk_…` consumer key from /admin/api-consumers, ' +
        'never NEXUS_API_TOKEN. Refusing to send.'
    )
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
     * A 404 means the item slug does not exist in Nexus — that is a bug in the
     * identifier you passed, not a Nexus outage. Check you sent
     * toItemId(item.slug) and not an internal ID.
     */
    async sendEvent(event: NexusEvent): Promise<{ ok: boolean }> {
      if (!keyIsValid) return { ok: false }
      try {
        const res = await fetch(`${base}/api/events`, {
          method: 'POST',
          keepalive: true,
          headers: {
            Authorization: `Bearer ${clientKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...event, clientVersion: NEXUS_CLIENT_VERSION }),
        })
        if (!res.ok) {
          console.warn(`[nexus-events] event rejected (${res.status})`, await res.text().catch(() => ''))
          return { ok: false }
        }
        return { ok: true }
      } catch (err) {
        console.warn('[nexus-events] event failed to send', err)
        return { ok: false }
      }
    },

    /**
     * Fetch recommendations for a user-only surface.
     *
     * Requires the consumer's "allow item reads" flag (403 otherwise).
     * Never throws — returns null on any failure so the UI can fall back to
     * its default (non-personalized) content.
     */
    async getUserItems(req: UserItemsRequest): Promise<UserItemsResponse | null> {
      if (!keyIsValid) return null
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
          console.warn(`[nexus-events] items fetch rejected (${res.status})`, await res.text().catch(() => ''))
          return null
        }
        return (await res.json()) as UserItemsResponse
      } catch (err) {
        console.warn('[nexus-events] items fetch failed', err)
        return null
      }
    },
  }
}

export type NexusBrowserClient = ReturnType<typeof createNexusBrowserClient>
