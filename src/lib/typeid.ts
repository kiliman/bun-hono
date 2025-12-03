/**
 * TypeID utilities for generating prefixed, sortable IDs
 *
 * Uses TypeID (https://github.com/jetify-com/typeid) which provides:
 * - Prefixed IDs for type safety
 * - UUIDv7 based (timestamp-ordered for better indexing)
 * - Base32 encoded (no dashes, double-click friendly)
 * - URL-safe
 */

import { typeid } from "typeid-js";

/**
 * ID prefixes for different resource types
 */
export const ID_PREFIXES = {
  contact: "con",
} as const;

export type IdPrefix = (typeof ID_PREFIXES)[keyof typeof ID_PREFIXES];

/**
 * Generate a new TypeID with the given prefix
 */
export function generateId(prefix: IdPrefix): string {
  return typeid(prefix).toString();
}

/**
 * Parse a TypeID into its prefix and base ID
 */
export function parseId(id: string): { prefix: string; uuid: string } {
  const parts = id.split("_");
  if (parts.length !== 2) {
    throw new Error(`Invalid TypeID format: ${id}`);
  }
  return {
    prefix: String(parts[0]),
    uuid: String(parts[1]),
  };
}

/**
 * Validate that an ID has the expected prefix
 */
export function validateIdPrefix(
  id: string,
  expectedPrefix: IdPrefix,
): boolean {
  try {
    const { prefix } = parseId(id);
    return prefix === expectedPrefix;
  } catch {
    return false;
  }
}
