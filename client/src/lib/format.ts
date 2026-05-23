// Locale-aware formatters. `locale` is provided by the I18n context — for Arabic
// we use `ar-AE-u-nu-latn` (Western digits in Arabic copy, per SPEC §4 R6).

const integerCache = new Map<string, Intl.NumberFormat>();
const percentCache = new Map<string, Intl.NumberFormat>();

function intFormatter(locale: string): Intl.NumberFormat {
  let f = integerCache.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    integerCache.set(locale, f);
  }
  return f;
}

function percentFormatter(locale: string): Intl.NumberFormat {
  let f = percentCache.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    percentCache.set(locale, f);
  }
  return f;
}

export function formatInt(value: number, locale: string): string {
  return intFormatter(locale).format(value);
}

export function formatPercent(value: number, locale: string): string {
  return percentFormatter(locale).format(value);
}
