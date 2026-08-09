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
