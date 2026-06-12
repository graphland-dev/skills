export type DateInput = Date | string | number | null | undefined

export type DateFormatOptions = {
  locale?: string
  timeZone?: string
  fallback?: string
}

const DEFAULT_FALLBACK = '—'

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>()
const relativeFormatterCache = new Map<string, Intl.RelativeTimeFormat>()

function getFormatter(
  cache: Map<string, Intl.DateTimeFormat>,
  locale: string,
  options: Intl.DateTimeFormatOptions,
) {
  const key = `${locale}:${JSON.stringify(options)}`
  let formatter = cache.get(key)

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options)
    cache.set(key, formatter)
  }

  return formatter
}

function getRelativeFormatter(locale: string, style: Intl.RelativeTimeFormatStyle) {
  const key = `${locale}:${style}`
  let formatter = relativeFormatterCache.get(key)

  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
      style,
    })
    relativeFormatterCache.set(key, formatter)
  }

  return formatter
}

export function parseDate(value: DateInput): Date | null {
  if (value == null || value === '') {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatWithFallback(
  value: DateInput,
  formatter: Intl.DateTimeFormat,
  fallback = DEFAULT_FALLBACK,
) {
  const date = parseDate(value)
  if (!date) {
    return fallback
  }

  return formatter.format(date)
}

/** Date only — e.g. "Apr 10, 2026" */
export function formatDate(
  value: DateInput,
  { locale, timeZone, fallback = DEFAULT_FALLBACK }: DateFormatOptions = {},
) {
  const resolvedLocale = locale ?? undefined

  return formatWithFallback(
    value,
    getFormatter(dateFormatterCache, resolvedLocale ?? 'en-US', {
      dateStyle: 'medium',
      timeZone,
    }),
    fallback,
  )
}

/** Time only — e.g. "10:15 AM" */
export function formatTime(
  value: DateInput,
  { locale, timeZone, fallback = DEFAULT_FALLBACK }: DateFormatOptions = {},
) {
  const resolvedLocale = locale ?? undefined

  return formatWithFallback(
    value,
    getFormatter(dateFormatterCache, resolvedLocale ?? 'en-US', {
      timeStyle: 'short',
      timeZone,
    }),
    fallback,
  )
}

/** Date and time — e.g. "Apr 10, 2026, 10:15 AM" */
export function formatDateTime(
  value: DateInput,
  { locale, timeZone, fallback = DEFAULT_FALLBACK }: DateFormatOptions = {},
) {
  const resolvedLocale = locale ?? undefined

  return formatWithFallback(
    value,
    getFormatter(dateFormatterCache, resolvedLocale ?? 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }),
    fallback,
  )
}

/** Long date — e.g. "Friday, April 10, 2026" */
export function formatDateLong(
  value: DateInput,
  { locale, timeZone, fallback = DEFAULT_FALLBACK }: DateFormatOptions = {},
) {
  const resolvedLocale = locale ?? undefined

  return formatWithFallback(
    value,
    getFormatter(dateFormatterCache, resolvedLocale ?? 'en-US', {
      dateStyle: 'full',
      timeZone,
    }),
    fallback,
  )
}

/** ISO calendar date — e.g. "2026-04-10" */
export function formatIsoDate(
  value: DateInput,
  { locale, timeZone, fallback = DEFAULT_FALLBACK }: DateFormatOptions = {},
) {
  const resolvedLocale = locale ?? undefined

  return formatWithFallback(
    value,
    getFormatter(dateFormatterCache, resolvedLocale ?? 'en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone,
    }),
    fallback,
  )
}

const relativeUnits: Array<{
  unit: Intl.RelativeTimeFormatUnit
  ms: number
}> = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
  { unit: 'second', ms: 1000 },
]

/** Relative time — e.g. "2 hours ago", "in 3 days" */
export function formatRelativeTime(
  value: DateInput,
  {
    locale,
    fallback = DEFAULT_FALLBACK,
    now = new Date(),
    style = 'long',
  }: DateFormatOptions & {
    now?: Date
    style?: Intl.RelativeTimeFormatStyle
  } = {},
) {
  const date = parseDate(value)
  if (!date) {
    return fallback
  }

  const diffMs = date.getTime() - now.getTime()
  const absDiffMs = Math.abs(diffMs)
  const resolvedLocale = locale ?? undefined
  const formatter = getRelativeFormatter(resolvedLocale ?? 'en-US', style)

  for (const { unit, ms } of relativeUnits) {
    if (absDiffMs >= ms || unit === 'second') {
      const value = Math.round(diffMs / ms)
      return formatter.format(value, unit)
    }
  }

  return fallback
}

/** Human-readable duration — e.g. "1h 5m 30s" */
export function formatDuration(
  totalMs: number,
  { fallback = DEFAULT_FALLBACK }: { fallback?: string } = {},
) {
  if (!Number.isFinite(totalMs) || totalMs < 0) {
    return fallback
  }

  const ms = Math.floor(totalMs)
  const seconds = Math.floor(ms / 1000) % 60
  const minutes = Math.floor(ms / (1000 * 60)) % 60
  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))

  const parts: string[] = []

  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)

  return parts.join(' ')
}
