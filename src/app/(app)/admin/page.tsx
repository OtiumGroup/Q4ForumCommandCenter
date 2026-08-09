import { ComingSoon } from "@/components/shared/coming-soon";
import { ShieldCheck } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={ShieldCheck}
      title="Admin"
      description="Manage users, invites, and forum-wide communications."
    />
  );
}
