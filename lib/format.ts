export function formatCurrency(amount: number): string {
  const formatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function parseISO(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function toISO(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function addDaysISO(isoDate: string, days: number): string {
  const d = parseISO(isoDate);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function isWithinRange(isoDate: string, start: string, end: string): boolean {
  if (!isoDate || !start || !end) return false;
  return isoDate >= start && isoDate <= end;
}

export function formatDateRange(start: string, end: string): string {
  const s = parseISO(start);
  const e = parseISO(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${start} – ${end}`;
  if (start === end) {
    return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()}, ${s.getFullYear()}`;
  }
  const sameYear = s.getFullYear() === e.getFullYear();
  if (!sameYear) {
    return `${formatDateShort(start)} – ${formatDateShort(end)}, ${e.getFullYear()}`;
  }
  if (s.getMonth() === e.getMonth()) {
    return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${MONTHS_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

export function formatDateShort(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return isoDate;
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
