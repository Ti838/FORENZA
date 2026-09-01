/**
 * FORENZA — FZ-AI Task Router & Policy Engine
 * Dispatches forensic requests to the optimal specialized AI engine
 * with provider health monitoring and automatic graceful fallback.
 */

import { FZAiTaskType, FZProviderName } from './types'
import { AIProvider } from './providers/base'
import { OpenSourceProvider } from './providers/open-source'
import { GeminiProvider } from './providers/gemini'
import { MockProvider } from './providers/mock'

export interface RouteDecision {
  provider: AIProvider
  modelRole: string
  fallbackProvider?: AIProvider
  fallbackUsed?: boolean
}

export class TaskRouter {
  private static providers: Map<FZProviderName, AIProvider> = new Map<FZProviderName, AIProvider>([
    ['nvidia', new OpenSourceProvider()],
    ['gemini', new GeminiProvider()],
    ['mock', new MockProvider()],
  ])

  private static getPrimaryProviderName(): FZProviderName {
    if (process.env.NODE_ENV === 'test' || process.env.AI_PROVIDER === 'mock') {
      return 'mock'
    }
    const envProv = (process.env.AI_PRIMARY_PROVIDER || 'nvidia').toLowerCase()
    if (envProv === 'nvidia' || envProv === 'gemini' || envProv === 'mock') {
      return envProv
    }
    return 'nvidia'
  }

  private static getFallbackProviderName(): FZProviderName {
    if (process.env.NODE_ENV === 'test' || process.env.AI_PROVIDER === 'mock') {
      return 'mock'
    }
    const envProv = (process.env.AI_FALLBACK_PROVIDER || 'gemini').toLowerCase()
    if (envProv === 'nvidia' || envProv === 'gemini' || envProv === 'mock') {
      return envProv
    }
    return 'gemini'
  }

  /**
   * Resolve appropriate model role based on forensic task type
   */
  static getModelRoleForTask(task: FZAiTaskType): string {
    switch (task) {
      case 'CASE_SUMMARY':
      case 'TIMELINE_ANALYSIS':
      case 'CUSTODY_ANALYSIS':
      case 'DISCREPANCY_ANALYSIS':
      case 'FIRST_DIVERGENCE_EXPLANATION':
        return 'DeepSeek V4 Flash (Primary Reasoning Engine)'

      case 'IMAGE_ANALYSIS':
        return 'Muse Glimmer 30B (Forensic Vision Engine)'

      case 'OCR':
        return 'Nemotron OCR V2 (Forensic OCR Engine)'

      case 'SEMANTIC_SEARCH':
        return 'Nemotron Embed 1B (Semantic Retrieval Engine)'

      case 'FAST_CLASSIFICATION':
        return 'Nemotron 3.5 Lightning (Fast Task Engine)'

      case 'TRANSLATION':
        return 'Riva Translate 4B (Translation Engine)'

      case 'SAFETY_CHECK':
        return 'NVIDIA Content Safety (Nemoguard)'

      case 'GENERAL_AI':
      default:
        return 'DeepSeek / Nemotron General Assistive Engine'
    }
  }

  /**
   * Route task to active healthy provider with fallback resolution
   */
  static async resolveRoute(task: FZAiTaskType): Promise<RouteDecision> {
    const primaryName = this.getPrimaryProviderName()
    const fallbackName = this.getFallbackProviderName()

    const primary = this.providers.get(primaryName) || this.providers.get('mock')!
    const fallback = this.providers.get(fallbackName) || this.providers.get('gemini')!

    const modelRole = this.getModelRoleForTask(task)

    // Check primary provider configuration
    if (primary.isConfigured()) {
      return {
        provider: primary,
        modelRole,
        fallbackProvider: fallback.isConfigured() ? fallback : undefined,
        fallbackUsed: false,
      }
    }

    // If primary not configured, fallback to secondary
    if (fallback.isConfigured()) {
      console.warn(`[FZ-AI ROUTER] Primary provider ${primaryName} not configured; using fallback ${fallbackName} for ${task}`)
      return {
        provider: fallback,
        modelRole: `${modelRole} (Fallback: ${fallbackName})`,
        fallbackUsed: true,
      }
    }

    // Default to mock provider for safe offline continuity
    const mock = this.providers.get('mock')!
    return {
      provider: mock,
      modelRole: `${modelRole} (Mock Offline Engine)`,
      fallbackUsed: true,
    }
  }

  static getProvider(name: FZProviderName): AIProvider {
    return this.providers.get(name) || this.providers.get('mock')!
  }

  static async checkAllHealth() {
    const results = []
    for (const [name, provider] of this.providers.entries()) {
      results.push(await provider.checkHealth())
    }
    return results
  }
}
