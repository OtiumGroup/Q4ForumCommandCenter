import { ComingSoon } from "@/components/shared/coming-soon";
import { UserCircle } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={UserCircle}
      title="Member Bios"
      description="A profile page for every member of the forum."
    />
  );
}
