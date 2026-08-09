// Admin-only user management: invite, resend invite, delete.
//
// Runs with the Supabase-injected SERVICE_ROLE key (never seen by the
// app or committed anywhere) so it can call the Auth Admin API — but
// only after independently confirming the caller is an admin using
// their own JWT. Never trust the client's claim of being an admin.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  // Client scoped to the caller's own JWT — used only to confirm identity.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();
  if (userError || !user) return json({ error: "Not authenticated" }, 401);

  const { data: profile } = await callerClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return json({ error: "Admins only" }, 403);
  }

  // Full-privilege client — only reached after the admin check above.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = body.action;

  if (action === "invite" || action === "resend") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) return json({ error: "Email is required" }, 400);

    const fullName = body.full_name ? String(body.full_name) : null;
    const role = body.role === "admin" ? "admin" : "member";
    const personalNote = body.personal_note ? String(body.personal_note) : null;

    if (action === "invite") {
      const { error: inviteError } = await admin.from("invites").upsert(
        {
          email,
          full_name: fullName,
          role,
          personal_note: personalNote,
          status: "pending",
          invited_by: user.id,
        },
        { onConflict: "email" }
      );
      if (inviteError) return json({ error: inviteError.message }, 500);
    }

    const { error: authError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role },
      redirectTo: SITE_URL ? `${SITE_URL}/invite/accept` : undefined,
    });
    if (authError) return json({ error: authError.message }, 500);

    return json({ ok: true });
  }

  if (action === "delete") {
    const targetId = String(body.user_id ?? "");
    if (!targetId) return json({ error: "user_id is required" }, 400);
    if (targetId === user.id) {
      return json({ error: "You can't delete your own account." }, 400);
    }

    const { error } = await admin.auth.admin.deleteUser(targetId);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "Unknown action" }, 400);
});
