import { ComingSoon } from "@/components/shared/coming-soon";
import { BookOpen } from "lucide-react";

export default function Page() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Books & Podcasts"
      description="Recommendations from the forum — books, audiobooks, and podcasts."
    />
  );
}
