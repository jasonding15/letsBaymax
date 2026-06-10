import { createHash } from "node:crypto";

/**
 * sha256 hex of a per-browser owner token. Must match the Web Crypto digest used
 * on the client (lib/owner.ts) so display and delete checks agree.
 */
export function hashOwnerToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
