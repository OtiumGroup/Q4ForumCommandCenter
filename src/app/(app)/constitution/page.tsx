import { ComingSoon } from "@/components/shared/coming-soon";
import { ScrollText } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={ScrollText}
      title="Constitution"
      description="The forum's governing document, read-only for members."
    />
  );
}
