import { createClient } from "@/lib/supabase/server";
import { SettingsPanel } from "./settings-panel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, photo_url, email_notifications, in_app_notifications")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <SettingsPanel
      email={user?.email ?? ""}
      fullName={profile?.full_name ?? null}
      photoUrl={profile?.photo_url ?? null}
      emailNotifications={profile?.email_notifications ?? true}
      inAppNotifications={profile?.in_app_notifications ?? true}
    />
  );
}
