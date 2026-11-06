/**
 * Nexus (CX recommendations service) settings for Webflow University.
 *
 * The client key belongs to the `webflow-university` consumer record in Nexus.
 * It is a browser-safe `nxk_` key: it can only send events and read published
 * recommendations, and only from https://university.webflow.com. It is not the
 * NEXUS_API_TOKEN server secret, which must never appear in this package.
 */

export const NEXUS_BASE_URL = 'https://nexus.webflow.com';

export const NEXUS_CLIENT_KEY = 'nxk_Ak5su5CQk0mZ17inBEi02NiAzBFoeNgr';

/** The only surface the WFU course sync assigns to course items. */
export const NEXUS_SURFACE = 'uni-all-courses';

/** Nexus prefixes WFU course slugs so they cannot collide with lesson slugs. */
export const NEXUS_COURSE_SLUG_PREFIX = 'uni-course-';
