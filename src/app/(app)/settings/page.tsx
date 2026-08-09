import { ComingSoon } from "@/components/shared/coming-soon";
import { Settings } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      description="Your profile, notifications, and app preferences."
    />
  );
}
