export type NumberFormatOptions = {
  locale?: string
  fallback?: string
  maximumFractionDigits?: number
  minimumFractionDigits?: number
}

const DEFAULT_FALLBACK = '—'

const numberFormatterCache = new Map<string, Intl.NumberFormat>()

function getNumberFormatter(
  locale: string,
  options: Intl.NumberFormatOptions,
) {
  const key = `${locale}:${JSON.stringify(options)}`
  let formatter = numberFormatterCache.get(key)

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options)
    numberFormatterCache.set(key, formatter)
  }

  return formatter
}

function formatNumberValue(
  value: number | null | undefined,
  formatter: Intl.NumberFormat,
  fallback = DEFAULT_FALLBACK,
) {
  if (value == null || !Number.isFinite(value)) {
    return fallback
  }

  return formatter.format(value)
}

/** Standard number — e.g. "1,234.5" */
export function formatNumber(
  value: number | null | undefined,
  {
    locale,
    fallback = DEFAULT_FALLBACK,
    maximumFractionDigits,
    minimumFractionDigits,
  }: NumberFormatOptions = {},
) {
  return formatNumberValue(
    value,
    getNumberFormatter(locale ?? 'en-US', {
      maximumFractionDigits,
      minimumFractionDigits,
    }),
    fallback,
  )
}

/** Compact number — e.g. "1.2K", "3.4M" */
export function formatCompactNumber(
  value: number | null | undefined,
  { locale, fallback = DEFAULT_FALLBACK }: NumberFormatOptions = {},
) {
  return formatNumberValue(
    value,
    getNumberFormatter(locale ?? 'en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }),
    fallback,
  )
}

/** Percentage — e.g. "42%" */
export function formatPercent(
  value: number | null | undefined,
  {
    locale,
    fallback = DEFAULT_FALLBACK,
    maximumFractionDigits = 0,
  }: NumberFormatOptions = {},
) {
  return formatNumberValue(
    value,
    getNumberFormatter(locale ?? 'en-US', {
      style: 'percent',
      maximumFractionDigits,
    }),
    fallback,
  )
}

/** Byte size — e.g. "1.5 MB" */
export function formatBytes(
  bytes: number | null | undefined,
  { locale, fallback = DEFAULT_FALLBACK }: NumberFormatOptions = {},
) {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) {
    return fallback
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const formatted = getNumberFormatter(locale ?? 'en-US', {
    maximumFractionDigits: value >= 10 || unitIndex === 0 ? 0 : 1,
  }).format(value)

  return `${formatted} ${units[unitIndex]}`
}
