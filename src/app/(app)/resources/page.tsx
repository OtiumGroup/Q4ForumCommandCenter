import { ComingSoon } from "@/components/shared/coming-soon";
import { LibraryBig } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={LibraryBig}
      title="EO Resources"
      description="The full Moderator Resources library, organized by category."
    />
  );
}
