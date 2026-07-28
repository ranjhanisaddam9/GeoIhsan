export function formatDateOnly(iso: string) {
  return iso.slice(0, 10);
}

export function isWithinDateRange(iso: string, from: string, to: string) {
  const date = formatDateOnly(iso);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}
