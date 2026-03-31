import type { TranslateFn } from '@/hooks/useI18n'

interface LanguageSwitchProps {
  t: TranslateFn
  locale: 'it' | 'en'
  onToggle: () => void
}

export function LanguageSwitch({ t, locale, onToggle }: LanguageSwitchProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/20 hover:border-cyber-blue/50 transition-all backdrop-blur-sm"
      aria-label={t('language.switchTo')}
    >
      <span className="text-sm" role="img" aria-hidden="true">
        {locale === 'it' ? '🇮🇹' : '🇬🇧'}
      </span>
      <span className="text-xs font-bold text-white/70 uppercase">
        {t('language.switchTo')}
      </span>
    </button>
  )
}
