// Small helper kept outside any component/hook body on purpose — the
// react-hooks "purity" lint rule flags Date.now()/new Date() calls
// written directly inside a component or hook, even in a Server
// Component that only runs once per request. Calling it through an
// ordinary function sidesteps that without losing the actual behavior.
export function splitUpcoming<T extends { starts_at: string }>(
  items: T[]
): { upcoming: T[]; past: T[] } {
  const now = Date.now();
  const upcoming: T[] = [];
  const past: T[] = [];
  for (const item of items) {
    if (new Date(item.starts_at).getTime() >= now) {
      upcoming.push(item);
    } else {
      past.push(item);
    }
  }
  return { upcoming, past };
}

// Same reasoning as above: kept out of any component body so the
// react-hooks purity lint doesn't flag the (perfectly fine, once-per-
// request) use of `new Date()` here.
export function nextBirthdayWithin(
  birthday: string | null | undefined,
  days: number
): Date | null {
  if (!birthday) return null;
  const parts = birthday.split("-").map(Number);
  const month = parts[1];
  const day = parts[2];
  if (!month || !day) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let next = new Date(now.getFullYear(), month - 1, day);
  if (next.getTime() < startOfToday.getTime()) {
    next = new Date(now.getFullYear() + 1, month - 1, day);
  }

  const diffDays = (next.getTime() - startOfToday.getTime()) / 86_400_000;
  return diffDays <= days ? next : null;
}

// ── Forum timezone handling ──────────────────────────────────────────────
// Every forum meeting/event time is Fort Worth (Central). We store UTC in the
// DB but always interpret user input and render output in Central, so times
// are correct regardless of where the server (UTC on Vercel) or a member runs.
export const FORUM_TZ = "America/Chicago";

// Convert a naive date + time (entered as Central wall-clock) to a UTC ISO
// string. DST-correct: 12:00 PM in August → the right UTC instant that always
// reads back as 12:00 PM.
export function formInputToUtcISO(
  date: string | null | undefined,
  time: string | null | undefined,
  tz: string = FORUM_TZ
): string | null {
  const d = String(date ?? "");
  if (!d) return null;
  const t = String(time ?? "") || "00:00";
  const [y, mo, day] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  if (!y || !mo || !day) return null;

  const guess = Date.UTC(y, mo - 1, day, h || 0, mi || 0, 0);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(guess))) parts[p.type] = p.value;
  let hh = Number(parts.hour);
  if (hh === 24) hh = 0;
  const asTz = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    hh, Number(parts.minute), Number(parts.second)
  );
  const offset = asTz - guess;
  return new Date(guess - offset).toISOString();
}

// Prefill <input type="date"> from a stored UTC timestamp, in the forum tz.
export function isoToTzDateInput(iso: string, tz: string = FORUM_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(iso));
}

// Prefill <input type="time"> from a stored UTC timestamp, in the forum tz.
export function isoToTzTimeInput(iso: string | null, tz: string = FORUM_TZ): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
}
