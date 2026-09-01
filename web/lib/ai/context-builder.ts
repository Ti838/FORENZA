/**
 * FORENZA — AI Context Builder & Prompt Injection Sanitizer
 * Enforces strict data minimization, case isolation, and untrusted-data wrapping.
 */

export interface ContextBuildOptions {
  caseId?: string
  evidenceId?: string
  allowedFields?: string[]
  stripPii?: boolean
}

export class AIContextBuilder {
  /**
   * Sanitize untrusted evidence text against prompt injection.
   * Wraps text in unambiguous delimiters and strips dangerous instruction attempts.
   */
  static sanitizeUntrustedText(text: string): string {
    if (!text) return ''

    // Neutralize common prompt injection prefixes
    const clean = text
      .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, '[POTENTIAL INJECTION SUPPRESSED]')
      .replace(/system\s*:\s*/gi, '[SYSTEM_TAG_STRIPPED] ')
      .replace(/developer\s*mode/gi, '[DEV_MODE_STRIPPED]')

    // Wrap in rigid XML delimiter
    return `<untrusted_evidence_content>\n${clean}\n</untrusted_evidence_content>`
  }

  /**
   * Build minimal, authorized context object for AI dispatch.
   * Automatically strips passwords, tokens, API keys, and sensitive raw keys.
   */
  static buildMinimalContext(
    rawContext: Record<string, unknown>,
    options: ContextBuildOptions = {}
  ): Record<string, unknown> {
    const minimized: Record<string, unknown> = {
      case_id: options.caseId,
      evidence_id: options.evidenceId,
      context_built_at_utc: new Date().toISOString(),
    }

    const forbiddenKeyPatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /api_key/i,
      /private/i,
      /jwt/i,
      /authorization/i,
    ]

    for (const [key, value] of Object.entries(rawContext)) {
      // Omit sensitive keys
      if (forbiddenKeyPatterns.some((pattern) => pattern.test(key))) {
        continue
      }

      if (key === 'case_id' || key === 'evidence_id' || key.endsWith('_id')) {
        minimized[key] = value
      } else if (typeof value === 'string') {
        minimized[key] = this.sanitizeUntrustedText(value)
      } else if (Array.isArray(value)) {
        minimized[key] = value.slice(0, 50).map((item) => {
          if (typeof item === 'object' && item !== null) {
            return this.buildMinimalContext(item as Record<string, unknown>, options)
          }
          return item
        })
      } else if (typeof value === 'object' && value !== null) {
        minimized[key] = this.buildMinimalContext(value as Record<string, unknown>, options)
      } else {
        minimized[key] = value
      }
    }

    return minimized
  }
}
