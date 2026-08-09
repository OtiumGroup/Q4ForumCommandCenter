import { ComingSoon } from "@/components/shared/coming-soon";
import { PartyPopper } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={PartyPopper}
      title="Upcoming Events"
      description="EO events and member-created get-togethers, with RSVPs."
    />
  );
}
