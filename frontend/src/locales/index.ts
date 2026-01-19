/**
 * i18n Infrastructure Stub
 *
 * This module provides a stub for internationalization (i18n) support.
 * Currently, only German (de) is supported as the default language.
 *
 * Future expansion:
 * - Add additional locale files (en.json, fr.json, etc.)
 * - Implement proper i18n library (react-i18next, react-intl)
 * - Add language switching functionality
 * - Implement pluralization and interpolation
 *
 * Usage:
 * ```tsx
 * import { useTranslation } from '@/locales';
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   return <button>{t('common.save')}</button>;
 * }
 * ```
 */

import de from './de.json';

type TranslationKeys = typeof de;

/**
 * Get a nested value from an object using dot notation.
 * @param obj - The object to traverse
 * @param path - Dot-separated path (e.g., 'nav.admin')
 * @returns The value at the path or the path itself if not found
 */
function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return path; // Return path as fallback
    }
    current = current[key];
  }

  return typeof current === 'string' ? current : path;
}

/**
 * Stub translation function.
 * Returns German strings from de.json.
 *
 * @param key - Dot-notation key (e.g., 'nav.admin')
 * @param params - Optional interpolation parameters (not yet implemented)
 * @returns Translated string or the key if not found
 */
export function t(key: string, _params?: Record<string, string | number>): string {
  // Currently only German is supported
  const value = getNestedValue(de, key);

  // TODO: Implement interpolation when needed
  // if (params) {
  //   return value.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? `{{${k}}}`));
  // }

  return value;
}

/**
 * Stub hook for component-level translations.
 * Returns the t function for use in React components.
 *
 * @returns Object containing the translation function
 */
export function useTranslation() {
  return { t };
}

/**
 * Export the raw translations object for direct access.
 */
export const translations: TranslationKeys = de;

/**
 * Current locale (stub - always returns 'de').
 */
export const currentLocale = 'de';

/**
 * Available locales (stub - only German supported).
 */
export const availableLocales = ['de'] as const;
