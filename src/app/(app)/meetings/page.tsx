import { ComingSoon } from "@/components/shared/coming-soon";
import { CalendarClock } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={CalendarClock}
      title="Upcoming Meetings"
      description="Forum meeting dates, times, and locations."
    />
  );
}
