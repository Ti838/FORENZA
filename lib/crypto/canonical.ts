/**
 * FORENZA — RFC 8785 JSON Canonicalization Scheme (JCS)
 *
 * Provides deterministic, byte-for-byte consistent JSON serialization
 * across all platforms (Node.js, Web, Flutter, Rust).
 *
 * Rules:
 * 1. Object keys are sorted lexicographically by UTF-16 code units.
 * 2. No whitespace outside of string literals.
 * 3. Numbers formatted consistently.
 * 4. Strings escaped according to RFC 8785 standard.
 * 5. Rejects undefined, functions, and symbols.
 */

export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj === 'boolean' || typeof obj === 'number') {
    return JSON.stringify(obj)
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj)
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalizeJson(item))
    return `[${items.join(',')}]`
  }

  if (typeof obj === 'object') {
    const rawObj = obj as Record<string, unknown>
    const definedKeys = Object.keys(rawObj)
      .filter((key) => rawObj[key] !== undefined)
      .sort()

    const entries = definedKeys.map((key) => {
      const val = rawObj[key]
      if (typeof val === 'function' || typeof val === 'symbol') {
        throw new Error(`Invalid JSON value for key "${key}": cannot canonicalize functions/symbols`)
      }
      return `${JSON.stringify(key)}:${canonicalizeJson(val)}`
    })
    return `{${entries.join(',')}}`
  }

  throw new Error(`Cannot canonicalize unsupported type: ${typeof obj}`)
}
