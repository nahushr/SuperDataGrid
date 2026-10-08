const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function ordinal(day: number): string {
  const remainder100 = day % 100;
  const suffix =
    remainder100 >= 11 && remainder100 <= 13
      ? "th"
      : day % 10 === 1
        ? "st"
        : day % 10 === 2
          ? "nd"
          : day % 10 === 3
            ? "rd"
            : "th";
  return `${day}${suffix}`;
}

export function formatCellDate(
  value: unknown,
  pattern: string,
  useUtc = false,
  timeZone?: string,
): string | null {
  if (value == null || value === "") return null;
  const dateOnly = typeof value === "string" ? DATE_ONLY.exec(value) : null;
  const date = value instanceof Date
    ? value
    : dateOnly
      ? new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])))
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;
  if (!date || Number.isNaN(date.getTime())) return null;

  const utc = useUtc || dateOnly != null;
  const resolvedTimeZone = utc ? "UTC" : timeZone;
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
    timeZone: resolvedTimeZone,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((candidate) => candidate.type === type)?.value ?? 0);
  const day = part("day");
  const month = part("month") - 1;
  const year = part("year");
  const hour = part("hour");
  const minute = part("minute");
  const second = part("second");
  const monthShort = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: resolvedTimeZone,
  }).format(date);
  const monthLong = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: resolvedTimeZone,
  }).format(date);
  const hour12 = hour % 12 || 12;
  const tokens: Record<string, string> = {
    yyyy: String(year),
    yy: String(year).slice(-2),
    MMMM: monthLong,
    MMM: monthShort,
    MM: String(month + 1).padStart(2, "0"),
    do: ordinal(day),
    dd: String(day).padStart(2, "0"),
    d: String(day),
    HH: String(hour).padStart(2, "0"),
    H: String(hour),
    hh: String(hour12).padStart(2, "0"),
    h: String(hour12),
    mm: String(minute).padStart(2, "0"),
    ss: String(second).padStart(2, "0"),
    a: hour < 12 ? "AM" : "PM",
  };
  return pattern.replace(/yyyy|MMMM|MMM|yy|MM|do|dd|d|HH|H|hh|h|mm|ss|a/g, (token) => tokens[token] ?? token);
}
