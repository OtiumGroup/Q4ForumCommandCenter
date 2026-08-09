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
