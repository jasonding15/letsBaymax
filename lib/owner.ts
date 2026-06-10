"use client";

/**
 * Per-browser ownership, no login required.
 *
 * On first use we mint a random token and persist it in localStorage. When you
 * add an entry, the token rides along; the server stores only its sha256 hash on
 * the row. Delete buttons render only for rows whose stored hash matches this
 * browser's token, and the server re-verifies the token on delete.
 *
 * Caveat: this is a friction/UX layer, not real security. It's per-browser (not
 * per-person), and anyone technical could call the delete API directly. Clearing
 * browser data forfeits the ability to delete your own entries from the UI.
 */

const OWNER_STORAGE_KEY = "whosbeached:owner-token";

/** This browser's persistent owner token, created on first use. Client-only. */
export function getOwnerToken(): string {
  let token = localStorage.getItem(OWNER_STORAGE_KEY);
  if (!token) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(OWNER_STORAGE_KEY, token);
  }
  return token;
}

/** SHA-256 hex digest of a string, via Web Crypto. */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

let cachedHash: Promise<string> | null = null;

/**
 * This browser's owner hash (sha256 of its token). Computed once and reused so
 * every row's delete button shares a single hashing pass.
 */
export function getOwnerHash(): Promise<string> {
  if (!cachedHash) {
    cachedHash = sha256Hex(getOwnerToken());
  }
  return cachedHash;
}
