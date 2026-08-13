export type PasswordCheck = { label: string; ok: boolean };

// A single source of truth for "strong" — used by the set-password form
// (live checklist) and enforced again server-side before the password is saved.
export function passwordChecks(pw: string): PasswordCheck[] {
  return [
    { label: "At least 10 characters", ok: pw.length >= 10 },
    { label: "An uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "A lowercase letter", ok: /[a-z]/.test(pw) },
    { label: "A number", ok: /[0-9]/.test(pw) },
    { label: "A symbol (! ? @ # …)", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export function isStrongPassword(pw: string): boolean {
  return passwordChecks(pw).every((c) => c.ok);
}
