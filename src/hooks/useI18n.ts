import { useState, useCallback, useMemo } from 'react'
import itStrings from '@/i18n/it.json'
import enStrings from '@/i18n/en.json'

type Locale = 'it' | 'en'

const STORAGE_KEY = 'cybershow-locale'

type NestedRecord = { [key: string]: string | NestedRecord }

const translations: Record<Locale, NestedRecord> = {
  it: itStrings as NestedRecord,
  en: enStrings as NestedRecord,
}

function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en') return 'en'
  } catch {
    // localStorage may not be available
  }
  return 'it'
}

function resolve(obj: NestedRecord, path: string): string {
  const parts = path.split('.')
  let current: NestedRecord | string = obj
  for (const part of parts) {
    if (typeof current === 'string') return path
    current = current[part] as NestedRecord | string
    if (current === undefined) return path
  }
  return typeof current === 'string' ? current : path
}

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch {
      // ignore
    }
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'it' ? 'en' : 'it')
  }, [locale, setLocale])

  const t = useMemo(() => {
    const dict = translations[locale]
    return (key: string, params?: Record<string, string | number>): string => {
      let result = resolve(dict, key)
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(`{${k}}`, String(v))
        }
      }
      return result
    }
  }, [locale])

  return { locale, setLocale, toggleLocale, t }
}

export type TranslateFn = ReturnType<typeof useI18n>['t']
