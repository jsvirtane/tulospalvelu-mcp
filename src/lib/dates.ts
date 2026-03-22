const HELSINKI_TIME_ZONE = "Europe/Helsinki";

function formatParts(date: Date): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: HELSINKI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function formatDateString(date: Date): string {
  const { year, month, day } = formatParts(date);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function resolveRelativeDate(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (!["today", "tomorrow", "yesterday"].includes(normalized)) {
    return value;
  }

  const todayInHelsinki = formatParts(new Date());
  const baseline = new Date(Date.UTC(todayInHelsinki.year, todayInHelsinki.month - 1, todayInHelsinki.day, 12, 0, 0));

  if (normalized === "tomorrow") {
    return formatDateString(addDays(baseline, 1));
  }

  if (normalized === "yesterday") {
    return formatDateString(addDays(baseline, -1));
  }

  return formatDateString(baseline);
}

export function resolveDateFilters(filters: {
  date?: string;
  startDate?: string;
  endDate?: string;
}): { date?: string; startDate?: string; endDate?: string } {
  return {
    date: resolveRelativeDate(filters.date),
    startDate: resolveRelativeDate(filters.startDate),
    endDate: resolveRelativeDate(filters.endDate),
  };
}
