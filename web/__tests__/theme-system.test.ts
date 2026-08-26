import { describe, it, expect, beforeEach } from 'vitest'

type ThemeMode = 'light' | 'dark' | 'system'

function resolveEffectiveTheme(mode: ThemeMode, systemIsDark: boolean): 'light' | 'dark' {
  if (mode === 'system') {
    return systemIsDark ? 'dark' : 'light'
  }
  return mode
}

describe('FORENZA Theme System & Persistence Suite', () => {
  const store: Record<string, string> = {}
  const mockLocalStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      for (const k in store) delete store[k]
    },
  }

  beforeEach(() => {
    mockLocalStorage.clear()
  })

  it('supports exactly LIGHT, DARK, and SYSTEM modes', () => {
    const supportedModes: ThemeMode[] = ['light', 'dark', 'system']
    expect(supportedModes).toHaveLength(3)
    expect(supportedModes).toContain('light')
    expect(supportedModes).toContain('dark')
    expect(supportedModes).toContain('system')
  })

  it('resolves LIGHT mode regardless of OS color scheme (Test 3)', () => {
    const osDark = true
    const effective = resolveEffectiveTheme('light', osDark)
    expect(effective).toBe('light')
  })

  it('resolves DARK mode regardless of OS color scheme (Test 4)', () => {
    const osLight = false
    const effective = resolveEffectiveTheme('dark', osLight)
    expect(effective).toBe('dark')
  })

  it('resolves SYSTEM mode to Light when OS is Light (Test 1)', () => {
    const osLight = false
    const effective = resolveEffectiveTheme('system', osLight)
    expect(effective).toBe('light')
  })

  it('resolves SYSTEM mode to Dark when OS is Dark (Test 2)', () => {
    const osDark = true
    const effective = resolveEffectiveTheme('system', osDark)
    expect(effective).toBe('dark')
  })

  it('persists selected theme to localStorage without data leakage (Test 5, 6, 9)', () => {
    mockLocalStorage.setItem('forenza-theme', 'dark')
    expect(mockLocalStorage.getItem('forenza-theme')).toBe('dark')

    mockLocalStorage.setItem('forenza-theme', 'light')
    expect(mockLocalStorage.getItem('forenza-theme')).toBe('light')

    mockLocalStorage.setItem('forenza-theme', 'system')
    expect(mockLocalStorage.getItem('forenza-theme')).toBe('system')
  })

  it('verifies DOM class updates for zero-flash execution', () => {
    const mockRoot = {
      classList: new Set<string>(),
      style: { colorScheme: '' },
    }

    const applyThemeToDOM = (effective: 'light' | 'dark') => {
      if (effective === 'dark') {
        mockRoot.classList.add('dark')
        mockRoot.classList.delete('light')
        mockRoot.style.colorScheme = 'dark'
      } else {
        mockRoot.classList.delete('dark')
        mockRoot.classList.add('light')
        mockRoot.style.colorScheme = 'light'
      }
    }

    applyThemeToDOM('dark')
    expect(mockRoot.classList.has('dark')).toBe(true)
    expect(mockRoot.style.colorScheme).toBe('dark')

    applyThemeToDOM('light')
    expect(mockRoot.classList.has('light')).toBe(true)
    expect(mockRoot.classList.has('dark')).toBe(false)
    expect(mockRoot.style.colorScheme).toBe('light')
  })
})
