// Shared date-range presets. The station runs on Pakistan Standard Time, so
// "today" and every range are anchored there rather than in whatever zone the
// viewer's machine happens to be set to — and not in UTC, which is 5 hours
// behind PKT and would roll the date back a day for anything after 7pm local.

const PKT_TIME_ZONE = "Asia/Karachi";

// The PKT calendar date, re-anchored at UTC midnight so the day and month
// arithmetic below is pure and can't be nudged across a boundary. Every Date
// built from one of these uses Date.UTC for the same reason, which is what
// makes toIso() exact.
export function pktToday() {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: PKT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// Only valid for the UTC-anchored dates produced above.
export function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function todayIso() {
  return toIso(pktToday());
}

export type DatePresetKey =
  | "today"
  | "yesterday"
  | "week"
  | "last_week"
  | "month"
  | "last_month"
  | "year"
  | "last_year"
  | "custom";

export const DATE_PRESET_LABELS: Record<DatePresetKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  last_week: "Last Week",
  month: "This Month",
  last_month: "Last Month",
  year: "This Year",
  last_year: "Last Year",
  custom: "Custom Date",
};

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date;
}

// The "this ..." presets run from the start of the period up to today; the
// "last ..." ones cover the whole of the previous period. "custom" returns
// null — it leaves the range untouched and just unlocks the date inputs.
export function rangeForPreset(key: DatePresetKey): { from: string; to: string } | null {
  const today = pktToday();
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();

  if (key === "today") return { from: toIso(today), to: toIso(today) };

  if (key === "yesterday") {
    const yest = new Date(today);
    yest.setUTCDate(yest.getUTCDate() - 1);
    return { from: toIso(yest), to: toIso(yest) };
  }

  if (key === "week") {
    return { from: toIso(startOfWeekMonday(today)), to: toIso(today) };
  }

  // Monday through Sunday of the week before this one.
  if (key === "last_week") {
    const start = startOfWeekMonday(today);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() - 1);
    start.setUTCDate(start.getUTCDate() - 7);
    return { from: toIso(start), to: toIso(end) };
  }

  if (key === "month") {
    return { from: toIso(new Date(Date.UTC(y, m, 1))), to: toIso(today) };
  }

  // Day 0 of this month is the last day of last month.
  if (key === "last_month") {
    return {
      from: toIso(new Date(Date.UTC(y, m - 1, 1))),
      to: toIso(new Date(Date.UTC(y, m, 0))),
    };
  }

  if (key === "year") {
    return { from: toIso(new Date(Date.UTC(y, 0, 1))), to: toIso(today) };
  }

  if (key === "last_year") {
    return {
      from: toIso(new Date(Date.UTC(y - 1, 0, 1))),
      to: toIso(new Date(Date.UTC(y - 1, 11, 31))),
    };
  }

  return null;
}
